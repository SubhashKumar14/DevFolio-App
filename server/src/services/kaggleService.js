import axios from 'axios';

/**
 * Fetch Kaggle user profile via the public API.
 * @param {string} username
 */
export async function fetchKaggleStats(username) {
  try {
    const res = await axios.get(
      `https://www.kaggle.com/api/v1/users/${username}`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'DevFolio-App',
          Accept: 'application/json',
        },
      }
    );

    const d = res.data || {};
    return {
      tier: d.tier || d.performanceTier || 'Unknown',
      totalMedals: (d.totalGoldMedals || 0) + (d.totalSilverMedals || 0) + (d.totalBronzeMedals || 0),
      goldMedals: d.totalGoldMedals || 0,
      silverMedals: d.totalSilverMedals || 0,
      bronzeMedals: d.totalBronzeMedals || 0,
      datasets: d.datasets || 0,
      notebooks: d.kernels || 0,
      competitions: d.competitions || 0,
      followers: d.followers || 0,
      ranking: d.ranking || 0,
    };
  } catch (err) {
    console.warn(`Kaggle fetch failed for ${username}:`, err.message);
    return {
      tier: 'Unknown', totalMedals: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0,
      datasets: 0, notebooks: 0, competitions: 0, followers: 0, ranking: 0,
    };
  }
}
