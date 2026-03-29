import axios from 'axios';

/**
 * Fetch Codeforces user stats, rating history, and daily submissions.
 * @param {string} username - Codeforces handle
 * @returns {Object} Codeforces stats including rating history and daily activity
 */
export async function fetchCodeforcesStats(username) {
  // Fetch user info + rating history + submissions in parallel
  const [infoRes, ratingRes, statusRes] = await Promise.all([
    axios.get(`https://codeforces.com/api/user.info?handles=${username}`, { timeout: 10000 }).catch(() => null),
    axios.get(`https://codeforces.com/api/user.rating?handle=${username}`, { timeout: 10000 }).catch(() => null),
    axios.get(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`, { timeout: 15000 }).catch(() => null),
  ]);

  // Basic info
  let currentRating = 0, maxRating = 0, rank = 'unrated';
  if (infoRes?.data?.status === 'OK' && infoRes.data.result?.length) {
    const user = infoRes.data.result[0];
    currentRating = user.rating || 0;
    maxRating = user.maxRating || 0;
    rank = user.rank || 'unrated';
  }

  // Rating history (for line chart)
  let ratingHistory = [];
  if (ratingRes?.data?.status === 'OK') {
    ratingHistory = (ratingRes.data.result || []).map((r) => ({
      contestName: r.contestName,
      contestId: r.contestId,
      rank: r.rank,
      oldRating: r.oldRating,
      newRating: r.newRating,
      date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString().split('T')[0],
    }));
  }

  // Daily submission counts (for heatmap)
  let dailySubmissions = [];
  if (statusRes?.data?.status === 'OK') {
    const submissions = statusRes.data.result || [];
    const dayMap = {};
    submissions.forEach((sub) => {
      const date = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
      dayMap[date] = (dayMap[date] || 0) + 1;
    });
    dailySubmissions = Object.entries(dayMap).map(([date, count]) => ({ date, count }));
  }

  // Total problems solved (unique accepted)
  let totalSolved = 0;
  if (statusRes?.data?.status === 'OK') {
    const accepted = new Set();
    (statusRes.data.result || []).forEach((sub) => {
      if (sub.verdict === 'OK' && sub.problem) {
        accepted.add(`${sub.problem.contestId}-${sub.problem.index}`);
      }
    });
    totalSolved = accepted.size;
  }

  return {
    currentRating,
    maxRating,
    rank,
    totalSolved,
    contestsParticipated: ratingHistory.length,
    ratingHistory,
    dailySubmissions,
  };
}
