import { parseReleaseVersion } from './release-policy.mjs';

const builds = {
  'darwin-aarch64': {
    os: 'macos-latest',
    target: 'aarch64-apple-darwin',
    platform: 'darwin-aarch64',
    bundles: 'app,dmg',
  },
  'windows-x86_64': {
    os: 'windows-latest',
    target: 'x86_64-pc-windows-msvc',
    platform: 'windows-x86_64',
    bundles: 'nsis',
  },
};

export function releaseTargets(version) {
  return parseReleaseVersion(version).prerelease
    ? ['darwin-aarch64']
    : ['darwin-aarch64', 'windows-x86_64'];
}

export function releaseBuildMatrix(version) {
  return {
    include: releaseTargets(version).map((target) => ({ ...builds[target] })),
  };
}
