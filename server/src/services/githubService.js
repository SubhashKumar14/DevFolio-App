import axios from 'axios';

function sumContributions(calendar = []) {
  return (calendar || []).reduce((sum, entry) => sum + (Number(entry?.count) || 0), 0);
}

function computeStreaks(calendar = []) {
  const activeDates = (calendar || [])
    .filter((entry) => Number(entry?.count) > 0)
    .map((entry) => entry.date)
    .sort();

  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let currentRun = 1;
  for (let i = 1; i < activeDates.length; i++) {
    const prev = new Date(`${activeDates[i - 1]}T00:00:00.000Z`);
    const curr = new Date(`${activeDates[i]}T00:00:00.000Z`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      currentRun += 1;
      if (currentRun > longestStreak) longestStreak = currentRun;
    } else {
      currentRun = 1;
    }
  }

  let currentStreak = 1;
  for (let i = activeDates.length - 1; i > 0; i--) {
    const curr = new Date(`${activeDates[i]}T00:00:00.000Z`);
    const prev = new Date(`${activeDates[i - 1]}T00:00:00.000Z`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) currentStreak += 1;
    else break;
  }

  return { currentStreak, longestStreak };
}

async function querySearchCount(url, headers) {
  try {
    const res = await axios.get(url, { headers, timeout: 15000 });
    return Number(res.data?.total_count) || 0;
  } catch {
    return 0;
  }
}

async function buildLanguageDistributionByBytes(githubUsername, repos, headers) {
  const languageMap = new Map();
  const reposForLanguageScan = (repos || []).filter((repo) => !repo?.fork).slice(0, 30);

  if (reposForLanguageScan.length > 0) {
    const languageResponses = await Promise.allSettled(
      reposForLanguageScan.map((repo) =>
        axios.get(
          `https://api.github.com/repos/${githubUsername}/${repo.name}/languages`,
          { headers, timeout: 15000 }
        )
      )
    );

    for (const response of languageResponses) {
      if (response.status !== 'fulfilled') continue;
      const payload = response.value?.data || {};
      for (const [language, bytes] of Object.entries(payload)) {
        const current = languageMap.get(language) || { language, bytes: 0, count: 0 };
        current.bytes += Number(bytes) || 0;
        current.count += 1;
        languageMap.set(language, current);
      }
    }
  }

  if (languageMap.size === 0) {
    for (const repo of repos || []) {
      const language = repo?.language;
      if (!language) continue;
      const current = languageMap.get(language) || { language, bytes: 0, count: 0 };
      current.count += 1;
      current.bytes += 1;
      languageMap.set(language, current);
    }
  }

  return [...languageMap.values()]
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);
}

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

  // 1. Fetch user profile + repos + orgs
  const [userRes, reposRes, orgsRes] = await Promise.all([
    axios.get(`https://api.github.com/users/${githubUsername}`, { headers, timeout: 15000 }),
    axios.get(`https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`, { headers, timeout: 15000 }),
    axios.get(`https://api.github.com/users/${githubUsername}/orgs`, { headers, timeout: 15000 }).catch(() => ({ data: [] })),
  ]);

  const repos = reposRes.data;
  const starsReceived = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const forksCount = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
  const organizations = (orgsRes.data || []).map((org) => org?.login).filter(Boolean);

  const languageDistribution = await buildLanguageDistributionByBytes(githubUsername, repos, headers);

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

  // 3. Count pull requests/issues
  const [pullRequestsTotal, pullRequestsMerged, issuesOpened, issuesClosed] = await Promise.all([
    querySearchCount(`https://api.github.com/search/issues?q=author:${githubUsername}+type:pr`, headers),
    querySearchCount(`https://api.github.com/search/issues?q=author:${githubUsername}+type:pr+is:merged`, headers),
    querySearchCount(`https://api.github.com/search/issues?q=author:${githubUsername}+type:issue`, headers),
    querySearchCount(`https://api.github.com/search/issues?q=author:${githubUsername}+type:issue+is:closed`, headers),
  ]);

  // 4. Fetch contribution calendar + totals via GraphQL (requires token)
  let contributionCalendar = [];
  let totalContributionsLastYear = 0;
  let totalContributionsAllTime = 0;

  const toDate = new Date();
  const fromLastYearDate = new Date(toDate);
  fromLastYearDate.setUTCFullYear(toDate.getUTCFullYear() - 1);
  const fromAllTimeDate = new Date(userRes.data?.created_at || fromLastYearDate.toISOString());

  if (accessToken) {
    try {
      const graphqlRes = await axios.post(
        'https://api.github.com/graphql',
        {
          query: `query($login: String!, $fromLastYear: DateTime!, $fromAllTime: DateTime!, $toDate: DateTime!) {
            user(login: $login) {
              lastYear: contributionsCollection(from: $fromLastYear, to: $toDate) {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                    }
                  }
                }
              }
              allTime: contributionsCollection(from: $fromAllTime, to: $toDate) {
                contributionCalendar {
                  totalContributions
                }
              }
            }
          }`,
          variables: {
            login: githubUsername,
            fromLastYear: fromLastYearDate.toISOString(),
            fromAllTime: fromAllTimeDate.toISOString(),
            toDate: toDate.toISOString(),
          },
        },
        { headers: { ...headers, 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      const lastYear = graphqlRes.data?.data?.user?.lastYear?.contributionCalendar;
      const allTime = graphqlRes.data?.data?.user?.allTime?.contributionCalendar;
      const weeks = lastYear?.weeks || [];
      contributionCalendar = weeks.flatMap((w) =>
        w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
      );
      totalContributionsLastYear = Number(lastYear?.totalContributions) || 0;
      totalContributionsAllTime = Number(allTime?.totalContributions) || 0;
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

  if (totalContributionsLastYear <= 0) {
    totalContributionsLastYear = sumContributions(contributionCalendar);
  }

  if (totalContributionsAllTime <= 0) {
    totalContributionsAllTime = Math.max(
      totalContributionsLastYear,
      totalCommits + pullRequestsMerged + issuesOpened
    );
  }

  const { currentStreak, longestStreak } = computeStreaks(contributionCalendar);

  return {
    totalCommits,
    totalContributionsLastYear,
    totalContributionsAllTime,
    publicRepos: userRes.data.public_repos || 0,
    starsReceived,
    pullRequests: pullRequestsMerged,
    pullRequestsMerged,
    pullRequestsTotal,
    issuesOpened,
    issuesClosed,
    forksCount,
    followers: userRes.data.followers || 0,
    organizations,
    currentStreak,
    longestStreak,
    githubAvatarUrl: userRes.data.avatar_url,
    githubProfileUrl: userRes.data.html_url,
    languageDistribution,
    contributionCalendar,
    lastSyncedAt: new Date(),
  };
}
