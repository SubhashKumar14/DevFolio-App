import axios from 'axios';

/**
 * Fetch LeetCode stats via the unofficial GraphQL API.
 * @param {string} username - LeetCode username
 * @returns {Object} LeetCode problem-solving stats + submission calendar
 */
export async function fetchLeetcodeStats(username) {
  const query = `
    query getUserProblemsSolved($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        submissionCalendar
      }
    }
  `;

  const response = await axios.post('https://leetcode.com/graphql', {
    query,
    variables: { username },
  }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  const matchedUser = response.data?.data?.matchedUser;
  if (!matchedUser) {
    return {
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      totalSolved: 0,
      dailyActivity: [],
    };
  }

  const stats = matchedUser.submitStatsGlobal.acSubmissionNum;

  // Parse submission calendar: { "unixTimestamp": count, ... }
  let dailyActivity = [];
  try {
    const calendar = JSON.parse(matchedUser.submissionCalendar || '{}');
    dailyActivity = Object.entries(calendar).map(([ts, count]) => ({
      date: new Date(parseInt(ts) * 1000).toISOString().split('T')[0],
      count,
    }));
  } catch { /* ignore parse errors */ }

  return {
    easySolved: stats.find((s) => s.difficulty === 'Easy')?.count || 0,
    mediumSolved: stats.find((s) => s.difficulty === 'Medium')?.count || 0,
    hardSolved: stats.find((s) => s.difficulty === 'Hard')?.count || 0,
    totalSolved: stats.find((s) => s.difficulty === 'All')?.count || 0,
    dailyActivity,
  };
}
