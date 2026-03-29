import axios from 'axios';

/**
 * Fetch CodeSignal profile stats.
 * Note: CodeSignal's API is restricted. This uses public profile scraping.
 * @param {string} username
 */
export async function fetchCodesignalStats(username) {
  try {
    const res = await axios.get(
      `https://app.codesignal.com/profile/${username}`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DevFolio/1.0)',
          'Accept': 'text/html',
        },
      }
    );

    const html = res.data || '';

    // Try to extract GCA score and other stats from HTML/JSON embedded data
    const gcaMatch = html.match(/"gcaScore"\s*:\s*(\d+)/);
    const codingScoreMatch = html.match(/"codingScore"\s*:\s*(\d+)/);
    const challengesMatch = html.match(/"tasksCompleted"\s*:\s*(\d+)/) || html.match(/"challengesSolved"\s*:\s*(\d+)/);
    const levelMatch = html.match(/"level"\s*:\s*(\d+)/);

    return {
      username,
      gcaScore: gcaMatch ? parseInt(gcaMatch[1]) : 0,
      codingScore: codingScoreMatch ? parseInt(codingScoreMatch[1]) : 0,
      challengesCompleted: challengesMatch ? parseInt(challengesMatch[1]) : 0,
      level: levelMatch ? parseInt(levelMatch[1]) : 0,
      profileUrl: `https://app.codesignal.com/profile/${username}`,
    };
  } catch (err) {
    console.warn(`CodeSignal fetch failed for ${username}:`, err.message);
    return {
      username,
      gcaScore: 0, codingScore: 0, challengesCompleted: 0, level: 0,
      profileUrl: `https://app.codesignal.com/profile/${username}`,
    };
  }
}
