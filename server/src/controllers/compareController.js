import mongoose from 'mongoose';
import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import Profile from '../models/Profile.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { isOwner } from '../utils/privacyAccess.js';
import axios from 'axios';

const COMPARE_MODES = new Set([
  'devscore',
  'github',
  'leetcode',
  'codeforces',
  'hackerrank',
  'codechef',
  'kaggle',
  'huggingface',
]);

const MODE_LABELS = {
  devscore: 'DevFolio Score',
  github: 'GitHub',
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  hackerrank: 'HackerRank',
  codechef: 'CodeChef',
  kaggle: 'Kaggle',
  huggingface: 'Hugging Face',
};

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scaleLinear(value, min, max) {
  const v = toNumber(value);
  if (max <= min) return 0;
  return clamp(((v - min) / (max - min)) * 100, 0, 100);
}

function scaleInverse(value, best, worst) {
  const v = toNumber(value);
  if (worst <= best) return 0;
  return clamp(((worst - v) / (worst - best)) * 100, 0, 100);
}

function scaleLog(value, fullAt) {
  const v = Math.max(0, toNumber(value));
  const cap = Math.max(1, toNumber(fullAt, 1));
  return clamp((Math.log1p(v) / Math.log1p(cap)) * 100, 0, 100);
}

function parseStarCount(value) {
  if (typeof value === 'number') return Math.max(0, value);
  const str = String(value || '');
  const direct = parseInt(str, 10);
  if (Number.isFinite(direct) && direct > 0) return direct;
  return (str.match(/★/g) || []).length;
}

function formatInteger(value) {
  return Math.round(toNumber(value)).toLocaleString();
}

function activityDaysInWindow(series = [], days = 90) {
  if (!Array.isArray(series) || series.length === 0) return 0;
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days + 1);

  let count = 0;
  for (const entry of series) {
    const dateStr = entry?.date;
    if (!dateStr) continue;
    const day = new Date(`${dateStr}T00:00:00.000Z`);
    if (Number.isNaN(day.getTime())) continue;
    if (day >= cutoff && toNumber(entry?.count) > 0) count += 1;
  }
  return count;
}

function platformConnected(user, mode) {
  if (mode === 'devscore') return true;
  const map = {
    github: 'githubUsername',
    leetcode: 'leetcodeUsername',
    codeforces: 'codeforcesUsername',
    hackerrank: 'hackerrankUsername',
    codechef: 'codechefUsername',
    kaggle: 'kaggleUsername',
    huggingface: 'huggingfaceUsername',
  };

  const field = map[mode];
  return Boolean(field && user?.[field]);
}

function buildDevscoreRadar(score1, score2) {
  const pillarNames = ['problemSolving', 'building', 'community', 'consistency', 'specialization'];
  const pillarLabels = {
    problemSolving: 'Problem Solving',
    building: 'Building & Shipping',
    community: 'Community',
    consistency: 'Consistency',
    specialization: 'Specialization',
  };

  return pillarNames.map((pillar) => ({
    metric: pillarLabels[pillar],
    user1: score1?.breakdown?.[pillar]?.percentile || 0,
    user2: score2?.breakdown?.[pillar]?.percentile || 0,
  }));
}

