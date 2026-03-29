import axios from 'axios';

function normalizeDomainName(value) {
  const raw = String(value || '').trim();
  return raw || 'General';
}

function toTierCounts(stars) {
  const n = Number(stars) || 0;
  if (n >= 5) return { gold: 1, silver: 0, bronze: 0 };
  if (n >= 3) return { gold: 0, silver: 1, bronze: 0 };
  if (n > 0) return { gold: 0, silver: 0, bronze: 1 };
  return { gold: 0, silver: 0, bronze: 0 };
}

/**
 * Fetch HackerRank profile data by scraping the public profile.
 * HackerRank doesn't have a public API, so we use their public profile REST endpoint.
 * @param {string} username
 */
export async function fetchHackerRankStats(username) {
  try {
    const headers = { 'User-Agent': 'DevFolio-App' };

    const [badgesRes, profileRes, scoresRes, contestsRes] = await Promise.all([
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, { timeout: 10000, headers }).catch(() => ({ data: { models: [] } })),
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}`, { timeout: 10000, headers }).catch(() => ({ data: { model: {} } })),
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}/scores_elo`, { timeout: 10000, headers }).catch(() => ({ data: { models: [] } })),
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}/contest_participation`, { timeout: 10000, headers }).catch(() => ({ data: { models: [], model: {} } })),
    ]);

    const badges = (badgesRes.data?.models || []).map((b) => ({
      domain: normalizeDomainName(b.badge_name || b.name || b.slug),
      stars: Number(b.stars) || 0,
      solved: Number(b.solved) || 0,
      currentPoints: Number(b.current_points) || 0,
    }));

    const profile = profileRes.data?.model || {};
    const domainScoreItems = scoresRes.data?.models || [];
    const domainScores = domainScoreItems.map((item) => ({
      domain: normalizeDomainName(item.name || item.skill || item.domain || item.track),
      stars: Number(item.stars || item.star || item.max_stars) || 0,
      rank: Number(item.rank || item.leaderboard_rank) || 0,
      score: Number(item.score || item.elo || item.points) || 0,
    })).filter((item) => item.domain);

    const domainRanks = domainScores.reduce((acc, item) => {
      if (item.rank > 0) acc[item.domain] = item.rank;
      return acc;
    }, {});

    const badgeTierByDomain = {};
    for (const item of domainScores) {
      badgeTierByDomain[item.domain] = toTierCounts(item.stars);
    }
    for (const badge of badges) {
      if (!badgeTierByDomain[badge.domain]) {
        badgeTierByDomain[badge.domain] = toTierCounts(badge.stars);
      }
    }

    const contestModels = contestsRes.data?.models || [];
    const contestModel = contestsRes.data?.model || contestModels[0] || {};
    const contestRanking = Number(contestModel?.rank || contestModel?.global_rank) || 0;
    const contestsParticipated = Number(contestModel?.contests_participated)
      || Number(contestModel?.contest_count)
      || contestModels.length
      || 0;

    return {
      badges,
      totalBadges: badges.length,
      totalStars: badges.reduce((sum, b) => sum + (Number(b.stars) || 0), 0),
      domainScores,
      badgeTierByDomain,
      domainRanks,
      contestRanking,
      contestsParticipated,
      name: profile.name || username,
      level: Number(profile.level) || 0,
      country: profile.country || '',
    };
  } catch (err) {
    console.warn(`HackerRank fetch failed for ${username}:`, err.message);
    return {
      badges: [],
      totalBadges: 0,
      totalStars: 0,
      domainScores: [],
      badgeTierByDomain: {},
      domainRanks: {},
      contestRanking: 0,
      contestsParticipated: 0,
      name: username,
      level: 0,
      country: '',
    };
  }
}
