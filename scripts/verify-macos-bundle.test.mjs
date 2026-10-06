import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import test from 'node:test';
import { verifyApp, verifyMacosBundle } from './verify-macos-bundle.mjs';

const native = { skip: process.platform !== 'darwin' };

function run(executable, args) {
  const result = spawnSync(executable, args, {
    encoding: 'utf8',
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  });
  assert.equal(result.status, 0, `${executable}: ${result.stderr}`);
  return result.stdout;
}

function temporary(t) {
  const root = mkdtempSync(join(tmpdir(), 'lernwelt signed bundle test '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function createApp(
  directory,
  { sealed = true, identifier = 'de.lernwelt.fixture' } = {},
) {
  const app = join(directory, 'Lernwelt Prüflauf Test.app');
  const executable = join(app, 'Contents', 'MacOS', 'fixture');
  mkdirSync(join(app, 'Contents', 'MacOS'), { recursive: true });
  mkdirSync(join(app, 'Contents', 'Resources'), { recursive: true });
  copyFileSync('/usr/bin/true', executable);
  writeFileSync(
    join(app, 'Contents', 'Resources', 'lesson.txt'),
    'A sealed lesson.',
  );
  writeFileSync(
    join(app, 'Contents', 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>fixture</string>
<key>CFBundleIdentifier</key><string>de.lernwelt.fixture</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1.2.3</string>
<key>CFBundleShortVersionString</key><string>1.2.3</string>
</dict></plist>`,
  );
  if (sealed)
    run('codesign', [
      '--force',
      '--sign',
      '-',
      '--identifier',
      identifier,
      app,
    ]);
  else {
    // codesign detects an executable already inside Contents/MacOS and seals its bundle.
    // Reproduce the linker-only signature by signing before placing it in the bundle.
    const standalone = join(directory, 'standalone executable');
    copyFileSync(executable, standalone);
    run('codesign', [
      '--force',
      '--sign',
      '-',
      '--identifier',
      identifier,
      standalone,
    ]);
    copyFileSync(standalone, executable);
    rmSync(standalone);
  }
  return app;
}

function packArchive(fixture, sourceApp = fixture.app) {
  run('tar', [
    '-czf',
    fixture.archive,
    '-C',
    join(sourceApp, '..'),
    basename(sourceApp),
  ]);
}

function packDmg(fixture, sourceApp = fixture.app) {
  const source = join(fixture.root, 'DMG source');
  rmSync(source, { recursive: true, force: true });
  mkdirSync(source);
  cpSync(sourceApp, join(source, basename(sourceApp)), { recursive: true });
  symlinkSync('/Applications', join(source, 'Applications'));
  rmSync(fixture.dmg, { force: true });
  run('hdiutil', [
    'create',
    '-volname',
    'Lernwelt Test',
    '-srcfolder',
    source,
    '-format',
    'UDZO',
    '-fs',
    'HFS+',
    fixture.dmg,
  ]);
}

function fixture(t) {
  const root = temporary(t);
  const bundleRoot = join(root, 'release bundle');
  const app = createApp(join(bundleRoot, 'macos'));
  const archive = join(bundleRoot, 'macos', `${basename(app)}.tar.gz`);
  const dmg = join(bundleRoot, 'dmg', 'Lernwelt Test_1.2.3_aarch64.dmg');
  const temporaryRoot = join(root, 'verification temp');
  mkdirSync(join(bundleRoot, 'dmg'));
  mkdirSync(temporaryRoot);
  const result = { root, bundleRoot, app, archive, dmg, temporaryRoot };
  packArchive(result);
  packDmg(result);
  return result;
}

test(
  'native signatures reject missing sealing, changed or deleted resources and changed Info.plist',
  native,
  async (t) => {
    for (const corruption of [
      'main executable only',
      'changed resource',
      'deleted resource',
      'changed plist',
      'wrong signed identifier',
    ]) {
      await t.test(corruption, (child) => {
        const root = temporary(child);
        const app = createApp(root, {
          sealed: corruption !== 'main executable only',
          identifier:
            corruption === 'wrong signed identifier'
              ? 'de.other.fixture'
              : 'de.lernwelt.fixture',
        });
        const resource = join(app, 'Contents', 'Resources', 'lesson.txt');
        if (corruption === 'changed resource')
          writeFileSync(resource, 'Changed after signing.');
        if (corruption === 'deleted resource') rmSync(resource);
        if (corruption === 'changed plist')
          run('plutil', [
            '-replace',
            'CFBundleVersion',
            '-string',
            '9.9.9',
            join(app, 'Contents', 'Info.plist'),
          ]);
        assert.throws(
          () => verifyApp(app),
          /codesign failed|identity or version/,
        );
      });
    }
  },
);

test(
  'verifies the actual app, tar and readonly DMG through the CLI with spaces and removes temporary data',
  native,
  (t) => {
    const data = fixture(t);
    const verified = verifyMacosBundle(data.bundleRoot, {
      temporaryRoot: data.temporaryRoot,
    });
    assert.equal(verified.identifier, 'de.lernwelt.fixture');
    assert.equal(verified.version, '1.2.3');
    assert.deepEqual(readdirSync(data.temporaryRoot), []);
    assert.match(
      run(process.execPath, [
        'scripts/verify-macos-bundle.mjs',
        data.bundleRoot,
      ]),
      /app, updater archive and DMG verified/,
    );
  },
);

test(
  'rejects a changed resource inside the actual updater archive and cleans extraction on failure',
  native,
  (t) => {
    const data = fixture(t);
    const packedApp = join(data.root, 'updater source', basename(data.app));
    cpSync(data.app, packedApp, { recursive: true });
    writeFileSync(
      join(packedApp, 'Contents', 'Resources', 'lesson.txt'),
      'Changed only in updater.',
    );
    packArchive(data, packedApp);
    assert.throws(
      () =>
        verifyMacosBundle(data.bundleRoot, {
          temporaryRoot: data.temporaryRoot,
        }),
      /codesign failed/,
    );
    assert.deepEqual(readdirSync(data.temporaryRoot), []);
    verifyApp(data.app);
  },
);

test(
  'rejects a changed resource in the actual DMG and detaches the image before cleanup',
  native,
  (t) => {
    const data = fixture(t);
    const packedApp = join(data.root, 'bad DMG app', basename(data.app));
    cpSync(data.app, packedApp, { recursive: true });
    rmSync(join(packedApp, 'Contents', 'Resources', 'lesson.txt'));
    packDmg(data, packedApp);
    assert.throws(
      () =>
        verifyMacosBundle(data.bundleRoot, {
          temporaryRoot: data.temporaryRoot,
        }),
      /codesign failed/,
    );
    assert.deepEqual(readdirSync(data.temporaryRoot), []);
    assert.ok(
      !run('hdiutil', ['info', '-plist']).includes(data.dmg),
      'Failed image must not remain attached.',
    );
    verifyApp(data.app);
  },
);

test(
  'rejects validly signed but different packed app versions and ambiguous release artifacts',
  native,
  (t) => {
    const data = fixture(t);
    const packedApp = join(data.root, 'different updater', basename(data.app));
    cpSync(data.app, packedApp, { recursive: true });
    run('plutil', [
      '-replace',
      'CFBundleVersion',
      '-string',
      '2.0.0',
      join(packedApp, 'Contents', 'Info.plist'),
    ]);
    run('codesign', ['--force', '--sign', '-', packedApp]);
    verifyApp(packedApp);
    packArchive(data, packedApp);
    assert.throws(
      () =>
        verifyMacosBundle(data.bundleRoot, {
          temporaryRoot: data.temporaryRoot,
        }),
      /signature differs/,
    );
    assert.deepEqual(readdirSync(data.temporaryRoot), []);
    cpSync(data.app, join(data.bundleRoot, 'macos', 'Another.app'), {
      recursive: true,
    });
    assert.throws(
      () => verifyMacosBundle(data.bundleRoot),
      /exactly one local app/,
    );
  },
);

test(
  'detaches a real image when attach reports failure after mounting',
  native,
  (t) => {
    const data = fixture(t);
    const operations = [];
    assert.throws(
      () =>
        verifyMacosBundle(data.bundleRoot, {
          temporaryRoot: data.temporaryRoot,
          execute(executable, args) {
            operations.push([executable, ...args]);
            const stdout = run(executable, args);
            if (executable === 'hdiutil' && args[0] === 'attach')
              throw new Error('Attach failed after the actual mount.');
            return { stdout, stderr: '' };
          },
        }),
      /Attach failed after the actual mount/,
    );
    assert.ok(
      operations.some(
        ([executable, operation]) =>
          executable === 'hdiutil' && operation === 'detach',
      ),
    );
    assert.deepEqual(readdirSync(data.temporaryRoot), []);
    assert.ok(!run('hdiutil', ['info', '-plist']).includes(data.dmg));
  },
);
