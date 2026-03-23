import axios from 'axios';

/**
 * Fetch LeetCode stats via the unofficial GraphQL API.
 * @param {string} username - LeetCode username
 * @returns {Object} LeetCode problem-solving stats
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
    };
  }

  const stats = matchedUser.submitStatsGlobal.acSubmissionNum;

  return {
    easySolved: stats.find((s) => s.difficulty === 'Easy')?.count || 0,
    mediumSolved: stats.find((s) => s.difficulty === 'Medium')?.count || 0,
    hardSolved: stats.find((s) => s.difficulty === 'Hard')?.count || 0,
    totalSolved: stats.find((s) => s.difficulty === 'All')?.count || 0,
  };
}
