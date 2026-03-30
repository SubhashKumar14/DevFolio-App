import User from '../models/User.js';
import Profile from '../models/Profile.js';
import DevScore from '../models/DevScore.js';
import PortfolioCode from '../models/PortfolioCode.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { normalizeSearchTerm } from '../utils/inputValidation.js';

// ─── Search Developers ───────────────────────────
export const searchDevelopers = asyncHandler(async (req, res) => {
  const { name, techStack, college, minScore, archetype, sortBy = 'devScore' } = req.query;
  const safeSortBy = sortBy === 'name' ? 'name' : 'devScore';

  // Build profile filter
  const profileFilter = { isPublic: true };
  const normalizedCollege = normalizeSearchTerm(college, { minLength: 1, maxLength: 80 });
  if (normalizedCollege) profileFilter.college = { $regex: normalizedCollege, $options: 'i' };
  if (techStack) {
    const techs = String(techStack)
      .split(',')
      .map((t) => t.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 10);
    profileFilter.techStack = { $in: techs };
  }

  // Get matching profiles
  let profiles = await Profile.find(profileFilter).select('userId techStack college avatarUrl');
  const profileUserIds = profiles.map((p) => p.userId);

  // Filter by user name and archetype
  let userFilter = { _id: { $in: profileUserIds } };
  const normalizedName = normalizeSearchTerm(name, { minLength: 1, maxLength: 64 });
  if (normalizedName) userFilter.displayName = { $regex: normalizedName, $options: 'i' };
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
  const parsedMinScore = Number(minScore);
  if (Number.isFinite(parsedMinScore) && parsedMinScore > 0) {
    results = results.filter((r) => r.devScore >= parsedMinScore);
  }

  // Sort
  if (safeSortBy === 'name') {
    results.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } else {
    results.sort((a, b) => b.devScore - a.devScore);
  }

  res.json({ success: true, data: results });
});
