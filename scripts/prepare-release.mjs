import { appendFileSync, existsSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { githubApi } from './release-github.mjs';
import { prepareReleaseTag } from './release-policy.mjs';
import { verifiedReleaseSource } from './release-source.mjs';
import { releaseBuildMatrix } from './release-platforms.mjs';

export async function prepareRelease(
  {
    outputFile = process.env.GITHUB_OUTPUT,
    sha = process.env.GITHUB_SHA ?? '',
    ref = process.env.GITHUB_REF ?? '',
  } = {},
  { verifySource = verifiedReleaseSource, api = githubApi } = {},
) {
  if (!outputFile) throw new Error('Missing CI output file.');
  const { version } = verifySource();
  const matrix = releaseBuildMatrix(version);
  const result = await prepareReleaseTag({ version, sha, ref }, api);
  appendFileSync(
    outputFile,
    `tag=${result.tag}\nversion=${result.version}\nbuild=${result.build}\nmatrix=${JSON.stringify(matrix)}\n`,
  );
  return { ...result, matrix };
}

if (
  process.argv[1] &&
  existsSync(process.argv[1]) &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  const result = await prepareRelease();
  console.log(
    result.build
      ? `Release ${result.version}: building ${process.env.GITHUB_SHA ?? ''}.`
      : `Release ${result.version} is already published; leaving it unchanged.`,
  );
}
