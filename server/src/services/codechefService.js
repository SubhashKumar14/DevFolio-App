import axios from 'axios';

function parseFirstInt(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const numeric = parseInt(String(match[1]).replace(/,/g, ''), 10);
      if (Number.isFinite(numeric)) return numeric;
    }
  }
  return 0;
}

function parseStarsCount(starsValue) {
  const starsString = String(starsValue || '');
  const explicit = parseInt(starsString, 10);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return (starsString.match(/★/g) || []).length;
}

function parseContestCountFromHistory(html) {
  const historyArrayMatch = html.match(/all_rating\s*=\s*(\[[^\]]*\])/i)
    || html.match(/"all_rating"\s*:\s*(\[[^\]]*\])/i);

  if (historyArrayMatch?.[1]) {
    const raw = historyArrayMatch[1];
    const numberMatches = raw.match(/\d+/g) || [];
    if (numberMatches.length > 0) return numberMatches.length;
  }

  const pointMatches = html.match(/rating-data-label-text/g) || [];
  return pointMatches.length;
}

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

    // Parse key stats from HTML with fallback regexes
    const currentRating = parseFirstInt(html, [
      /class="rating-number">\s*([\d,]+)/i,
      /"rating"\s*:\s*"?([\d,]+)"?/i,
    ]);
    const starsRaw = (html.match(/class="rating"\s*>([^<]*)</i)?.[1] || '').trim();
    const starsCount = parseStarsCount(starsRaw);
    const stars = starsRaw || (starsCount > 0 ? `${starsCount}★` : '');

    const problemsSolved = parseFirstInt(html, [
      /Problems Solved<\/h5>\s*<span[^>]*>\s*([\d,]+)/i,
      /"problems_solved"\s*:\s*([\d,]+)/i,
    ]);
    const globalRank = parseFirstInt(html, [
      /Global Rank<\/span>\s*<strong>\s*([\d,]+)/i,
      /"global_rank"\s*:\s*([\d,]+)/i,
    ]);
    const countryRank = parseFirstInt(html, [
      /Country Rank<\/span>\s*<strong>\s*([\d,]+)/i,
      /"country_rank"\s*:\s*([\d,]+)/i,
    ]);
    const highestRating = parseFirstInt(html, [
      /Highest Rating<\/span>\s*<strong>\s*([\d,]+)/i,
      /"highest_rating"\s*:\s*([\d,]+)/i,
      /"max_rating"\s*:\s*([\d,]+)/i,
    ]);

    let contestCount = parseFirstInt(html, [
      /Contests Participated<\/span>\s*<strong>\s*([\d,]+)/i,
      /"contest_count"\s*:\s*([\d,]+)/i,
    ]);
    if (!contestCount) contestCount = parseContestCountFromHistory(html);

    const fullySolvedCount = parseFirstInt(html, [
      /Fully Solved<\/span>\s*<strong>\s*([\d,]+)/i,
      /"fully_solved"\s*:\s*([\d,]+)/i,
    ]);
    const partiallySolvedCount = parseFirstInt(html, [
      /Partially Solved<\/span>\s*<strong>\s*([\d,]+)/i,
      /"partially_solved"\s*:\s*([\d,]+)/i,
    ]);

    return {
      currentRating,
      stars,
      starsCount,
      problemsSolved,
      globalRank,
      countryRank,
      highestRating: highestRating || currentRating,
      contestCount,
      fullySolvedCount,
      partiallySolvedCount,
    };
  } catch (err) {
    console.warn(`CodeChef fetch failed for ${username}:`, err.message);
    return {
      currentRating: 0,
      stars: '',
      starsCount: 0,
      problemsSolved: 0,
      globalRank: 0,
      countryRank: 0,
      highestRating: 0,
      contestCount: 0,
      fullySolvedCount: 0,
      partiallySolvedCount: 0,
    };
  }
}
