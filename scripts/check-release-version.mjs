import { readFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const config = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8').match(
  /^version = "([^"]+)"/m,
)?.[1];
const cargoLock = readFileSync('src-tauri/Cargo.lock', 'utf8').match(
  /name = "lernwelt"\nversion = "([^"]+)"/,
)?.[1];
if (
  ![
    lock.version,
    lock.packages[''].version,
    config.version,
    cargo,
    cargoLock,
  ].every((version) => version === pkg.version)
)
  throw new Error('Package, Tauri and Cargo versions differ.');
if (process.env.GITHUB_REF_NAME !== `v${pkg.version}`)
  throw new Error('Tag and app version differ.');
readFileSync(`docs/releases/${pkg.version}.md`, 'utf8');
if (
  !config.plugins?.updater?.pubkey ||
  config.plugins.updater.pubkey.includes('PENDING')
)
  throw new Error('Missing update verification key.');
console.log(`Release ${pkg.version}: versions and release notes verified.`);
