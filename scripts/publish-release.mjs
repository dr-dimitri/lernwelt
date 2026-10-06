import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { githubApi } from './release-github.mjs';
import {
  parseReleaseVersion,
  releaseTag,
  releaseVersion,
  shouldMakeLatest,
} from './release-policy.mjs';

export async function publishRelease(
  { version, sha, ref, tag, notes, assets },
  api,
  upload,
) {
  if (releaseTag(version, sha, ref) !== tag)
    throw new Error('Prepared release tag differs.');
  const { prerelease } = parseReleaseVersion(version);
  let release = await api('GET', `releases/tags/${tag}`, undefined, true);
  if (release && !release.draft && release.prerelease !== prerelease)
    throw new Error('Published release channel differs; leaving it unchanged.');
  if (release && !release.draft) return { published: false, unchanged: true };
  const expected = [
    `Lernwelt_${version}_darwin-aarch64.app.tar.gz`,
    `Lernwelt_${version}_darwin-aarch64.app.tar.gz.sig`,
    `Lernwelt_${version}_darwin-aarch64.dmg`,
    `Lernwelt_${version}_windows-x86_64-setup.exe`,
    `Lernwelt_${version}_windows-x86_64-setup.exe.sig`,
    'latest.json',
  ];
  if (
    assets.length !== expected.length ||
    !expected.every((name) => assets.includes(name))
  )
    throw new Error('Expected exactly six validated release assets.');
  if (!release) {
    release = await api('POST', 'releases', {
      tag_name: tag,
      target_commitish: sha,
      name: `Lernwelt ${version}`,
      body: notes,
      draft: true,
      prerelease,
      make_latest: 'false',
    });
  }
  await upload(tag, assets);
  const uploaded = await api('GET', `releases/${release.id}`);
  if (
    !Array.isArray(uploaded.assets) ||
    uploaded.assets.length !== expected.length ||
    !expected.every((name) =>
      uploaded.assets.some(
        (asset) =>
          asset.name === name &&
          Number.isSafeInteger(asset.size) &&
          asset.size > 0,
      ),
    )
  )
    throw new Error(
      'Release upload is incomplete or contains unexpected assets; keeping the draft.',
    );
  const latest = prerelease
    ? null
    : await api('GET', 'releases/latest', undefined, true);
  const makeLatest = shouldMakeLatest(version, latest);
  await api('PATCH', `releases/${release.id}`, {
    draft: false,
    prerelease,
    make_latest: makeLatest ? 'true' : 'false',
  });
  return { published: true, makeLatest };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const sourceVersion = JSON.parse(
    readFileSync('package.json', 'utf8'),
  ).version;
  const version = releaseVersion(sourceVersion, process.env.GITHUB_REF ?? '');
  if (process.env.RELEASE_VERSION && process.env.RELEASE_VERSION !== version)
    throw new Error('Prepared release version differs.');
  const result = await publishRelease(
    {
      version,
      sha: process.env.GITHUB_SHA ?? '',
      ref: process.env.GITHUB_REF ?? '',
      tag: process.env.RELEASE_TAG ?? '',
      notes: readFileSync(`docs/releases/${sourceVersion}.md`, 'utf8'),
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
      ? `Release ${version} published for Apple Silicon and Windows x64.`
      : `Release ${version} is already published; leaving it unchanged.`,
  );
}
