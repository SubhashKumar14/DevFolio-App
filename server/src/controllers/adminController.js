import User from '../models/User.js';
import Profile from '../models/Profile.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import Project from '../models/Project.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { fetchGithubStats } from '../services/githubService.js';
import { fetchLeetcodeStats } from '../services/leetcodeService.js';
import { fetchCodeforcesStats } from '../services/codeforcesService.js';
import { computeDevScore } from '../utils/devScoreCalculator.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── List All Users ──────────────────────────────
export const listUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('email displayName role createdAt'),
    User.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    },
  });
});

// ─── Delete User (Cascading) ─────────────────────
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (userId === req.user._id.toString()) {
    throw new AppError('Cannot delete your own account via admin panel', 400);
  }

  await Promise.all([
    Profile.deleteMany({ userId }),
    GithubStats.deleteMany({ userId }),
    DsaStats.deleteMany({ userId }),
    Project.deleteMany({ userId }),
    DevScore.deleteMany({ userId }),
    PortfolioCode.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ]);

  res.json({
    success: true,
    message: 'User and all related data deleted',
  });
});

// ─── Change User Role ────────────────────────────
export const changeRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const validRoles = ['developer', 'recruiter', 'mentor', 'admin'];
  if (!validRoles.includes(role)) {
    throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
  }

  if (userId === req.user._id.toString()) {
    throw new AppError('Cannot change your own role', 400);
  }

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('email displayName role');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, data: user });
});

// ─── Platform Stats ──────────────────────────────
export const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProfiles,
    totalPortfolios,
    publicPortfolios,
    totalProjects,
    totalScores,
  ] = await Promise.all([
    User.countDocuments(),
    Profile.countDocuments(),
    PortfolioCode.countDocuments(),
    PortfolioCode.countDocuments({ isPublic: true }),
    Project.countDocuments(),
    DevScore.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalProfiles,
      totalPortfolios,
      publicPortfolios,
      totalProjects,
      totalScores,
    },
  });
});

// ─── Trigger Global Sync ─────────────────────────
export const triggerGlobalSync = asyncHandler(async (req, res) => {
  const users = await User.find({
    $or: [
      { githubUsername: { $ne: null } },
      { leetcodeUsername: { $ne: null } },
      { codeforcesUsername: { $ne: null } },
    ],
  }).select('+githubAccessToken');

  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      if (user.githubUsername) {
        const stats = await fetchGithubStats(user.githubUsername, user.githubAccessToken);
        await GithubStats.findOneAndUpdate({ userId: user._id }, { ...stats, userId: user._id }, { upsert: true });
      }
      if (user.leetcodeUsername) {
        const stats = await fetchLeetcodeStats(user.leetcodeUsername);
        await DsaStats.findOneAndUpdate({ userId: user._id }, { leetcode: stats, lastSyncedAt: new Date(), userId: user._id }, { upsert: true });
      }
      if (user.codeforcesUsername) {
        const stats = await fetchCodeforcesStats(user.codeforcesUsername);
        await DsaStats.findOneAndUpdate({ userId: user._id }, { codeforces: stats, lastSyncedAt: new Date() }, { upsert: true });
      }
      const githubStats = await GithubStats.findOne({ userId: user._id });
      const dsaStats = await DsaStats.findOne({ userId: user._id });
      const portfolio = await PortfolioCode.findOne({ userId: user._id });
      const scoreResult = computeDevScore(githubStats, dsaStats, portfolio);
      await DevScore.create({ userId: user._id, ...scoreResult, computedAt: new Date() });
      successCount++;
    } catch (error) {
      console.error(`Admin sync failed for user ${user._id}:`, error.message);
      errorCount++;
    }
  }

  res.json({
    success: true,
    message: `Global sync complete: ${successCount} synced, ${errorCount} errors`,
  });
});

