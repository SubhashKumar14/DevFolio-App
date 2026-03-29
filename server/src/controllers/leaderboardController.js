import DevScore from '../models/DevScore.js';
import GithubStats from '../models/GithubStats.js';
import DsaStats from '../models/DsaStats.js';
import PlatformStats from '../models/PlatformStats.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import PortfolioCode from '../models/PortfolioCode.js';
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

function metricFromPlatform(mode, { github, dsa, platform }) {
  if (mode === 'github') {
    const contributions = toNumber(github?.totalContributionsLastYear || github?.totalContributionsAllTime);
    const stars = toNumber(github?.starsReceived);
    const followers = toNumber(github?.followers);
    const available = contributions > 0 || stars > 0 || followers > 0;

    return {
      available,
      sortValue: contributions + stars * 0.25 + followers * 2,
      metricLabel: 'Contributions (Last Year)',
      metricValue: contributions,
      metricDisplay: `${formatInteger(contributions)} contributions`,
      metricSecondary: `${formatInteger(stars)} stars`,
    };
  }

  if (mode === 'leetcode') {
    const contestRank = toNumber(dsa?.leetcode?.contestGlobalRanking);
    const contestRating = toNumber(dsa?.leetcode?.contestRating);
    const solved = toNumber(dsa?.leetcode?.totalSolved);

    if (contestRank > 0) {
      return {
        available: true,
        sortValue: -contestRank,
        metricLabel: 'Global Contest Rank',
        metricValue: contestRank,
        metricDisplay: `#${formatInteger(contestRank)}`,
        metricSecondary: contestRating > 0 ? `Rating ${formatInteger(contestRating)}` : `${formatInteger(solved)} solved`,
      };
    }

    if (contestRating > 0) {
      return {
        available: true,
        sortValue: contestRating,
        metricLabel: 'Contest Rating',
        metricValue: contestRating,
        metricDisplay: formatInteger(contestRating),
        metricSecondary: `${formatInteger(solved)} solved`,
      };
    }

    return {
      available: solved > 0,
      sortValue: solved,
      metricLabel: 'Problems Solved',
      metricValue: solved,
      metricDisplay: `${formatInteger(solved)} solved`,
      metricSecondary: '',
    };
  }

  if (mode === 'codeforces') {
    const rating = toNumber(dsa?.codeforces?.currentRating || dsa?.codeforces?.rating);
    const maxRating = toNumber(dsa?.codeforces?.maxRating);
    const solved = toNumber(dsa?.codeforces?.totalSolved);
    const contests = toNumber(dsa?.codeforces?.contestsParticipated);

    if (rating > 0) {
      return {
        available: true,
        sortValue: rating,
        metricLabel: 'Current Rating',
        metricValue: rating,
        metricDisplay: formatInteger(rating),
        metricSecondary: maxRating > 0 ? `Peak ${formatInteger(maxRating)}` : `${formatInteger(contests)} contests`,
      };
    }

    return {
      available: solved > 0,
      sortValue: solved,
      metricLabel: 'Problems Solved',
      metricValue: solved,
      metricDisplay: `${formatInteger(solved)} solved`,
      metricSecondary: `${formatInteger(contests)} contests`,
    };
  }

  if (mode === 'hackerrank') {
    const contestRank = toNumber(platform?.hackerrank?.contestRanking);
    const stars = toNumber(platform?.hackerrank?.totalStars);
    const badges = toNumber(platform?.hackerrank?.totalBadges);
    const level = toNumber(platform?.hackerrank?.level);
    const contests = toNumber(platform?.hackerrank?.contestsParticipated);

    if (contestRank > 0) {
      return {
        available: true,
        sortValue: -contestRank,
        metricLabel: 'Contest Ranking',
        metricValue: contestRank,
        metricDisplay: `#${formatInteger(contestRank)}`,
        metricSecondary: `${formatInteger(stars)} stars`,
      };
    }

    const scoreSignal = stars * 20 + badges * 8 + level * 15 + contests * 2;
    return {
      available: scoreSignal > 0,
      sortValue: scoreSignal,
      metricLabel: 'Total Stars',
      metricValue: stars,
      metricDisplay: `${formatInteger(stars)} stars`,
      metricSecondary: `${formatInteger(badges)} badges`,
    };
  }

  if (mode === 'codechef') {
    const globalRank = toNumber(platform?.codechef?.globalRank);
    const rating = toNumber(platform?.codechef?.currentRating);
    const stars = parseStarCount(platform?.codechef?.stars || platform?.codechef?.starsCount);
    const solved = toNumber(platform?.codechef?.problemsSolved);

    if (globalRank > 0) {
      return {
        available: true,
        sortValue: -globalRank,
        metricLabel: 'Global Rank',
        metricValue: globalRank,
        metricDisplay: `#${formatInteger(globalRank)}`,
        metricSecondary: rating > 0 ? `Rating ${formatInteger(rating)}` : `${stars} stars`,
      };
    }

    if (rating > 0) {
      return {
        available: true,
        sortValue: rating,
        metricLabel: 'Current Rating',
        metricValue: rating,
        metricDisplay: formatInteger(rating),
        metricSecondary: `${formatInteger(solved)} solved`,
      };
    }

    return {
      available: solved > 0,
      sortValue: solved,
      metricLabel: 'Problems Solved',
      metricValue: solved,
      metricDisplay: `${formatInteger(solved)} solved`,
      metricSecondary: `${stars} stars`,
    };
  }

  if (mode === 'kaggle') {
    const ranking = toNumber(platform?.kaggle?.ranking || platform?.kaggle?.rank);
    const medals = toNumber(platform?.kaggle?.competitionMedals?.total)
      + toNumber(platform?.kaggle?.notebookMedals?.total)
      + toNumber(platform?.kaggle?.datasetMedals?.total)
      + toNumber(platform?.kaggle?.goldMedals)
      + toNumber(platform?.kaggle?.silverMedals)
      + toNumber(platform?.kaggle?.bronzeMedals);
    const notebookVotes = toNumber(platform?.kaggle?.notebookVotesReceived || platform?.kaggle?.notebookVotes);
    const datasetDownloads = toNumber(platform?.kaggle?.datasetDownloads);

    if (ranking > 0) {
      return {
        available: true,
        sortValue: -ranking,
        metricLabel: 'Global Rank',
        metricValue: ranking,
        metricDisplay: `#${formatInteger(ranking)}`,
        metricSecondary: `${formatInteger(medals)} medals`,
      };
    }

    const impact = medals * 15 + notebookVotes * 0.4 + datasetDownloads * 0.03;
    return {
      available: impact > 0,
      sortValue: impact,
      metricLabel: 'Medal + Impact Signal',
      metricValue: medals,
      metricDisplay: `${formatInteger(medals)} medals`,
      metricSecondary: `${formatInteger(datasetDownloads)} dataset downloads`,
    };
  }

  if (mode === 'huggingface') {
    const downloads = toNumber(platform?.huggingface?.totalDownloads)
      || (toNumber(platform?.huggingface?.modelDownloads) + toNumber(platform?.huggingface?.datasetDownloads));
    const likes = toNumber(platform?.huggingface?.totalLikes) + toNumber(platform?.huggingface?.spacesLikes);
    const followers = toNumber(platform?.huggingface?.followers);
    const available = downloads > 0 || likes > 0 || followers > 0;

    return {
      available,
      sortValue: downloads + likes * 50 + followers * 200,
      metricLabel: 'Total Downloads',
      metricValue: downloads,
      metricDisplay: `${formatInteger(downloads)} downloads`,
      metricSecondary: `${formatInteger(likes)} likes`,
    };
  }

  return {
    available: false,
    sortValue: Number.NEGATIVE_INFINITY,
    metricLabel: 'Metric',
    metricValue: 0,
    metricDisplay: 'N/A',
    metricSecondary: '',
  };
}

