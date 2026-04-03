import User from '../models/User.js';
import Profile from '../models/Profile.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import Project from '../models/Project.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';

import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { enqueueGlobalSyncJob, getSyncJobSnapshot } from '../services/syncJobQueue.js';

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

  const user = await User.findByIdAndUpdate(userId, { role }, { returnDocument: 'after' }).select('email displayName role');
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
  const job = await enqueueGlobalSyncJob({
    requestedBy: req.user._id,
    meta: { source: 'admin-panel' },
  });

  res.status(202).json({
    success: true,
    message: 'Global sync job queued',
    data: job,
  });
});

// ─── Get Global Sync Job Status ──────────────────
export const getGlobalSyncJobStatus = asyncHandler(async (req, res) => {
  const job = await getSyncJobSnapshot(req.params.jobId);

  if (!job || job.type !== 'global-sync') {
    throw new AppError('Global sync job not found', 404);
  }

  res.json({
    success: true,
    data: job,
  });
});
