import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function identity(sha, runId) {
  if (
    typeof sha !== 'string' ||
    typeof runId !== 'string' ||
    !/^[a-f0-9]{40}$/.test(sha) ||
    !/^[1-9]\d*$/.test(runId)
  )
    throw new Error('Frontend artifact requires a valid CI commit and run ID.');
  return { sha, runId };
}

function fileHashes(directory, prefix = '') {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name, 'en'),
  )) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    const filename = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...fileHashes(filename, path));
    else if (entry.isFile())
      files.push({
        path,
        sha256: createHash('sha256')
          .update(readFileSync(filename))
          .digest('hex'),
      });
    else
      throw new Error('Frontend artifact contains an unsupported file type.');
  }
  return files;
}

function checkedFiles(directory) {
  if (!lstatSync(directory).isDirectory())
    throw new Error('Frontend artifact contains an unsupported file type.');
  const files = fileHashes(directory);
  if (
    !files.some((file) => file.path === 'index.html') ||
    !readFileSync(join(directory, 'index.html')).length
  )
    throw new Error('Frontend artifact has no nonempty index.html.');
  return files;
}

export function packFrontendArtifact({
  distDir = 'dist',
  artifactDir = 'frontend-artifact',
  sha = process.env.GITHUB_SHA,
  runId = process.env.GITHUB_RUN_ID,
} = {}) {
  const metadata = {
    schema: 1,
    ...identity(sha, runId),
    files: checkedFiles(distDir),
  };
  rmSync(artifactDir, { recursive: true, force: true });
  mkdirSync(artifactDir, { recursive: true });
  cpSync(distDir, join(artifactDir, 'dist'), { recursive: true });
  writeFileSync(
    join(artifactDir, 'metadata.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  return metadata;
}

export function restoreFrontendArtifact({
  distDir = 'dist',
  artifactDir = 'frontend-artifact',
  configFile,
  sha = process.env.GITHUB_SHA,
  runId = process.env.GITHUB_RUN_ID,
} = {}) {
  const expected = identity(sha, runId);
  if (!lstatSync(join(artifactDir, 'metadata.json')).isFile())
    throw new Error('Frontend artifact contains an unsupported file type.');
  const metadata = JSON.parse(
    readFileSync(join(artifactDir, 'metadata.json'), 'utf8'),
  );
  if (
    metadata.schema !== 1 ||
    metadata.sha !== expected.sha ||
    metadata.runId !== expected.runId
  )
    throw new Error('Frontend artifact belongs to a different commit or run.');
  if (
    JSON.stringify(readdirSync(artifactDir).sort()) !==
    JSON.stringify(['dist', 'metadata.json'])
  )
    throw new Error('Frontend artifact has unexpected top-level files.');
  const source = join(artifactDir, 'dist');
  if (JSON.stringify(checkedFiles(source)) !== JSON.stringify(metadata.files))
    throw new Error('Frontend artifact files differ from the checked build.');
  if (!configFile)
    throw new Error('Missing CI-only Tauri build configuration.');
  const previous = existsSync(configFile)
    ? JSON.parse(readFileSync(configFile, 'utf8'))
    : {};
  const config = {
    ...previous,
    build: { ...previous.build, beforeBuildCommand: '' },
  };
  // Validate the complete artifact before changing either build input.
  rmSync(distDir, { recursive: true, force: true });
  cpSync(source, distDir, { recursive: true });
  writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`);
  return metadata;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const command = process.argv[2];
  if (command === '--pack') packFrontendArtifact();
  else if (command === '--restore')
    restoreFrontendArtifact({
      configFile: process.argv
        .find((argument) => argument.startsWith('--config='))
        ?.slice('--config='.length),
    });
  else throw new Error('Use --pack or --restore --config=<CI config file>.');
  console.log(`Frontend ${command.slice(2)}: commit, run and files verified.`);
}
