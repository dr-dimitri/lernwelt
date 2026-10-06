import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { prepareRelease } from './release-assets.mjs';

function fixture(t, targets = ['darwin-aarch64', 'windows-x86_64']) {
  const root = mkdtempSync(join(tmpdir(), 'lernwelt-release-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const target of targets) {
    const dir = join(root, target, 'bundle');
    mkdirSync(dir, { recursive: true });
    const bundle = join(
      dir,
      target.startsWith('darwin')
        ? 'Lernwelt.app.tar.gz'
        : 'Lernwelt-setup.exe',
    );
    writeFileSync(bundle, target);
    writeFileSync(
      `${bundle}.sig`,
      Buffer.from(
        'untrusted comment: test\nRWTEST\ntrusted comment: test\nTEST',
      ).toString('base64'),
    );
    if (target.startsWith('darwin'))
      writeFileSync(join(dir, 'Lernwelt.dmg'), target);
  }
  return root;
}

test('assembles exactly the six Apple Silicon and Windows files and their updater manifest', (t) => {
  const root = fixture(t);
  const output = join(root, 'output');
  const result = prepareRelease(root, output, '0.2.0', 'Neue Funktionen');
  assert.deepEqual(Object.keys(result.platforms), [
    'darwin-aarch64',
    'windows-x86_64',
  ]);
  assert.deepEqual(
    readdirSync(output).sort(),
    [
      'Lernwelt_0.2.0_darwin-aarch64.app.tar.gz',
      'Lernwelt_0.2.0_darwin-aarch64.app.tar.gz.sig',
      'Lernwelt_0.2.0_darwin-aarch64.dmg',
      'Lernwelt_0.2.0_windows-x86_64-setup.exe',
      'Lernwelt_0.2.0_windows-x86_64-setup.exe.sig',
      'latest.json',
    ].sort(),
  );
  assert.equal(
    readFileSync(join(output, 'Lernwelt_0.2.0_darwin-aarch64.dmg'), 'utf8'),
    'darwin-aarch64',
  );
  for (const [target, entry] of Object.entries(result.platforms)) {
    assert.ok(
      entry.url.startsWith(
        'https://github.com/dr-dimitri/lernwelt/releases/download/v0.2.0/',
      ),
    );
    const name = entry.url.split('/').at(-1);
    assert.equal(readFileSync(join(output, name), 'utf8'), target);
    assert.equal(
      readFileSync(join(output, `${name}.sig`), 'utf8'),
      entry.signature,
    );
  }
  assert.deepEqual(
    JSON.parse(readFileSync(join(output, 'latest.json'), 'utf8')),
    result,
  );
});

test('rejects missing, invalid, empty or unexpected inputs before producing any output', async (t) => {
  const faults = {
    'missing Windows platform': (root) =>
      rmSync(join(root, 'windows-x86_64'), { recursive: true }),
    'missing Apple Silicon platform': (root) =>
      rmSync(join(root, 'darwin-aarch64'), { recursive: true }),
    'invalid signature': (root) =>
      writeFileSync(
        join(root, 'windows-x86_64', 'bundle', 'Lernwelt-setup.exe.sig'),
        'not a signature',
      ),
    'missing signature': (root) =>
      rmSync(join(root, 'windows-x86_64', 'bundle', 'Lernwelt-setup.exe.sig')),
    'empty signature': (root) =>
      writeFileSync(
        join(root, 'windows-x86_64', 'bundle', 'Lernwelt-setup.exe.sig'),
        '',
      ),
    'ambiguous updater': (root) =>
      writeFileSync(
        join(root, 'darwin-aarch64', 'bundle', 'Another.app.tar.gz'),
        'second app',
      ),
    'missing DMG': (root) =>
      rmSync(join(root, 'darwin-aarch64', 'bundle', 'Lernwelt.dmg')),
    'empty updater': (root) =>
      writeFileSync(
        join(root, 'windows-x86_64', 'bundle', 'Lernwelt-setup.exe'),
        '',
      ),
    'empty DMG': (root) =>
      writeFileSync(join(root, 'darwin-aarch64', 'bundle', 'Lernwelt.dmg'), ''),
    'additional Intel platform': (root) =>
      mkdirSync(join(root, 'darwin-x86_64')),
    'Intel file inside supported platform': (root) =>
      writeFileSync(
        join(
          root,
          'windows-x86_64',
          'bundle',
          'Lernwelt_darwin-x86_64.app.tar.gz',
        ),
        'old Intel app',
      ),
    'Intel updater replacing the Apple Silicon input': (root) => {
      const directory = join(root, 'darwin-aarch64', 'bundle');
      renameSync(
        join(directory, 'Lernwelt.app.tar.gz'),
        join(directory, 'Lernwelt_darwin-x86_64.app.tar.gz'),
      );
      renameSync(
        join(directory, 'Lernwelt.app.tar.gz.sig'),
        join(directory, 'Lernwelt_darwin-x86_64.app.tar.gz.sig'),
      );
    },
    'Intel DMG replacing the Apple Silicon input': (root) => {
      const directory = join(root, 'darwin-aarch64', 'bundle');
      renameSync(
        join(directory, 'Lernwelt.dmg'),
        join(directory, 'Lernwelt_0.2.0_x64.dmg'),
      );
    },
    'unexpected root file': (root) =>
      writeFileSync(join(root, 'old-intel.dmg'), 'old Intel DMG'),
    'unexpected signature': (root) =>
      writeFileSync(
        join(root, 'darwin-aarch64', 'bundle', 'old.app.tar.gz.sig'),
        'old signature',
      ),
    'unexpected Windows DMG': (root) =>
      writeFileSync(
        join(root, 'windows-x86_64', 'bundle', 'old.dmg'),
        'unexpected DMG',
      ),
  };
  for (const [name, corrupt] of Object.entries(faults)) {
    await t.test(name, (child) => {
      const root = fixture(child);
      const output = join(root, 'output');
      corrupt(root);
      assert.throws(() => prepareRelease(root, output, '0.2.0', ''));
      assert.equal(existsSync(output), false);
    });
  }
});

test('rejects invalid versions and unexpected destinations', (t) => {
  const root = fixture(t);
  assert.throws(
    () => prepareRelease(root, join(root, 'output'), '../bad', ''),
    /version/,
  );
  assert.throws(
    () => prepareRelease(root, join(root, 'output'), '0.2.0', '', 'other/repo'),
    /repository/,
  );
});

test('assembles exactly four signed Apple Silicon preview files with the rc version in URLs and manifest', (t) => {
  const root = fixture(t, ['darwin-aarch64']);
  const output = join(root, 'output');
  const result = prepareRelease(root, output, '0.6.9-rc.1', 'Vorab testen');
  assert.equal(result.version, '0.6.9-rc.1');
  assert.deepEqual(Object.keys(result.platforms), ['darwin-aarch64']);
  assert.deepEqual(readdirSync(output).sort(), [
    'Lernwelt_0.6.9-rc.1_darwin-aarch64.app.tar.gz',
    'Lernwelt_0.6.9-rc.1_darwin-aarch64.app.tar.gz.sig',
    'Lernwelt_0.6.9-rc.1_darwin-aarch64.dmg',
    'latest.json',
  ]);
  for (const entry of Object.values(result.platforms)) {
    assert.ok(
      entry.url.startsWith(
        'https://github.com/dr-dimitri/lernwelt/releases/download/v0.6.9-rc.1/Lernwelt_0.6.9-rc.1_',
      ),
    );
    const name = entry.url.split('/').at(-1);
    assert.equal(readFileSync(join(output, name), 'utf8'), 'darwin-aarch64');
    assert.equal(
      readFileSync(join(output, `${name}.sig`), 'utf8'),
      entry.signature,
    );
  }
  assert.equal(
    readFileSync(
      join(output, 'Lernwelt_0.6.9-rc.1_darwin-aarch64.dmg'),
      'utf8',
    ),
    'darwin-aarch64',
  );
  assert.deepEqual(
    JSON.parse(readFileSync(join(output, 'latest.json'), 'utf8')),
    result,
  );
});

test('rejects missing, invalid, empty or extra preview inputs before producing any output', async (t) => {
  const bundleDirectory = (root) => join(root, 'darwin-aarch64', 'bundle');
  const updater = (root) => join(bundleDirectory(root), 'Lernwelt.app.tar.gz');
  const faults = {
    'missing Apple Silicon platform': (root) =>
      rmSync(join(root, 'darwin-aarch64'), { recursive: true }),
    'missing updater': (root) => rmSync(updater(root)),
    'invalid signature': (root) =>
      writeFileSync(`${updater(root)}.sig`, 'not a signature'),
    'missing signature': (root) => rmSync(`${updater(root)}.sig`),
    'empty signature': (root) => writeFileSync(`${updater(root)}.sig`, ''),
    'empty updater': (root) => writeFileSync(updater(root), ''),
    'ambiguous updater': (root) =>
      writeFileSync(join(bundleDirectory(root), 'Another.app.tar.gz'), 'app'),
    'missing DMG': (root) =>
      rmSync(join(bundleDirectory(root), 'Lernwelt.dmg')),
    'empty DMG': (root) =>
      writeFileSync(join(bundleDirectory(root), 'Lernwelt.dmg'), ''),
    'additional Windows platform': (root) =>
      mkdirSync(join(root, 'windows-x86_64')),
    'nested Windows platform': (root) =>
      mkdirSync(join(bundleDirectory(root), 'windows-x86_64')),
    'nested Windows build directory': (root) =>
      mkdirSync(join(bundleDirectory(root), 'x86_64-pc-windows-msvc')),
    'additional Windows installer': (root) =>
      writeFileSync(join(bundleDirectory(root), 'Lernwelt-setup.exe'), 'exe'),
    'additional Windows signature': (root) =>
      writeFileSync(
        join(bundleDirectory(root), 'Lernwelt-setup.exe.sig'),
        'sig',
      ),
    'Windows updater replacing the Apple Silicon input': (root) => {
      renameSync(
        updater(root),
        join(bundleDirectory(root), 'Lernwelt_windows-x86_64.app.tar.gz'),
      );
      renameSync(
        `${updater(root)}.sig`,
        join(bundleDirectory(root), 'Lernwelt_windows-x86_64.app.tar.gz.sig'),
      );
      assert.equal(readdirSync(bundleDirectory(root)).length, 3);
    },
    'Windows DMG replacing the Apple Silicon input': (root) => {
      renameSync(
        join(bundleDirectory(root), 'Lernwelt.dmg'),
        join(bundleDirectory(root), 'Lernwelt_x86_64-pc-windows-msvc.dmg'),
      );
      assert.equal(readdirSync(bundleDirectory(root)).length, 3);
    },
    'additional Intel platform': (root) =>
      mkdirSync(join(root, 'darwin-x86_64')),
    'nested Intel platform': (root) =>
      mkdirSync(join(bundleDirectory(root), 'darwin-x86_64')),
    'Intel updater replacing the Apple Silicon input': (root) => {
      renameSync(
        updater(root),
        join(bundleDirectory(root), 'Lernwelt_darwin-x86_64.app.tar.gz'),
      );
      renameSync(
        `${updater(root)}.sig`,
        join(bundleDirectory(root), 'Lernwelt_darwin-x86_64.app.tar.gz.sig'),
      );
    },
    'Intel DMG replacing the Apple Silicon input': (root) =>
      renameSync(
        join(bundleDirectory(root), 'Lernwelt.dmg'),
        join(bundleDirectory(root), 'Lernwelt_0.6.9-rc.1_x64.dmg'),
      ),
    'unexpected root file': (root) =>
      writeFileSync(join(root, 'Lernwelt-setup.exe'), 'exe'),
    'unexpected signature': (root) =>
      writeFileSync(join(bundleDirectory(root), 'old.app.tar.gz.sig'), 'sig'),
  };
  for (const [name, corrupt] of Object.entries(faults)) {
    await t.test(name, (child) => {
      const root = fixture(child, ['darwin-aarch64']);
      const output = join(root, 'output');
      corrupt(root);
      assert.throws(() => prepareRelease(root, output, '0.6.9-rc.1', ''));
      assert.equal(existsSync(output), false);
    });
  }
});

test('retains the macOS package verification gate before artifact upload', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/release.yml', import.meta.url),
    'utf8',
  );
  const verification = workflow.indexOf('node scripts/verify-macos-bundle.mjs');
  const upload = workflow.indexOf('uses: actions/upload-artifact');
  assert.ok(verification >= 0);
  assert.ok(upload >= 0);
  assert.ok(verification < upload);
});
