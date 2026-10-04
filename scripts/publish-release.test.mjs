import assert from 'node:assert/strict';
import test from 'node:test';
import { publishRelease } from './publish-release.mjs';

const assets = ['darwin-aarch64', 'darwin-x86_64']
  .flatMap((target) => [
    `Lernwelt_0.6.2_${target}.app.tar.gz`,
    `Lernwelt_0.6.2_${target}.app.tar.gz.sig`,
    `Lernwelt_0.6.2_${target}.dmg`,
  ])
  .concat([
    'Lernwelt_0.6.2_windows-x86_64-setup.exe',
    'Lernwelt_0.6.2_windows-x86_64-setup.exe.sig',
    'latest.json',
  ]);
const source = {
  version: '0.6.2',
  sha: 'a'.repeat(40),
  ref: 'refs/heads/main',
  tag: 'v0.6.2',
  notes: 'Neue Version',
  assets,
};
function fixture({
  existing = null,
  uploaded = assets.map((name) => ({ name, size: 100 })),
  latest = { tag_name: 'v0.6.1' },
  failUpload = false,
} = {}) {
  const writes = [];
  const uploads = [];
  const api = async (method, path, body) => {
    if (method !== 'GET') writes.push({ method, path, body });
    if (path === 'releases/tags/v0.6.2') return existing;
    if (method === 'POST') return { id: 123, draft: true };
    if (path === 'releases/latest') return latest;
    if (method === 'GET' && path === 'releases/123')
      return { assets: uploaded };
    if (method === 'PATCH') return { draft: false };
    throw new Error(`Unexpected ${method} ${path}`);
  };
  const upload = async (tag, files) => {
    uploads.push({ tag, files });
    if (failUpload) throw new Error('Upload failed');
  };
  return { api, upload, writes, uploads };
}

test('publishes a new draft only after all nine files were uploaded', async () => {
  const f = fixture();
  assert.deepEqual(await publishRelease(source, f.api, f.upload), {
    published: true,
    makeLatest: true,
  });
  assert.equal(f.writes[0].body.draft, true);
  assert.equal(f.writes[0].body.target_commitish, source.sha);
  assert.deepEqual(f.uploads, [{ tag: 'v0.6.2', files: assets }]);
  assert.deepEqual(f.writes.at(-1), {
    method: 'PATCH',
    path: 'releases/123',
    body: { draft: false, make_latest: 'true' },
  });
});

test('leaves a published release untouched without uploads or writes', async () => {
  const f = fixture({ existing: { id: 123, draft: false } });
  assert.deepEqual(await publishRelease(source, f.api, f.upload), {
    published: false,
    unchanged: true,
  });
  assert.equal(f.writes.length, 0);
  assert.equal(f.uploads.length, 0);
});

test('retries an existing draft without creating a second release', async () => {
  const f = fixture({ existing: { id: 123, draft: true } });
  await publishRelease(source, f.api, f.upload);
  assert.equal(
    f.writes.filter((request) => request.method === 'POST').length,
    0,
  );
});

test('does not create a release for missing or unexpected assets', async () => {
  for (const invalid of [
    assets.slice(1),
    [...assets.slice(1), 'unexpected.exe'],
  ]) {
    const f = fixture();
    await assert.rejects(
      () => publishRelease({ ...source, assets: invalid }, f.api, f.upload),
      /all nine/,
    );
    assert.equal(f.writes.length, 0);
    assert.equal(f.uploads.length, 0);
  }
});

test('keeps the draft on upload failure, missing uploaded file or zero-byte asset', async () => {
  for (const options of [
    { failUpload: true },
    { uploaded: assets.slice(1).map((name) => ({ name, size: 100 })) },
    {
      uploaded: assets.map((name, index) => ({ name, size: index ? 100 : 0 })),
    },
  ]) {
    const f = fixture(options);
    await assert.rejects(() => publishRelease(source, f.api, f.upload));
    assert.equal(
      f.writes.filter((request) => request.method === 'PATCH').length,
      0,
    );
    assert.equal(f.writes[0].body.draft, true);
  }
});

test('publishes an older completed release without replacing the newer updater latest', async () => {
  const f = fixture({ latest: { tag_name: 'v0.6.3' } });
  assert.deepEqual(await publishRelease(source, f.api, f.upload), {
    published: true,
    makeLatest: false,
  });
  assert.equal(f.writes.at(-1).body.make_latest, 'false');
});

test('rejects a mismatched prepared tag before accessing GitHub', async () => {
  const f = fixture();
  await assert.rejects(
    () => publishRelease({ ...source, tag: 'v0.6.1' }, f.api, f.upload),
    /tag differs/,
  );
  assert.equal(f.writes.length, 0);
  assert.equal(f.uploads.length, 0);
});