function buildPlatformRadar(mode, { github1, github2, dsa1, dsa2, platform1, platform2 }) {
  if (mode === 'github') {
    const contributions1 = toNumber(github1?.totalContributionsLastYear || github1?.totalContributionsAllTime);
    const contributions2 = toNumber(github2?.totalContributionsLastYear || github2?.totalContributionsAllTime);
    const stars1 = toNumber(github1?.starsReceived);
    const stars2 = toNumber(github2?.starsReceived);
    const prs1 = toNumber(github1?.pullRequestsMerged || github1?.pullRequests);
    const prs2 = toNumber(github2?.pullRequestsMerged || github2?.pullRequests);
    const followers1 = toNumber(github1?.followers);
    const followers2 = toNumber(github2?.followers);
    const streak1 = toNumber(github1?.longestStreak || github1?.currentStreak);
    const streak2 = toNumber(github2?.longestStreak || github2?.currentStreak);

    return [
      { metric: 'Contributions', user1: scaleLog(contributions1, 2500), user2: scaleLog(contributions2, 2500) },
      { metric: 'Stars', user1: scaleLog(stars1, 1500), user2: scaleLog(stars2, 1500) },
      { metric: 'Merged PRs', user1: scaleLog(prs1, 300), user2: scaleLog(prs2, 300) },
      { metric: 'Followers', user1: scaleLog(followers1, 600), user2: scaleLog(followers2, 600) },
      { metric: 'Streak', user1: scaleLinear(streak1, 7, 180), user2: scaleLinear(streak2, 7, 180) },
    ];
  }

  if (mode === 'leetcode') {
    const lc1 = dsa1?.leetcode || {};
    const lc2 = dsa2?.leetcode || {};
    const active1 = activityDaysInWindow(lc1.dailyActivity, 90) || toNumber(lc1.activeDays);
    const active2 = activityDaysInWindow(lc2.dailyActivity, 90) || toNumber(lc2.activeDays);

    return [
      { metric: 'Contest Rating', user1: scaleLinear(lc1.contestRating, 1100, 2500), user2: scaleLinear(lc2.contestRating, 1100, 2500) },
      { metric: 'Solved', user1: scaleLog(lc1.totalSolved, 900), user2: scaleLog(lc2.totalSolved, 900) },
      { metric: 'Hard Solved', user1: scaleLinear(lc1.hardSolved, 8, 120), user2: scaleLinear(lc2.hardSolved, 8, 120) },
      { metric: 'Acceptance', user1: scaleLinear(lc1.acceptanceRate, 25, 75), user2: scaleLinear(lc2.acceptanceRate, 25, 75) },
      { metric: 'Consistency', user1: scaleLinear(active1, 5, 90), user2: scaleLinear(active2, 5, 90) },
    ];
  }

  if (mode === 'codeforces') {
    const cf1 = dsa1?.codeforces || {};
    const cf2 = dsa2?.codeforces || {};
    const active1 = activityDaysInWindow(cf1.dailySubmissions, 90);
    const active2 = activityDaysInWindow(cf2.dailySubmissions, 90);

    return [
      { metric: 'Current Rating', user1: scaleLinear(cf1.currentRating || cf1.rating, 1000, 2500), user2: scaleLinear(cf2.currentRating || cf2.rating, 1000, 2500) },
      { metric: 'Peak Rating', user1: scaleLinear(cf1.maxRating, 1200, 2800), user2: scaleLinear(cf2.maxRating, 1200, 2800) },
      { metric: 'Contests', user1: scaleLog(cf1.contestsParticipated, 80), user2: scaleLog(cf2.contestsParticipated, 80) },
      { metric: 'Solved', user1: scaleLog(cf1.totalSolved, 900), user2: scaleLog(cf2.totalSolved, 900) },
      { metric: 'Recent Activity', user1: scaleLinear(active1, 5, 80), user2: scaleLinear(active2, 5, 80) },
    ];
  }

  if (mode === 'hackerrank') {
    const hr1 = platform1?.hackerrank || {};
    const hr2 = platform2?.hackerrank || {};

    return [
      { metric: 'Stars', user1: scaleLinear(hr1.totalStars, 5, 70), user2: scaleLinear(hr2.totalStars, 5, 70) },
      { metric: 'Badges', user1: scaleLog(hr1.totalBadges, 35), user2: scaleLog(hr2.totalBadges, 35) },
      { metric: 'Level', user1: scaleLinear(hr1.level, 1, 10), user2: scaleLinear(hr2.level, 1, 10) },
      { metric: 'Contests', user1: scaleLog(hr1.contestsParticipated, 30), user2: scaleLog(hr2.contestsParticipated, 30) },
      { metric: 'Contest Rank', user1: scaleInverse(hr1.contestRanking, 1, 200000), user2: scaleInverse(hr2.contestRanking, 1, 200000) },
    ];
  }

  if (mode === 'codechef') {
    const cc1 = platform1?.codechef || {};
    const cc2 = platform2?.codechef || {};

    return [
      { metric: 'Current Rating', user1: scaleLinear(cc1.currentRating, 1100, 2400), user2: scaleLinear(cc2.currentRating, 1100, 2400) },
      { metric: 'Stars', user1: scaleLinear(parseStarCount(cc1.stars || cc1.starsCount), 1, 7), user2: scaleLinear(parseStarCount(cc2.stars || cc2.starsCount), 1, 7) },
      { metric: 'Problems Solved', user1: scaleLog(cc1.problemsSolved, 600), user2: scaleLog(cc2.problemsSolved, 600) },
      { metric: 'Contest Count', user1: scaleLog(cc1.contestCount, 120), user2: scaleLog(cc2.contestCount, 120) },
      { metric: 'Global Rank', user1: scaleInverse(cc1.globalRank, 1, 150000), user2: scaleInverse(cc2.globalRank, 1, 150000) },
    ];
  }

  if (mode === 'kaggle') {
    const kg1 = platform1?.kaggle || {};
    const kg2 = platform2?.kaggle || {};
    const medals1 = toNumber(kg1.competitionMedals?.total) + toNumber(kg1.notebookMedals?.total) + toNumber(kg1.datasetMedals?.total);
    const medals2 = toNumber(kg2.competitionMedals?.total) + toNumber(kg2.notebookMedals?.total) + toNumber(kg2.datasetMedals?.total);

    return [
      { metric: 'Global Rank', user1: scaleInverse(kg1.ranking, 1, 50000), user2: scaleInverse(kg2.ranking, 1, 50000) },
      { metric: 'Medals', user1: scaleLog(medals1, 40), user2: scaleLog(medals2, 40) },
      { metric: 'Notebook Votes', user1: scaleLog(kg1.notebookVotesReceived || kg1.notebookVotes, 1200), user2: scaleLog(kg2.notebookVotesReceived || kg2.notebookVotes, 1200) },
      { metric: 'Dataset Downloads', user1: scaleLog(kg1.datasetDownloads, 3000), user2: scaleLog(kg2.datasetDownloads, 3000) },
      { metric: 'Followers', user1: scaleLog(kg1.followers, 2000), user2: scaleLog(kg2.followers, 2000) },
    ];
  }

  if (mode === 'huggingface') {
    const hf1 = platform1?.huggingface || {};
    const hf2 = platform2?.huggingface || {};
    const downloads1 = toNumber(hf1.totalDownloads) || (toNumber(hf1.modelDownloads) + toNumber(hf1.datasetDownloads));
    const downloads2 = toNumber(hf2.totalDownloads) || (toNumber(hf2.modelDownloads) + toNumber(hf2.datasetDownloads));

    return [
      { metric: 'Models', user1: scaleLog(hf1.modelsPublished, 40), user2: scaleLog(hf2.modelsPublished, 40) },
      { metric: 'Datasets', user1: scaleLog(hf1.datasetsPublished, 40), user2: scaleLog(hf2.datasetsPublished, 40) },
      { metric: 'Downloads', user1: scaleLog(downloads1, 500000), user2: scaleLog(downloads2, 500000) },
      { metric: 'Likes', user1: scaleLog(hf1.totalLikes || hf1.spacesLikes, 3000), user2: scaleLog(hf2.totalLikes || hf2.spacesLikes, 3000) },
      { metric: 'Followers', user1: scaleLog(hf1.followers, 2000), user2: scaleLog(hf2.followers, 2000) },
    ];
  }

  return [];
}

