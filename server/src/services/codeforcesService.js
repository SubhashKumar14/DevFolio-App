import axios from 'axios';

/**
 * Fetch Codeforces user stats via the official REST API.
 * @param {string} username - Codeforces handle
 * @returns {Object} Codeforces rating and rank
 */
export async function fetchCodeforcesStats(username) {
  const response = await axios.get(
    `https://codeforces.com/api/user.info?handles=${username}`,
    { timeout: 10000 }
  );

  if (response.data.status !== 'OK' || !response.data.result?.length) {
    return {
      currentRating: 0,
      maxRating: 0,
      rank: 'unrated',
    };
  }

  const user = response.data.result[0];

  return {
    currentRating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || 'unrated',
  };
}
