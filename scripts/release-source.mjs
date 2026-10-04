import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseReleaseVersion,
  releaseTag,
  releaseVersion,
} from './release-policy.mjs';

export function verifyReleaseSource({ sourceVersion, sha, ref }, git) {
  const version = releaseVersion(sourceVersion, ref);
  const tag = releaseTag(version, sha, ref);
  const { prerelease } = parseReleaseVersion(version);
  if (prerelease) {
    const branches = git([
      'for-each-ref',
      `--contains=${sha}`,
      '--format=%(refname)',
      'refs/remotes/origin/codex/issue-*',
    ]);
    if (
      !branches
        .trim()
        .split(/\r?\n/)
        .some((branch) =>
          /^refs\/remotes\/origin\/codex\/issue-[1-9]\d*-[a-z0-9-]+$/.test(
            branch,
          ),
        )
    )
      throw new Error(
        'Prerelease commit must belong to a pushed issue branch.',
      );
  } else {
    git(['merge-base', '--is-ancestor', sha, 'origin/main']);
  }
  return { version, tag, prerelease };
}

export function verifiedReleaseSource() {
  const sourceVersion = JSON.parse(
    readFileSync('package.json', 'utf8'),
  ).version;
  const result = verifyReleaseSource(
    {
      sourceVersion,
      sha: process.env.GITHUB_SHA ?? '',
      ref: process.env.GITHUB_REF ?? '',
    },
    (args) => execFileSync('git', args, { encoding: 'utf8' }),
  );
  if (
    process.env.RELEASE_VERSION &&
    process.env.RELEASE_VERSION !== result.version
  )
    throw new Error('Prepared release version differs.');
  if (process.env.RELEASE_TAG && process.env.RELEASE_TAG !== result.tag)
    throw new Error('Prepared release tag differs.');
  // Keep the existing five-file stable-version and notes checks unchanged.
  execFileSync(process.execPath, ['scripts/check-release-version.mjs'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      RELEASE_TAG: `v${sourceVersion}`,
      RELEASE_BASE_SHA: undefined,
    },
  });
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const release = verifiedReleaseSource();
  if (process.argv.includes('--write-build-config'))
    writeFileSync(
      'release-build-config.json',
      `${JSON.stringify({ version: release.version }, null, 2)}\n`,
    );
  console.log(`Release ${release.version}: source and channel verified.`);
}
