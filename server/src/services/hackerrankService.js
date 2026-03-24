import axios from 'axios';

/**
 * Fetch HackerRank profile data by scraping the public profile.
 * HackerRank doesn't have a public API, so we use their public profile REST endpoint.
 * @param {string} username
 */
export async function fetchHackerRankStats(username) {
  try {
    // HackerRank public profile badges endpoint
    const res = await axios.get(
      `https://www.hackerrank.com/rest/hackers/${username}/badges`,
      { timeout: 10000, headers: { 'User-Agent': 'DevFolio-App' } }
    );

    const badges = (res.data?.models || []).map((b) => ({
      name: b.badge_name || b.name,
      stars: b.stars || 0,
      solved: b.solved || 0,
      currentPoints: b.current_points || 0,
    }));

    // Also fetch basic profile
    let profileData = {};
    try {
      const profileRes = await axios.get(
        `https://www.hackerrank.com/rest/hackers/${username}`,
        { timeout: 10000, headers: { 'User-Agent': 'DevFolio-App' } }
      );
      const m = profileRes.data?.model || {};
      profileData = {
        name: m.name || username,
        level: m.level || 0,
        country: m.country || '',
      };
    } catch { /* ignore */ }

    return {
      badges,
      totalBadges: badges.length,
      totalStars: badges.reduce((sum, b) => sum + b.stars, 0),
      ...profileData,
    };
  } catch (err) {
    console.warn(`HackerRank fetch failed for ${username}:`, err.message);
    return { badges: [], totalBadges: 0, totalStars: 0 };
  }
}