function buildCompareModeSummary(mode, { user1, user2, github1, github2, dsa1, dsa2, platform1, platform2, score1, score2 }) {
  if (mode === 'devscore') {
    const value1 = toNumber(score1?.score);
    const value2 = toNumber(score2?.score);
    return {
      mode,
      label: MODE_LABELS[mode],
      metricLabel: 'DevScore',
      user1MetricValue: value1,
      user2MetricValue: value2,
      user1MetricDisplay: `${formatInteger(value1)} DevScore`,
      user2MetricDisplay: `${formatInteger(value2)} DevScore`,
      user1Connected: true,
      user2Connected: true,
      note: 'Comparing full DevFolio score pillars.',
      user1PlatformScore: null,
      user2PlatformScore: null,
    };
  }

  const connected1 = platformConnected(user1, mode);
  const connected2 = platformConnected(user2, mode);
  const scoreBased1 = toNumber(score1?.platformScores?.[mode]?.score);
  const scoreBased2 = toNumber(score2?.platformScores?.[mode]?.score);

  if (mode === 'github') {
    const contributions1 = toNumber(github1?.totalContributionsLastYear || github1?.totalContributionsAllTime);
    const contributions2 = toNumber(github2?.totalContributionsLastYear || github2?.totalContributionsAllTime);

    return {
      mode,
      label: MODE_LABELS[mode],
      metricLabel: 'Contributions (Last Year)',
      user1MetricValue: contributions1,
      user2MetricValue: contributions2,
      user1MetricDisplay: `${formatInteger(contributions1)} contributions`,
      user2MetricDisplay: `${formatInteger(contributions2)} contributions`,
      user1Connected: connected1,
      user2Connected: connected2,
      note: 'Comparing GitHub productivity and collaboration signal.',
      user1PlatformScore: scoreBased1,
      user2PlatformScore: scoreBased2,
    };
  }

  if (mode === 'leetcode') {
    const rank1 = toNumber(dsa1?.leetcode?.contestGlobalRanking);
    const rank2 = toNumber(dsa2?.leetcode?.contestGlobalRanking);
    const rating1 = toNumber(dsa1?.leetcode?.contestRating);
    const rating2 = toNumber(dsa2?.leetcode?.contestRating);
    const solved1 = toNumber(dsa1?.leetcode?.totalSolved);
    const solved2 = toNumber(dsa2?.leetcode?.totalSolved);

    const user1MetricDisplay = rank1 > 0
      ? `#${formatInteger(rank1)} global rank`
      : rating1 > 0 ? `Rating ${formatInteger(rating1)}` : `${formatInteger(solved1)} solved`;
    const user2MetricDisplay = rank2 > 0
      ? `#${formatInteger(rank2)} global rank`
      : rating2 > 0 ? `Rating ${formatInteger(rating2)}` : `${formatInteger(solved2)} solved`;

    return {
      mode,
      label: MODE_LABELS[mode],
      metricLabel: 'Contest Global Rank / Rating',
      user1MetricValue: rank1 > 0 ? rank1 : rating1 || solved1,
      user2MetricValue: rank2 > 0 ? rank2 : rating2 || solved2,
      user1MetricDisplay,
      user2MetricDisplay,
      user1Connected: connected1,
      user2Connected: connected2,
      note: 'Comparing LeetCode contest and problem-solving performance.',
      user1PlatformScore: scoreBased1,
      user2PlatformScore: scoreBased2,
    };
  }

  if (mode === 'codeforces') {
    const rating1 = toNumber(dsa1?.codeforces?.currentRating || dsa1?.codeforces?.rating);
    const rating2 = toNumber(dsa2?.codeforces?.currentRating || dsa2?.codeforces?.rating);

    return {
      mode,
      label: MODE_LABELS[mode],
      metricLabel: 'Current Rating',
      user1MetricValue: rating1,
      user2MetricValue: rating2,
      user1MetricDisplay: rating1 > 0 ? `Rating ${formatInteger(rating1)}` : 'No rating',
      user2MetricDisplay: rating2 > 0 ? `Rating ${formatInteger(rating2)}` : 'No rating',
      user1Connected: connected1,
      user2Connected: connected2,
      note: 'Comparing Codeforces rating and contest consistency.',
      user1PlatformScore: scoreBased1,
      user2PlatformScore: scoreBased2,
    };
  }

  if (mode === 'hackerrank') {
    const rank1 = toNumber(platform1?.hackerrank?.contestRanking);
    const rank2 = toNumber(platform2?.hackerrank?.contestRanking);
    const stars1 = toNumber(platform1?.hackerrank?.totalStars);
    const stars2 = toNumber(platform2?.hackerrank?.totalStars);

    return {
      mode,
      label: MODE_LABELS[mode],
      metricLabel: 'Contest Rank / Stars',
      user1MetricValue: rank1 > 0 ? rank1 : stars1,
      user2MetricValue: rank2 > 0 ? rank2 : stars2,
      user1MetricDisplay: rank1 > 0 ? `#${formatInteger(rank1)} contest rank` : `${formatInteger(stars1)} stars`,
      user2MetricDisplay: rank2 > 0 ? `#${formatInteger(rank2)} contest rank` : `${formatInteger(stars2)} stars`,
      user1Connected: connected1,
      user2Connected: connected2,
      note: 'Comparing HackerRank badges, stars, and contest quality.',
      user1PlatformScore: scoreBased1,
      user2PlatformScore: scoreBased2,
    };
  }

  if (mode === 'codechef') {
    const rank1 = toNumber(platform1?.codechef?.globalRank);
    const rank2 = toNumber(platform2?.codechef?.globalRank);
    const rating1 = toNumber(platform1?.codechef?.currentRating);
    const rating2 = toNumber(platform2?.codechef?.currentRating);

    return {
      mode,
      label: MODE_LABELS[mode],
      metricLabel: 'Global Rank / Rating',
      user1MetricValue: rank1 > 0 ? rank1 : rating1,
      user2MetricValue: rank2 > 0 ? rank2 : rating2,
      user1MetricDisplay: rank1 > 0 ? `#${formatInteger(rank1)} global rank` : `Rating ${formatInteger(rating1)}`,
      user2MetricDisplay: rank2 > 0 ? `#${formatInteger(rank2)} global rank` : `Rating ${formatInteger(rating2)}`,
      user1Connected: connected1,
      user2Connected: connected2,
      note: 'Comparing CodeChef rank and rating profile.',
      user1PlatformScore: scoreBased1,
      user2PlatformScore: scoreBased2,
    };
  }

  if (mode === 'kaggle') {
    const rank1 = toNumber(platform1?.kaggle?.ranking);
    const rank2 = toNumber(platform2?.kaggle?.ranking);
    const medals1 = toNumber(platform1?.kaggle?.competitionMedals?.total) + toNumber(platform1?.kaggle?.notebookMedals?.total) + toNumber(platform1?.kaggle?.datasetMedals?.total);
    const medals2 = toNumber(platform2?.kaggle?.competitionMedals?.total) + toNumber(platform2?.kaggle?.notebookMedals?.total) + toNumber(platform2?.kaggle?.datasetMedals?.total);

    return {
      mode,
      label: MODE_LABELS[mode],
      metricLabel: 'Global Rank / Medal Impact',
      user1MetricValue: rank1 > 0 ? rank1 : medals1,
      user2MetricValue: rank2 > 0 ? rank2 : medals2,
      user1MetricDisplay: rank1 > 0 ? `#${formatInteger(rank1)} global rank` : `${formatInteger(medals1)} medals`,
      user2MetricDisplay: rank2 > 0 ? `#${formatInteger(rank2)} global rank` : `${formatInteger(medals2)} medals`,
      user1Connected: connected1,
      user2Connected: connected2,
      note: 'Comparing Kaggle rank, medals, and dataset/notebook impact.',
      user1PlatformScore: scoreBased1,
      user2PlatformScore: scoreBased2,
    };
  }

  if (mode === 'huggingface') {
    const downloads1 = toNumber(platform1?.huggingface?.totalDownloads) || (toNumber(platform1?.huggingface?.modelDownloads) + toNumber(platform1?.huggingface?.datasetDownloads));
    const downloads2 = toNumber(platform2?.huggingface?.totalDownloads) || (toNumber(platform2?.huggingface?.modelDownloads) + toNumber(platform2?.huggingface?.datasetDownloads));

    return {
      mode,
      label: MODE_LABELS[mode],
      metricLabel: 'Total Downloads',
      user1MetricValue: downloads1,
      user2MetricValue: downloads2,
      user1MetricDisplay: `${formatInteger(downloads1)} downloads`,
      user2MetricDisplay: `${formatInteger(downloads2)} downloads`,
      user1Connected: connected1,
      user2Connected: connected2,
      note: 'Comparing model/dataset publishing and adoption impact.',
      user1PlatformScore: scoreBased1,
      user2PlatformScore: scoreBased2,
    };
  }

  return {
    mode,
    label: MODE_LABELS[mode] || 'Platform',
    metricLabel: 'Platform metric',
    user1MetricValue: 0,
    user2MetricValue: 0,
    user1MetricDisplay: 'N/A',
    user2MetricDisplay: 'N/A',
    user1Connected: connected1,
    user2Connected: connected2,
    note: 'Platform comparison unavailable.',
    user1PlatformScore: scoreBased1,
    user2PlatformScore: scoreBased2,
  };
}

