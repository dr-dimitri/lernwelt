import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareVersions,
  requireNewVersion,
  releaseTag,
  prepareReleaseTag,
  shouldMakeLatest,
  parseReleaseVersion,
  releaseVersion,
} from './release-policy.mjs';

const sha = 'a'.repeat(40);
const source = { version: '0.6.2', sha, ref: 'refs/heads/main' };
function fakeApi({
  tag = null,
  release = null,
  annotated = null,
  version = '0.6.2',
} = {}) {
  const requests = [];
  const api = async (method, path, body, missing) => {
    requests.push({ method, path, body, missing });
    if (path === `git/ref/tags/v${version}`) return tag;
    if (path.startsWith('git/tags/')) return { object: annotated };
    if (path === `releases/tags/v${version}`) return release;
    if (method === 'POST' && path === 'git/refs')
      return { object: { type: 'commit', sha } };
    throw new Error(`Unexpected request ${method} ${path}`);
  };
  return { api, requests };
}

test('requires a strictly newer stable version, including numeric multi-digit ordering', () => {
  assert.doesNotThrow(() => requireNewVersion('0.6.2', '0.6.1'));
  assert.doesNotThrow(() => requireNewVersion('0.10.0', '0.9.99'));
  assert.doesNotThrow(() => requireNewVersion('1.0.0', '0.99.99'));
  for (const version of ['0.6.1', '0.6.0', '0.5.99'])
    assert.throws(
      () => requireNewVersion(version, '0.6.1'),
      /higher release version/,
    );
  for (const version of [
    'v0.6.2',
    '0.06.2',
    '0.6.2-beta',
    '0.6',
    '../bad',
    '9999999999999999999.0.0',
  ])
    assert.throws(() => compareVersions(version, '0.6.1'));
});

test('restricts publication to a full commit on main or its matching tag', () => {
  assert.equal(releaseTag('0.6.2', sha, 'refs/heads/main'), 'v0.6.2');
  assert.equal(releaseTag('0.6.2', sha, 'refs/tags/v0.6.2'), 'v0.6.2');
  for (const ref of [
    'refs/pull/133/merge',
    'refs/heads/codex/issue-132-auto-release',
    'refs/tags/v0.6.1',
  ])
    assert.throws(() => releaseTag('0.6.2', sha, ref), /require main/);
  assert.throws(
    () => releaseTag('0.6.2', 'HEAD', 'refs/heads/main'),
    /Invalid release commit/,
  );
});

test('creates the new tag at the exact checked commit and requests a build', async () => {
  const { api, requests } = fakeApi();
  assert.deepEqual(await prepareReleaseTag(source, api), {
    tag: 'v0.6.2',
    version: '0.6.2',
    build: true,
  });
  const writes = requests.filter((request) => request.method !== 'GET');
  assert.deepEqual(writes, [
    {
      method: 'POST',
      path: 'git/refs',
      body: { ref: 'refs/tags/v0.6.2', sha },
      missing: undefined,
    },
  ]);
});

test('rebuilds an incomplete draft but leaves a published release unchanged on rerun', async () => {
  for (const draft of [true, false]) {
    const { api, requests } = fakeApi({
      tag: { object: { type: 'commit', sha } },
      release: { draft },
    });
    assert.equal((await prepareReleaseTag(source, api)).build, draft);
    assert.equal(
      requests.filter((request) => request.method !== 'GET').length,
      0,
    );
  }
});

test('accepts an annotated tag only when it resolves to the checked commit', async () => {
  const { api } = fakeApi({
    tag: { object: { type: 'tag', sha: 'b'.repeat(40) } },
    annotated: { type: 'commit', sha },
  });
  assert.equal((await prepareReleaseTag(source, api)).build, true);
});

test('refuses mismatched tags before any write or release lookup', async () => {
  const { api, requests } = fakeApi({
    tag: { object: { type: 'commit', sha: 'b'.repeat(40) } },
  });
  await assert.rejects(
    () => prepareReleaseTag(source, api),
    /different commit/,
  );
  assert.equal(requests.length, 1);
});

