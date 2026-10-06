import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyReleaseSource } from './release-source.mjs';

const sha = 'a'.repeat(40);
const source = { sourceVersion: '0.6.9', sha, ref: 'refs/tags/v0.6.9-rc.1' };

test('accepts a prerelease tag only when its exact commit belongs to a pushed issue branch', () => {
  const calls = [];
  assert.deepEqual(
    verifyReleaseSource(source, (args) => {
      calls.push(args);
      return 'refs/remotes/origin/codex/issue-149-direkt-zum-thema\r\n';
    }),
    { version: '0.6.9-rc.1', tag: 'v0.6.9-rc.1', prerelease: true },
  );
  assert.deepEqual(calls, [
    [
      'for-each-ref',
      `--contains=${sha}`,
      '--format=%(refname)',
      'refs/remotes/origin/codex/issue-*',
    ],
  ]);
  for (const branches of [
    '',
    'refs/remotes/origin/main\n',
    'refs/heads/codex/issue-149-test\n',
    'refs/remotes/origin/codex/issue-0-test\n',
  ])
    assert.throws(
      () => verifyReleaseSource(source, () => branches),
      /pushed issue branch/,
    );
});

test('retains main ancestry as a mandatory condition for stable tags and main releases', () => {
  for (const ref of ['refs/heads/main', 'refs/tags/v0.6.9']) {
    const calls = [];
    assert.deepEqual(
      verifyReleaseSource({ ...source, ref }, (args) => {
        calls.push(args);
        return '';
      }),
      { version: '0.6.9', tag: 'v0.6.9', prerelease: false },
    );
    assert.deepEqual(calls, [
      ['merge-base', '--is-ancestor', sha, 'origin/main'],
    ]);
    assert.throws(
      () =>
        verifyReleaseSource({ ...source, ref }, () => {
          throw new Error('not on main');
        }),
      /not on main/,
    );
  }
});

test('rejects an rc tag for another source version before looking up branch ancestry', () => {
  let calls = 0;
  assert.throws(
    () =>
      verifyReleaseSource({ ...source, sourceVersion: '0.6.8' }, () => {
        calls++;
      }),
    /source version differ/,
  );
  assert.equal(calls, 0);
});

test('checks real remote issue refs and refuses a stable release from an unmerged commit', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'lernwelt-release-source-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const git = (args) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_NOSYSTEM: '1',
      },
    });
  const commit = () =>
    git([
      '-c',
      'user.name=Release Test',
      '-c',
      'user.email=release-test@example.invalid',
      'commit',
      '--quiet',
      '-am',
      'Release fixture',
    ]);
  git(['init', '--quiet']);
  writeFileSync(join(directory, 'source'), 'main');
  git(['add', 'source']);
  commit();
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  writeFileSync(join(directory, 'source'), 'issue');
  commit();
  const issueSha = git(['rev-parse', 'HEAD']).trim();
  git([
    'update-ref',
    'refs/remotes/origin/codex/issue-149-direkt-zum-thema',
    issueSha,
  ]);
  assert.equal(
    verifyReleaseSource({ ...source, sha: issueSha }, git).prerelease,
    true,
  );
  assert.throws(() =>
    verifyReleaseSource(
      { ...source, sha: issueSha, ref: 'refs/tags/v0.6.9' },
      git,
    ),
  );
  git([
    'update-ref',
    '-d',
    'refs/remotes/origin/codex/issue-149-direkt-zum-thema',
  ]);
  assert.throws(
    () => verifyReleaseSource({ ...source, sha: issueSha }, git),
    /pushed issue branch/,
  );
});