// ─── Helper: resolve user param ──────────────────
async function resolveUser(param) {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return await User.findById(param).select([
      'displayName',
      'publicHandle',
      'archetype',
      'githubUsername',
      'leetcodeUsername',
      'codeforcesUsername',
      'hackerrankUsername',
      'codechefUsername',
      'kaggleUsername',
      'huggingfaceUsername',
    ].join(' '));
  }
  const normalizedHandle = String(param || '').trim().toLowerCase();
  const isHandleLike = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(normalizedHandle);

  if (isHandleLike) {
    const byHandle = await User.findOne({ publicHandle: normalizedHandle }).select([
      'displayName',
      'publicHandle',
      'archetype',
      'githubUsername',
      'leetcodeUsername',
      'codeforcesUsername',
      'hackerrankUsername',
      'codechefUsername',
      'kaggleUsername',
      'huggingfaceUsername',
    ].join(' '));

    if (byHandle) {
      return byHandle;
    }
  }

  return await User.findOne({
    displayName: { $regex: new RegExp(`^${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  }).select([
    'displayName',
    'publicHandle',
    'archetype',
    'githubUsername',
    'leetcodeUsername',
    'codeforcesUsername',
    'hackerrankUsername',
    'codechefUsername',
    'kaggleUsername',
    'huggingfaceUsername',
  ].join(' '));
}

// ─── Helper: fetch repo names ────────────────────
async function fetchRepoNames(githubUsername) {
  if (!githubUsername) return [];
  try {
    const res = await axios.get(`https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`, { timeout: 10000 });
    return res.data.map((r) => r.name.toLowerCase());
  } catch {
    return [];
  }
}

// ─── Compare Two Developers (v2 — Pillar-Based) ──
export const compareDevelopers = asyncHandler(async (req, res) => {
  const { userId1, userId2 } = req.params;
  const requestedMode = String(req.query.platform || 'devscore').toLowerCase();
  const mode = COMPARE_MODES.has(requestedMode) ? requestedMode : 'devscore';

  const [user1, user2] = await Promise.all([
    resolveUser(userId1),
    resolveUser(userId2),
  ]);

  if (!user1 || !user2) throw new AppError('One or both users not found', 404);

  const [resolvedHandle1, resolvedHandle2] = await Promise.all([
    User.ensurePublicHandle(user1),
    User.ensurePublicHandle(user2),
  ]);

  user1.publicHandle = user1.publicHandle || resolvedHandle1 || null;
  user2.publicHandle = user2.publicHandle || resolvedHandle2 || null;

  const [profile1, profile2] = await Promise.all([
    Profile.findOne({ userId: user1._id }).select('isPublic').lean(),
    Profile.findOne({ userId: user2._id }).select('isPublic').lean(),
  ]);

  const canReadUser1 = Boolean(profile1?.isPublic) || isOwner(req.user, user1._id);
  const canReadUser2 = Boolean(profile2?.isPublic) || isOwner(req.user, user2._id);

  if (!canReadUser1 || !canReadUser2) {
    throw new AppError('One or both profiles are private', 403);
  }

  const [
    github1, github2,
    dsa1, dsa2,
    platform1, platform2,
    score1, score2,
    portfolio1, portfolio2,
  ] = await Promise.all([
    GithubStats.findOne({ userId: user1._id }).lean(),
    GithubStats.findOne({ userId: user2._id }).lean(),
    DsaStats.findOne({ userId: user1._id }).lean(),
    DsaStats.findOne({ userId: user2._id }).lean(),
    PlatformStats.findOne({ userId: user1._id }).lean(),
    PlatformStats.findOne({ userId: user2._id }).lean(),
    DevScore.findOne({ userId: user1._id }).sort({ createdAt: -1 }).lean(),
    DevScore.findOne({ userId: user2._id }).sort({ createdAt: -1 }).lean(),
    PortfolioCode.findOne({ userId: user1._id }).lean(),
    PortfolioCode.findOne({ userId: user2._id }).lean(),
  ]);

  // Shared repository detection
  const [repos1, repos2] = await Promise.all([
    fetchRepoNames(user1.githubUsername),
    fetchRepoNames(user2.githubUsername),
  ]);
  const repos2Set = new Set(repos2);
  const sharedRepos = repos1.filter((name) => repos2Set.has(name));

  const radarData = mode === 'devscore'
    ? buildDevscoreRadar(score1, score2)
    : buildPlatformRadar(mode, { github1, github2, dsa1, dsa2, platform1, platform2 });

  const compareMode = buildCompareModeSummary(mode, {
    user1,
    user2,
    github1,
    github2,
    dsa1,
    dsa2,
    platform1,
    platform2,
    score1,
    score2,
  });

  // Count connected platforms per user
  const countPlatforms = (u) => [
    u?.githubUsername,
    u?.leetcodeUsername,
    u?.codeforcesUsername,
    u?.hackerrankUsername,
    u?.codechefUsername,
    u?.kaggleUsername,
    u?.huggingfaceUsername,
  ].filter(Boolean).length;

  res.json({
    success: true,
    data: {
      user1: {
        displayName: user1.displayName,
        publicHandle: user1.publicHandle || null,
        archetype: user1.archetype || 'none',
        devScore: score1?.score || 0,
        maxScore: 1000,
        pillars: score1?.breakdown || null,
        connectedPlatforms: countPlatforms(user1),
        githubStats: github1,
        dsaStats: dsa1,
        platformStats: platform1,
        hasPortfolio: !!(portfolio1?.isPublic),
      },
      user2: {
        displayName: user2.displayName,
        publicHandle: user2.publicHandle || null,
        archetype: user2.archetype || 'none',
        devScore: score2?.score || 0,
        maxScore: 1000,
        pillars: score2?.breakdown || null,
        connectedPlatforms: countPlatforms(user2),
        githubStats: github2,
        dsaStats: dsa2,
        platformStats: platform2,
        hasPortfolio: !!(portfolio2?.isPublic),
      },
      compareMode,
      sharedRepos,
      radarData,
    },
  });
});
