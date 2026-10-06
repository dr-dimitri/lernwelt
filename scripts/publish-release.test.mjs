import assert from 'node:assert/strict';
import test from 'node:test';
import { publishRelease } from './publish-release.mjs';

const assets = ['darwin-aarch64']
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
const previewVersion = '0.6.14-rc.1';
const previewAssets = [
  `Lernwelt_${previewVersion}_darwin-aarch64.app.tar.gz`,
  `Lernwelt_${previewVersion}_darwin-aarch64.app.tar.gz.sig`,
  `Lernwelt_${previewVersion}_darwin-aarch64.dmg`,
  'latest.json',
];
const previewSource = {
  ...source,
  version: previewVersion,
  ref: `refs/tags/v${previewVersion}`,
  tag: `v${previewVersion}`,
  assets: previewAssets,
};
function fixture({
  releaseSource = source,
  existing = null,
  uploaded = releaseSource.assets.map((name) => ({ name, size: 100 })),
  latest = { tag_name: 'v0.6.1' },
  failUpload = false,
} = {}) {
  const writes = [];
  const reads = [];
  const uploads = [];
  const api = async (method, path, body) => {
    if (method !== 'GET') writes.push({ method, path, body });
    else reads.push(path);
    if (path === `releases/tags/${releaseSource.tag}`) return existing;
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
  return { api, upload, writes, uploads, reads };
}

test('publishes a new draft only after exactly six files were uploaded', async () => {
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
    body: { draft: false, prerelease: false, make_latest: 'true' },
  });
});

