import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { releaseBuildMatrix, releaseTargets } from './release-platforms.mjs';

function evaluate(expression, context) {
  const source = /^\$\{\{\s*([\s\S]+?)\s*\}\}$/.exec(expression)?.[1];
  assert.ok(source, 'Workflow must use an Actions expression.');
  return JSON.parse(
    JSON.stringify(
      runInNewContext(
        source,
        { ...context, fromJSON: JSON.parse },
        { timeout: 1000 },
      ),
    ),
  );
}

test('RC matrices contain only Apple Silicon, stable matrices retain Apple Silicon and Windows', () => {
  for (const version of ['0.6.14-rc.1', '0.6.14-rc.12']) {
    assert.deepEqual(releaseTargets(version), ['darwin-aarch64']);
    assert.deepEqual(releaseBuildMatrix(version), {
      include: [
        {
          os: 'macos-latest',
          target: 'aarch64-apple-darwin',
          platform: 'darwin-aarch64',
          bundles: 'app,dmg',
        },
      ],
    });
  }
  for (const version of ['0.6.14', '1.0.0']) {
    assert.deepEqual(releaseTargets(version), [
      'darwin-aarch64',
      'windows-x86_64',
    ]);
    assert.deepEqual(releaseBuildMatrix(version), {
      include: [
        {
          os: 'macos-latest',
          target: 'aarch64-apple-darwin',
          platform: 'darwin-aarch64',
          bundles: 'app,dmg',
        },
        {
          os: 'windows-latest',
          target: 'x86_64-pc-windows-msvc',
          platform: 'windows-x86_64',
          bundles: 'nsis',
        },
      ],
    });
  }
});

test('invalid or unsupported version labels cannot produce a build matrix', () => {
  for (const version of [
    'v0.6.14',
    '0.6.14-beta.1',
    '0.6.14-rc.0',
    '0.6.14-rc.01',
    '0.6.14-rc.9007199254740992',
  ]) {
    assert.throws(() => releaseTargets(version));
    assert.throws(() => releaseBuildMatrix(version));
  }
});

test('the actual Quality matrix schedules Windows only for a push to main, irrespective of PR base', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/ci.yml', import.meta.url),
    'utf8',
  );
  const expression = /^\s+os:\s*(\$\{\{.+\}\})\s*$/m.exec(workflow)?.[1];
  assert.ok(expression, 'Quality must derive its OS matrix from the event.');
  for (const github of [
    {
      event_name: 'pull_request',
      ref: 'refs/pull/159/merge',
      base_ref: 'main',
    },
    {
      event_name: 'pull_request_target',
      ref: 'refs/heads/main',
      base_ref: 'main',
    },
    {
      event_name: 'push',
      ref: 'refs/heads/codex/issue-159-test',
      base_ref: 'main',
    },
    { event_name: 'push', ref: 'refs/tags/v0.6.14-rc.1', base_ref: 'main' },
    { event_name: 'workflow_dispatch', ref: 'refs/heads/main', base_ref: '' },
  ])
    assert.deepEqual(evaluate(expression, { github }), ['macos-latest']);
  assert.deepEqual(
    evaluate(expression, {
      github: { event_name: 'push', ref: 'refs/heads/main', base_ref: '' },
    }),
    ['macos-latest', 'windows-latest'],
  );
  assert.ok(workflow.includes('node scripts/check-issue-workflow.mjs'));
  assert.ok(workflow.includes('npm run check:rust'));
});

test('the release workflow consumes the verified prepare matrix and retains the macOS upload gate', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/release.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /matrix: \$\{\{ steps\.release\.outputs\.matrix \}\}/);
  const expression = /^\s+matrix:\s*(\$\{\{ fromJSON\(.+\) \}\})\s*$/m.exec(
    workflow,
  )?.[1];
  assert.ok(expression, 'Build matrix must consume prepare output.');
  for (const version of ['0.6.14-rc.1', '0.6.14']) {
    const matrix = releaseBuildMatrix(version);
    assert.deepEqual(
      evaluate(expression, {
        needs: { prepare: { outputs: { matrix: JSON.stringify(matrix) } } },
      }),
      matrix,
    );
  }
  assert.throws(() =>
    evaluate(expression, { needs: { prepare: { outputs: { matrix: '' } } } }),
  );
  assert.doesNotMatch(workflow, /x86_64-apple-darwin/);
  const gate = workflow.indexOf('node scripts/verify-macos-bundle.mjs');
  const upload = workflow.indexOf('uses: actions/upload-artifact');
  assert.ok(gate >= 0 && upload >= 0 && gate < upload);
});
