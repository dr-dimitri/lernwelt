/** Stable versions only: the updater and installer must agree on ordering. */
export function compareVersions(left, right) {
  const parts = (version) => {
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version))
      throw new Error(`Invalid stable release version: ${version}`);
    const values = version.split('.').map(Number);
    if (!values.every(Number.isSafeInteger))
      throw new Error('Release version exceeds the supported range.');
    return values;
  };
  const a = parts(left);
  const b = parts(right);
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return Math.sign(a[index] - b[index]);
  }
  return 0;
}

export function requireNewVersion(version, baseVersion) {
  if (compareVersions(version, baseVersion) <= 0)
    throw new Error('Every merge needs a higher release version than main.');
}

/** Only explicit rc tags enable previews; source versions remain stable. */
export function releaseVersion(sourceVersion, ref) {
  compareVersions(sourceVersion, sourceVersion);
  const tagged = /^refs\/tags\/v(.+)$/.exec(ref)?.[1];
  if (tagged && tagged !== sourceVersion) {
    const preview = parseReleaseVersion(tagged);
    if (!preview.prerelease || preview.baseVersion !== sourceVersion)
      throw new Error('Prerelease tag and stable source version differ.');
    return tagged;
  }
  return sourceVersion;
}

export function parseReleaseVersion(version) {
  const preview = /^(\d+\.\d+\.\d+)-rc\.([1-9]\d*)$/.exec(version);
  const baseVersion = preview?.[1] ?? version;
  compareVersions(baseVersion, baseVersion);
  if (preview && !Number.isSafeInteger(Number(preview[2])))
    throw new Error('Prerelease number exceeds the supported range.');
  return { baseVersion, prerelease: Boolean(preview) };
}

export function releaseTag(version, sha, ref) {
  const { prerelease } = parseReleaseVersion(version);
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid release commit.');
  const tag = `v${version}`;
  if (prerelease && ref !== `refs/tags/${tag}`)
    throw new Error('Prereleases require the matching explicit rc tag.');
  if (!prerelease && ref !== 'refs/heads/main' && ref !== `refs/tags/${tag}`)
    throw new Error('Releases require main or the matching version tag.');
  return tag;
}

export async function prepareReleaseTag({ version, sha, ref }, api) {
  const tag = releaseTag(version, sha, ref);
  const existing = await api('GET', `git/ref/tags/${tag}`, undefined, true);
  if (existing) {
    let object = existing.object;
    for (let depth = 0; object.type === 'tag' && depth < 5; depth++) {
      object = (await api('GET', `git/tags/${object.sha}`)).object;
    }
    if (object.type !== 'commit' || object.sha !== sha)
      throw new Error('The release tag belongs to a different commit.');
  } else {
    await api('POST', 'git/refs', { ref: `refs/tags/${tag}`, sha });
  }
  const release = await api('GET', `releases/tags/${tag}`, undefined, true);
  return { tag, version, build: !release || release.draft };
}

export function shouldMakeLatest(version, latest) {
  if (parseReleaseVersion(version).prerelease) return false;
  if (!latest) return true;
  const previous = /^v(.+)$/.exec(latest.tag_name)?.[1];
  if (!previous) throw new Error('Latest release has an unexpected tag.');
  return compareVersions(version, previous) > 0;
}
