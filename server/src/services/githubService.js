import axios from 'axios';

/**
 * Fetch GitHub user stats using REST API + GraphQL for contribution calendar.
 * @param {string} githubUsername
 * @param {string} [accessToken] - Optional OAuth token for higher rate limits + GraphQL
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

  // Build language distribution from repos
  const langMap = {};
  repos.forEach((repo) => {
    if (repo.language) {
      langMap[repo.language] = (langMap[repo.language] || 0) + 1;
    }
  });
  const languageDistribution = Object.entries(langMap)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 2. Estimate total commits via Search API
  let totalCommits = 0;
  try {
    const searchRes = await axios.get(
      `https://api.github.com/search/commits?q=author:${githubUsername}`,
      { headers: { ...headers, Accept: 'application/vnd.github.cloak-preview+json' }, timeout: 15000 }
    );
    totalCommits = searchRes.data.total_count || 0;
  } catch {
    totalCommits = userRes.data.public_repos || 0;
  }

  // 3. Count pull requests
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

  // 4. Fetch contribution calendar via GitHub GraphQL API (requires token)
  let contributionCalendar = [];
  if (accessToken) {
    try {
      const graphqlRes = await axios.post(
        'https://api.github.com/graphql',
        {
          query: `query($login: String!) {
            user(login: $login) {
              contributionsCollection {
                contributionCalendar {
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                    }
                  }
                }
              }
            }
          }`,
          variables: { login: githubUsername },
        },
        { headers: { ...headers, 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      const weeks = graphqlRes.data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
      contributionCalendar = weeks.flatMap((w) =>
        w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
      );
    } catch (err) {
      console.warn('GitHub GraphQL calendar fetch failed:', err.message);
    }
  }

  // Fallback: scrape from GitHub profile HTML if no token
  if (contributionCalendar.length === 0) {
    try {
      const htmlRes = await axios.get(`https://github.com/users/${githubUsername}/contributions`, {
        headers: { 'User-Agent': 'DevFolio-App' },
        timeout: 15000,
      });
      const dateRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-count="(\d+)"/g;
      let match;
      while ((match = dateRegex.exec(htmlRes.data)) !== null) {
        contributionCalendar.push({ date: match[1], count: parseInt(match[2], 10) });
      }
    } catch {
      // No calendar data available
    }
  }

  // Last-resort fallback: aggregate recent public events by day (typically up to ~90 days)
  if (contributionCalendar.length === 0) {
    try {
      const eventsRes = await axios.get(
        `https://api.github.com/users/${githubUsername}/events/public?per_page=100`,
        { headers, timeout: 15000 }
      );
      const eventMap = {};
      for (const event of eventsRes.data || []) {
        if (!event?.created_at) continue;
        const date = event.created_at.slice(0, 10);
        eventMap[date] = (eventMap[date] || 0) + 1;
      }
      contributionCalendar = Object.entries(eventMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      // No events fallback available
    }
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
    languageDistribution,
    contributionCalendar,
    lastSyncedAt: new Date(),
  };
}
