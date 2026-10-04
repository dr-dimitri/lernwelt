import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { githubApi } from './release-github.mjs';
import { releaseTag, shouldMakeLatest } from './release-policy.mjs';

export async function publishRelease(
  { version, sha, ref, tag, notes, assets },
  api,
  upload,
) {
  if (releaseTag(version, sha, ref) !== tag)
    throw new Error('Prepared release tag differs.');
  let release = await api('GET', `releases/tags/${tag}`, undefined, true);
  if (release && !release.draft) return { published: false, unchanged: true };
  const expected = [
    `Lernwelt_${version}_darwin-aarch64.app.tar.gz`,
    `Lernwelt_${version}_darwin-aarch64.app.tar.gz.sig`,
    `Lernwelt_${version}_darwin-aarch64.dmg`,
    `Lernwelt_${version}_darwin-x86_64.app.tar.gz`,
    `Lernwelt_${version}_darwin-x86_64.app.tar.gz.sig`,
    `Lernwelt_${version}_darwin-x86_64.dmg`,
    `Lernwelt_${version}_windows-x86_64-setup.exe`,
    `Lernwelt_${version}_windows-x86_64-setup.exe.sig`,
    'latest.json',
  ];
  if (
    assets.length !== expected.length ||
    !expected.every((name) => assets.includes(name))
  )
    throw new Error('Expected all nine validated release assets.');
  if (!release) {
    release = await api('POST', 'releases', {
      tag_name: tag,
      target_commitish: sha,
      name: `Lernwelt ${version}`,
      body: notes,
      draft: true,
      make_latest: 'false',
    });
  }
  await upload(tag, assets);
  const uploaded = await api('GET', `releases/${release.id}`);
  if (
    !assets.every((name) =>
      uploaded.assets.some((asset) => asset.name === name && asset.size > 0),
    )
  )
    throw new Error('Release upload is incomplete; keeping the draft.');
  const latest = await api('GET', 'releases/latest', undefined, true);
  const makeLatest = shouldMakeLatest(version, latest);
  await api('PATCH', `releases/${release.id}`, {
    draft: false,
    make_latest: makeLatest ? 'true' : 'false',
  });
  return { published: true, makeLatest };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const result = await publishRelease(
    {
      version,
      sha: process.env.GITHUB_SHA ?? '',
      ref: process.env.GITHUB_REF ?? '',
      tag: process.env.RELEASE_TAG ?? '',
      notes: readFileSync(`docs/releases/${version}.md`, 'utf8'),
      assets: readdirSync('release-upload').sort(),
    },
    githubApi,
    (tag, assets) =>
      execFileSync(
        'gh',
        [
          'release',
          'upload',
          tag,
          ...assets.map((file) => join('release-upload', file)),
          '--clobber',
          '--repo',
          'dr-dimitri/lernwelt',
        ],
        { stdio: 'inherit' },
      ),
  );
  console.log(
    result.published
      ? `Release ${version} published with all three platforms.`
      : `Release ${version} is already published; leaving it unchanged.`,
  );
}
