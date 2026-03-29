import User from '../models/User.js';
import Profile from '../models/Profile.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ─── Search Developers ───────────────────────────
export const searchDevelopers = asyncHandler(async (req, res) => {
  const { name, techStack, college, minScore, archetype, sortBy = 'devScore' } = req.query;

  // Build profile filter
  const profileFilter = { isPublic: true };
  if (college) profileFilter.college = { $regex: college, $options: 'i' };
  if (techStack) {
    const techs = techStack.split(',').map((t) => t.trim());
    profileFilter.techStack = { $in: techs };
  }

  // Get matching profiles
  let profiles = await Profile.find(profileFilter).select('userId techStack college avatarUrl');
  const profileUserIds = profiles.map((p) => p.userId);

  // Filter by user name and archetype
  let userFilter = { _id: { $in: profileUserIds } };
  if (name) userFilter.displayName = { $regex: name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (archetype) {
    userFilter.$or = [{ archetype }, { secondaryArchetype: archetype }];
  }

  const users = await User.find(userFilter).select('displayName email archetype secondaryArchetype');

  // Get latest scores (DevScore v2 - field is 'score' now)
  const scores = await DevScore.aggregate([
    { $match: { userId: { $in: users.map((u) => u._id) } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$userId',
        score: { $first: '$score' },
        archetype: { $first: '$archetype' },
        secondaryArchetype: { $first: '$secondaryArchetype' },
        breakdown: { $first: '$breakdown' },
      },
    },
  ]);

  // Get portfolio status
  const portfolios = await PortfolioCode.find({
    userId: { $in: users.map((u) => u._id) },
    isPublic: true,
  }).select('userId');
  const portfolioSet = new Set(portfolios.map((p) => p.userId.toString()));

  const scoreMap = new Map(scores.map((s) => [s._id.toString(), s]));
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  let results = users.map((user) => {
    const profile = profileMap.get(user._id.toString());
    const scoreData = scoreMap.get(user._id.toString());
    return {
      userId: user._id,
      displayName: user.displayName,
      archetype: user.archetype || 'none',
      secondaryArchetype: user.secondaryArchetype || 'none',
      devScore: scoreData?.score || 0,
      pillars: scoreData?.breakdown || null,
      techStack: profile?.techStack || [],
      college: profile?.college || '',
      hasPortfolio: portfolioSet.has(user._id.toString()),
    };
  });

  // Filter by minimum score
  if (minScore) {
    results = results.filter((r) => r.devScore >= parseInt(minScore, 10));
  }

  // Sort
  if (sortBy === 'name') {
    results.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } else {
    results.sort((a, b) => b.devScore - a.devScore);
  }

  res.json({ success: true, data: results });
});