test('leaves a historical three-platform release with nine assets untouched', async () => {
  const historicalAssets = [
    ...assets,
    'Lernwelt_0.6.2_darwin-x86_64.app.tar.gz',
    'Lernwelt_0.6.2_darwin-x86_64.app.tar.gz.sig',
    'Lernwelt_0.6.2_darwin-x86_64.dmg',
  ];
  const existing = {
    id: 123,
    draft: false,
    prerelease: false,
    assets: historicalAssets.map((name) => ({ name, size: 100 })),
  };
  const before = structuredClone(existing);
  const f = fixture({ existing });
  assert.deepEqual(
    await publishRelease(
      { ...source, assets: historicalAssets },
      f.api,
      f.upload,
    ),
    {
      published: false,
      unchanged: true,
    },
  );
  assert.equal(f.writes.length, 0);
  assert.equal(f.uploads.length, 0);
  assert.deepEqual(existing, before);
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
    [...assets, 'Lernwelt_0.6.2_darwin-x86_64.dmg'],
    [...assets.slice(1), assets[1]],
  ]) {
    const f = fixture();
    await assert.rejects(
      () => publishRelease({ ...source, assets: invalid }, f.api, f.upload),
      /exactly 6/,
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
    {
      uploaded: [...assets, 'Lernwelt_0.6.2_darwin-x86_64.dmg'].map((name) => ({
        name,
        size: 100,
      })),
    },
    {
      uploaded: [...assets.slice(1), assets[1]].map((name) => ({
        name,
        size: 100,
      })),
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

test('publishes rc assets as a prerelease without reading or changing stable latest', async () => {
  const f = fixture({ releaseSource: previewSource });
  assert.deepEqual(await publishRelease(previewSource, f.api, f.upload), {
    published: true,
    makeLatest: false,
  });
  assert.equal(f.writes[0].body.prerelease, true);
  assert.equal(f.writes[0].body.make_latest, 'false');
  assert.deepEqual(f.writes.at(-1).body, {
    draft: false,
    prerelease: true,
    make_latest: 'false',
  });
  assert.ok(!f.reads.includes('releases/latest'));
  assert.deepEqual(f.uploads, [
    { tag: previewSource.tag, files: previewAssets },
  ]);
  assert.equal(f.uploads[0].files.length, 4);
  assert.ok(
    f.uploads[0].files.every((name) => !/windows|darwin-x86_64/.test(name)),
  );
});

test('rejects every missing file and extra Windows or Intel preview assets without creating a draft', async () => {
  const invalid = [
    ...previewAssets.map((_, index) =>
      previewAssets.filter((__, i) => i !== index),
    ),
    [...previewAssets, `Lernwelt_${previewVersion}_windows-x86_64-setup.exe`],
    [
      ...previewAssets,
      `Lernwelt_${previewVersion}_windows-x86_64-setup.exe.sig`,
    ],
    [...previewAssets, 'windows-x86_64'],
    [...previewAssets, `Lernwelt_${previewVersion}_darwin-x86_64.dmg`],
    [...previewAssets.slice(1), previewAssets[1]],
  ];
  for (const files of invalid) {
    const f = fixture({ releaseSource: previewSource });
    await assert.rejects(
      () =>
        publishRelease({ ...previewSource, assets: files }, f.api, f.upload),
      /exactly 4/,
    );
    assert.deepEqual(f.writes, []);
    assert.deepEqual(f.uploads, []);
  }
});

test('requires every stable platform package and signature before creating a draft', async () => {
  for (let index = 0; index < assets.length; index++) {
    const f = fixture();
    await assert.rejects(
      () =>
        publishRelease(
          { ...source, assets: assets.filter((_, i) => i !== index) },
          f.api,
          f.upload,
        ),
      /exactly 6/,
    );
    assert.deepEqual(f.writes, []);
    assert.deepEqual(f.uploads, []);
  }
});

test('requires every uploaded file to be present and nonempty for both channels', async () => {
  for (const releaseSource of [source, previewSource]) {
    for (let index = 0; index < releaseSource.assets.length; index++) {
      for (const uploaded of [
        releaseSource.assets
          .filter((_, i) => i !== index)
          .map((name) => ({ name, size: 100 })),
        releaseSource.assets.map((name, i) => ({
          name,
          size: i === index ? 0 : 100,
        })),
      ]) {
        const f = fixture({ releaseSource, uploaded });
        await assert.rejects(
          () => publishRelease(releaseSource, f.api, f.upload),
          /incomplete or contains unexpected assets/,
        );
        assert.equal(
          f.writes.filter(({ method }) => method === 'PATCH').length,
          0,
        );
        assert.equal(f.writes[0].body.draft, true);
      }
    }
  }
});

test('leaves preview drafts unpublished on extra Windows, Intel, duplicate files or failed uploads', async () => {
  for (const options of [
    { failUpload: true },
    {
      uploaded: [
        ...previewAssets,
        `Lernwelt_${previewVersion}_windows-x86_64-setup.exe`,
        `Lernwelt_${previewVersion}_windows-x86_64-setup.exe.sig`,
      ].map((name) => ({ name, size: 100 })),
    },
    {
      uploaded: [
        ...previewAssets,
        `Lernwelt_${previewVersion}_darwin-x86_64.dmg`,
      ].map((name) => ({ name, size: 100 })),
    },
    {
      uploaded: [...previewAssets.slice(1), previewAssets[1]].map((name) => ({
        name,
        size: 100,
      })),
    },
  ]) {
    const f = fixture({
      ...options,
      releaseSource: previewSource,
      existing: { id: 123, draft: true, prerelease: true },
    });
    await assert.rejects(() => publishRelease(previewSource, f.api, f.upload));
    assert.deepEqual(f.writes, []);
    assert.deepEqual(f.uploads, [
      { tag: previewSource.tag, files: previewAssets },
    ]);
    assert.ok(!f.reads.includes('releases/latest'));
  }
});

test('leaves historical published previews with six or nine assets and their channels unchanged', async () => {
  const windowsAssets = [
    `Lernwelt_${previewVersion}_windows-x86_64-setup.exe`,
    `Lernwelt_${previewVersion}_windows-x86_64-setup.exe.sig`,
  ];
  const intelAssets = [
    `Lernwelt_${previewVersion}_darwin-x86_64.app.tar.gz`,
    `Lernwelt_${previewVersion}_darwin-x86_64.app.tar.gz.sig`,
    `Lernwelt_${previewVersion}_darwin-x86_64.dmg`,
  ];
  for (const files of [
    [...previewAssets, ...windowsAssets],
    [...previewAssets, ...windowsAssets, ...intelAssets],
  ]) {
    const existing = {
      id: 123,
      draft: false,
      prerelease: true,
      body: 'Historische Vorabversion',
      assets: files.map((name) => ({ name, size: 100 })),
    };
    const before = structuredClone(existing);
    const f = fixture({ releaseSource: previewSource, existing });
    assert.deepEqual(
      await publishRelease(
        { ...previewSource, assets: files },
        f.api,
        f.upload,
      ),
      { published: false, unchanged: true },
    );
    assert.deepEqual(existing, before);
    assert.deepEqual(f.writes, []);
    assert.deepEqual(f.uploads, []);
    assert.deepEqual(f.reads, [`releases/tags/${previewSource.tag}`]);
  }
});

test('rejects a published preview with the stable channel without uploading or changing it', async () => {
  const existing = { id: 123, draft: false, prerelease: false };
  const before = structuredClone(existing);
  const f = fixture({ releaseSource: previewSource, existing });
  await assert.rejects(
    () => publishRelease(previewSource, f.api, f.upload),
    /channel differs/,
  );
  assert.deepEqual(existing, before);
  assert.deepEqual(f.writes, []);
  assert.deepEqual(f.uploads, []);
});

test('keeps an existing draft with old Intel assets unpublished after retry', async () => {
  const f = fixture({
    existing: { id: 123, draft: true },
    uploaded: [
      ...assets,
      'Lernwelt_0.6.2_darwin-x86_64.app.tar.gz',
      'Lernwelt_0.6.2_darwin-x86_64.app.tar.gz.sig',
      'Lernwelt_0.6.2_darwin-x86_64.dmg',
    ].map((name) => ({ name, size: 100 })),
  });
  await assert.rejects(
    () => publishRelease(source, f.api, f.upload),
    /unexpected assets/,
  );
  assert.deepEqual(f.writes, []);
  assert.deepEqual(f.uploads, [{ tag: 'v0.6.2', files: assets }]);
});

test('does not overwrite a published release with a conflicting channel', async () => {
  const f = fixture({ existing: { id: 123, draft: false, prerelease: true } });
  await assert.rejects(
    () => publishRelease(source, f.api, f.upload),
    /channel differs/,
  );
  assert.equal(f.writes.length, 0);
  assert.equal(f.uploads.length, 0);
});
