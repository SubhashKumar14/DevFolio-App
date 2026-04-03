import mongoose from 'mongoose';
import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';

import { fetchGithubStats } from '../services/githubService.js';
import { fetchLeetcodeStats } from '../services/leetcodeService.js';
import { fetchCodeforcesStats } from '../services/codeforcesService.js';
import { fetchHackerRankStats } from '../services/hackerrankService.js';
import { fetchCodeChefStats } from '../services/codechefService.js';
import { fetchKaggleStats } from '../services/kaggleService.js';
import { fetchHuggingfaceStats } from '../services/huggingfaceService.js';

import { computeDevScore } from '../services/devscoreEngine.js';
import DevScore from '../models/DevScore.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { assertPublicOrOwner } from '../utils/privacyAccess.js';
import { decryptTokenAtRest } from '../utils/secureToken.js';
import { invalidateLeaderboardCache } from '../utils/cacheInvalidation.js';
import { enqueueUserSyncJob, getSyncJobSnapshot } from '../services/syncJobQueue.js';

const SCORE_RETENTION_LIMIT = 30;

// ─── Helper: resolve userId param ─────────────────
async function resolveUserId(param) {
  if (mongoose.Types.ObjectId.isValid(param)) return param;

  const normalizedHandle = String(param || '').trim().toLowerCase();
  const isHandleLike = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(normalizedHandle);
  if (isHandleLike) {
    const byHandle = await User.findOne({ publicHandle: normalizedHandle }).select('_id');
    if (byHandle?._id) {
      return byHandle._id;
    }
  }

  const user = await User.findOne({
    displayName: { $regex: new RegExp(`^${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  return user?._id || null;
}

// ─── Build platform data map for DevScore v2 ──────
async function buildPlatformData(userId) {
  const platformData = {};

  const [githubStats, dsaStats, platformStats] = await Promise.all([
    GithubStats.findOne({ userId }).lean(),
    DsaStats.findOne({ userId }).lean(),
    PlatformStats.findOne({ userId }).lean(),
  ]);

  if (githubStats) {
    platformData.github = {
      totalCommits: githubStats.totalCommits || 0,
      totalContributionsLastYear: githubStats.totalContributionsLastYear || 0,
      totalContributionsAllTime: githubStats.totalContributionsAllTime || 0,
      publicRepos: githubStats.publicRepos || 0,
      starsReceived: githubStats.starsReceived || 0,
      forksCount: githubStats.forksCount || 0,
      followers: githubStats.followers || 0,
      pullRequestsTotal: githubStats.pullRequestsTotal || githubStats.pullRequests || 0,
      pullRequestsMerged: githubStats.pullRequestsMerged || githubStats.pullRequests || 0,
      issuesOpened: githubStats.issuesOpened || 0,
      issuesClosed: githubStats.issuesClosed || 0,
      organizations: Array.isArray(githubStats.organizations) ? githubStats.organizations : [],
      currentStreak: githubStats.currentStreak || 0,
      longestStreak: githubStats.longestStreak || 0,
      contributionCalendar: Array.isArray(githubStats.contributionCalendar) ? githubStats.contributionCalendar : [],
      languageDistribution: Array.isArray(githubStats.languageDistribution) ? githubStats.languageDistribution : [],
      lastSyncedAt: githubStats.updatedAt || null,
    };
  }

  if (dsaStats?.leetcode) {
    const leetcodeData = {
      totalSolved: dsaStats.leetcode.totalSolved || 0,
      easySolved: dsaStats.leetcode.easySolved || 0,
      mediumSolved: dsaStats.leetcode.mediumSolved || 0,
      hardSolved: dsaStats.leetcode.hardSolved || 0,
      dailyActivity: Array.isArray(dsaStats.leetcode.dailyActivity) ? dsaStats.leetcode.dailyActivity : [],
    };

    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'contestRating')) leetcodeData.contestRating = dsaStats.leetcode.contestRating;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'contestGlobalRanking')) leetcodeData.contestGlobalRanking = dsaStats.leetcode.contestGlobalRanking;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'acceptanceRate')) leetcodeData.acceptanceRate = dsaStats.leetcode.acceptanceRate;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'currentStreak')) leetcodeData.currentStreak = dsaStats.leetcode.currentStreak;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'activeDays')) leetcodeData.activeDays = dsaStats.leetcode.activeDays;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'maxStreak')) leetcodeData.maxStreak = dsaStats.leetcode.maxStreak;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'topPercentage')) leetcodeData.topPercentage = dsaStats.leetcode.topPercentage;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'contestsParticipated')) leetcodeData.contestsParticipated = dsaStats.leetcode.contestsParticipated;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'badgesEarned')) leetcodeData.badgesEarned = dsaStats.leetcode.badgesEarned;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'solutionCount')) leetcodeData.solutionCount = dsaStats.leetcode.solutionCount;

    platformData.leetcode = leetcodeData;
  }

  if (dsaStats?.codeforces) {
    const codeforcesData = {
      rating: dsaStats.codeforces.currentRating || dsaStats.codeforces.rating || 0,
      currentRating: dsaStats.codeforces.currentRating || dsaStats.codeforces.rating || 0,
      maxRating: dsaStats.codeforces.maxRating || 0,
      rank: dsaStats.codeforces.rank || '',
      totalSolved: dsaStats.codeforces.totalSolved || 0,
      recentContestResults: Array.isArray(dsaStats.codeforces.recentContestResults) ? dsaStats.codeforces.recentContestResults : [],
      ratingHistory: Array.isArray(dsaStats.codeforces.ratingHistory) ? dsaStats.codeforces.ratingHistory : [],
      dailySubmissions: Array.isArray(dsaStats.codeforces.dailySubmissions) ? dsaStats.codeforces.dailySubmissions : [],
      tagsDistribution: Array.isArray(dsaStats.codeforces.tagsDistribution) ? dsaStats.codeforces.tagsDistribution : [],
    };

    if (Object.prototype.hasOwnProperty.call(dsaStats.codeforces, 'contestsParticipated')) {
      codeforcesData.contestsParticipated = dsaStats.codeforces.contestsParticipated;
    }

    platformData.codeforces = codeforcesData;
  }

  // Map PlatformStats fields
  if (platformStats) {
    const mapping = ['hackerrank', 'codechef', 'kaggle', 'huggingface'];
    for (const key of mapping) {
      const data = platformStats[key];
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        platformData[key] = data;
      }
    }
  }

  return platformData;
}

// ─── Persist DevScore and enforce retention cap ───
async function persistScore(userId, result) {
  await DevScore.create({
    userId,
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

  const count = await DevScore.countDocuments({ userId });
  if (count > SCORE_RETENTION_LIMIT) {
    const oldest = await DevScore.find({ userId })
      .sort({ createdAt: 1 })
      .limit(count - SCORE_RETENTION_LIMIT)
      .select('_id');
    await DevScore.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
  }
}

// ─── Get GitHub Stats ─────────────────────────────
export const getGithubStats = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);
  if (userId) {
    await assertPublicOrOwner({ targetUserId: userId, requester: req.user });
  }
  const stats = userId ? await GithubStats.findOne({ userId }) : null;
  res.json({ success: true, data: stats || null });
});

// ─── Get DSA Stats ────────────────────────────────
export const getDsaStats = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);
  if (userId) {
    await assertPublicOrOwner({ targetUserId: userId, requester: req.user });
  }
  const stats = userId ? await DsaStats.findOne({ userId }) : null;
  res.json({ success: true, data: stats || null });
});

// ─── Get Platform Stats ───────────────────────────
export const getPlatformStats = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);
  if (userId) {
    await assertPublicOrOwner({ targetUserId: userId, requester: req.user });
  }
  const stats = userId ? await PlatformStats.findOne({ userId }) : null;
  res.json({ success: true, data: stats || null });
});

// ─── Manual Sync All Stats + Recompute DevScore ───
export const syncStats = asyncHandler(async (req, res) => {
  const job = await enqueueUserSyncJob({
    targetUserId: req.user._id,
    requestedBy: req.user._id,
    meta: { source: 'manual' },
  });

  res.status(202).json({
    success: true,
    message: 'Sync job queued',
    data: job,
  });
});

// ─── Get Manual Sync Job Status ───────────────────
export const getSyncJobStatus = asyncHandler(async (req, res) => {
  const job = await getSyncJobSnapshot(req.params.jobId);

  if (!job || job.type !== 'user-sync') {
    throw new AppError('Sync job not found', 404);
  }

  const requesterId = req.user?._id?.toString();
  const isAdmin = req.user?.role === 'admin';
  const isOwner = requesterId && (
    job.requestedBy === requesterId || job.targetUserId === requesterId
  );

  if (!isAdmin && !isOwner) {
    throw new AppError('Access denied. Insufficient permissions.', 403);
  }

  res.json({
    success: true,
    data: job,
  });
});
