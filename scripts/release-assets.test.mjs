import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { prepareRelease } from './release-assets.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'lernwelt-release-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const target of ['darwin-aarch64', 'darwin-x86_64', 'windows-x86_64']) {
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

test('publishes all targets without overwriting the two macOS bundles', (t) => {
  const root = fixture(t);
  const output = join(root, 'output');
  const result = prepareRelease(root, output, '0.2.0', 'Neue Funktionen');
  assert.equal(Object.keys(result.platforms).length, 3);
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

test('rejects an incomplete platform set, missing signature, or ambiguous bundle', (t) => {
  const root = fixture(t);
  const dir = join(root, 'windows-x86_64', 'bundle');
  const signature = join(dir, 'Lernwelt-setup.exe.sig');
  writeFileSync(signature, 'not a signature');
  assert.throws(
    () => prepareRelease(root, join(root, 'output'), '0.2.0', ''),
    /signature/,
  );
  rmSync(signature);
  assert.throws(() => prepareRelease(root, join(root, 'output'), '0.2.0', ''));
  writeFileSync(join(dir, 'Second-setup.exe'), 'ambiguous');
  assert.throws(
    () => prepareRelease(root, join(root, 'output'), '0.2.0', ''),
    /one updater bundle/,
  );
  rmSync(join(root, 'windows-x86_64'), { recursive: true });
  assert.throws(() => prepareRelease(root, join(root, 'output'), '0.2.0', ''));
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
