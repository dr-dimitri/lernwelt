import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const targets = ['darwin-aarch64', 'darwin-x86_64', 'windows-x86_64'];
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(directory, entry.name))
      : [join(directory, entry.name)],
  );
}

export function prepareRelease(
  root,
  output,
  version,
  notes,
  repository = 'dr-dimitri/lernwelt',
) {
  if (!/^\d+\.\d+\.\d+$/.test(version))
    throw new Error('Expected a stable semantic version.');
  if (repository !== 'dr-dimitri/lernwelt')
    throw new Error('Unexpected release repository.');
  const manifest = {
    version,
    notes,
    pub_date: new Date().toISOString(),
    platforms: {},
  };
  // Validate all targets before producing any publishable output.
  const assets = targets.map((target) => {
    const entries = files(join(root, target));
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
    manifest.platforms[target] = {
      signature,
      url: `https://github.com/${repository}/releases/download/v${version}/${name}`,
    };
    return { source, name, diskImage: diskImages[0], target };
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
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  if (process.env.GITHUB_REF_NAME !== `v${version}`)
    throw new Error('Tag and app version differ.');
  prepareRelease(
    'release-assets',
    'release-upload',
    version,
    readFileSync(`docs/releases/${version}.md`, 'utf8'),
  );
}
