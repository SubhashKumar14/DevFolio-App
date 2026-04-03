import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import DevScore from '../models/DevScore.js';

import { fetchGithubStats } from './githubService.js';
import { fetchLeetcodeStats } from './leetcodeService.js';
import { fetchCodeforcesStats } from './codeforcesService.js';
import { fetchHackerRankStats } from './hackerrankService.js';
import { fetchCodeChefStats } from './codechefService.js';
import { fetchKaggleStats } from './kaggleService.js';
import { fetchHuggingfaceStats } from './huggingfaceService.js';

import { computeDevScore } from './devscoreEngine.js';
import { decryptTokenAtRest } from '../utils/secureToken.js';
import { invalidateLeaderboardCache } from '../utils/cacheInvalidation.js';

const SCORE_RETENTION_LIMIT = 30;
const GLOBAL_SYNC_CONCURRENCY = 3;

export const CONNECTED_USER_FILTER = {
  $or: [
    { githubUsername: { $nin: [null, ''] } },
    { leetcodeUsername: { $nin: [null, ''] } },
    { codeforcesUsername: { $nin: [null, ''] } },
    { hackerrankUsername: { $nin: [null, ''] } },
    { codechefUsername: { $nin: [null, ''] } },
    { kaggleUsername: { $nin: [null, ''] } },
    { huggingfaceUsername: { $nin: [null, ''] } },
  ],
};

const SYNC_USER_SELECT = [
  'displayName',
  'archetype',
  'secondaryArchetype',
  'githubUsername',
  'leetcodeUsername',
  'codeforcesUsername',
  'hackerrankUsername',
  'codechefUsername',
  'kaggleUsername',
  'huggingfaceUsername',
].join(' ');

function toSafeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function appendDailyDelta(existing = [], previousTotal = 0, nextTotal = 0) {
  const today = new Date().toISOString().slice(0, 10);
  const delta = Math.max(0, toSafeNumber(nextTotal) - toSafeNumber(previousTotal));
  const map = new Map((existing || []).map((entry) => [entry.date, toSafeNumber(entry.count)]));

  if (delta > 0) {
    map.set(today, (map.get(today) || 0) + delta);
  }

  return [...map.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

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
    for (const key of ['hackerrank', 'codechef', 'kaggle', 'huggingface']) {
      const data = platformStats[key];
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        platformData[key] = data;
      }
    }
  }

  return platformData;
}

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

    await DevScore.deleteMany({ _id: { $in: oldest.map((entry) => entry._id) } });
  }
}

