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
import { fetchGfgStats } from '../services/gfgService.js';
import { fetchAtcoderStats } from '../services/atcoderService.js';
import { fetchStackoverflowStats } from '../services/stackoverflowService.js';
import { fetchHackerearthStats } from '../services/hackerearthService.js';
import { fetchHuggingfaceStats } from '../services/huggingfaceService.js';
import { fetchTryhackmeStats } from '../services/tryhackmeService.js';
import { fetchCodesignalStats } from '../services/codesignalService.js';
import { fetchDevtoStats } from '../services/devtoService.js';
import { fetchGitlabStats } from '../services/gitlabService.js';

import { computeDevScore } from '../services/devscoreEngine.js';
import DevScore from '../models/DevScore.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const SCORE_RETENTION_LIMIT = 30;

// ─── Helper: resolve userId param ─────────────────
async function resolveUserId(param) {
  if (mongoose.Types.ObjectId.isValid(param)) return param;
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
      publicRepos: githubStats.publicRepos || 0,
      starsReceived: githubStats.starsReceived || 0,
      totalCommits: githubStats.totalCommits || 0,
      pullRequests: githubStats.pullRequests || 0,
      followers: githubStats.followers || 0,
      forksCount: githubStats.forksCount || 0,
      currentStreak: githubStats.currentStreak || 0,
      contributionCalendar: Array.isArray(githubStats.contributionCalendar) ? githubStats.contributionCalendar : [],
      languageDistribution: Array.isArray(githubStats.languageDistribution) ? githubStats.languageDistribution : [],
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
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'acceptanceRate')) leetcodeData.acceptanceRate = dsaStats.leetcode.acceptanceRate;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'activeDays')) leetcodeData.activeDays = dsaStats.leetcode.activeDays;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'maxStreak')) leetcodeData.maxStreak = dsaStats.leetcode.maxStreak;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'topPercentage')) leetcodeData.topPercentage = dsaStats.leetcode.topPercentage;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'contestsParticipated')) leetcodeData.contestsParticipated = dsaStats.leetcode.contestsParticipated;
    if (Object.prototype.hasOwnProperty.call(dsaStats.leetcode, 'badgesEarned')) leetcodeData.badgesEarned = dsaStats.leetcode.badgesEarned;

    platformData.leetcode = leetcodeData;
  }

  if (dsaStats?.codeforces) {
    const codeforcesData = {
      rating: dsaStats.codeforces.currentRating || dsaStats.codeforces.rating || 0,
      currentRating: dsaStats.codeforces.currentRating || dsaStats.codeforces.rating || 0,
      maxRating: dsaStats.codeforces.maxRating || 0,
      totalSolved: dsaStats.codeforces.totalSolved || 0,
      dailySubmissions: Array.isArray(dsaStats.codeforces.dailySubmissions) ? dsaStats.codeforces.dailySubmissions : [],
    };

    if (Object.prototype.hasOwnProperty.call(dsaStats.codeforces, 'contestsParticipated')) {
      codeforcesData.contestsParticipated = dsaStats.codeforces.contestsParticipated;
    }

    platformData.codeforces = codeforcesData;
  }

  // Map PlatformStats fields
  if (platformStats) {
    const mapping = [
      'hackerrank', 'codechef', 'kaggle', 'gfg',
      'atcoder', 'stackoverflow', 'hackerearth',
      'huggingface', 'tryhackme', 'codesignal', 'devto', 'gitlab',
    ];
    for (const key of mapping) {
      const data = platformStats[key];
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        // Map gfg → geeksforgeeks for devscoreEngine compatibility
        const engineKey = key === 'gfg' ? 'geeksforgeeks' : key;
        platformData[engineKey] = data;
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
  const stats = userId ? await GithubStats.findOne({ userId }) : null;
  res.json({ success: true, data: stats || null });
});

// ─── Get DSA Stats ────────────────────────────────
export const getDsaStats = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);
  const stats = userId ? await DsaStats.findOne({ userId }) : null;
  res.json({ success: true, data: stats || null });
});

