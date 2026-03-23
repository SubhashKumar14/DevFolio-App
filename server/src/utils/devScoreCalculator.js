/**
 * DevScore Computation Engine
 *
 * Weighted formula:
 *   GitHub Activity  = 40%
 *   DSA Performance  = 40%
 *   Portfolio        = 20%
 *
 * Each sub-score is normalized to 0-100, then weighted.
 */

// ─── GitHub Normalization (0-100) ─────────────────
function normalizeGithub(stats) {
  if (!stats) return 0;

  // Commits: 0-500 → 0-25
  const commitScore = Math.min((stats.totalCommits || 0) / 500, 1) * 25;
  // Repos: 0-50 → 0-25
  const repoScore = Math.min((stats.publicRepos || 0) / 50, 1) * 25;
  // Stars: 0-100 → 0-25
  const starScore = Math.min((stats.starsReceived || 0) / 100, 1) * 25;
  // PRs: 0-50 → 0-25
  const prScore = Math.min((stats.pullRequests || 0) / 50, 1) * 25;

  return Math.round(commitScore + repoScore + starScore + prScore);
}

// ─── DSA Normalization (0-100) ────────────────────
function normalizeDsa(stats) {
  if (!stats) return 0;

  let lcScore = 0;
  if (stats.leetcode) {
    const { easySolved = 0, mediumSolved = 0, hardSolved = 0 } = stats.leetcode;
    // Weighted: easy=1, medium=3, hard=5 → max ~500 points mapped to 0-60
    const weighted = (easySolved * 1) + (mediumSolved * 3) + (hardSolved * 5);
    lcScore = Math.min(weighted / 500, 1) * 60;
  }

  let cfScore = 0;
  if (stats.codeforces) {
    // Rating: 0-2400 → 0-40
    cfScore = Math.min((stats.codeforces.currentRating || 0) / 2400, 1) * 40;
  }

  return Math.round(lcScore + cfScore);
}

// ─── Portfolio Normalization (0-100) ──────────────
function normalizePortfolio(portfolio) {
  if (!portfolio) return 0;

  let score = 0;

  // Has any content (HTML, CSS, or JS) → 40 points
  const hasContent = (portfolio.rawHtml && portfolio.rawHtml.length > 10) ||
                     (portfolio.cssContent && portfolio.cssContent.length > 10) ||
                     (portfolio.jsContent && portfolio.jsContent.length > 10);
  if (hasContent) score += 40;

  // Is public → 30 points
  if (portfolio.isPublic) score += 30;

  // Content quality heuristic (total code length) → 0-30 points
  const totalLength = (portfolio.rawHtml?.length || 0) +
                      (portfolio.cssContent?.length || 0) +
                      (portfolio.jsContent?.length || 0);
  // 0-2000 chars → 0-30 points
  score += Math.min(totalLength / 2000, 1) * 30;

  return Math.round(score);
}

// ─── Main Computation ─────────────────────────────
/**
 * Compute the DevScore for a user based on their stats.
 * @param {Object} githubStats - GitHub metrics
 * @param {Object} dsaStats - LeetCode + Codeforces stats
 * @param {Object} portfolioCode - Portfolio code data
 * @returns {{ overallScore: number, breakdown: Object }}
 */
export function computeDevScore(githubStats, dsaStats, portfolioCode) {
  const githubScore = normalizeGithub(githubStats);
  const dsaScore = normalizeDsa(dsaStats);
  const portfolioScore = normalizePortfolio(portfolioCode);

  const overallScore = Math.round(
    (githubScore * 0.40) +
    (dsaScore * 0.40) +
    (portfolioScore * 0.20)
  );

  return {
    overallScore,
    breakdown: {
      github: { score: githubScore, weight: 40 },
      dsa: { score: dsaScore, weight: 40 },
      portfolio: { score: portfolioScore, weight: 20 },
    },
  };
}
