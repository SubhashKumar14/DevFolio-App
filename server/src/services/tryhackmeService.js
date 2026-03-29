import axios from 'axios';

/**
 * Fetch TryHackMe profile stats.
 * @param {string} username
 */
export async function fetchTryhackmeStats(username) {
  try {
    const res = await axios.get(
      `https://tryhackme.com/api/user/rank/${username}`,
      {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DevFolio/1.0)' },
      }
    );

    const data = res.data || {};

    // Also try to get badge/room data
    let rooms = 0;
    let badges = 0;
    try {
      const profileRes = await axios.get(
        `https://tryhackme.com/api/user/${username}`,
        {
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DevFolio/1.0)' },
        }
      );
      const profile = profileRes.data || {};
      rooms = profile.totalCompletedRooms || 0;
      badges = profile.totalBadges || profile.badges?.length || 0;
    } catch {
      // Badge data is optional
    }

    return {
      username,
      rank: data.userRank || 0,
      points: data.points || 0,
      level: data.level || 0,
      roomsCompleted: rooms,
      badgesEarned: badges,
      streak: data.streak || 0,
      profileUrl: `https://tryhackme.com/p/${username}`,
    };
  } catch (err) {
    console.warn(`TryHackMe fetch failed for ${username}:`, err.message);
    return {
      username,
      rank: 0, points: 0, level: 0,
      roomsCompleted: 0, badgesEarned: 0, streak: 0,
      profileUrl: `https://tryhackme.com/p/${username}`,
    };
  }
}
