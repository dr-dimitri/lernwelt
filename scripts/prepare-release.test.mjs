import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { prepareRelease } from './prepare-release.mjs';
import { verifyReleaseSource } from './release-source.mjs';

const sha = 'a'.repeat(40);
function temporary(t) {
  const directory = mkdtempSync(join(tmpdir(), 'lernwelt prepare test '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function readOutput(path) {
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .trim()
      .split('\n')
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

test('source rejection prevents API access and matrix output for an unmerged stable tag', async (t) => {
  const outputFile = join(temporary(t), 'output');
  let requests = 0;
  const ref = 'refs/tags/v0.6.14';
  await assert.rejects(
    () =>
      prepareRelease(
        { outputFile, sha, ref },
        {
          verifySource: () =>
            verifyReleaseSource({ sourceVersion: '0.6.14', sha, ref }, () => {
              throw new Error('not on main');
            }),
          api: async () => {
            requests++;
          },
        },
      ),
    /not on main/,
  );
  assert.equal(requests, 0);
  assert.equal(existsSync(outputFile), false);
});

test('failed GitHub preparation does not emit any build or platform output', async (t) => {
  const outputFile = join(temporary(t), 'output');
  let verified = false;
  await assert.rejects(
    () =>
      prepareRelease(
        { outputFile, sha, ref: 'refs/heads/main' },
        {
          verifySource: () => {
            verified = true;
            return { version: '0.6.14' };
          },
          api: async () => {
            assert.equal(verified, true);
            throw new Error('HTTP 403');
          },
        },
      ),
    /HTTP 403/,
  );
  assert.equal(existsSync(outputFile), false);
});

function cliFixture(
  t,
  { version, published = false, rejectSource = false } = {},
) {
  const directory = temporary(t);
  for (const name of [
    'prepare-release.mjs',
    'release-platforms.mjs',
    'release-policy.mjs',
  ])
    copyFileSync(new URL(name, import.meta.url), join(directory, name));
  writeFileSync(
    join(directory, 'release-source.mjs'),
    `
import { appendFileSync } from 'node:fs';
export function verifiedReleaseSource() {
  appendFileSync(process.env.TEST_PREPARE_LOG, 'source verified\\n');
  if (${rejectSource}) throw new Error('unverified source');
  return { version: ${JSON.stringify(version)} };
}`,
  );
  writeFileSync(
    join(directory, 'release-github.mjs'),
    `
import { appendFileSync } from 'node:fs';
export async function githubApi(method, path) {
  appendFileSync(process.env.TEST_PREPARE_LOG, method + ' ' + path + '\\n');
  if (path.startsWith('git/ref/tags/')) return { object: { type: 'commit', sha: process.env.GITHUB_SHA } };
  if (path.startsWith('releases/tags/')) return { draft: ${!published} };
  throw new Error('Unexpected API operation.');
}`,
  );
  const output = join(directory, 'CI output');
  const log = join(directory, 'boundary log');
  const run = (outputFile = output) =>
    spawnSync(process.execPath, [join(directory, 'prepare-release.mjs')], {
      cwd: directory,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_SHA: sha,
        GITHUB_REF: version.includes('-rc.')
          ? `refs/tags/v${version}`
          : 'refs/heads/main',
        GITHUB_OUTPUT: outputFile,
        TEST_PREPARE_LOG: log,
        GH_TOKEN: undefined,
      },
    });
  return { run, output, log };
}

test('the prepare CLI appends valid matrix JSON for RC and stable channels after source verification', (t) => {
  for (const version of ['0.6.14-rc.1', '0.6.14']) {
    const fixture = cliFixture(t, { version });
    writeFileSync(fixture.output, 'existing=retained\n');
    const result = fixture.run();
    assert.equal(result.status, 0, result.stderr);
    const output = readOutput(fixture.output);
    assert.equal(output.existing, 'retained');
    assert.equal(output.tag, `v${version}`);
    assert.equal(output.version, version);
    assert.equal(output.build, 'true');
    const matrix = JSON.parse(output.matrix);
    assert.deepEqual(
      matrix.include.map((build) => build.os),
      version.includes('-rc.')
        ? ['macos-latest']
        : ['macos-latest', 'windows-latest'],
    );
    assert.equal(
      readFileSync(fixture.log, 'utf8').split('\n')[0],
      'source verified',
    );
  }
});

test('the prepare CLI preserves the no-build result of an already published RC', (t) => {
  const fixture = cliFixture(t, { version: '0.6.14-rc.1', published: true });
  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
  const output = readOutput(fixture.output);
  assert.equal(output.build, 'false');
  assert.deepEqual(
    JSON.parse(output.matrix).include.map((build) => build.platform),
    ['darwin-aarch64'],
  );
  assert.match(result.stdout, /already published/);
});

test('the prepare CLI rejects a missing output file or failed source before GitHub', (t) => {
  const missing = cliFixture(t, { version: '0.6.14' });
  const noOutput = missing.run('');
  assert.notEqual(noOutput.status, 0);
  assert.match(noOutput.stderr, /Missing CI output/);
  assert.equal(existsSync(missing.log), false);
  const rejected = cliFixture(t, { version: '0.6.14', rejectSource: true });
  const badSource = rejected.run();
  assert.notEqual(badSource.status, 0);
  assert.match(badSource.stderr, /unverified source/);
  assert.equal(existsSync(rejected.output), false);
  assert.equal(readFileSync(rejected.log, 'utf8'), 'source verified\n');
});
