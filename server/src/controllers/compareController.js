import mongoose from 'mongoose';
import User from '../models/User.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import axios from 'axios';

// Helper: resolve a user param (ObjectId or displayName) to a User document
async function resolveUser(param) {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return await User.findById(param).select('displayName githubUsername');
  }
  return await User.findOne({
    displayName: { $regex: new RegExp(`^${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  }).select('displayName githubUsername');
}

// Helper: fetch repo names for a GitHub user
async function fetchRepoNames(githubUsername) {
  if (!githubUsername) return [];
  try {
    const res = await axios.get(`https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`, { timeout: 10000 });
    return res.data.map((r) => r.name.toLowerCase());
  } catch {
    return [];
  }
}

// ─── Compare Two Developers ──────────────────────
export const compareDevelopers = asyncHandler(async (req, res) => {
  const { userId1, userId2 } = req.params;

  // Resolve by ObjectId OR displayName
  const [user1, user2] = await Promise.all([
    resolveUser(userId1),
    resolveUser(userId2),
  ]);

  if (!user1 || !user2) {
    throw new AppError('One or both users not found', 404);
  }

  const [
    github1, github2,
    dsa1, dsa2,
    score1, score2,
    portfolio1, portfolio2,
  ] = await Promise.all([
    GithubStats.findOne({ userId: user1._id }),
    GithubStats.findOne({ userId: user2._id }),
    DsaStats.findOne({ userId: user1._id }),
    DsaStats.findOne({ userId: user2._id }),
    DevScore.findOne({ userId: user1._id }).sort({ createdAt: -1 }),
    DevScore.findOne({ userId: user2._id }).sort({ createdAt: -1 }),
    PortfolioCode.findOne({ userId: user1._id }),
    PortfolioCode.findOne({ userId: user2._id }),
  ]);

  // Shared repository detection
  const [repos1, repos2] = await Promise.all([
    fetchRepoNames(user1.githubUsername),
    fetchRepoNames(user2.githubUsername),
  ]);
  const repos2Set = new Set(repos2);
  const sharedRepos = repos1.filter((name) => repos2Set.has(name));

  // Build radar chart data
  const radarData = [
    {
      metric: 'GitHub',
      user1: score1?.breakdown?.github?.score || 0,
      user2: score2?.breakdown?.github?.score || 0,
    },
    {
      metric: 'DSA',
      user1: score1?.breakdown?.dsa?.score || 0,
      user2: score2?.breakdown?.dsa?.score || 0,
    },
    {
      metric: 'Portfolio',
      user1: score1?.breakdown?.portfolio?.score || 0,
      user2: score2?.breakdown?.portfolio?.score || 0,
    },
    {
      metric: 'Projects',
      user1: Math.min((github1?.publicRepos || 0) * 2, 100),
      user2: Math.min((github2?.publicRepos || 0) * 2, 100),
    },
    {
      metric: 'Consistency',
      user1: Math.min((github1?.totalCommits || 0) / 5, 100),
      user2: Math.min((github2?.totalCommits || 0) / 5, 100),
    },
    {
      metric: 'Breadth',
      user1: Math.min(((dsa1?.leetcode?.totalSolved || 0) + (github1?.publicRepos || 0)) / 3, 100),
      user2: Math.min(((dsa2?.leetcode?.totalSolved || 0) + (github2?.publicRepos || 0)) / 3, 100),
    },
  ];

  res.json({
    success: true,
    data: {
      user1: {
        displayName: user1.displayName,
        devScore: score1?.overallScore || 0,
        githubStats: github1,
        dsaStats: dsa1,
        hasPortfolio: !!(portfolio1?.isPublic),
      },
      user2: {
        displayName: user2.displayName,
        devScore: score2?.overallScore || 0,
        githubStats: github2,
        dsaStats: dsa2,
        hasPortfolio: !!(portfolio2?.isPublic),
      },
      sharedRepos,
      radarData,
    },
  });
});