async function syncUserDocument(user) {
  const syncedPlatforms = [];
  const errors = [];

  const existingPlatformStats = await PlatformStats.findOne({ userId: user._id }).lean();

  if (user.githubUsername) {
    try {
      const githubAccessToken = decryptTokenAtRest(user.githubAccessToken);
      const github = await fetchGithubStats(user.githubUsername, githubAccessToken);
      await GithubStats.findOneAndUpdate(
        { userId: user._id },
        { ...github, userId: user._id },
        { upsert: true, returnDocument: 'after' }
      );
      syncedPlatforms.push('GitHub');
    } catch (error) {
      errors.push(`GitHub: ${error.message}`);
    }
  }

  if (user.leetcodeUsername || user.codeforcesUsername) {
    const dsaUpdates = {};

    if (user.leetcodeUsername) {
      try {
        dsaUpdates.leetcode = await fetchLeetcodeStats(user.leetcodeUsername);
        syncedPlatforms.push('LeetCode');
      } catch (error) {
        errors.push(`LeetCode: ${error.message}`);
      }
    }

    if (user.codeforcesUsername) {
      try {
        const codeforcesStats = await fetchCodeforcesStats(user.codeforcesUsername);
        const { ratingHistory, ...cfData } = codeforcesStats;
        dsaUpdates.codeforces = { ...cfData, ratingHistory: ratingHistory?.slice(-50) || [] };
        syncedPlatforms.push('Codeforces');
      } catch (error) {
        errors.push(`Codeforces: ${error.message}`);
      }
    }

    if (Object.keys(dsaUpdates).length > 0) {
      await DsaStats.findOneAndUpdate(
        { userId: user._id },
        { $set: { ...dsaUpdates, lastSyncedAt: new Date() }, $setOnInsert: { userId: user._id } },
        { upsert: true, returnDocument: 'after' }
      );
    }
  }

  const platformFetchers = [
    { field: 'hackerrankUsername', key: 'hackerrank', label: 'HackerRank', deltaField: 'totalStars', fn: fetchHackerRankStats },
    { field: 'codechefUsername', key: 'codechef', label: 'CodeChef', deltaField: 'problemsSolved', fn: fetchCodeChefStats },
    { field: 'kaggleUsername', key: 'kaggle', label: 'Kaggle', deltaField: null, fn: fetchKaggleStats },
    { field: 'huggingfaceUsername', key: 'huggingface', label: 'Hugging Face', deltaField: 'modelsPublished', fn: fetchHuggingfaceStats },
  ];

  const platformUpdates = {};
  await Promise.allSettled(platformFetchers.map(async ({ field, key, label, deltaField, fn }) => {
    if (!user[field]) return;

    try {
      const stats = await fn(user[field]);

      if (deltaField) {
        const dailyActivity = appendDailyDelta(
          existingPlatformStats?.[key]?.dailyActivity,
          toSafeNumber(existingPlatformStats?.[key]?.[deltaField]),
          toSafeNumber(stats?.[deltaField])
        );

        platformUpdates[key] = { ...stats, dailyActivity };
      } else {
        platformUpdates[key] = stats;
      }

      syncedPlatforms.push(label);
    } catch (error) {
      errors.push(`${label}: ${error.message}`);
    }
  }));

  if (Object.keys(platformUpdates).length > 0) {
    await PlatformStats.findOneAndUpdate(
      { userId: user._id },
      { $set: { ...platformUpdates, lastSyncedAt: new Date() }, $setOnInsert: { userId: user._id } },
      { upsert: true, returnDocument: 'after' }
    );
  }

  try {
    const platformData = await buildPlatformData(user._id);
    const scoreResult = computeDevScore({
      archetype: user.archetype,
      secondaryArchetype: user.secondaryArchetype,
      platformData,
    });

    await persistScore(user._id, scoreResult);
  } catch (error) {
    errors.push(`DevScore recompute: ${error.message}`);
  }

  return {
    userId: user._id,
    syncedPlatforms,
    errors,
  };
}

export async function syncSingleUser(userId, { invalidateLeaderboard = true } = {}) {
  const user = await User.findById(userId).select(`+githubAccessToken ${SYNC_USER_SELECT}`);

  if (!user) {
    throw new Error('User not found');
  }

  const result = await syncUserDocument(user);

  if (invalidateLeaderboard) {
    await invalidateLeaderboardCache();
  }

  return result;
}

export async function runGlobalSync({ onProgress } = {}) {
  const users = await User.find(CONNECTED_USER_FILTER).select(`+githubAccessToken ${SYNC_USER_SELECT}`);
  const totalTargets = users.length;

  if (totalTargets === 0) {
    return {
      totalTargets: 0,
      processedTargets: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }

  let nextIndex = 0;
  let processedTargets = 0;
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= users.length) {
        return;
      }

      const user = users[currentIndex];

      try {
        const result = await syncUserDocument(user);

        if (result.errors.length > 0) {
          errorCount += 1;
          errors.push({
            userId: user._id,
            message: result.errors.join('; '),
          });
        } else {
          successCount += 1;
        }
      } catch (error) {
        errorCount += 1;
        errors.push({ userId: user._id, message: error.message });
      } finally {
        processedTargets += 1;

        if (onProgress) {
          await onProgress({
            totalTargets,
            processedTargets,
            successCount,
            errorCount,
          });
        }
      }
    }
  }

  const workerCount = Math.min(GLOBAL_SYNC_CONCURRENCY, users.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  await invalidateLeaderboardCache();

  return {
    totalTargets,
    processedTargets,
    successCount,
    errorCount,
    errors: errors.slice(0, 25),
  };
}
