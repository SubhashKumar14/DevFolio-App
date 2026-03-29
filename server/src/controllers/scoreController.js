import User from '../models/User.js';
import DevScore from '../models/DevScore.js';
import PlatformStats from '../models/PlatformStats.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import { computeDevScore } from '../services/devscoreEngine.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const SCORE_RETENTION_LIMIT = 30;

function percentileIndex(sortedValues, percentile) {
  if (!sortedValues.length) return 0;
  const idx = Math.floor((sortedValues.length - 1) * percentile);
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, idx))];
}

/**
 * Build platformData map from a user's stored stats
 */
async function buildPlatformData(userId) {
  const platformData = {};

  // Fetch GitHub stats
  const githubStats = await GithubStats.findOne({ userId }).lean();
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

  // Fetch DSA stats (LeetCode, Codeforces)
  const dsaStats = await DsaStats.findOne({ userId }).lean();
  if (dsaStats) {
    if (dsaStats.leetcode) {
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
    if (dsaStats.codeforces) {
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
  }

  // Fetch additional platform stats if available
  const platformStats = await PlatformStats.findOne({ userId }).lean();
  if (platformStats) {
    const newPlatforms = ['hackerrank', 'codechef', 'kaggle', 'huggingface'];
    for (const p of newPlatforms) {
      if (platformStats[p] && Object.keys(platformStats[p]).length > 0) {
        platformData[p] = platformStats[p];
      }
    }
  }

  return platformData;
}

// ─── Compute DevScore for authenticated user ──────
export const computeScore = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const platformData = await buildPlatformData(user._id);
  const result = computeDevScore({
    archetype: user.archetype,
    secondaryArchetype: user.secondaryArchetype,
    platformData,
  });

  // Store the score
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

  // Retain only the latest N score entries per user
  const count = await DevScore.countDocuments({ userId: user._id });
  if (count > SCORE_RETENTION_LIMIT) {
    const oldest = await DevScore.find({ userId: user._id })
      .sort({ createdAt: 1 })
      .limit(count - SCORE_RETENTION_LIMIT)
      .select('_id');
    await DevScore.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
  }

  res.json({
    success: true,
    data: result,
  });
});

// ─── Get latest DevScore for a user ───────────────
export const getScore = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user._id;

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Try stored score first
  const latest = await DevScore.findOne({ userId }).sort({ createdAt: -1 }).lean();

  if (latest) {
    return res.json({
      success: true,
      data: {
        overallScore: latest.score,
        maxScore: 1000,
        rawScore: latest.rawScore ?? 0,
        weightedRawScore: latest.weightedRawScore ?? latest.rawScore ?? 0,
        archetype: latest.archetype,
        secondaryArchetype: latest.secondaryArchetype,
        domain: latest.domain || 'all_rounder',
        domainLabel: latest.domainLabel || 'All Rounder',
        connectedPlatforms: latest.connectedPlatforms || 0,
        pillars: latest.breakdown,
        platformScores: latest.platformScores || {},
        strengths: latest.strengths || [],
        improvements: latest.improvements || [],
        diagnostics: latest.diagnostics || {},
        createdAt: latest.createdAt,
      },
    });
  }

  // Compute fresh if no stored score
  const platformData = await buildPlatformData(userId);
  const result = computeDevScore({
    archetype: user.archetype,
    secondaryArchetype: user.secondaryArchetype,
    platformData,
  });

  res.json({
    success: true,
    data: result,
  });
});

// ─── Get DevScore history ─────────────────────────
export const getScoreHistory = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user._id;
  const limit = Math.min(parseInt(req.query.limit) || SCORE_RETENTION_LIMIT, SCORE_RETENTION_LIMIT);

  const history = await DevScore.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('score rawScore weightedRawScore breakdown archetype secondaryArchetype domain domainLabel connectedPlatforms strengths improvements diagnostics createdAt computedAt')
    .lean();

  res.json({
    success: true,
    data: history,
  });
});

// ─── Get Domain Benchmark (anonymous aggregate) ──
export const getScoreBenchmark = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user._id;

  const latest = await DevScore.findOne({ userId }).sort({ createdAt: -1 }).lean();
  if (!latest) {
    return res.json({
      success: true,
      data: null,
    });
  }

  const domain = latest.domain || 'all_rounder';
  const domainLabel = latest.domainLabel || 'All Rounder';

  const sample = await DevScore.find({ domain })
    .sort({ createdAt: -1 })
    .limit(500)
    .select('score')
    .lean();

  const scores = sample
    .map((entry) => Number(entry?.score))
    .filter((value) => Number.isFinite(value));

  if (scores.length === 0) {
    return res.json({
      success: true,
      data: {
        domain,
        domainLabel,
        userScore: latest.score,
        sampleSize: 0,
        averageScore: latest.score,
        medianScore: latest.score,
        p75Score: latest.score,
        percentile: 100,
      },
    });
  }

  const sortedScores = [...scores].sort((a, b) => a - b);
  const sum = sortedScores.reduce((acc, value) => acc + value, 0);
  const averageScore = Math.round(sum / sortedScores.length);
  const medianScore = Math.round(percentileIndex(sortedScores, 0.5));
  const p75Score = Math.round(percentileIndex(sortedScores, 0.75));
  const percentile = Math.round((sortedScores.filter((value) => value <= latest.score).length / sortedScores.length) * 100);

  res.json({
    success: true,
    data: {
      domain,
      domainLabel,
      userScore: latest.score,
      sampleSize: sortedScores.length,
      averageScore,
      medianScore,
      p75Score,
      percentile,
    },
  });
});
