import axios from 'axios';

/**
 * Fetch upcoming contests from Codeforces and LeetCode.
 */
export async function fetchCodeforcesContests() {
  try {
    const res = await axios.get('https://codeforces.com/api/contest.list', { timeout: 10000 });
    if (res.data.status !== 'OK') return [];

    return res.data.result
      .filter((c) => c.phase === 'BEFORE')
      .slice(0, 10)
      .map((c) => ({
        platform: 'codeforces',
        name: c.name,
        startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
        durationSeconds: c.durationSeconds,
        url: `https://codeforces.com/contest/${c.id}`,
      }));
  } catch (err) {
    console.warn('Failed to fetch Codeforces contests:', err.message);
    return [];
  }
}

export async function fetchLeetcodeContests() {
  const query = `
    query {
      topTwoContests {
        title
        startTime
        duration
        titleSlug
      }
    }
  `;

  try {
    const res = await axios.post(
      'https://leetcode.com/graphql',
      { query },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const contests = res.data?.data?.topTwoContests || [];
    return contests.map((c) => ({
      platform: 'leetcode',
      name: c.title,
      startTime: new Date(c.startTime * 1000).toISOString(),
      durationSeconds: c.duration,
      url: `https://leetcode.com/contest/${c.titleSlug}/`,
    }));
  } catch (err) {
    console.warn('Failed to fetch LeetCode contests:', err.message);
    return [];
  }
}

export async function fetchAllUpcomingContests() {
  const [cf, lc] = await Promise.allSettled([
    fetchCodeforcesContests(),
    fetchLeetcodeContests(),
  ]);

  const all = [
    ...(cf.status === 'fulfilled' ? cf.value : []),
    ...(lc.status === 'fulfilled' ? lc.value : []),
  ];

  // Sort by start time ascending
  all.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  return all;
}
