import { appendFileSync } from 'node:fs';
import { githubApi } from './release-github.mjs';
import { prepareReleaseTag } from './release-policy.mjs';
import { verifiedReleaseSource } from './release-source.mjs';

if (!process.env.GITHUB_OUTPUT) throw new Error('Missing CI output file.');
const { version } = verifiedReleaseSource();
const sha = process.env.GITHUB_SHA ?? '';
const ref = process.env.GITHUB_REF ?? '';
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
