import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { fetchGithubStats } from '../services/githubService.js';
import { fetchLeetcodeStats } from '../services/leetcodeService.js';
import { fetchCodeforcesStats } from '../services/codeforcesService.js';
import { computeDevScore } from '../utils/devScoreCalculator.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Get GitHub Stats ─────────────────────────────
export const getGithubStats = asyncHandler(async (req, res) => {
  const stats = await GithubStats.findOne({ userId: req.params.userId });

  res.json({ success: true, data: stats || null });
});

// ─── Get DSA Stats ────────────────────────────────
export const getDsaStats = asyncHandler(async (req, res) => {
  const stats = await DsaStats.findOne({ userId: req.params.userId });

  res.json({ success: true, data: stats || null });
});

// ─── Manual Sync All Stats ────────────────────────
export const syncStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+githubAccessToken');

  const synced = [];

  // Sync GitHub
  if (user.githubUsername) {
    try {
      const stats = await fetchGithubStats(user.githubUsername, user.githubAccessToken);
      await GithubStats.findOneAndUpdate(
        { userId: user._id },
        { ...stats, userId: user._id },
        { upsert: true, new: true }
      );
      synced.push('GitHub');
    } catch (err) {
      console.error('GitHub sync error:', err.message);
    }
  }

  // Sync LeetCode
  if (user.leetcodeUsername) {
    try {
      const stats = await fetchLeetcodeStats(user.leetcodeUsername);
      await DsaStats.findOneAndUpdate(
        { userId: user._id },
        { leetcode: stats, lastSyncedAt: new Date(), userId: user._id },
        { upsert: true, new: true }
      );
      synced.push('LeetCode');
    } catch (err) {
      console.error('LeetCode sync error:', err.message);
    }
  }

  // Sync Codeforces
  if (user.codeforcesUsername) {
    try {
      const stats = await fetchCodeforcesStats(user.codeforcesUsername);
      await DsaStats.findOneAndUpdate(
        { userId: user._id },
        { codeforces: stats, lastSyncedAt: new Date() },
        { upsert: true, new: true }
      );
      synced.push('Codeforces');
    } catch (err) {
      console.error('Codeforces sync error:', err.message);
    }
  }

  // Recompute DevScore
  const githubStats = await GithubStats.findOne({ userId: user._id });
  const dsaStats = await DsaStats.findOne({ userId: user._id });
  const portfolio = await PortfolioCode.findOne({ userId: user._id });

  const scoreResult = computeDevScore(githubStats, dsaStats, portfolio);

  await DevScore.create({
    userId: user._id,
    ...scoreResult,
    computedAt: new Date(),
  });

  res.json({
    success: true,
    message: `Sync triggered for: ${synced.join(', ') || 'no platforms connected'}`,
  });
});
