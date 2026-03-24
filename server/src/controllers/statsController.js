import mongoose from 'mongoose';
import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { fetchGithubStats } from '../services/githubService.js';
import { fetchLeetcodeStats } from '../services/leetcodeService.js';
import { fetchCodeforcesStats } from '../services/codeforcesService.js';
import { fetchHackerRankStats } from '../services/hackerrankService.js';
import { fetchCodeChefStats } from '../services/codechefService.js';
import { fetchKaggleStats } from '../services/kaggleService.js';
import { fetchGfgStats } from '../services/gfgService.js';
import { computeDevScore } from '../utils/devScoreCalculator.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Helper: resolve userId param (ObjectId or displayName) ──
async function resolveUserId(param) {
  if (mongoose.Types.ObjectId.isValid(param)) return param;
  const user = await User.findOne({
    displayName: { $regex: new RegExp(`^${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  return user?._id || null;
}

// ─── Get GitHub Stats ─────────────────────────────
export const getGithubStats = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);
  const stats = userId ? await GithubStats.findOne({ userId }) : null;
  res.json({ success: true, data: stats || null });
});

// ─── Get DSA Stats ────────────────────────────────
export const getDsaStats = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);
  const stats = userId ? await DsaStats.findOne({ userId }) : null;
  res.json({ success: true, data: stats || null });
});

// ─── Get Platform Stats (new platforms) ───────────
export const getPlatformStats = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);
  const stats = userId ? await PlatformStats.findOne({ userId }) : null;
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
    } catch (err) { console.error('GitHub sync error:', err.message); }
  }

  // Sync LeetCode
  if (user.leetcodeUsername) {
    try {
      const stats = await fetchLeetcodeStats(user.leetcodeUsername);
      const { dailyActivity, ...leetcodeData } = stats;

      // Merge daily activity by date instead of replacing
      const existing = await DsaStats.findOne({ userId: user._id });
      const existingMap = new Map((existing?.dailyActivity || []).map(d => [d.date, d]));
      
      if (dailyActivity) {
        dailyActivity.forEach(d => {
          const current = existingMap.get(d.date) || { date: d.date, leetcodeCount: 0, codeforcesCount: 0 };
          current.leetcodeCount = d.count || 0;
          existingMap.set(d.date, current);
        });
      }

      await DsaStats.findOneAndUpdate(
        { userId: user._id },
        {
          leetcode: leetcodeData,
          dailyActivity: Array.from(existingMap.values()),
          lastSyncedAt: new Date(),
          userId: user._id,
        },
        { upsert: true, new: true }
      );
      synced.push('LeetCode');
    } catch (err) { console.error('LeetCode sync error:', err.message); }
  }

  // Sync Codeforces
  if (user.codeforcesUsername) {
    try {
      const stats = await fetchCodeforcesStats(user.codeforcesUsername);
      const { dailySubmissions, ratingHistory, ...cfData } = stats;

      // Merge Codeforces daily submissions into existing dailyActivity
      const existing = await DsaStats.findOne({ userId: user._id });
      const existingMap = new Map((existing?.dailyActivity || []).map(d => [d.date, d]));

      if (dailySubmissions) {
        dailySubmissions.forEach(d => {
          const current = existingMap.get(d.date) || { date: d.date, leetcodeCount: 0, codeforcesCount: 0 };
          current.codeforcesCount = d.count || 0;
          existingMap.set(d.date, current);
        });
      }

      await DsaStats.findOneAndUpdate(
        { userId: user._id },
        {
          codeforces: { ...cfData, ratingHistory: ratingHistory?.slice(-50) || [] },
          dailyActivity: Array.from(existingMap.values()),
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      synced.push('Codeforces');
    } catch (err) { console.error('Codeforces sync error:', err.message); }
  }

  // Sync HackerRank
  if (user.hackerrankUsername) {
    try {
      const stats = await fetchHackerRankStats(user.hackerrankUsername);
      await PlatformStats.findOneAndUpdate(
        { userId: user._id },
        { hackerrank: stats, lastSyncedAt: new Date(), userId: user._id },
        { upsert: true, new: true }
      );
      synced.push('HackerRank');
    } catch (err) { console.error('HackerRank sync error:', err.message); }
  }

  // Sync CodeChef
  if (user.codechefUsername) {
    try {
      const stats = await fetchCodeChefStats(user.codechefUsername);
      await PlatformStats.findOneAndUpdate(
        { userId: user._id },
        { codechef: stats, lastSyncedAt: new Date(), userId: user._id },
        { upsert: true, new: true }
      );
      synced.push('CodeChef');
    } catch (err) { console.error('CodeChef sync error:', err.message); }
  }

  // Sync Kaggle
  if (user.kaggleUsername) {
    try {
      const stats = await fetchKaggleStats(user.kaggleUsername);
      await PlatformStats.findOneAndUpdate(
        { userId: user._id },
        { kaggle: stats, lastSyncedAt: new Date(), userId: user._id },
        { upsert: true, new: true }
      );
      synced.push('Kaggle');
    } catch (err) { console.error('Kaggle sync error:', err.message); }
  }

  // Sync GeeksforGeeks
  if (user.gfgUsername) {
    try {
      const stats = await fetchGfgStats(user.gfgUsername);
      await PlatformStats.findOneAndUpdate(
        { userId: user._id },
        { gfg: stats, lastSyncedAt: new Date(), userId: user._id },
        { upsert: true, new: true }
      );
      synced.push('GeeksforGeeks');
    } catch (err) { console.error('GFG sync error:', err.message); }
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

  // Retention: keep only last 100 DevScore entries per user
  const count = await DevScore.countDocuments({ userId: user._id });
  if (count > 100) {
    const oldest = await DevScore.find({ userId: user._id })
      .sort({ createdAt: 1 })
      .limit(count - 100)
      .select('_id');
    await DevScore.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
  }

  res.json({
    success: true,
    message: `Sync triggered for: ${synced.join(', ') || 'no platforms connected'}`,
  });
});