// ─── Get Global Leaderboard ──────────────────────
export const getLeaderboard = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const college = req.query.college;
  const archetype = req.query.archetype;
  const requestedMode = String(req.query.mode || 'devscore').toLowerCase();
  const mode = LEADERBOARD_MODES.has(requestedMode) ? requestedMode : 'devscore';

  const cacheKey = `leaderboard:mode:${mode}:${college ? `college:${college.toLowerCase()}:` : ''}${archetype ? `archetype:${archetype}:` : ''}all`;

  const allRankings = await cacheGet(cacheKey, async () => {
    // Get latest score per user via aggregation
    const pipeline = [
      { $sort: { userId: 1, createdAt: -1 } },
      { $group: {
        _id: '$userId',
        score: { $first: { $ifNull: ['$score', '$overallScore'] } },
        breakdown: { $first: '$breakdown' },
        computedAt: { $first: '$computedAt' },
      }},
      { $sort: { score: -1 } },
    ];

    const scores = await DevScore.aggregate(pipeline);

    // Get user info
    const userIds = scores.map((s) => s._id);
    const [users, profiles, portfolios] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select([
        'displayName',
        'email',
        'archetype',
        'secondaryArchetype',
        'githubUsername',
        'leetcodeUsername',
        'codeforcesUsername',
        'hackerrankUsername',
        'codechefUsername',
        'kaggleUsername',
        'huggingfaceUsername',
      ].join(' ')),
      Profile.find({ userId: { $in: userIds } }).select('userId college avatarUrl'),
      PortfolioCode.find({ userId: { $in: userIds }, isPublic: true }).select('userId'),
    ]);

    let githubMap = new Map();
    let dsaMap = new Map();
    let platformMap = new Map();

    if (mode === 'github') {
      const githubStats = await GithubStats.find({ userId: { $in: userIds } })
        .select('userId totalContributionsLastYear totalContributionsAllTime starsReceived followers')
        .lean();
      githubMap = new Map(githubStats.map((row) => [row.userId.toString(), row]));
    } else if (mode === 'leetcode' || mode === 'codeforces') {
      const dsaStats = await DsaStats.find({ userId: { $in: userIds } })
        .select('userId leetcode codeforces')
        .lean();
      dsaMap = new Map(dsaStats.map((row) => [row.userId.toString(), row]));
    } else if (mode !== 'devscore') {
      const platformStats = await PlatformStats.find({ userId: { $in: userIds } })
        .select('userId hackerrank codechef kaggle huggingface')
        .lean();
      platformMap = new Map(platformStats.map((row) => [row.userId.toString(), row]));
    }

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
    const portfolioSet = new Set(portfolios.map((p) => p.userId.toString()));

    let rankings = scores.map((s, idx) => {
      const user = userMap.get(s._id.toString());
      const profile = profileMap.get(s._id.toString());

      const baseEntry = {
        rank: idx + 1,
        userId: s._id,
        displayName: user?.displayName || 'Unknown',
        overallScore: s.score || 0,
        archetype: user?.archetype || 'none',
        secondaryArchetype: user?.secondaryArchetype || 'none',
        college: profile?.college || '',
        avatarUrl: profile?.avatarUrl || null,
        hasPortfolio: portfolioSet.has(s._id.toString()),
      };

      if (mode === 'devscore') {
        return baseEntry;
      }

      const metric = metricFromPlatform(mode, {
        github: githubMap.get(s._id.toString()),
        dsa: dsaMap.get(s._id.toString()),
        platform: platformMap.get(s._id.toString()),
      });

      if (!metric.available) {
        return null;
      }

      return {
        ...baseEntry,
        metricLabel: metric.metricLabel,
        metricValue: metric.metricValue,
        metricDisplay: metric.metricDisplay,
        metricSecondary: metric.metricSecondary,
        metricSortValue: metric.sortValue,
      };
    }).filter(Boolean);

    if (mode !== 'devscore') {
      rankings.sort((a, b) => {
        const metricDiff = toNumber(b.metricSortValue, Number.NEGATIVE_INFINITY) - toNumber(a.metricSortValue, Number.NEGATIVE_INFINITY);
        if (metricDiff !== 0) return metricDiff;
        return toNumber(b.overallScore) - toNumber(a.overallScore);
      });
    }

    // Filter by college if specified
    if (college) {
      rankings = rankings.filter((r) =>
        r.college.toLowerCase().includes(college.toLowerCase())
      );
    }

    if (archetype) {
      rankings = rankings.filter((r) => r.archetype === archetype || r.secondaryArchetype === archetype);
    }

    rankings = rankings.map((r, idx) => ({ ...r, rank: idx + 1 }));

    return rankings;
  }, 600); // 10 minute TTL

  const totalItems = allRankings.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedRankings = allRankings.slice(skip, skip + limit);

  res.json({
    success: true,
    data: {
      mode,
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
