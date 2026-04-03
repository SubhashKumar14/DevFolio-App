import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { normalizeSearchTerm } from '../utils/inputValidation.js';

const ALLOWED_SORT_FIELDS = new Set(['devScore', 'name', 'college', 'portfolio']);
const ALLOWED_SORT_ORDERS = new Set(['asc', 'desc']);

function normalizeArchetype(value) {
  const normalized = String(value || '').trim().toLowerCase().slice(0, 32);
  if (!normalized) return null;
  if (!/^[a-z0-9_-]+$/.test(normalized)) return null;
  return normalized;
}

function parseBooleanQuery(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
}

function parsePositiveInt(value, { fallback, min = 1, max = 100 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseScoreValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(1000, Math.max(0, parsed));
}

function parseTechStackQuery(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 10);
}

function buildSortStage(sortBy, sortOrder) {
  const direction = sortOrder === 'asc' ? 1 : -1;

  if (sortBy === 'name') {
    return { displayName: direction, devScore: -1 };
  }

  if (sortBy === 'college') {
    return { college: direction, devScore: -1, displayName: 1 };
  }

  if (sortBy === 'portfolio') {
    return { hasPortfolio: direction, devScore: -1, displayName: 1 };
  }

  return { devScore: direction, displayName: 1 };
}

// --- Search Developers ---------------------------
export const searchDevelopers = asyncHandler(async (req, res) => {
  const {
    name,
    techStack,
    college,
    minScore,
    maxScore,
    archetype,
    secondaryArchetype,
    hasPortfolio,
    sortBy = 'devScore',
    sortOrder = 'desc',
    matchTech = 'any',
    page = '1',
    limit = '24',
  } = req.query;

  const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : 'devScore';
  const safeSortOrder = ALLOWED_SORT_ORDERS.has(String(sortOrder).toLowerCase())
    ? String(sortOrder).toLowerCase()
    : 'desc';
  const safeMatchTech = String(matchTech).toLowerCase() === 'all' ? 'all' : 'any';

  const pageNumber = parsePositiveInt(page, { fallback: 1, min: 1, max: 200 });
  const pageSize = parsePositiveInt(limit, { fallback: 24, min: 1, max: 100 });
  const offset = (pageNumber - 1) * pageSize;

  const profileMatch = { isPublic: true };
  const normalizedCollege = normalizeSearchTerm(college, { minLength: 1, maxLength: 80 });
  if (normalizedCollege) {
    profileMatch.college = { $regex: normalizedCollege, $options: 'i' };
  }

  const techFilters = parseTechStackQuery(techStack);
  if (techFilters.length > 0) {
    profileMatch.techStack = safeMatchTech === 'all'
      ? { $all: techFilters }
      : { $in: techFilters };
  }

  const userMatch = {};
  const normalizedName = normalizeSearchTerm(name, { minLength: 1, maxLength: 64 });
  if (normalizedName) {
    userMatch['user.displayName'] = { $regex: normalizedName, $options: 'i' };
  }

  const primaryArchetype = normalizeArchetype(archetype);
  const secondaryArchetypeFilter = normalizeArchetype(secondaryArchetype);
  const archetypeTargets = [...new Set([primaryArchetype, secondaryArchetypeFilter].filter(Boolean))];

  if (archetypeTargets.length === 1) {
    const [target] = archetypeTargets;
    userMatch.$or = [
      { 'user.archetype': target },
      { 'user.secondaryArchetype': target },
    ];
  } else if (archetypeTargets.length > 1) {
    userMatch.$and = archetypeTargets.map((target) => ({
      $or: [
        { 'user.archetype': target },
        { 'user.secondaryArchetype': target },
      ],
    }));
  }

  const pipeline = [
    { $match: profileMatch },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ];

  if (Object.keys(userMatch).length > 0) {
    pipeline.push({ $match: userMatch });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'devscores',
        let: { uid: '$userId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          {
            $project: {
              _id: 0,
              score: { $ifNull: ['$score', '$overallScore'] },
              breakdown: '$breakdown',
              createdAt: '$createdAt',
            },
          },
        ],
        as: 'latestScore',
      },
    },
    {
      $lookup: {
        from: 'portfoliocodes',
        let: { uid: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', '$$uid'] },
                  { $eq: ['$isPublic', true] },
                ],
              },
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: 'portfolio',
      },
    },
    {
      $addFields: {
        latestScore: { $first: '$latestScore' },
        devScore: { $ifNull: [{ $first: '$latestScore.score' }, 0] },
        pillars: { $ifNull: [{ $first: '$latestScore.breakdown' }, null] },
        scoreUpdatedAt: { $ifNull: [{ $first: '$latestScore.createdAt' }, null] },
        hasPortfolio: { $gt: [{ $size: '$portfolio' }, 0] },
        displayName: '$user.displayName',
        publicHandle: '$user.publicHandle',
        archetype: { $ifNull: ['$user.archetype', 'none'] },
        secondaryArchetype: { $ifNull: ['$user.secondaryArchetype', 'none'] },
        college: { $ifNull: ['$college', ''] },
        techStack: { $ifNull: ['$techStack', []] },
      },
    }
  );

  const portfolioFilter = parseBooleanQuery(hasPortfolio);
  if (portfolioFilter !== null) {
    pipeline.push({ $match: { hasPortfolio: portfolioFilter } });
  }

  const parsedMinScore = parseScoreValue(minScore);
  const parsedMaxScore = parseScoreValue(maxScore);
  if (parsedMinScore !== null || parsedMaxScore !== null) {
    const lower = parsedMinScore ?? 0;
    const upper = parsedMaxScore ?? 1000;
    const minBound = Math.min(lower, upper);
    const maxBound = Math.max(lower, upper);
    pipeline.push({ $match: { devScore: { $gte: minBound, $lte: maxBound } } });
  }

  pipeline.push(
    {
      $project: {
        _id: 0,
        userId: '$userId',
        displayName: 1,
        publicHandle: 1,
        archetype: 1,
        secondaryArchetype: 1,
        devScore: 1,
        pillars: 1,
        scoreUpdatedAt: 1,
        techStack: 1,
        college: 1,
        hasPortfolio: 1,
      },
    },
    { $sort: buildSortStage(safeSortBy, safeSortOrder) },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: offset },
          { $limit: pageSize },
        ],
      },
    }
  );

  const [aggregation] = await Profile.aggregate(pipeline).collation({ locale: 'en', strength: 2 });

  const total = Number(aggregation?.metadata?.[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const normalizedPage = Math.min(pageNumber, totalPages);
  let results = aggregation?.data || [];

  if (normalizedPage !== pageNumber) {
    const normalizedOffset = (normalizedPage - 1) * pageSize;
    const [normalizedAggregation] = await Profile.aggregate([
      ...pipeline.slice(0, -1),
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: normalizedOffset },
            { $limit: pageSize },
          ],
        },
      },
    ]).collation({ locale: 'en', strength: 2 });

    results = normalizedAggregation?.data || [];
  }

  await Promise.all(results.map(async (row) => {
    if (row.publicHandle) return;

    const generated = await User.ensurePublicHandle(row.userId);
    row.publicHandle = generated || null;
  }));

  res.json({
    success: true,
    data: results,
    meta: {
      total,
      page: normalizedPage,
      totalPages,
      limit: pageSize,
      sortBy: safeSortBy,
      sortOrder: safeSortOrder,
      matchTech: safeMatchTech,
    },
  });
});
