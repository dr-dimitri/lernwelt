import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { prepareRelease } from './release-assets.mjs';

const pinnedAction = '634f93cb2916e3fdff6788551b99b062d0335ce0';
const signature = Buffer.from(
  'untrusted comment: test\nRWTEST\ntrusted comment: test\nTEST',
).toString('base64');
const appleSilicon = {
  name: 'darwin-aarch64',
  files: {
    'macos/Lernwelt.app.tar.gz': 'Apple Silicon updater',
    'macos/Lernwelt.app.tar.gz.sig': signature,
    'dmg/Lernwelt.dmg': 'Apple Silicon installer',
  },
};
const windows = {
  name: 'windows-x86_64',
  files: {
    'nsis/Lernwelt-setup.exe': 'Windows installer',
    'nsis/Lernwelt-setup.exe.sig': signature,
  },
};

function temporary(t) {
  const directory = mkdtempSync(path.join(tmpdir(), 'lernwelt download test '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function workflowDownload(version) {
  const workflow = readFileSync(
    new URL('../.github/workflows/release.yml', import.meta.url),
    'utf8',
  );
  const downloads = [
    ...workflow.matchAll(
      /^ {6}- uses: actions\/download-artifact@([^\n]+)\n((?:^ {8,}[^\n]*\n?)*)/gm,
    ),
  ].map(([, revision, block]) => {
    assert.equal(revision, pinnedAction);
    const condition = /^ {8}if: (.+)$/m.exec(block)?.[1];
    assert.ok(condition, 'Each download must select its release channel.');
    const expression = condition.replace(/^\$\{\{\s*|\s*\}\}$/g, '');
    return {
      enabled: runInNewContext(
        expression,
        {
          needs: { prepare: { outputs: { version } } },
          contains: (value, part) => value.includes(part),
        },
        { timeout: 1000 },
      ),
      inputs: Object.fromEntries(
        [...block.matchAll(/^ {10}([\w-]+): (.+)$/gm)].map(([, key, value]) => [
          key,
          value,
        ]),
      ),
    };
  });
  const enabled = downloads.filter((download) => download.enabled);
  assert.equal(enabled.length, 1, 'Exactly one channel download must run.');
  return enabled[0].inputs;
}

function downloadLayout(directory, inputs, available) {
  const artifacts = inputs.name
    ? available.filter((artifact) => artifact.name === inputs.name)
    : available;
  assert.ok(artifacts.length, 'The requested artifact must exist.');
  for (const artifact of artifacts) {
    // Pinned upstream path decision, independent of Lernwelt's workflow:
    // https://github.com/actions/download-artifact/blob/634f93cb2916e3fdff6788551b99b062d0335ce0/src/download-artifact.ts#L155-L165
    const destination = runInNewContext(
      'isSingleArtifactDownload || inputs.mergeMultiple || artifacts.length === 1 ? resolvedPath : path.join(resolvedPath, artifact.name)',
      {
        isSingleArtifactDownload: Boolean(inputs.name),
        inputs: { mergeMultiple: inputs['merge-multiple'] === 'true' },
        artifacts,
        resolvedPath: path.resolve(directory, inputs.path),
        artifact,
        path,
      },
      { timeout: 1000 },
    );
    for (const [name, contents] of Object.entries(artifact.files)) {
      const filename = path.join(destination, name);
      mkdirSync(path.dirname(filename), { recursive: true });
      writeFileSync(filename, contents);
    }
  }
}

test('the RC workflow download assembles its single artifact into exactly four publishable files', (t) => {
  for (const available of [
    [appleSilicon],
    [
      appleSilicon,
      { name: 'unrelated-debug', files: { 'lernwelt-debug': 'debug' } },
    ],
  ]) {
    const directory = temporary(t);
    downloadLayout(directory, workflowDownload('0.6.14-rc.2'), available);
    const output = path.join(directory, 'release-upload');
    const manifest = prepareRelease(
      path.join(directory, 'release-assets'),
      output,
      '0.6.14-rc.2',
      'Vorab testen',
    );
    assert.deepEqual(Object.keys(manifest.platforms), ['darwin-aarch64']);
    assert.deepEqual(readdirSync(output).sort(), [
      'Lernwelt_0.6.14-rc.2_darwin-aarch64.app.tar.gz',
      'Lernwelt_0.6.14-rc.2_darwin-aarch64.app.tar.gz.sig',
      'Lernwelt_0.6.14-rc.2_darwin-aarch64.dmg',
      'latest.json',
    ]);
    assert.equal(
      readFileSync(
        path.join(output, 'Lernwelt_0.6.14-rc.2_darwin-aarch64.app.tar.gz'),
        'utf8',
      ),
      'Apple Silicon updater',
    );
    assert.deepEqual(
      JSON.parse(readFileSync(path.join(output, 'latest.json'), 'utf8')),
      manifest,
    );
  }
});

test('the stable workflow retains the unfiltered multi-artifact layout and six-file manifest', (t) => {
  const directory = temporary(t);
  const inputs = workflowDownload('0.6.14');
  assert.equal(inputs.name, undefined);
  downloadLayout(directory, inputs, [appleSilicon, windows]);
  const output = path.join(directory, 'release-upload');
  const manifest = prepareRelease(
    path.join(directory, 'release-assets'),
    output,
    '0.6.14',
    'Neue Version',
  );
  assert.deepEqual(Object.keys(manifest.platforms), [
    'darwin-aarch64',
    'windows-x86_64',
  ]);
  assert.equal(readdirSync(output).length, 6);
  assert.equal(
    readFileSync(
      path.join(output, 'Lernwelt_0.6.14_windows-x86_64-setup.exe'),
      'utf8',
    ),
    'Windows installer',
  );
});

test('the old unfiltered single-artifact download layout fails before any manifest is produced', (t) => {
  const directory = temporary(t);
  downloadLayout(directory, { path: 'release-assets' }, [appleSilicon]);
  const output = path.join(directory, 'release-upload');
  assert.throws(
    () =>
      prepareRelease(
        path.join(directory, 'release-assets'),
        output,
        '0.6.14-rc.2',
        '',
      ),
    /Expected exactly release artifact directories/,
  );
  assert.equal(existsSync(output), false);
});
