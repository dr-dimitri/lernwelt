import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { compareVersions, requireNewVersion } from './release-policy.mjs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const config = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8').match(
  /^version = "([^"]+)"/m,
)?.[1];
const cargoLock = readFileSync('src-tauri/Cargo.lock', 'utf8').match(
  /name = "lernwelt"\r?\nversion = "([^"]+)"/,
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
compareVersions(pkg.version, pkg.version);
if (process.env.RELEASE_BASE_SHA) {
  const base = process.env.RELEASE_BASE_SHA;
  if (!/^[a-f0-9]{40}$/.test(base))
    throw new Error('Invalid release base commit.');
  const baseVersion = JSON.parse(
    execFileSync('git', ['show', `${base}:package.json`], { encoding: 'utf8' }),
  ).version;
  requireNewVersion(pkg.version, baseVersion);
} else if (
  (process.env.RELEASE_TAG ?? process.env.GITHUB_REF_NAME) !== `v${pkg.version}`
) {
  throw new Error('Tag and app version differ.');
}
readFileSync(`docs/releases/${pkg.version}.md`, 'utf8');
if (
  !config.plugins?.updater?.pubkey ||
  config.plugins.updater.pubkey.includes('PENDING')
)
  throw new Error('Missing update verification key.');
console.log(`Release ${pkg.version}: versions and release notes verified.`);
