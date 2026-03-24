import axios from 'axios';

/**
 * Fetch CodeChef profile stats using the unofficial profile API.
 * @param {string} username
 */
export async function fetchCodeChefStats(username) {
  try {
    const res = await axios.get(
      `https://www.codechef.com/users/${username}`,
      { timeout: 15000, headers: { 'User-Agent': 'DevFolio-App' } }
    );

    const html = res.data;

    // Parse key stats from HTML
    const ratingMatch = html.match(/class="rating-number">(\d+)/);
    const starsMatch = html.match(/class="rating"\s*>([^<]*★[^<]*)</);
    const solvedMatch = html.match(/Problems Solved<\/h5>\s*<span[^>]*>(\d+)/i);
    const globalRankMatch = html.match(/Global Rank<\/span>\s*<strong>(\d+)/i);
    const countryRankMatch = html.match(/Country Rank<\/span>\s*<strong>(\d+)/i);

    const currentRating = ratingMatch ? parseInt(ratingMatch[1]) : 0;
    const stars = starsMatch ? starsMatch[1].trim() : '';
    const problemsSolved = solvedMatch ? parseInt(solvedMatch[1]) : 0;
    const globalRank = globalRankMatch ? parseInt(globalRankMatch[1]) : 0;
    const countryRank = countryRankMatch ? parseInt(countryRankMatch[1]) : 0;

    return {
      currentRating,
      stars,
      problemsSolved,
      globalRank,
      countryRank,
    };
  } catch (err) {
    console.warn(`CodeChef fetch failed for ${username}:`, err.message);
    return { currentRating: 0, stars: '', problemsSolved: 0, globalRank: 0, countryRank: 0 };
  }
}
