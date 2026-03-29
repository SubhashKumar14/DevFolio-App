import axios from 'axios';

/**
 * Fetch GeeksforGeeks profile stats by scraping the public profile API.
 * @param {string} username
 */
export async function fetchGfgStats(username) {
  try {
    const res = await axios.get(
      `https://geeks-for-geeks-stats-api.vercel.app/?userName=${username}`,
      { timeout: 10000 }
    );

    const d = res.data || {};
    return {
      totalProblemsSolved: parseInt(d.totalProblemsSolved) || 0,
      easySolved: (parseInt(d.School) || 0) + (parseInt(d.Basic) || 0) + (parseInt(d.Easy) || 0),
      mediumSolved: parseInt(d.Medium) || 0,
      hardSolved: parseInt(d.Hard) || 0,
      score: parseInt(d.codingScore) || 0,
      instituteRank: parseInt(d.instituteRank) || 0,
      streak: d.currentStreak || '0',
    };
  } catch (err) {
    console.warn(`GFG fetch failed for ${username}:`, err.message);
    return {
      totalProblemsSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
      score: 0, instituteRank: 0, streak: '0',
    };
  }
}
