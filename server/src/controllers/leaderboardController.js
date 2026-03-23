import DevScore from '../models/DevScore.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ─── Get Global Leaderboard ──────────────────────
export const getLeaderboard = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const college = req.query.college;

  // Get latest score per user via aggregation
  const pipeline = [
    { $sort: { userId: 1, createdAt: -1 } },
    { $group: {
      _id: '$userId',
      overallScore: { $first: '$overallScore' },
      breakdown: { $first: '$breakdown' },
      computedAt: { $first: '$computedAt' },
    }},
    { $sort: { overallScore: -1 } },
  ];

  let scores = await DevScore.aggregate(pipeline);

  // Get user info and filter by college if needed
  const userIds = scores.map((s) => s._id);
  const users = await User.find({ _id: { $in: userIds } }).select('displayName email');
  const profiles = await Profile.find({ userId: { $in: userIds } }).select('userId college avatarUrl');
  const portfolios = await PortfolioCode.find({ userId: { $in: userIds }, isPublic: true }).select('userId');

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const portfolioSet = new Set(portfolios.map((p) => p.userId.toString()));

  let rankings = scores.map((s, idx) => {
    const user = userMap.get(s._id.toString());
    const profile = profileMap.get(s._id.toString());
    return {
      rank: idx + 1,
      userId: s._id,
      displayName: user?.displayName || 'Unknown',
      overallScore: s.overallScore,
      college: profile?.college || '',
      avatarUrl: profile?.avatarUrl || null,
      hasPortfolio: portfolioSet.has(s._id.toString()),
    };
  });

  // Filter by college if specified
  if (college) {
    rankings = rankings.filter((r) =>
      r.college.toLowerCase().includes(college.toLowerCase())
    );
    // Re-rank after filtering
    rankings = rankings.map((r, idx) => ({ ...r, rank: idx + 1 }));
  }

  const totalItems = rankings.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedRankings = rankings.slice(skip, skip + limit);

  res.json({
    success: true,
    data: {
      rankings: paginatedRankings,
      totalPages,
      currentPage: page,
    },
  });
});

// ─── Get College Leaderboard ─────────────────────
export const getCollegeLeaderboard = asyncHandler(async (req, res) => {
  req.query.college = req.params.collegeName;
  return getLeaderboard(req, res);
});
