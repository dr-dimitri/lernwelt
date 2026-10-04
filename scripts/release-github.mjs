const repository = 'dr-dimitri/lernwelt';

/** The token stays in memory and headers, never in URLs, files or logs. */
export async function githubApi(method, path, body, allowMissing = false) {
  if (process.env.GITHUB_REPOSITORY !== repository || !process.env.GH_TOKEN)
    throw new Error('Release requires the Lernwelt repository and CI token.');
  const response = await fetch(
    `https://api.github.com/repos/${repository}/${path}`,
    {
      method,
      signal: AbortSignal.timeout(30_000),
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  if (allowMissing && response.status === 404) return null;
  if (!response.ok)
    throw new Error(`GitHub release request failed: HTTP ${response.status}.`);
  return response.status === 204 ? null : response.json();
}
