import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  packFrontendArtifact,
  restoreFrontendArtifact,
} from './frontend-artifact.mjs';

const sha = 'a'.repeat(40);
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'lernwelt frontend artifact '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const source = join(directory, 'source');
  mkdirSync(join(source, 'assets'), { recursive: true });
  writeFileSync(join(source, 'index.html'), '<main>Lernwelt</main>');
  writeFileSync(join(source, 'assets', 'app.js'), 'checked frontend');
  const options = {
    artifactDir: join(directory, 'artifact'),
    distDir: join(directory, 'restored'),
    configFile: join(directory, 'ci-config.json'),
    sha,
    runId: '12345',
  };
  packFrontendArtifact({ ...options, distDir: source });
  return { source, ...options };
}

test('restores the exact checked frontend and keeps the RC version override while disabling only the CI build hook', (t) => {
  const options = fixture(t);
  writeFileSync(
    options.configFile,
    JSON.stringify({
      version: '0.6.16-rc.1',
      build: { frontendDist: '../dist' },
    }),
  );
  const metadata = restoreFrontendArtifact(options);
  assert.equal(metadata.sha, sha);
  assert.equal(metadata.runId, '12345');
  assert.equal(
    readFileSync(join(options.distDir, 'assets', 'app.js'), 'utf8'),
    'checked frontend',
  );
  assert.deepEqual(JSON.parse(readFileSync(options.configFile, 'utf8')), {
    version: '0.6.16-rc.1',
    build: { frontendDist: '../dist', beforeBuildCommand: '' },
  });
  // The transport metadata is never embedded in the product frontend.
  assert.deepEqual(readdirSync(options.distDir).sort(), [
    'assets',
    'index.html',
  ]);
  assert.equal(
    JSON.parse(
      readFileSync(new URL('../src-tauri/tauri.conf.json', import.meta.url)),
    ).build.beforeBuildCommand,
    'npm run build',
  );
});

test('rejects a different commit or run before changing existing build inputs', async (t) => {
  for (const mismatch of [{ sha: 'b'.repeat(40) }, { runId: '54321' }])
    await t.test(JSON.stringify(mismatch), (child) => {
      const options = fixture(child);
      mkdirSync(options.distDir);
      writeFileSync(join(options.distDir, 'existing'), 'retained');
      writeFileSync(options.configFile, '{"version":"0.6.16"}');
      assert.throws(
        () => restoreFrontendArtifact({ ...options, ...mismatch }),
        /different commit or run/,
      );
      assert.equal(
        readFileSync(join(options.distDir, 'existing'), 'utf8'),
        'retained',
      );
      assert.equal(
        readFileSync(options.configFile, 'utf8'),
        '{"version":"0.6.16"}',
      );
    });
});

test('rejects changed, removed or additional files in the transferred frontend', async (t) => {
  for (const change of ['modified', 'removed', 'added'])
    await t.test(change, (child) => {
      const options = fixture(child);
      const assets = join(options.artifactDir, 'dist', 'assets');
      if (change === 'removed') rmSync(join(assets, 'app.js'));
      else
        writeFileSync(
          join(assets, change === 'added' ? 'extra.js' : 'app.js'),
          'different contents',
        );
      assert.throws(
        () => restoreFrontendArtifact(options),
        /files differ from the checked build/,
      );
    });
});

test('allows a rerun of failed native jobs to use the successful frontend from the same run', (t) => {
  const options = fixture(t);
  const before = process.env.GITHUB_RUN_ATTEMPT;
  process.env.GITHUB_RUN_ATTEMPT = '2';
  try {
    assert.equal(restoreFrontendArtifact(options).runId, '12345');
  } finally {
    if (before === undefined) delete process.env.GITHUB_RUN_ATTEMPT;
    else process.env.GITHUB_RUN_ATTEMPT = before;
  }
});

test('refuses missing CI identity and empty frontend', (t) => {
  const options = fixture(t);
  assert.throws(
    () => packFrontendArtifact({ ...options, sha: 'HEAD' }),
    /valid CI commit and run ID/,
  );
  writeFileSync(join(options.source, 'index.html'), '');
  assert.throws(
    () => packFrontendArtifact({ ...options, distDir: options.source }),
    /nonempty index.html/,
  );
});

test(
  'refuses symlinks instead of including external files',
  { skip: process.platform === 'win32' },
  (t) => {
    const options = fixture(t);
    symlinkSync(
      join(options.source, 'index.html'),
      join(options.source, 'link'),
    );
    assert.throws(
      () => packFrontendArtifact({ ...options, distDir: options.source }),
      /unsupported file type/,
    );
  },
);