test('does not turn a failed GitHub read into a tag creation', async () => {
  let writes = 0;
  const api = async (method) => {
    if (method !== 'GET') writes++;
    throw new Error('HTTP 403');
  };
  await assert.rejects(() => prepareReleaseTag(source, api), /HTTP 403/);
  assert.equal(writes, 0);
});

test('keeps the updater latest version monotonic even when an older build finishes later', () => {
  assert.equal(shouldMakeLatest('0.6.2', null), true);
  assert.equal(shouldMakeLatest('0.6.2', { tag_name: 'v0.6.1' }), true);
  assert.equal(shouldMakeLatest('0.6.2', { tag_name: 'v0.6.2' }), false);
  assert.equal(shouldMakeLatest('0.6.2', { tag_name: 'v0.7.0' }), false);
  assert.equal(shouldMakeLatest('0.10.0', { tag_name: 'v0.9.9' }), true);
  assert.throws(() => shouldMakeLatest('0.6.2', { tag_name: 'other-tag' }));
});

test('enables rc versions only through a matching explicit tag with a stable source version', () => {
  assert.equal(releaseVersion('0.6.9', 'refs/heads/main'), '0.6.9');
  assert.equal(releaseVersion('0.6.9', 'refs/tags/v0.6.9'), '0.6.9');
  assert.equal(releaseVersion('0.6.9', 'refs/tags/v0.6.9-rc.1'), '0.6.9-rc.1');
  assert.deepEqual(parseReleaseVersion('0.6.9-rc.12'), {
    baseVersion: '0.6.9',
    prerelease: true,
  });
  assert.equal(
    releaseTag('0.6.9-rc.1', sha, 'refs/tags/v0.6.9-rc.1'),
    'v0.6.9-rc.1',
  );
  for (const ref of [
    'refs/heads/main',
    'refs/heads/codex/issue-149-test',
    'refs/tags/v0.6.9',
  ])
    assert.throws(() => releaseTag('0.6.9-rc.1', sha, ref), /explicit rc tag/);
  for (const tag of [
    'v0.6.8-rc.1',
    'v0.6.9-rc.0',
    'v0.6.9-rc.01',
    'v0.6.9-beta.1',
    'v0.6.9-rc.9007199254740992',
  ])
    assert.throws(() => releaseVersion('0.6.9', `refs/tags/${tag}`));
  assert.throws(
    () => requireNewVersion('0.6.9-rc.1', '0.6.8'),
    /stable release version/,
  );
});

test('a prerelease never replaces the stable latest endpoint', () => {
  for (const latest of [
    null,
    { tag_name: 'v0.6.8' },
    { tag_name: 'other-tag' },
  ])
    assert.equal(shouldMakeLatest('0.6.9-rc.1', latest), false);
});

test('rc tags preserve their exact commit and leave a published preview unchanged', async () => {
  const version = '0.6.9-rc.1';
  for (const draft of [true, false]) {
    const f = fakeApi({
      version,
      tag: { object: { type: 'commit', sha } },
      release: { draft, prerelease: true },
    });
    assert.deepEqual(
      await prepareReleaseTag(
        { version, sha, ref: `refs/tags/v${version}` },
        f.api,
      ),
      { tag: `v${version}`, version, build: draft },
    );
    assert.equal(
      f.requests.filter((request) => request.method !== 'GET').length,
      0,
    );
  }
  const mismatched = fakeApi({
    version,
    tag: { object: { type: 'commit', sha: 'b'.repeat(40) } },
  });
  await assert.rejects(
    () =>
      prepareReleaseTag(
        { version, sha, ref: `refs/tags/v${version}` },
        mismatched.api,
      ),
    /different commit/,
  );
  assert.equal(mismatched.requests.length, 1);
});
