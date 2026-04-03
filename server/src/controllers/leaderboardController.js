import DevScore from '../models/DevScore.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cacheGet } from '../config/redisClient.js';

const LEADERBOARD_MODES = new Set([
  'devscore',
  'github',
  'leetcode',
  'codeforces',
  'hackerrank',
  'codechef',
  'kaggle',
  'huggingface',
]);

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatInteger(value) {
  return Math.round(toNumber(value)).toLocaleString();
}

function parsePositiveInt(value, fallback, min = 1, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function buildModePipeline(mode) {
  if (mode === 'github') {
    return [
      {
        $lookup: {
          from: 'githubstats',
          localField: '_id',
          foreignField: 'userId',
          as: 'github',
        },
      },
      { $addFields: { github: { $first: '$github' } } },
      {
        $addFields: {
          githubContributions: {
            $ifNull: ['$github.totalContributionsLastYear', { $ifNull: ['$github.totalContributionsAllTime', 0] }],
          },
          githubStars: { $ifNull: ['$github.starsReceived', 0] },
          githubFollowers: { $ifNull: ['$github.followers', 0] },
        },
      },
      {
        $addFields: {
          metricKind: 'github',
          metricLabel: 'Contributions (Last Year)',
          metricPrimary: '$githubContributions',
          metricSecondary: '$githubStars',
          metricSortValue: {
            $add: [
              '$githubContributions',
              { $multiply: ['$githubStars', 0.25] },
              { $multiply: ['$githubFollowers', 2] },
            ],
          },
          metricAvailable: {
            $gt: [{ $add: ['$githubContributions', '$githubStars', '$githubFollowers'] }, 0],
          },
        },
      },
    ];
  }

  if (mode === 'leetcode') {
    return [
      {
        $lookup: {
          from: 'dsastats',
          localField: '_id',
          foreignField: 'userId',
          as: 'dsa',
        },
      },
      { $addFields: { dsa: { $first: '$dsa' } } },
      {
        $addFields: {
          lcRank: { $ifNull: ['$dsa.leetcode.contestGlobalRanking', 0] },
          lcRating: { $ifNull: ['$dsa.leetcode.contestRating', 0] },
          lcSolved: { $ifNull: ['$dsa.leetcode.totalSolved', 0] },
        },
      },
      {
        $addFields: {
          metricKind: {
            $switch: {
              branches: [
                { case: { $gt: ['$lcRank', 0] }, then: 'leetcode-rank' },
                { case: { $gt: ['$lcRating', 0] }, then: 'leetcode-rating' },
              ],
              default: 'leetcode-solved',
            },
          },
          metricLabel: {
            $switch: {
              branches: [
                { case: { $gt: ['$lcRank', 0] }, then: 'Global Contest Rank' },
                { case: { $gt: ['$lcRating', 0] }, then: 'Contest Rating' },
              ],
              default: 'Problems Solved',
            },
          },
          metricPrimary: {
            $switch: {
              branches: [
                { case: { $gt: ['$lcRank', 0] }, then: '$lcRank' },
                { case: { $gt: ['$lcRating', 0] }, then: '$lcRating' },
              ],
              default: '$lcSolved',
            },
          },
          metricSecondary: {
            $switch: {
              branches: [
                { case: { $gt: ['$lcRank', 0] }, then: '$lcRating' },
                { case: { $gt: ['$lcRating', 0] }, then: '$lcSolved' },
              ],
              default: 0,
            },
          },
          metricSortValue: {
            $switch: {
              branches: [
                { case: { $gt: ['$lcRank', 0] }, then: { $multiply: ['$lcRank', -1] } },
                { case: { $gt: ['$lcRating', 0] }, then: '$lcRating' },
              ],
              default: '$lcSolved',
            },
          },
          metricAvailable: { $gt: [{ $max: ['$lcRank', '$lcRating', '$lcSolved'] }, 0] },
        },
      },
    ];
  }

  if (mode === 'codeforces') {
    return [
      {
        $lookup: {
          from: 'dsastats',
          localField: '_id',
          foreignField: 'userId',
          as: 'dsa',
        },
      },
      { $addFields: { dsa: { $first: '$dsa' } } },
      {
        $addFields: {
          cfRating: { $ifNull: ['$dsa.codeforces.currentRating', { $ifNull: ['$dsa.codeforces.rating', 0] }] },
          cfMaxRating: { $ifNull: ['$dsa.codeforces.maxRating', 0] },
          cfSolved: { $ifNull: ['$dsa.codeforces.totalSolved', 0] },
          cfContests: { $ifNull: ['$dsa.codeforces.contestsParticipated', 0] },
        },
      },
      {
        $addFields: {
          metricKind: {
            $cond: [{ $gt: ['$cfRating', 0] }, 'codeforces-rating', 'codeforces-solved'],
          },
          metricLabel: {
            $cond: [{ $gt: ['$cfRating', 0] }, 'Current Rating', 'Problems Solved'],
          },
          metricPrimary: {
            $cond: [{ $gt: ['$cfRating', 0] }, '$cfRating', '$cfSolved'],
          },
          metricSecondary: {
            $cond: [{ $gt: ['$cfRating', 0] }, '$cfMaxRating', '$cfContests'],
          },
          metricSortValue: {
            $cond: [{ $gt: ['$cfRating', 0] }, '$cfRating', '$cfSolved'],
          },
          metricAvailable: { $gt: [{ $max: ['$cfRating', '$cfSolved'] }, 0] },
        },
      },
    ];
  }

  if (mode === 'hackerrank') {
    return [
      {
        $lookup: {
          from: 'platformstats',
          localField: '_id',
          foreignField: 'userId',
          as: 'platform',
        },
      },
      { $addFields: { platform: { $first: '$platform' } } },
      {
        $addFields: {
          hrContestRank: { $ifNull: ['$platform.hackerrank.contestRanking', 0] },
          hrStars: { $ifNull: ['$platform.hackerrank.totalStars', 0] },
          hrBadges: { $ifNull: ['$platform.hackerrank.totalBadges', 0] },
          hrLevel: { $ifNull: ['$platform.hackerrank.level', 0] },
          hrContests: { $ifNull: ['$platform.hackerrank.contestsParticipated', 0] },
        },
      },
      {
        $addFields: {
          hrSignal: {
            $add: [
              { $multiply: ['$hrStars', 20] },
              { $multiply: ['$hrBadges', 8] },
              { $multiply: ['$hrLevel', 15] },
              { $multiply: ['$hrContests', 2] },
            ],
          },
        },
      },
      {
        $addFields: {
          metricKind: {
            $cond: [{ $gt: ['$hrContestRank', 0] }, 'hackerrank-rank', 'hackerrank-stars'],
          },
          metricLabel: {
            $cond: [{ $gt: ['$hrContestRank', 0] }, 'Contest Ranking', 'Total Stars'],
          },
          metricPrimary: {
            $cond: [{ $gt: ['$hrContestRank', 0] }, '$hrContestRank', '$hrStars'],
          },
          metricSecondary: {
            $cond: [{ $gt: ['$hrContestRank', 0] }, '$hrStars', '$hrBadges'],
          },
          metricSortValue: {
            $cond: [{ $gt: ['$hrContestRank', 0] }, { $multiply: ['$hrContestRank', -1] }, '$hrSignal'],
          },
          metricAvailable: {
            $or: [
              { $gt: ['$hrContestRank', 0] },
              { $gt: ['$hrSignal', 0] },
            ],
          },
        },
      },
    ];
  }

  if (mode === 'codechef') {
    return [
      {
        $lookup: {
          from: 'platformstats',
          localField: '_id',
          foreignField: 'userId',
          as: 'platform',
        },
      },
      { $addFields: { platform: { $first: '$platform' } } },
      {
        $addFields: {
          ccGlobalRank: { $ifNull: ['$platform.codechef.globalRank', 0] },
          ccRating: { $ifNull: ['$platform.codechef.currentRating', 0] },
          ccSolved: { $ifNull: ['$platform.codechef.problemsSolved', 0] },
          ccStarsCount: { $ifNull: ['$platform.codechef.starsCount', 0] },
        },
      },
      {
        $addFields: {
          metricKind: {
            $switch: {
              branches: [
                { case: { $gt: ['$ccGlobalRank', 0] }, then: 'codechef-rank' },
                { case: { $gt: ['$ccRating', 0] }, then: 'codechef-rating' },
              ],
              default: 'codechef-solved',
            },
          },
          metricLabel: {
            $switch: {
              branches: [
                { case: { $gt: ['$ccGlobalRank', 0] }, then: 'Global Rank' },
                { case: { $gt: ['$ccRating', 0] }, then: 'Current Rating' },
              ],
              default: 'Problems Solved',
            },
          },
          metricPrimary: {
            $switch: {
              branches: [
                { case: { $gt: ['$ccGlobalRank', 0] }, then: '$ccGlobalRank' },
                { case: { $gt: ['$ccRating', 0] }, then: '$ccRating' },
              ],
              default: '$ccSolved',
            },
          },
          metricSecondary: {
            $switch: {
              branches: [
                { case: { $gt: ['$ccGlobalRank', 0] }, then: '$ccRating' },
                { case: { $gt: ['$ccRating', 0] }, then: '$ccSolved' },
              ],
              default: '$ccStarsCount',
            },
          },
          metricSortValue: {
            $switch: {
              branches: [
                { case: { $gt: ['$ccGlobalRank', 0] }, then: { $multiply: ['$ccGlobalRank', -1] } },
                { case: { $gt: ['$ccRating', 0] }, then: '$ccRating' },
              ],
              default: '$ccSolved',
            },
          },
          metricAvailable: { $gt: [{ $max: ['$ccGlobalRank', '$ccRating', '$ccSolved'] }, 0] },
        },
      },
    ];
  }

  if (mode === 'kaggle') {
    return [
      {
        $lookup: {
          from: 'platformstats',
          localField: '_id',
          foreignField: 'userId',
          as: 'platform',
        },
      },
      { $addFields: { platform: { $first: '$platform' } } },
      {
        $addFields: {
          kgRank: { $ifNull: ['$platform.kaggle.ranking', { $ifNull: ['$platform.kaggle.rank', 0] }] },
          kgMedals: {
            $add: [
              { $ifNull: ['$platform.kaggle.competitionMedals.total', 0] },
              { $ifNull: ['$platform.kaggle.notebookMedals.total', 0] },
              { $ifNull: ['$platform.kaggle.datasetMedals.total', 0] },
              { $ifNull: ['$platform.kaggle.goldMedals', 0] },
              { $ifNull: ['$platform.kaggle.silverMedals', 0] },
              { $ifNull: ['$platform.kaggle.bronzeMedals', 0] },
            ],
          },
          kgNotebookVotes: { $ifNull: ['$platform.kaggle.notebookVotesReceived', { $ifNull: ['$platform.kaggle.notebookVotes', 0] }] },
          kgDatasetDownloads: { $ifNull: ['$platform.kaggle.datasetDownloads', 0] },
        },
      },
      {
        $addFields: {
          kgImpact: {
            $add: [
              { $multiply: ['$kgMedals', 15] },
              { $multiply: ['$kgNotebookVotes', 0.4] },
              { $multiply: ['$kgDatasetDownloads', 0.03] },
            ],
          },
        },
      },
      {
        $addFields: {
          metricKind: {
            $cond: [{ $gt: ['$kgRank', 0] }, 'kaggle-rank', 'kaggle-impact'],
          },
          metricLabel: {
            $cond: [{ $gt: ['$kgRank', 0] }, 'Global Rank', 'Medal + Impact Signal'],
          },
          metricPrimary: {
            $cond: [{ $gt: ['$kgRank', 0] }, '$kgRank', '$kgMedals'],
          },
          metricSecondary: {
            $cond: [{ $gt: ['$kgRank', 0] }, '$kgMedals', '$kgDatasetDownloads'],
          },
          metricSortValue: {
            $cond: [{ $gt: ['$kgRank', 0] }, { $multiply: ['$kgRank', -1] }, '$kgImpact'],
          },
          metricAvailable: {
            $or: [
              { $gt: ['$kgRank', 0] },
              { $gt: ['$kgImpact', 0] },
            ],
          },
        },
      },
    ];
  }

  if (mode === 'huggingface') {
    return [
      {
        $lookup: {
          from: 'platformstats',
          localField: '_id',
          foreignField: 'userId',
          as: 'platform',
        },
      },
      { $addFields: { platform: { $first: '$platform' } } },
      {
        $addFields: {
          hfDownloads: {
            $ifNull: [
              '$platform.huggingface.totalDownloads',
              {
                $add: [
                  { $ifNull: ['$platform.huggingface.modelDownloads', 0] },
                  { $ifNull: ['$platform.huggingface.datasetDownloads', 0] },
                ],
              },
            ],
          },
          hfLikes: {
            $add: [
              { $ifNull: ['$platform.huggingface.totalLikes', 0] },
              { $ifNull: ['$platform.huggingface.spacesLikes', 0] },
            ],
          },
          hfFollowers: { $ifNull: ['$platform.huggingface.followers', 0] },
        },
      },
      {
        $addFields: {
          metricKind: 'huggingface',
          metricLabel: 'Total Downloads',
          metricPrimary: '$hfDownloads',
          metricSecondary: '$hfLikes',
          metricSortValue: {
            $add: [
              '$hfDownloads',
              { $multiply: ['$hfLikes', 50] },
              { $multiply: ['$hfFollowers', 200] },
            ],
          },
          metricAvailable: {
            $gt: [{ $add: ['$hfDownloads', '$hfLikes', '$hfFollowers'] }, 0],
          },
        },
      },
    ];
  }

  return [];
}

function presentMetric(mode, row) {
  if (mode === 'devscore') {
    return {
      metricLabel: undefined,
      metricDisplay: undefined,
      metricSecondary: undefined,
    };
  }

  if (mode === 'github') {
    return {
      metricLabel: row.metricLabel,
      metricDisplay: `${formatInteger(row.metricPrimary)} contributions`,
      metricSecondary: `${formatInteger(row.metricSecondary)} stars`,
    };
  }

  if (mode === 'leetcode') {
    if (row.metricKind === 'leetcode-rank') {
      return {
        metricLabel: row.metricLabel,
        metricDisplay: `#${formatInteger(row.metricPrimary)}`,
        metricSecondary: row.metricSecondary > 0 ? `Rating ${formatInteger(row.metricSecondary)}` : '',
      };
    }

    if (row.metricKind === 'leetcode-rating') {
      return {
        metricLabel: row.metricLabel,
        metricDisplay: formatInteger(row.metricPrimary),
        metricSecondary: `${formatInteger(row.metricSecondary)} solved`,
      };
    }

    return {
      metricLabel: row.metricLabel,
      metricDisplay: `${formatInteger(row.metricPrimary)} solved`,
      metricSecondary: '',
    };
  }

  if (mode === 'codeforces') {
    if (row.metricKind === 'codeforces-rating') {
      return {
        metricLabel: row.metricLabel,
        metricDisplay: formatInteger(row.metricPrimary),
        metricSecondary: row.metricSecondary > 0 ? `Peak ${formatInteger(row.metricSecondary)}` : '',
      };
    }

    return {
      metricLabel: row.metricLabel,
      metricDisplay: `${formatInteger(row.metricPrimary)} solved`,
      metricSecondary: row.metricSecondary > 0 ? `${formatInteger(row.metricSecondary)} contests` : '',
    };
  }

  if (mode === 'hackerrank') {
    if (row.metricKind === 'hackerrank-rank') {
      return {
        metricLabel: row.metricLabel,
        metricDisplay: `#${formatInteger(row.metricPrimary)}`,
        metricSecondary: `${formatInteger(row.metricSecondary)} stars`,
      };
    }

    return {
      metricLabel: row.metricLabel,
      metricDisplay: `${formatInteger(row.metricPrimary)} stars`,
      metricSecondary: `${formatInteger(row.metricSecondary)} badges`,
    };
  }

  if (mode === 'codechef') {
    if (row.metricKind === 'codechef-rank') {
      return {
        metricLabel: row.metricLabel,
        metricDisplay: `#${formatInteger(row.metricPrimary)}`,
        metricSecondary: row.metricSecondary > 0 ? `Rating ${formatInteger(row.metricSecondary)}` : '',
      };
    }

    if (row.metricKind === 'codechef-rating') {
      return {
        metricLabel: row.metricLabel,
        metricDisplay: formatInteger(row.metricPrimary),
        metricSecondary: `${formatInteger(row.metricSecondary)} solved`,
      };
    }

    return {
      metricLabel: row.metricLabel,
      metricDisplay: `${formatInteger(row.metricPrimary)} solved`,
      metricSecondary: row.metricSecondary > 0 ? `${formatInteger(row.metricSecondary)} stars` : '',
    };
  }

  if (mode === 'kaggle') {
    if (row.metricKind === 'kaggle-rank') {
      return {
        metricLabel: row.metricLabel,
        metricDisplay: `#${formatInteger(row.metricPrimary)}`,
        metricSecondary: `${formatInteger(row.metricSecondary)} medals`,
      };
    }

    return {
      metricLabel: row.metricLabel,
      metricDisplay: `${formatInteger(row.metricPrimary)} medals`,
      metricSecondary: `${formatInteger(row.metricSecondary)} dataset downloads`,
    };
  }

  if (mode === 'huggingface') {
    return {
      metricLabel: row.metricLabel,
      metricDisplay: `${formatInteger(row.metricPrimary)} downloads`,
      metricSecondary: `${formatInteger(row.metricSecondary)} likes`,
    };
  }

  return {
    metricLabel: row.metricLabel,
    metricDisplay: 'N/A',
    metricSecondary: '',
  };
}

// --- Get Global Leaderboard ----------------------
export const getLeaderboard = asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1, 1, 500);
  const limit = parsePositiveInt(req.query.limit, 20, 1, 100);
  const skip = (page - 1) * limit;

  const college = typeof req.query.college === 'string' ? req.query.college.trim() : '';
  const archetype = typeof req.query.archetype === 'string' ? req.query.archetype.trim() : '';
  const requestedMode = String(req.query.mode || 'devscore').toLowerCase();
  const mode = LEADERBOARD_MODES.has(requestedMode) ? requestedMode : 'devscore';

  const cacheKey = `leaderboard:v2:${mode}:college:${college.toLowerCase() || 'all'}:archetype:${archetype || 'all'}:page:${page}:limit:${limit}`;

  const payload = await cacheGet(cacheKey, async () => {
    const pipeline = [
      { $sort: { userId: 1, createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          overallScore: { $first: { $ifNull: ['$score', '$overallScore'] } },
        },
      },
      {
        $lookup: {
          from: 'profiles',
          let: { uid: '$_id' },
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
            {
              $project: {
                _id: 0,
                college: '$college',
                avatarUrl: '$avatarUrl',
              },
            },
          ],
          as: 'profile',
        },
      },
      { $unwind: '$profile' },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'portfoliocodes',
          let: { uid: '$_id' },
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
          displayName: '$user.displayName',
          publicHandle: '$user.publicHandle',
          archetype: { $ifNull: ['$user.archetype', 'none'] },
          secondaryArchetype: { $ifNull: ['$user.secondaryArchetype', 'none'] },
          college: { $ifNull: ['$profile.college', ''] },
          avatarUrl: '$profile.avatarUrl',
          hasPortfolio: { $gt: [{ $size: '$portfolio' }, 0] },
        },
      },
    ];

    if (college) {
      pipeline.push({
        $match: {
          college: { $regex: college, $options: 'i' },
        },
      });
    }

    if (archetype) {
      pipeline.push({
        $match: {
          $or: [
            { archetype },
            { secondaryArchetype: archetype },
          ],
        },
      });
    }

    if (mode !== 'devscore') {
      pipeline.push(...buildModePipeline(mode));
      pipeline.push({ $match: { metricAvailable: true } });
      pipeline.push({ $sort: { metricSortValue: -1, overallScore: -1, displayName: 1 } });
    } else {
      pipeline.push({ $sort: { overallScore: -1, displayName: 1 } });
    }

    pipeline.push(
      {
        $project: {
          _id: 0,
          userId: '$_id',
          displayName: 1,
          publicHandle: 1,
          overallScore: 1,
          archetype: 1,
          secondaryArchetype: 1,
          college: 1,
          avatarUrl: 1,
          hasPortfolio: 1,
          metricKind: 1,
          metricLabel: 1,
          metricPrimary: 1,
          metricSecondary: 1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          rankings: [
            { $skip: skip },
            { $limit: limit },
          ],
        },
      }
    );

    const [aggregation] = await DevScore.aggregate(pipeline).collation({ locale: 'en', strength: 2 });

    const totalItems = Number(aggregation?.metadata?.[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const rankings = aggregation?.rankings || [];

    await Promise.all(rankings.map(async (entry) => {
      if (entry.publicHandle) return;

      const generated = await User.ensurePublicHandle(entry.userId);
      entry.publicHandle = generated || null;
    }));

    const rankingsWithPresentation = rankings.map((entry, index) => {
      const metricPresentation = presentMetric(mode, entry);

      return {
        rank: skip + index + 1,
        userId: entry.userId,
        displayName: entry.displayName || 'Unknown',
        publicHandle: entry.publicHandle || null,
        overallScore: toNumber(entry.overallScore),
        archetype: entry.archetype || 'none',
        secondaryArchetype: entry.secondaryArchetype || 'none',
        college: entry.college || '',
        avatarUrl: entry.avatarUrl || null,
        hasPortfolio: Boolean(entry.hasPortfolio),
        ...metricPresentation,
      };
    });

    return {
      mode,
      rankings: rankingsWithPresentation,
      totalPages,
      currentPage: Math.min(page, totalPages),
    };
  }, 300);

  res.json({
    success: true,
    data: payload,
  });
});

// --- Get College Leaderboard ---------------------
export const getCollegeLeaderboard = asyncHandler(async (req, res) => {
  req.query.college = req.params.collegeName;
  return getLeaderboard(req, res);
});
