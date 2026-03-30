import User from '../models/User.js';
import Profile from '../models/Profile.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import Project from '../models/Project.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { computeDevScore } from '../services/devscoreEngine.js';

import { fetchGithubStats } from '../services/githubService.js';
import { fetchLeetcodeStats } from '../services/leetcodeService.js';
import { fetchCodeforcesStats } from '../services/codeforcesService.js';
import { fetchHackerRankStats } from '../services/hackerrankService.js';
import { fetchCodeChefStats } from '../services/codechefService.js';
import { fetchKaggleStats } from '../services/kaggleService.js';
import { fetchHuggingfaceStats } from '../services/huggingfaceService.js';

import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { decryptTokenAtRest } from '../utils/secureToken.js';
import { invalidateLeaderboardCache } from '../utils/cacheInvalidation.js';

const SCORE_RETENTION_LIMIT = 30;

// ─── List All Users ──────────────────────────────
export const listUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select('email displayName role archetype createdAt'),
    User.countDocuments(),
  ]);

  res.json({
    success: true,
    data: { users, totalPages: Math.ceil(total / limit), currentPage: page },
  });
});

// ─── Delete User (Cascading) ─────────────────────
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (userId === req.user._id.toString()) throw new AppError('Cannot delete your own account via admin panel', 400);

  await Promise.all([
    Profile.deleteMany({ userId }),
    GithubStats.deleteMany({ userId }),
    DsaStats.deleteMany({ userId }),
    PlatformStats.deleteMany({ userId }),
    Project.deleteMany({ userId }),
    DevScore.deleteMany({ userId }),
    PortfolioCode.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ]);

  res.json({ success: true, message: 'User and all related data deleted' });
});

// ─── Change User Role ────────────────────────────
export const changeRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const validRoles = ['developer', 'recruiter', 'mentor', 'admin'];
  if (!validRoles.includes(role)) throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
  if (userId === req.user._id.toString()) throw new AppError('Cannot change your own role', 400);

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('email displayName role');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
});

// ─── Platform Stats ──────────────────────────────
export const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProfiles, totalPortfolios, publicPortfolios, totalProjects, totalScores] = await Promise.all([
    User.countDocuments(),
    Profile.countDocuments(),
    PortfolioCode.countDocuments(),
    PortfolioCode.countDocuments({ isPublic: true }),
    Project.countDocuments(),
    DevScore.countDocuments(),
  ]);

  // Archetype distribution for analytics
  const archetypeDistribution = await User.aggregate([
    { $match: { archetype: { $ne: null } } },
    { $group: { _id: '$archetype', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalUsers, totalProfiles, totalPortfolios, publicPortfolios, totalProjects, totalScores,
      archetypeDistribution,
    },
  });
});

// ─── Trigger Global Sync ──────────────────────────
export const triggerGlobalSync = asyncHandler(async (req, res) => {
  const users = await User.find({
    $or: [
      { githubUsername: { $ne: null } },
      { leetcodeUsername: { $ne: null } },
      { codeforcesUsername: { $ne: null } },
      { hackerrankUsername: { $ne: null } },
      { codechefUsername: { $ne: null } },
      { kaggleUsername: { $ne: null } },
      { huggingfaceUsername: { $ne: null } },
    ],
  }).select('+githubAccessToken');

  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      // GitHub
      if (user.githubUsername) {
        const githubAccessToken = decryptTokenAtRest(user.githubAccessToken);
        const stats = await fetchGithubStats(user.githubUsername, githubAccessToken);
        await GithubStats.findOneAndUpdate({ userId: user._id }, { ...stats, userId: user._id }, { upsert: true });
      }

      // DSA
      const dsaUpdates = {};
      if (user.leetcodeUsername) {
        dsaUpdates.leetcode = await fetchLeetcodeStats(user.leetcodeUsername);
      }
      if (user.codeforcesUsername) {
        const stats = await fetchCodeforcesStats(user.codeforcesUsername);
        const { ratingHistory, ...cfData } = stats;
        dsaUpdates.codeforces = { ...cfData, ratingHistory: ratingHistory?.slice(-50) || [] };
      }
      if (Object.keys(dsaUpdates).length > 0) {
        await DsaStats.findOneAndUpdate(
          { userId: user._id },
          { $set: { ...dsaUpdates, lastSyncedAt: new Date() }, $setOnInsert: { userId: user._id } },
          { upsert: true }
        );
      }

      // All other platforms
      const platformFetchers = [
        { field: 'hackerrankUsername', key: 'hackerrank', fn: fetchHackerRankStats },
        { field: 'codechefUsername', key: 'codechef', fn: fetchCodeChefStats },
        { field: 'kaggleUsername', key: 'kaggle', fn: fetchKaggleStats },
        { field: 'huggingfaceUsername', key: 'huggingface', fn: fetchHuggingfaceStats },
      ];

      const platformUpdates = {};
      await Promise.allSettled(
        platformFetchers.map(async ({ field, key, fn }) => {
          if (user[field]) {
            try { platformUpdates[key] = await fn(user[field]); }
            catch (err) { console.error(`  ${key} sync error:`, err.message); }
          }
        })
      );

      if (Object.keys(platformUpdates).length > 0) {
        await PlatformStats.findOneAndUpdate(
          { userId: user._id },
          { $set: { ...platformUpdates, lastSyncedAt: new Date() }, $setOnInsert: { userId: user._id } },
          { upsert: true }
        );
      }

      // DevScore v2 recompute
      const [githubStats, dsaStats, platformStats] = await Promise.all([
        GithubStats.findOne({ userId: user._id }).lean(),
        DsaStats.findOne({ userId: user._id }).lean(),
        PlatformStats.findOne({ userId: user._id }).lean(),
      ]);

      const platformData = {};
      if (githubStats) platformData.github = githubStats;
      if (dsaStats?.leetcode) platformData.leetcode = dsaStats.leetcode;
      if (dsaStats?.codeforces) platformData.codeforces = { rating: dsaStats.codeforces.currentRating, ...dsaStats.codeforces };
      if (platformStats) {
        for (const key of ['hackerrank', 'codechef', 'kaggle', 'huggingface']) {
          if (platformStats[key] && Object.keys(platformStats[key]).length > 0) {
            platformData[key] = platformStats[key];
          }
        }
      }

      const result = computeDevScore({ archetype: user.archetype, secondaryArchetype: user.secondaryArchetype, platformData });
      await DevScore.create({
        userId: user._id,
        score: result.overallScore,
        rawScore: result.rawScore,
        weightedRawScore: result.weightedRawScore,
        breakdown: result.pillars,
        archetype: result.archetype,
        secondaryArchetype: result.secondaryArchetype,
        connectedPlatforms: result.connectedPlatforms,
        domain: result.domain,
        domainLabel: result.domainLabel,
        platformScores: result.platformScores,
        strengths: result.strengths,
        improvements: result.improvements,
        diagnostics: result.diagnostics,
      });

      const count = await DevScore.countDocuments({ userId: user._id });
      if (count > SCORE_RETENTION_LIMIT) {
        const oldest = await DevScore.find({ userId: user._id })
          .sort({ createdAt: 1 })
          .limit(count - SCORE_RETENTION_LIMIT)
          .select('_id');
        await DevScore.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
      }

      successCount++;
    } catch (error) {
      console.error(`Admin sync failed for user ${user._id}:`, error.message);
      errorCount++;
    }
  }

  await invalidateLeaderboardCache();

  res.json({
    success: true,
    message: `Global sync complete: ${successCount} synced, ${errorCount} errors`,
  });
});
