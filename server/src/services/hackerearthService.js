import axios from 'axios';

/**
 * Fetch HackerEarth profile stats via scraping the public API.
 * @param {string} username
 */
export async function fetchHackerearthStats(username) {
  try {
    const res = await axios.get(
      `https://www.hackerearth.com/@${username}`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DevFolio/1.0)',
          'Accept': 'text/html',
        },
      }
    );

    const html = res.data || '';

    // Parse basic stats from HTML using regex patterns
    const ratingMatch = html.match(/Rating:\s*(\d+)/i);
    const solvedMatch = html.match(/Problems Solved:\s*(\d+)/i) || html.match(/"problems_solved"\s*:\s*(\d+)/);
    const contestsMatch = html.match(/Contests:\s*(\d+)/i) || html.match(/"contests_participated"\s*:\s*(\d+)/);

    return {
      username,
      rating: ratingMatch ? parseInt(ratingMatch[1]) : 0,
      problemsSolved: solvedMatch ? parseInt(solvedMatch[1]) : 0,
      contestsParticipated: contestsMatch ? parseInt(contestsMatch[1]) : 0,
      profileUrl: `https://www.hackerearth.com/@${username}`,
    };
  } catch (err) {
    console.warn(`HackerEarth fetch failed for ${username}:`, err.message);
    return {
      username,
      rating: 0, problemsSolved: 0, contestsParticipated: 0,
      profileUrl: `https://www.hackerearth.com/@${username}`,
    };
  }
}
