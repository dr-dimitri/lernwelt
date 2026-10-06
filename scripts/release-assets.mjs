import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseReleaseVersion, releaseVersion } from './release-policy.mjs';

const targets = ['darwin-aarch64', 'windows-x86_64'];
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return files(join(directory, entry.name));
    if (!entry.isFile()) throw new Error('Unexpected release artifact type.');
    return [join(directory, entry.name)];
  });
}

export function prepareRelease(
  root,
  output,
  version,
  notes,
  repository = 'dr-dimitri/lernwelt',
) {
  parseReleaseVersion(version);
  if (repository !== 'dr-dimitri/lernwelt')
    throw new Error('Unexpected release repository.');
  const inputs = readdirSync(root, { withFileTypes: true });
  if (
    inputs.length !== targets.length ||
    !inputs.every(
      (entry) => entry.isDirectory() && targets.includes(entry.name),
    )
  )
    throw new Error(
      'Expected exactly Apple Silicon and Windows release artifacts.',
    );
  const manifest = {
    version,
    notes,
    pub_date: new Date().toISOString(),
    platforms: {},
  };
  // Validate all targets before producing any publishable output.
  const assets = targets.map((target) => {
    const entries = files(join(root, target));
    if (
      entries.some((file) =>
        /darwin-x86_64|x86_64-apple-darwin|_x(?:64|86_64)\.dmg$/.test(
          basename(file),
        ),
      )
    )
      throw new Error(`Intel macOS artifact is unsupported: ${target}.`);
    const extension = target.startsWith('darwin')
      ? '.app.tar.gz'
      : '-setup.exe';
    const packages = entries.filter((file) => file.endsWith(extension));
    if (packages.length !== 1)
      throw new Error(`Expected one updater bundle for ${target}.`);
    const source = packages[0];
    const signature = readFileSync(`${source}.sig`, 'utf8').trim();
    const decoded = Buffer.from(signature, 'base64').toString('utf8');
    if (
      !/^[A-Za-z0-9+/=]+$/.test(signature) ||
      !decoded.startsWith('untrusted comment:') ||
      !decoded.includes('trusted comment:')
    ) {
      throw new Error(`Invalid updater signature for ${target}.`);
    }
    const name = `Lernwelt_${version}_${target}${extension}`;
    const diskImages = entries.filter((file) => file.endsWith('.dmg'));
    if (target.startsWith('darwin') && diskImages.length !== 1)
      throw new Error(`Expected one DMG for ${target}.`);
    const expected = [source, `${source}.sig`];
    if (target.startsWith('darwin')) expected.push(diskImages[0]);
    if (
      entries.length !== expected.length ||
      !entries.every((file) => expected.includes(file))
    )
      throw new Error(`Unexpected release artifact for ${target}.`);
    if (expected.some((file) => statSync(file).size === 0))
      throw new Error(`Empty release artifact for ${target}.`);
    manifest.platforms[target] = {
      signature,
      url: `https://github.com/${repository}/releases/download/v${version}/${name}`,
    };
    return {
      source,
      name,
      diskImage: target.startsWith('darwin') ? diskImages[0] : undefined,
      target,
    };
  });
  mkdirSync(output, { recursive: true });
  for (const asset of assets) {
    copyFileSync(asset.source, join(output, asset.name));
    copyFileSync(`${asset.source}.sig`, join(output, `${asset.name}.sig`));
    if (asset.diskImage)
      copyFileSync(
        asset.diskImage,
        join(output, `Lernwelt_${version}_${asset.target}.dmg`),
      );
  }
  writeFileSync(
    join(output, 'latest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const sourceVersion = JSON.parse(
    readFileSync('package.json', 'utf8'),
  ).version;
  const version = releaseVersion(sourceVersion, process.env.GITHUB_REF ?? '');
  if (process.env.RELEASE_VERSION && process.env.RELEASE_VERSION !== version)
    throw new Error('Prepared release version differs.');
  if (
    (process.env.RELEASE_TAG ?? process.env.GITHUB_REF_NAME) !== `v${version}`
  )
    throw new Error('Tag and app version differ.');
  prepareRelease(
    'release-assets',
    'release-upload',
    version,
    readFileSync(`docs/releases/${sourceVersion}.md`, 'utf8'),
  );
}
