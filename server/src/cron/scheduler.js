import cron from 'node-cron';
import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import DevScore from '../models/DevScore.js';

import { fetchGithubStats } from '../services/githubService.js';
import { fetchLeetcodeStats } from '../services/leetcodeService.js';
import { fetchCodeforcesStats } from '../services/codeforcesService.js';
import { fetchHackerRankStats } from '../services/hackerrankService.js';
import { fetchCodeChefStats } from '../services/codechefService.js';
import { fetchKaggleStats } from '../services/kaggleService.js';
import { fetchHuggingfaceStats } from '../services/huggingfaceService.js';

import { computeDevScore } from '../services/devscoreEngine.js';
import { acquireLock, releaseLock, NO_LOCK_BACKEND } from '../config/redisClient.js';
import { decryptTokenAtRest } from '../utils/secureToken.js';
import { invalidateLeaderboardCache } from '../utils/cacheInvalidation.js';

const SCORE_RETENTION_LIMIT = 30;

// ─── Helpers ──────────────────────────────────────
function toSafeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function appendDailyDelta(existing = [], previousTotal = 0, nextTotal = 0) {
  const today = new Date().toISOString().slice(0, 10);
  const delta = Math.max(0, toSafeNumber(nextTotal) - toSafeNumber(previousTotal));
  const map = new Map((existing || []).map((d) => [d.date, toSafeNumber(d.count)]));
  if (delta > 0) {
    map.set(today, (map.get(today) || 0) + delta);
  }
  return [...map.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Build platformData for DevScore v2 engine ────
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

// ─── Persist DevScore v2 with retention cap ───────
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

/**
 * Nightly sync cron job — runs at 2:00 AM every day.
 * Syncs all supported platforms for all users with connected platforms.
 * Recomputes DevScore v2 after sync.
 */
cron.schedule('0 2 * * *', async () => {
  const lockKey = 'cron:nightly-sync:all-platforms';
  const lockToken = await acquireLock(lockKey, 2 * 60 * 60);

  if (lockToken === null) {
    console.log('⏭️ Skipping nightly sync: lock is held by another instance');
    return;
  }

  if (lockToken === NO_LOCK_BACKEND) {
    console.log('ℹ️ Nightly sync running without distributed lock (Redis unavailable)');
  }

  console.log('🔄 Starting nightly sync (supported platforms)...');

  try {
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
        const existingPlatformStats = await PlatformStats.findOne({ userId: user._id }).lean();

        // ─── GitHub ───────────────────────────
        if (user.githubUsername) {
          const githubAccessToken = decryptTokenAtRest(user.githubAccessToken);
          const stats = await fetchGithubStats(user.githubUsername, githubAccessToken);
          await GithubStats.findOneAndUpdate(
            { userId: user._id },
            { ...stats, userId: user._id },
            { upsert: true }
          );
        }

        // ─── LeetCode ────────────────────────
        if (user.leetcodeUsername) {
          const stats = await fetchLeetcodeStats(user.leetcodeUsername);
          await DsaStats.findOneAndUpdate(
            { userId: user._id },
            { $set: { leetcode: stats, lastSyncedAt: new Date() }, $setOnInsert: { userId: user._id } },
            { upsert: true }
          );
        }

        // ─── Codeforces ──────────────────────
        if (user.codeforcesUsername) {
          const stats = await fetchCodeforcesStats(user.codeforcesUsername);
          const { ratingHistory, ...cfData } = stats;
          await DsaStats.findOneAndUpdate(
            { userId: user._id },
            { $set: { codeforces: { ...cfData, ratingHistory: ratingHistory?.slice(-50) || [] }, lastSyncedAt: new Date() }, $setOnInsert: { userId: user._id } },
            { upsert: true }
          );
        }

        // ─── All other platforms (parallel) ───
        const platformFetchers = [
          { field: 'hackerrankUsername', key: 'hackerrank', fn: fetchHackerRankStats, deltaField: 'totalStars' },
          { field: 'codechefUsername', key: 'codechef', fn: fetchCodeChefStats, deltaField: 'problemsSolved' },
          { field: 'kaggleUsername', key: 'kaggle', fn: fetchKaggleStats, deltaField: null },
          { field: 'huggingfaceUsername', key: 'huggingface', fn: fetchHuggingfaceStats, deltaField: 'modelsPublished' },
        ];

        const platformUpdates = {};

        await Promise.allSettled(
          platformFetchers.map(async ({ field, key, fn, deltaField }) => {
            if (!user[field]) return;
            try {
              const stats = await fn(user[field]);
              if (deltaField) {
                const dailyActivity = appendDailyDelta(
                  existingPlatformStats?.[key]?.dailyActivity,
                  toSafeNumber(existingPlatformStats?.[key]?.[deltaField]),
                  toSafeNumber(stats[deltaField])
                );
                platformUpdates[key] = { ...stats, dailyActivity };
              } else {
                platformUpdates[key] = stats;
              }
            } catch (err) {
              console.error(`  ❌ ${key} sync failed for ${user._id}:`, err.message);
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

        // ─── Recompute DevScore v2 ────────────
        const platformData = await buildPlatformData(user._id);
        const result = computeDevScore({ archetype: user.archetype, secondaryArchetype: user.secondaryArchetype, platformData });
        await persistScore(user._id, result);

        successCount++;
      } catch (error) {
        console.error(`❌ Sync failed for user ${user._id}:`, error.message);
        errorCount++;
      }
    }

    await invalidateLeaderboardCache();

    console.log(`✅ Nightly sync complete: ${successCount} synced, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Nightly sync job failed:', error.message);
  } finally {
    await releaseLock(lockKey, lockToken);
  }
});

console.log('⏰ Cron scheduler initialized (nightly sync at 2:00 AM)');
