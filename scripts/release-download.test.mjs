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
const debugArtifacts = [
  {
    name: 'lernwelt-debug-macos-latest',
    files: { lernwelt: 'macOS debug executable' },
  },
  {
    name: 'lernwelt-debug-windows-latest',
    files: { 'lernwelt.exe': 'Windows debug executable' },
  },
];

function temporary(t) {
  const directory = mkdtempSync(path.join(tmpdir(), 'lernwelt download test '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function workflowDownloads(version) {
  const workflow = readFileSync(
    new URL('../.github/workflows/release-publish.yml', import.meta.url),
    'utf8',
  );
  const downloads = [
    ...workflow.matchAll(
      /^ {6}- uses: actions\/download-artifact@([^\n]+)\n((?:^ {8,}[^\n]*\n?)*)/gm,
    ),
  ].map(([, revision, block]) => {
    assert.equal(revision, pinnedAction);
    const condition = /^ {8}if: (.+)$/m.exec(block)?.[1];
    const expression = condition?.replace(/^\$\{\{\s*|\s*\}\}$/g, '');
    return {
      enabled:
        !expression ||
        runInNewContext(
          expression,
          {
            inputs: { version },
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
  assert.ok(enabled.length, 'At least one named download must run.');
  for (const download of downloads)
    assert.ok(
      download.inputs.name,
      'Release downloads must select a named artifact.',
    );
  return enabled.map((download) => download.inputs);
}

function downloadLayout(directory, inputs, available) {
  const artifacts = inputs.name
    ? available.filter((artifact) => artifact.name === inputs.name)
    : available;
  if (!artifacts.length) throw new Error(`Artifact '${inputs.name}' not found`);
  for (const artifact of artifacts) {
    // Pinned upstream path decision, independent of Lernwelt's workflow:
    // https://github.com/actions/download-artifact/blob/634f93cb2916e3fdff6788551b99b062d0335ce0/src/download-artifact.ts#L158-L168
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

function assembleWorkflow(directory, version, available) {
  for (const inputs of workflowDownloads(version))
    downloadLayout(directory, inputs, available);
  const output = path.join(directory, 'release-upload');
  const manifest = prepareRelease(
    path.join(directory, 'release-assets'),
    output,
    version,
    'Neue Version',
  );
  return { output, manifest };
}

test('the RC workflow download assembles its single artifact into exactly four publishable files', (t) => {
  assert.deepEqual(
    workflowDownloads('0.6.15-rc.1').map((inputs) => inputs.name),
    ['darwin-aarch64'],
  );
  for (const available of [
    [appleSilicon],
    [appleSilicon, windows, ...debugArtifacts],
  ]) {
    const directory = temporary(t);
    const { output, manifest } = assembleWorkflow(
      directory,
      '0.6.15-rc.1',
      available,
    );
    assert.deepEqual(Object.keys(manifest.platforms), ['darwin-aarch64']);
    assert.deepEqual(readdirSync(output).sort(), [
      'Lernwelt_0.6.15-rc.1_darwin-aarch64.app.tar.gz',
      'Lernwelt_0.6.15-rc.1_darwin-aarch64.app.tar.gz.sig',
      'Lernwelt_0.6.15-rc.1_darwin-aarch64.dmg',
      'latest.json',
    ]);
    assert.equal(
      readFileSync(
        path.join(output, 'Lernwelt_0.6.15-rc.1_darwin-aarch64.app.tar.gz'),
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

test('the stable workflow selects only release artifacts from a run with both Quality debug artifacts', (t) => {
  const directory = temporary(t);
  assert.deepEqual(
    workflowDownloads('0.6.15').map((inputs) => inputs.name),
    ['darwin-aarch64', 'windows-x86_64'],
  );
  const { output, manifest } = assembleWorkflow(directory, '0.6.15', [
    appleSilicon,
    windows,
    ...debugArtifacts,
  ]);
  assert.deepEqual(Object.keys(manifest.platforms), [
    'darwin-aarch64',
    'windows-x86_64',
  ]);
  assert.deepEqual(readdirSync(output).sort(), [
    'Lernwelt_0.6.15_darwin-aarch64.app.tar.gz',
    'Lernwelt_0.6.15_darwin-aarch64.app.tar.gz.sig',
    'Lernwelt_0.6.15_darwin-aarch64.dmg',
    'Lernwelt_0.6.15_windows-x86_64-setup.exe',
    'Lernwelt_0.6.15_windows-x86_64-setup.exe.sig',
    'latest.json',
  ]);
  assert.equal(
    readFileSync(
      path.join(output, 'Lernwelt_0.6.15_windows-x86_64-setup.exe'),
      'utf8',
    ),
    'Windows installer',
  );
  assert.deepEqual(
    JSON.parse(readFileSync(path.join(output, 'latest.json'), 'utf8')),
    manifest,
  );
});

test('a missing selected artifact blocks assembly without producing publishable output', async (t) => {
  for (const { version, missing } of [
    { version: '0.6.15-rc.1', missing: 'darwin-aarch64' },
    { version: '0.6.15', missing: 'darwin-aarch64' },
    { version: '0.6.15', missing: 'windows-x86_64' },
  ]) {
    await t.test(`${version}: missing ${missing}`, (child) => {
      const directory = temporary(child);
      const available = [appleSilicon, windows, ...debugArtifacts].filter(
        (artifact) => artifact.name !== missing,
      );
      assert.throws(
        () => assembleWorkflow(directory, version, available),
        new RegExp(`Artifact '${missing}' not found`),
      );
      assert.equal(existsSync(path.join(directory, 'release-upload')), false);
    });
  }
});

test('named downloads preserve validation of files and signatures inside the Mac release artifact', async (t) => {
  for (const { name, files, error } of [
    {
      name: 'embedded debug executable',
      files: { ...appleSilicon.files, 'macos/lernwelt-debug': 'debug' },
      error: /Unexpected release artifact/,
    },
    {
      name: 'invalid updater signature',
      files: {
        ...appleSilicon.files,
        'macos/Lernwelt.app.tar.gz.sig': 'broken signature',
      },
      error: /Invalid updater signature/,
    },
  ]) {
    await t.test(name, (child) => {
      const directory = temporary(child);
      assert.throws(
        () =>
          assembleWorkflow(directory, '0.6.15-rc.1', [
            { ...appleSilicon, files },
          ]),
        error,
      );
      assert.equal(existsSync(path.join(directory, 'release-upload')), false);
    });
  }
});

test('the old unfiltered stable download includes Quality debug directories and fails before output', (t) => {
  const directory = temporary(t);
  downloadLayout(directory, { path: 'release-assets' }, [
    appleSilicon,
    windows,
    ...debugArtifacts,
  ]);
  const root = path.join(directory, 'release-assets');
  assert.deepEqual(readdirSync(root).sort(), [
    'darwin-aarch64',
    'lernwelt-debug-macos-latest',
    'lernwelt-debug-windows-latest',
    'windows-x86_64',
  ]);
  const output = path.join(directory, 'release-upload');
  assert.throws(
    () => prepareRelease(root, output, '0.6.15', ''),
    /Expected exactly release artifact directories/,
  );
  assert.equal(existsSync(output), false);
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
