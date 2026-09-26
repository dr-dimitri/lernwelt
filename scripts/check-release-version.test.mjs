import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const version = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
).version;
const files = [
  'package.json',
  'package-lock.json',
  'src-tauri/tauri.conf.json',
  'src-tauri/Cargo.toml',
  'src-tauri/Cargo.lock',
  `docs/releases/${version}.md`,
];

function runCheck(lineEnding, mismatchedVersion = false) {
  const fixture = mkdtempSync(join(tmpdir(), 'lernwelt-version-'));
  try {
    for (const name of files) {
      const target = join(fixture, name);
      mkdirSync(dirname(target), { recursive: true });
      let content = readFileSync(join(root, name), 'utf8');
      if (mismatchedVersion && name === 'src-tauri/tauri.conf.json') {
        const config = JSON.parse(content);
        config.version = '999.0.0';
        content = JSON.stringify(config);
      }
      writeFileSync(target, content.replace(/\r?\n/g, lineEnding));
    }
    return spawnSync(
      process.execPath,
      [join(root, 'scripts/check-release-version.mjs')],
      {
        cwd: fixture,
        env: { ...process.env, GITHUB_REF_NAME: `v${version}` },
        encoding: 'utf8',
      },
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

test('accepts matching release versions with Unix line endings', () => {
  const result = runCheck('\n');
  assert.equal(result.status, 0, result.stderr);
});

test('accepts matching release versions with Windows line endings', () => {
  const result = runCheck('\r\n');
  assert.equal(result.status, 0, result.stderr);
});

test('rejects a real version mismatch with Windows line endings', () => {
  const result = runCheck('\r\n', true);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Package, Tauri and Cargo versions differ/);
});
