import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function command(executable, args, input) {
  const result = spawnSync(executable, args, {
    encoding: 'utf8',
    input,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${executable} failed: ${result.error?.message ?? result.stderr?.trim() ?? result.status}`,
    );
  return { stdout: result.stdout, stderr: result.stderr };
}

function artifacts(root) {
  const found = { apps: [], archives: [], dmgs: [] };
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.endsWith('.app')) found.apps.push(path);
        else visit(path);
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.app.tar.gz')) found.archives.push(path);
        if (entry.name.endsWith('.dmg')) found.dmgs.push(path);
      }
    }
  }
  visit(root);
  return found;
}

function exactlyOne(paths, description) {
  if (paths.length !== 1)
    throw new Error(
      `Expected exactly one ${description}; found ${paths.length}.`,
    );
  return paths[0];
}

function plistJson(input) {
  return JSON.parse(
    command('plutil', ['-convert', 'json', '-o', '-', '--', '-'], input).stdout,
  );
}

/** Read-only verification: this never repairs or re-signs a build artifact. */
export function verifyApp(app) {
  command('codesign', ['--verify', '--deep', '--strict', '--verbose=4', app]);
  const signature = command('codesign', ['--display', '--verbose=4', app]);
  const display = `${signature.stdout}\n${signature.stderr}`;
  if (
    !/^Info\.plist entries=[1-9]\d*$/m.test(display) ||
    !/^Sealed Resources version=2 rules=\d+ files=[1-9]\d*$/m.test(display)
  )
    throw new Error(
      `${app}: Info.plist and resources must be sealed by the bundle signature.`,
    );
  const info = JSON.parse(
    command('plutil', [
      '-convert',
      'json',
      '-o',
      '-',
      '--',
      join(app, 'Contents', 'Info.plist'),
    ]).stdout,
  );
  const identifier = /^Identifier=(.+)$/m.exec(display)?.[1];
  const cdHash = /^CDHash=([a-f0-9]+)$/m.exec(display)?.[1];
  if (
    !identifier ||
    identifier !== info.CFBundleIdentifier ||
    !cdHash ||
    typeof info.CFBundleVersion !== 'string' ||
    !info.CFBundleVersion ||
    typeof info.CFBundleShortVersionString !== 'string' ||
    !info.CFBundleShortVersionString
  )
    throw new Error(
      `${app}: Signed bundle identity or version is missing or inconsistent.`,
    );
  return {
    identifier,
    version: info.CFBundleVersion,
    shortVersion: info.CFBundleShortVersionString,
    cdHash,
  };
}

function verifyMatchingApp(app, expectedAppName, expectedSignature) {
  if (basename(app).normalize('NFC') !== expectedAppName.normalize('NFC'))
    throw new Error(
      `Packed app ${basename(app)} does not match ${expectedAppName}.`,
    );
  const signature = verifyApp(app);
  if (JSON.stringify(signature) !== JSON.stringify(expectedSignature))
    throw new Error(`${app}: Packed app signature differs from the local app.`);
}

function imageIsMounted(mountpoint, execute) {
  const inventory = plistJson(execute('hdiutil', ['info', '-plist']).stdout);
  if (!Array.isArray(inventory.images))
    throw new Error('Could not read mounted image inventory.');
  return inventory.images.some((image) =>
    image['system-entities']?.some((entity) => {
      const mountedPath = entity['mount-point'];
      return (
        mountedPath && realpathSync(mountedPath) === realpathSync(mountpoint)
      );
    }),
  );
}

function detach(mountpoint, execute) {
  try {
    execute('hdiutil', ['detach', mountpoint]);
  } catch (first) {
    try {
      execute('hdiutil', ['detach', '-force', mountpoint]);
    } catch (second) {
      // A failed attach may never have mounted; only an authoritative inventory permits cleanup.
      try {
        if (!imageIsMounted(mountpoint, execute)) return;
      } catch (inventoryError) {
        throw new AggregateError(
          [first, second, inventoryError],
          `Could not determine whether verification image remains mounted at ${mountpoint}.`,
        );
      }
      throw new AggregateError(
        [first, second],
        `Could not detach verification image at ${mountpoint}.`,
      );
    }
  }
}

export function verifyMacosBundle(
  bundleRoot,
  { temporaryRoot = tmpdir(), execute = command } = {},
) {
  if (process.platform !== 'darwin')
    throw new Error('macOS bundle verification requires macOS.');
  const found = artifacts(resolve(bundleRoot));
  const app = exactlyOne(found.apps, 'local app');
  const archive = exactlyOne(found.archives, 'updater app archive');
  const dmg = exactlyOne(found.dmgs, 'DMG');
  const appName = basename(app);
  if (
    basename(archive).normalize('NFC') !== `${appName}.tar.gz`.normalize('NFC')
  )
    throw new Error('Updater archive name does not match the local app.');
  const signature = verifyApp(app);
  const temporary = mkdtempSync(join(temporaryRoot, 'lernwelt-macos-verify-'));
  const extracted = join(temporary, 'updater');
  const mountpoint = join(temporary, 'mounted');
  mkdirSync(extracted);
  mkdirSync(mountpoint);
  let mountNeedsCleanup = false;
  let failure;
  try {
    execute('tar', ['-xzf', archive, '-C', extracted]);
    verifyMatchingApp(
      exactlyOne(artifacts(extracted).apps, 'updater app'),
      appName,
      signature,
    );
    execute('hdiutil', ['verify', dmg]);
    // Even a nonzero/timeout result may follow a successful mount.
    mountNeedsCleanup = true;
    const attached = execute('hdiutil', [
      'attach',
      '-readonly',
      '-nobrowse',
      '-noautoopen',
      '-mountpoint',
      mountpoint,
      '-plist',
      dmg,
    ]);
    const volumes = plistJson(attached.stdout)['system-entities']?.filter(
      (entity) => entity['mount-point'],
    );
    if (
      !Array.isArray(volumes) ||
      volumes.length !== 1 ||
      realpathSync(volumes[0]['mount-point']) !== realpathSync(mountpoint)
    )
      throw new Error(
        'DMG must mount exactly one volume at the verification mountpoint.',
      );
    verifyMatchingApp(
      exactlyOne(artifacts(mountpoint).apps, 'DMG app'),
      appName,
      signature,
    );
  } catch (error) {
    failure = error;
  } finally {
    if (mountNeedsCleanup) {
      try {
        detach(mountpoint, execute);
        mountNeedsCleanup = false;
      } catch (error) {
        failure = failure
          ? new AggregateError(
              [failure, error],
              'Bundle verification and image cleanup failed.',
            )
          : error;
      }
    }
    // Never traverse an image that could not be detached; retain its owned path for diagnosis.
    if (!mountNeedsCleanup) rmSync(temporary, { recursive: true, force: true });
  }
  if (failure) throw failure;
  return { app, archive, dmg, ...signature };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    if (process.argv.length !== 3)
      throw new Error(
        'Usage: node scripts/verify-macos-bundle.mjs <bundle-root>',
      );
    const result = verifyMacosBundle(process.argv[2]);
    console.log(
      `macOS app, updater archive and DMG verified: ${result.identifier} ${result.version}.`,
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