// ─── Get Platform Stats ───────────────────────────
export const getPlatformStats = asyncHandler(async (req, res) => {
  const userId = await resolveUserId(req.params.userId);
  const stats = userId ? await PlatformStats.findOne({ userId }) : null;
  res.json({ success: true, data: stats || null });
});

// ─── Manual Sync All Stats + Recompute DevScore ───
export const syncStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+githubAccessToken');
  const synced = [];

  // Group 1: GitHub
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

  // Group 2: DSA (LeetCode, Codeforces)
  if (user.leetcodeUsername || user.codeforcesUsername) {
    const dsaUpdates = {};
    if (user.leetcodeUsername) {
      try {
        dsaUpdates.leetcode = await fetchLeetcodeStats(user.leetcodeUsername);
        synced.push('LeetCode');
      } catch (err) { console.error('LeetCode sync error:', err.message); }
    }
    if (user.codeforcesUsername) {
      try {
        const stats = await fetchCodeforcesStats(user.codeforcesUsername);
        const { ratingHistory, ...cfData } = stats;
        dsaUpdates.codeforces = { ...cfData, ratingHistory: ratingHistory?.slice(-50) || [] };
        synced.push('Codeforces');
      } catch (err) { console.error('Codeforces sync error:', err.message); }
    }
    if (Object.keys(dsaUpdates).length > 0) {
      await DsaStats.findOneAndUpdate(
        { userId: user._id },
        { $set: { ...dsaUpdates, lastSyncedAt: new Date() }, $setOnInsert: { userId: user._id } },
        { upsert: true, new: true }
      );
    }
  }

  // Group 3: All other platforms (parallel)
  const platformUpdates = {};
  const platformFetchers = [
    { field: 'hackerrankUsername', key: 'hackerrank', fn: fetchHackerRankStats },
    { field: 'codechefUsername', key: 'codechef', fn: fetchCodeChefStats },
    { field: 'kaggleUsername', key: 'kaggle', fn: fetchKaggleStats },
    { field: 'gfgUsername', key: 'gfg', fn: fetchGfgStats },
    { field: 'atcoderUsername', key: 'atcoder', fn: fetchAtcoderStats },
    { field: 'stackoverflowUserId', key: 'stackoverflow', fn: fetchStackoverflowStats },
    { field: 'hackerEarthUsername', key: 'hackerearth', fn: fetchHackerearthStats },
    { field: 'huggingfaceUsername', key: 'huggingface', fn: fetchHuggingfaceStats },
    { field: 'tryhackmeUsername', key: 'tryhackme', fn: fetchTryhackmeStats },
    { field: 'codesignalUsername', key: 'codesignal', fn: fetchCodesignalStats },
    { field: 'devtoUsername', key: 'devto', fn: fetchDevtoStats },
    { field: 'gitlabUsername', key: 'gitlab', fn: fetchGitlabStats },
  ];

  await Promise.allSettled(
    platformFetchers.map(async ({ field, key, fn }) => {
      if (user[field]) {
        try {
          const stats = await fn(user[field]);
          platformUpdates[key] = stats;
          synced.push(key);
        } catch (err) {
          console.error(`${key} sync error:`, err.message);
        }
      }
    })
  );

  if (Object.keys(platformUpdates).length > 0) {
    await PlatformStats.findOneAndUpdate(
      { userId: user._id },
      { $set: { ...platformUpdates, lastSyncedAt: new Date() }, $setOnInsert: { userId: user._id } },
      { upsert: true, new: true }
    );
  }

  // ─── Auto-recompute DevScore v2 after sync ──────
  try {
    const platformData = await buildPlatformData(user._id);
    const result = computeDevScore({
      archetype: user.archetype,
      secondaryArchetype: user.secondaryArchetype,
      platformData,
    });
    await persistScore(user._id, result);
  } catch (err) {
    console.error('DevScore recompute after sync failed:', err.message);
  }

  res.json({
    success: true,
    message: `Sync triggered for: ${synced.join(', ') || 'no platforms connected'}`,
  });
});
