import axios from 'axios';

function pickNumber(payload, keys, fallback = 0) {
  for (const key of keys) {
    const value = payload?.[key];
    if (value === null || value === undefined) continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
}

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
    const competitionMedals = {
      gold: pickNumber(d, ['competitionsGold', 'competitionGoldMedals', 'totalCompetitionGoldMedals'], d.totalGoldMedals || 0),
      silver: pickNumber(d, ['competitionsSilver', 'competitionSilverMedals', 'totalCompetitionSilverMedals'], d.totalSilverMedals || 0),
      bronze: pickNumber(d, ['competitionsBronze', 'competitionBronzeMedals', 'totalCompetitionBronzeMedals'], d.totalBronzeMedals || 0),
    };
    competitionMedals.total = competitionMedals.gold + competitionMedals.silver + competitionMedals.bronze;

    const notebookMedals = {
      gold: pickNumber(d, ['notebooksGold', 'kernelsGold', 'totalNotebookGoldMedals']),
      silver: pickNumber(d, ['notebooksSilver', 'kernelsSilver', 'totalNotebookSilverMedals']),
      bronze: pickNumber(d, ['notebooksBronze', 'kernelsBronze', 'totalNotebookBronzeMedals']),
    };
    notebookMedals.total = notebookMedals.gold + notebookMedals.silver + notebookMedals.bronze;

    const datasetMedals = {
      gold: pickNumber(d, ['datasetsGold', 'totalDatasetGoldMedals']),
      silver: pickNumber(d, ['datasetsSilver', 'totalDatasetSilverMedals']),
      bronze: pickNumber(d, ['datasetsBronze', 'totalDatasetBronzeMedals']),
    };
    datasetMedals.total = datasetMedals.gold + datasetMedals.silver + datasetMedals.bronze;

    const competitionsCount = pickNumber(d, ['competitions', 'competitionCount']);
    const notebooksCount = pickNumber(d, ['kernels', 'notebooks']);
    const datasetsCount = pickNumber(d, ['datasets', 'datasetCount']);
    const notebookVotesReceived = pickNumber(d, ['kernelsVotes', 'notebookVotes', 'totalKernelVotes']);
    const datasetDownloads = pickNumber(d, ['datasetsDownloads', 'datasetDownloads', 'totalDatasetDownloads']);

    return {
      tier: d.tier || d.performanceTier || 'Unknown',
      totalMedals: (d.totalGoldMedals || 0) + (d.totalSilverMedals || 0) + (d.totalBronzeMedals || 0),
      goldMedals: d.totalGoldMedals || 0,
      silverMedals: d.totalSilverMedals || 0,
      bronzeMedals: d.totalBronzeMedals || 0,
      competitionMedals,
      notebookMedals,
      datasetMedals,
      competitions: competitionsCount,
      competitionsCount,
      notebooks: notebooksCount,
      datasets: datasetsCount,
      notebookVotesReceived,
      datasetDownloads,
      followers: pickNumber(d, ['followers', 'followersCount']),
      following: pickNumber(d, ['following', 'followingCount']),
      ranking: pickNumber(d, ['ranking', 'rank']),
    };
  } catch (err) {
    console.warn(`Kaggle fetch failed for ${username}:`, err.message);
    return {
      tier: 'Unknown',
      totalMedals: 0,
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0,
      competitionMedals: { gold: 0, silver: 0, bronze: 0, total: 0 },
      notebookMedals: { gold: 0, silver: 0, bronze: 0, total: 0 },
      datasetMedals: { gold: 0, silver: 0, bronze: 0, total: 0 },
      competitions: 0,
      competitionsCount: 0,
      notebooks: 0,
      datasets: 0,
      notebookVotesReceived: 0,
      datasetDownloads: 0,
      followers: 0,
      following: 0,
      ranking: 0,
    };
  }
}
