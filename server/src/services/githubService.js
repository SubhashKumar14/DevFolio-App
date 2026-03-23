import axios from 'axios';

/**
 * Fetch GitHub user stats using the public GitHub REST API.
 * Works without OAuth — uses username-based public endpoints.
 * @param {string} githubUsername
 * @param {string} [accessToken] - Optional GitHub OAuth token for higher rate limits
 * @returns {Object} GitHub stats
 */
export async function fetchGithubStats(githubUsername, accessToken) {
  const headers = { 'User-Agent': 'DevFolio-App' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  // 1. Fetch user profile + repos in parallel
  const [userRes, reposRes] = await Promise.all([
    axios.get(`https://api.github.com/users/${githubUsername}`, { headers, timeout: 15000 }),
    axios.get(`https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`, { headers, timeout: 15000 }),
  ]);

  const repos = reposRes.data;
  const starsReceived = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const forksCount = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

  // 2. Estimate total commits by summing commit activity on owned repos (non-forks)
  const ownedRepos = repos.filter(r => !r.fork);
  let totalCommits = 0;

  // Use the Search API to get total commit count for this user
  try {
    const searchRes = await axios.get(
      `https://api.github.com/search/commits?q=author:${githubUsername}`,
      { headers: { ...headers, Accept: 'application/vnd.github.cloak-preview+json' }, timeout: 15000 }
    );
    totalCommits = searchRes.data.total_count || 0;
  } catch {
    // Fallback: use public_repos as rough proxy
    totalCommits = userRes.data.public_repos || 0;
  }

  // 3. Count pull requests authored by this user (via Search API)
  let pullRequests = 0;
  try {
    const prRes = await axios.get(
      `https://api.github.com/search/issues?q=author:${githubUsername}+type:pr`,
      { headers, timeout: 15000 }
    );
    pullRequests = prRes.data.total_count || 0;
  } catch {
    pullRequests = 0;
  }

  return {
    totalCommits,
    publicRepos: userRes.data.public_repos || 0,
    starsReceived,
    pullRequests,
    forksCount,
    followers: userRes.data.followers || 0,
    githubAvatarUrl: userRes.data.avatar_url,
    githubProfileUrl: userRes.data.html_url,
    lastSyncedAt: new Date(),
  };
}
