import User from '../models/User.js';
import Profile from '../models/Profile.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ─── Search Developers ───────────────────────────
export const searchDevelopers = asyncHandler(async (req, res) => {
  const { name, techStack, college, minScore } = req.query;

  // Build profile filter
  const profileFilter = { isPublic: true };

  if (college) {
    profileFilter.college = { $regex: college, $options: 'i' };
  }

  if (techStack) {
    const techs = techStack.split(',').map((t) => t.trim());
    profileFilter.techStack = { $in: techs };
  }

  // Get matching profiles
  let profiles = await Profile.find(profileFilter).select('userId techStack college avatarUrl');
  const profileUserIds = profiles.map((p) => p.userId);

  // Filter by user name
  let userFilter = { _id: { $in: profileUserIds } };
  if (name) {
    userFilter.displayName = { $regex: name, $options: 'i' };
  }

  const users = await User.find(userFilter).select('displayName email');
  const matchedUserIds = users.map((u) => u._id.toString());

  // Get latest scores
  const scores = await DevScore.aggregate([
    { $match: { userId: { $in: users.map((u) => u._id) } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$userId', overallScore: { $first: '$overallScore' } } },
  ]);

  // Get portfolio status
  const portfolios = await PortfolioCode.find({
    userId: { $in: users.map((u) => u._id) },
    isPublic: true,
  }).select('userId');
  const portfolioSet = new Set(portfolios.map((p) => p.userId.toString()));

  const scoreMap = new Map(scores.map((s) => [s._id.toString(), s.overallScore]));
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  let results = users.map((user) => {
    const profile = profileMap.get(user._id.toString());
    const score = scoreMap.get(user._id.toString()) || 0;
    return {
      userId: user._id,
      displayName: user.displayName,
      devScore: score,
      techStack: profile?.techStack || [],
      college: profile?.college || '',
      hasPortfolio: portfolioSet.has(user._id.toString()),
    };
  });

  // Filter by minimum score
  if (minScore) {
    results = results.filter((r) => r.devScore >= parseInt(minScore, 10));
  }

  // Sort by score descending
  results.sort((a, b) => b.devScore - a.devScore);

  res.json({ success: true, data: results });
});
