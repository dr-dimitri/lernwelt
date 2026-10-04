import { appendFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { githubApi } from './release-github.mjs';
import { prepareReleaseTag, releaseTag } from './release-policy.mjs';

if (!process.env.GITHUB_OUTPUT) throw new Error('Missing CI output file.');
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const sha = process.env.GITHUB_SHA ?? '';
const ref = process.env.GITHUB_REF ?? '';
const tag = releaseTag(version, sha, ref);
execFileSync(process.execPath, ['scripts/check-release-version.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, RELEASE_TAG: tag },
});
execFileSync('git', ['merge-base', '--is-ancestor', sha, 'origin/main']);
const result = await prepareReleaseTag({ version, sha, ref }, githubApi);
appendFileSync(
  process.env.GITHUB_OUTPUT,
  `tag=${result.tag}\nversion=${result.version}\nbuild=${result.build}\n`,
);
console.log(
  result.build
    ? `Release ${version}: building ${sha}.`
    : `Release ${version} is already published; leaving it unchanged.`,
);
