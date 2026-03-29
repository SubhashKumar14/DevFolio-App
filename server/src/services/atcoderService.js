import axios from 'axios';

/**
 * Fetch AtCoder profile stats.
 * Uses the unofficial AtCoder Problems API.
 * @param {string} username
 */
export async function fetchAtcoderStats(username) {
  try {
    // Fetch user info from AtCoder Problems API
    const [infoRes, historyRes] = await Promise.all([
      axios.get(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/ac_rank?user=${username}`, { timeout: 10000 }),
      axios.get(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/rating_info?user=${username}`, { timeout: 10000 }),
    ]);

    // AC rank data
    const acRank = infoRes.data || {};

    // Rating info
    const ratingInfo = historyRes.data || {};
    const ratingHistory = ratingInfo.rating_history || [];
    const latestRating = ratingHistory.length > 0 ? ratingHistory[ratingHistory.length - 1] : null;

    // Compute color rank from rating
    const rating = latestRating?.new_rating || 0;
    let colorRank = 'grey';
    if (rating >= 2800) colorRank = 'red';
    else if (rating >= 2400) colorRank = 'orange';
    else if (rating >= 2000) colorRank = 'yellow';
    else if (rating >= 1600) colorRank = 'blue';
    else if (rating >= 1200) colorRank = 'cyan';
    else if (rating >= 800) colorRank = 'green';
    else if (rating >= 400) colorRank = 'brown';

    return {
      username,
      rating,
      maxRating: Math.max(0, ...ratingHistory.map(r => r.new_rating || 0)),
      colorRank,
      contestsParticipated: ratingHistory.length,
      problemsSolved: acRank.count || 0,
      globalRank: acRank.rank || null,
      ratingHistory: ratingHistory.slice(-50).map(r => ({
        contestName: r.contest_name || '',
        newRating: r.new_rating || 0,
        performance: r.performance || 0,
        date: r.end_time || '',
      })),
    };
  } catch (err) {
    console.warn(`AtCoder fetch failed for ${username}:`, err.message);
    return {
      username,
      rating: 0, maxRating: 0, colorRank: 'grey',
      contestsParticipated: 0, problemsSolved: 0, globalRank: null,
      ratingHistory: [],
    };
  }
}
