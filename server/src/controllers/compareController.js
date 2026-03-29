import mongoose from 'mongoose';
import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import axios from 'axios';

// ─── Helper: resolve user param ──────────────────
async function resolveUser(param) {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return await User.findById(param).select('displayName githubUsername archetype');
  }
  return await User.findOne({
    displayName: { $regex: new RegExp(`^${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  }).select('displayName githubUsername archetype');
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

  const [user1, user2] = await Promise.all([
    resolveUser(userId1),
    resolveUser(userId2),
  ]);

  if (!user1 || !user2) throw new AppError('One or both users not found', 404);

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

  // Build v2 pillar-based radar chart (the 5 scoring pillars)
  const pillarNames = ['problemSolving', 'building', 'community', 'consistency', 'specialization'];
  const pillarLabels = {
    problemSolving: 'Problem Solving',
    building: 'Building & Shipping',
    community: 'Community',
    consistency: 'Consistency',
    specialization: 'Specialization',
  };

  const radarData = pillarNames.map((pillar) => ({
    metric: pillarLabels[pillar],
    user1: score1?.breakdown?.[pillar]?.percentile || 0,
    user2: score2?.breakdown?.[pillar]?.percentile || 0,
  }));

  // Count connected platforms per user
  const countPlatforms = (u) => [
    u?.githubUsername, u?.leetcodeUsername, u?.codeforcesUsername,
    u?.hackerrankUsername, u?.codechefUsername, u?.kaggleUsername, u?.gfgUsername,
    u?.atcoderUsername, u?.stackoverflowUserId, u?.hackerEarthUsername,
    u?.huggingfaceUsername, u?.tryhackmeUsername, u?.codesignalUsername,
    u?.devtoUsername, u?.gitlabUsername,
  ].filter(Boolean).length;

  res.json({
    success: true,
    data: {
      user1: {
        displayName: user1.displayName,
        archetype: user1.archetype || 'none',
        devScore: score1?.score || 0,
        maxScore: 1000,
        pillars: score1?.breakdown || null,
        connectedPlatforms: countPlatforms(user1),
        githubStats: github1,
        dsaStats: dsa1,
        hasPortfolio: !!(portfolio1?.isPublic),
      },
      user2: {
        displayName: user2.displayName,
        archetype: user2.archetype || 'none',
        devScore: score2?.score || 0,
        maxScore: 1000,
        pillars: score2?.breakdown || null,
        connectedPlatforms: countPlatforms(user2),
        githubStats: github2,
        dsaStats: dsa2,
        hasPortfolio: !!(portfolio2?.isPublic),
      },
      sharedRepos,
      radarData,
    },
  });
});
