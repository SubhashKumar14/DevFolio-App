/**
 * DevScore v2.0 - production-grade developer quality score
 *
 * Adapted from documentation/devscore.ts and integrated with this codebase's
 * existing API contract and persistence shape.
 */

const SCORING_VERSION = '2.0.0';

const ALL_PLATFORMS = [
  'github',
  'leetcode',
  'codeforces',
  'hackerrank',
  'codechef',
  'kaggle',
  'huggingface',
];

const PLATFORM_LABELS = {
  github: 'GitHub',
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  hackerrank: 'HackerRank',
  codechef: 'CodeChef',
  kaggle: 'Kaggle',
  huggingface: 'Hugging Face',
};

const DOMAIN_LABELS = {
  competitive_programmer: 'Competitive Programmer',
  open_source_developer: 'Open Source Developer',
  ml_engineer: 'ML Engineer',
  data_scientist: 'Data Scientist',
  full_stack_developer: 'Full Stack Developer',
  ai_researcher: 'AI Researcher',
  all_rounder: 'All Rounder',
};

const ARCHETYPE_TO_DOMAIN = {
  builder: 'full_stack_developer',
  problem_solver: 'competitive_programmer',
  ai_engineer: 'ml_engineer',
  security_expert: 'competitive_programmer',
  open_source: 'open_source_developer',
  competitor: 'competitive_programmer',
  learner: 'all_rounder',
};

const LEGACY_DOMAIN_ALIASES = {
  competitive_programming: 'competitive_programmer',
  open_source: 'open_source_developer',
  ai_ml: 'ml_engineer',
  full_stack: 'full_stack_developer',
  security: 'competitive_programmer',
  learner: 'all_rounder',
  all_rounder: 'all_rounder',
};

const DOMAIN_AFFINITIES = {
  competitive_programmer: {
    leetcode: 1.0,
    codeforces: 1.0,
    codechef: 0.9,
    hackerrank: 0.55,
    github: 0.25,
    kaggle: 0.05,
    huggingface: 0.05,
  },
  open_source_developer: {
    github: 1.0,
    huggingface: 0.4,
    leetcode: 0.35,
    hackerrank: 0.2,
    kaggle: 0.1,
    codeforces: 0.1,
    codechef: 0.1,
  },
  ml_engineer: {
    huggingface: 1.0,
    kaggle: 0.85,
    github: 0.8,
    leetcode: 0.45,
    hackerrank: 0.15,
    codeforces: 0.1,
    codechef: 0.05,
  },
  data_scientist: {
    kaggle: 1.0,
    huggingface: 0.7,
    github: 0.65,
    leetcode: 0.35,
    hackerrank: 0.15,
    codeforces: 0.05,
    codechef: 0.05,
  },
  full_stack_developer: {
    github: 1.0,
    leetcode: 0.55,
    hackerrank: 0.45,
    huggingface: 0.25,
    codeforces: 0.15,
    kaggle: 0.1,
    codechef: 0.1,
  },
  ai_researcher: {
    huggingface: 1.0,
    kaggle: 0.8,
    github: 0.75,
    leetcode: 0.3,
    codeforces: 0.1,
    hackerrank: 0.1,
    codechef: 0.05,
  },
  all_rounder: {
    github: 0.8,
    leetcode: 0.8,
    codeforces: 0.7,
    hackerrank: 0.6,
    codechef: 0.6,
    kaggle: 0.65,
    huggingface: 0.65,
  },
};

const CF_TIERS = [
  [0, 0.0],
  [1200, 0.15],
  [1400, 0.25],
  [1600, 0.36],
  [1900, 0.52],
  [2100, 0.65],
  [2300, 0.77],
  [2400, 0.84],
  [2600, 0.92],
  [3000, 0.97],
  [3500, 1.0],
];

const LC_RATING_TIERS = [
  [0, 0.0],
  [1400, 0.2],
  [1600, 0.38],
  [1800, 0.56],
  [2000, 0.72],
  [2200, 0.84],
  [2400, 0.93],
  [2600, 1.0],
];

const CC_RATING_TIERS = [
  [0, 0.0],
  [1000, 0.1],
  [1400, 0.22],
  [1600, 0.38],
  [1800, 0.54],
  [2000, 0.68],
  [2200, 0.81],
  [2500, 0.93],
  [3000, 1.0],
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function hasOwn(data, key) {
  return !!data && Object.prototype.hasOwnProperty.call(data, key);
}

function logNorm(value, softCap) {
  if (!value || value <= 0 || softCap <= 0) return 0;
  return Math.min(1, Math.log(1 + value) / Math.log(1 + softCap));
}

function linearNorm(value, cap) {
  if (value == null || value < 0 || cap <= 0) return 0;
  return Math.min(1, value / cap);
}

function piecewiseNorm(value, tiers) {
  if (value == null || !tiers.length) return 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (value >= tiers[i][0]) {
      if (i === tiers.length - 1) return tiers[i][1];
      const r0 = tiers[i][0];
      const n0 = tiers[i][1];
      const r1 = tiers[i + 1][0];
      const n1 = tiers[i + 1][1];
      return n0 + ((value - r0) / (r1 - r0)) * (n1 - n0);
    }
  }
  return 0;
}

function geoMean(a, b) {
  return Math.sqrt(Math.max(0, a) * Math.max(0, b));
}

function recencyFactor(lastActiveDateStr, halfLifeDays = 180) {
  if (!lastActiveDateStr) return 0.55;
  const days = (Date.now() - new Date(lastActiveDateStr).getTime()) / 86400000;
  if (Number.isNaN(days) || days < 0) return 0.8;
  return Math.max(0.25, Math.pow(0.5, days / halfLifeDays));
}

function combineSignals(signals) {
  const present = signals.filter((s) => s.value !== null && s.value !== undefined && !Number.isNaN(s.value));
  if (!present.length) return { score: 0, confidence: 0 };

  const totalWeight = present.reduce((sum, s) => sum + s.weight, 0);
  const weightedScore = present.reduce((sum, s) => sum + s.value * s.weight, 0);

  return {
    score: clamp(weightedScore / Math.max(totalWeight, 1e-9), 0, 1),
    confidence: present.length / Math.max(signals.length, 1),
  };
}

function analyzeCalendar(calendar) {
  const empty = { activeWeekRate: 0, consistency: 0, densityScore: 0 };
  if (!Array.isArray(calendar) || calendar.length < 14) return empty;

  const weekMap = new Map();
  for (const day of calendar) {
    const d = new Date(day.date);
    if (Number.isNaN(d.getTime())) continue;

    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
    const weekKey = `${d.getFullYear()}-W${String(Math.floor(dayOfYear / 7)).padStart(2, '0')}`;
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + toNumber(day.count));
  }

  const allWeekCounts = Array.from(weekMap.values());
  const activeWeeks = allWeekCounts.filter((c) => c > 0);
  const activeWeekRate = allWeekCounts.length ? activeWeeks.length / allWeekCounts.length : 0;

  const mean = activeWeeks.length
    ? activeWeeks.reduce((a, b) => a + b, 0) / activeWeeks.length
    : 0;
  const variance = activeWeeks.length > 1
    ? activeWeeks.reduce((a, b) => a + (b - mean) ** 2, 0) / activeWeeks.length
    : 0;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const consistency = Math.max(0, 1 - Math.min(1, cv / 2));

  const totalContribs = calendar.reduce((sum, day) => sum + toNumber(day.count), 0);
  const activeDays = calendar.filter((d) => toNumber(d.count) > 0).length;
  const avgPerActiveDay = activeDays > 0 ? totalContribs / activeDays : 0;
  const densityScore = logNorm(avgPerActiveDay, 5);

  return { activeWeekRate, consistency, densityScore };
}

function parseStarsCount(value) {
  if (typeof value === 'number') return clamp(value, 0, 7);
  const str = String(value || '');
  const numeric = parseInt(str, 10);
  if (Number.isFinite(numeric) && numeric > 0) return clamp(numeric, 0, 7);
  const stars = (str.match(/★/g) || []).length;
  return clamp(stars, 0, 7);
}

function medalBucketTotal(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return Math.max(0, value);
  if (typeof value === 'object') {
    return Math.max(
      0,
      toNumber(value.total)
        || (toNumber(value.gold) + toNumber(value.silver) + toNumber(value.bronze))
    );
  }
  return 0;
}

function normalizeDomain(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || normalized === 'none') return 'all_rounder';
  if (DOMAIN_AFFINITIES[normalized]) return normalized;
  if (ARCHETYPE_TO_DOMAIN[normalized]) return ARCHETYPE_TO_DOMAIN[normalized];
  if (LEGACY_DOMAIN_ALIASES[normalized]) return LEGACY_DOMAIN_ALIASES[normalized];
  return 'all_rounder';
}

function scoreGitHub(data = {}) {
  const cal = analyzeCalendar(data.contributionCalendar);
  const recencyDate = data.lastSyncedAt || data.updatedAt;
  const recency = recencyFactor(recencyDate, 365);

  const consistency = cal.activeWeekRate > 0
    ? cal.activeWeekRate * 0.5 + cal.consistency * 0.3 + cal.densityScore * 0.2
    : data.totalContributionsLastYear != null
      ? logNorm(data.totalContributionsLastYear, 800)
      : null;

  const repoQuality = data.starsReceived != null || data.publicRepos != null
    ? logNorm(data.starsReceived, 1000) * 0.45
      + logNorm(data.forksCount, 200) * 0.25
      + logNorm(data.publicRepos, 50) * 0.3
    : null;

  const pullRequestsTotal = toNumber(data.pullRequestsTotal, toNumber(data.pullRequests));
  const pullRequestsMerged = toNumber(data.pullRequestsMerged, toNumber(data.pullRequests));
  const issuesOpened = toNumber(data.issuesOpened);
  const issuesClosed = toNumber(data.issuesClosed);

  const prMergeRate = pullRequestsTotal > 5 ? pullRequestsMerged / pullRequestsTotal : null;
  const prVolume = pullRequestsTotal > 0 ? logNorm(pullRequestsTotal, 200) : null;
  const issueCloseRate = issuesOpened > 3 ? issuesClosed / issuesOpened : null;

  let collaboration = null;
  if (prMergeRate !== null && prVolume !== null) {
    collaboration = prMergeRate * 0.55 + (issueCloseRate ?? 0.5) * 0.2 + prVolume * 0.25;
  } else if (issueCloseRate !== null) {
    collaboration = issueCloseRate * 0.6 + logNorm(issuesOpened, 100) * 0.4;
  } else if (prVolume !== null) {
    collaboration = prVolume * 0.5;
  }

  const streak = data.currentStreak != null || data.longestStreak != null
    ? geoMean(logNorm(data.currentStreak ?? 0, 60), logNorm(data.longestStreak ?? 0, 180))
    : null;

  const significantLangs = Array.isArray(data.languageDistribution)
    ? data.languageDistribution.filter((lang) => toNumber(lang.bytes) > 2000).length
    : null;
  const langBreadth = significantLangs != null ? logNorm(significantLangs, 8) : null;

  const organizations = Array.isArray(data.organizations)
    ? data.organizations.length
    : toNumber(data.organizations);
  const community = data.followers != null || organizations > 0
    ? logNorm(data.followers, 300) * 0.7 + logNorm(organizations, 8) * 0.3
    : null;

  const volume = data.totalCommits != null
    ? logNorm(data.totalCommits, 3000) * recency
    : data.totalContributionsLastYear != null
      ? logNorm(data.totalContributionsLastYear, 800) * recency
      : null;

  const signals = [
    { name: 'consistency', value: consistency, weight: 0.25 },
    { name: 'repo_quality', value: repoQuality, weight: 0.22 },
    { name: 'collaboration', value: collaboration, weight: 0.18 },
    { name: 'volume', value: volume, weight: 0.14 },
    { name: 'streak', value: streak, weight: 0.1 },
    { name: 'community', value: community, weight: 0.07 },
    { name: 'lang_breadth', value: langBreadth, weight: 0.04 },
  ];

  const { score, confidence } = combineSignals(signals);
  return {
    score,
    confidence: confidence * recency,
    signals: Object.fromEntries(signals.map((s) => [s.name, s.value])),
  };
}

function scoreLeetCode(data = {}) {
  const weightedSolved = data.easySolved != null || data.mediumSolved != null || data.hardSolved != null
    ? toNumber(data.easySolved) * 1 + toNumber(data.mediumSolved) * 3 + toNumber(data.hardSolved) * 7
    : null;

  const depthScore = weightedSolved != null
    ? logNorm(weightedSolved, 2000)
    : data.totalSolved != null
      ? logNorm(data.totalSolved, 1000)
      : null;

  const contestRating = data.contestRating != null && toNumber(data.contestsParticipated) > 0
    ? piecewiseNorm(data.contestRating, LC_RATING_TIERS)
    : null;

  const acceptance = data.acceptanceRate != null ? linearNorm(data.acceptanceRate, 75) : null;
  const consistency = data.activeDays != null
    ? logNorm(data.activeDays, 250)
    : data.currentStreak != null
      ? logNorm(data.currentStreak, 60)
      : null;

  const rankPercentile = data.topPercentage != null
    ? Math.max(0, 1 - toNumber(data.topPercentage) / 100)
    : null;

  const contestParticipation = data.contestsParticipated != null
    ? logNorm(data.contestsParticipated, 75)
    : null;

  const hardFocus = data.hardSolved != null ? logNorm(data.hardSolved, 200) : null;
  const badges = data.badgesEarned != null ? logNorm(data.badgesEarned, 25) : null;

  const signals = [
    { name: 'depth_score', value: depthScore, weight: 0.24 },
    { name: 'contest_rating', value: contestRating, weight: 0.22 },
    { name: 'hard_focus', value: hardFocus, weight: 0.14 },
    { name: 'consistency', value: consistency, weight: 0.13 },
    { name: 'rank_percentile', value: rankPercentile, weight: 0.11 },
    { name: 'contest_participation', value: contestParticipation, weight: 0.1 },
    { name: 'acceptance_quality', value: acceptance, weight: 0.04 },
    { name: 'badges', value: badges, weight: 0.02 },
  ];

  const result = combineSignals(signals);
  return {
    ...result,
    signals: Object.fromEntries(signals.map((s) => [s.name, s.value])),
  };
}

function scoreCodeforces(data = {}) {
  const currentRating = data.currentRating != null
    ? piecewiseNorm(data.currentRating, CF_TIERS)
    : data.rating != null
      ? piecewiseNorm(data.rating, CF_TIERS)
      : null;

  const peakRating = data.maxRating != null ? piecewiseNorm(data.maxRating, CF_TIERS) * 0.85 : null;

  const rawCurrent = toNumber(data.currentRating, toNumber(data.rating));
  const rawPeak = toNumber(data.maxRating);
  const ratingGap = rawCurrent > 0 && rawPeak > 0 ? Math.max(0, rawPeak - rawCurrent) : 0;
  const stabilityMultiplier = Math.max(0.5, 1 - ratingGap / 500);
  const effectiveCurrentRating = currentRating != null ? currentRating * stabilityMultiplier : null;

  const contestActivity = data.contestsParticipated != null ? logNorm(data.contestsParticipated, 100) : null;
  const solveVolume = data.totalSolved != null ? logNorm(data.totalSolved, 1000) : null;

  const recentActivity = (() => {
    if (!Array.isArray(data.dailySubmissions) || !data.dailySubmissions.length) return null;
    const last30 = data.dailySubmissions.filter((entry) => (Date.now() - new Date(entry.date).getTime()) / 86400000 <= 30);
    const count = last30.reduce((sum, entry) => sum + toNumber(entry.count), 0);
    return logNorm(count, 60);
  })();

  const ratingTrajectory = (() => {
    if (!Array.isArray(data.ratingHistory) || data.ratingHistory.length < 4) return null;
    const sorted = [...data.ratingHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const n = sorted.length;
    const earlyWindow = Math.min(3, n);
    const recentWindow = Math.min(5, n);

    const earlyAvg = sorted.slice(0, earlyWindow).reduce((sum, row) => sum + toNumber(row.rating, toNumber(row.newRating)), 0) / earlyWindow;
    const recentAvg = sorted.slice(-recentWindow).reduce((sum, row) => sum + toNumber(row.rating, toNumber(row.newRating)), 0) / recentWindow;

    return linearNorm(recentAvg - earlyAvg + 500, 1000);
  })();

  const signals = [
    { name: 'current_rating', value: effectiveCurrentRating, weight: 0.36 },
    { name: 'peak_rating', value: peakRating, weight: 0.14 },
    { name: 'contest_activity', value: contestActivity, weight: 0.22 },
    { name: 'solve_volume', value: solveVolume, weight: 0.14 },
    { name: 'recent_activity', value: recentActivity, weight: 0.1 },
    { name: 'trajectory', value: ratingTrajectory, weight: 0.04 },
  ];

  const result = combineSignals(signals);
  return {
    ...result,
    signals: Object.fromEntries(signals.map((s) => [s.name, s.value])),
  };
}

function scoreHackerRank(data = {}) {
  const starScore = data.totalStars != null ? logNorm(data.totalStars, 80) : null;

  const badgeQuality = Array.isArray(data.badges)
    ? logNorm(data.badges.filter((b) => toNumber(b.stars) >= 4).length, 10) * 0.6
      + logNorm(data.totalBadges ?? 0, 20) * 0.4
    : data.totalBadges != null
      ? logNorm(data.totalBadges, 20)
      : null;

  const levelMap = {
    emerging: 0.15,
    developer: 0.3,
    intermediate: 0.5,
    expert: 0.75,
    professional: 0.9,
    master: 1.0,
  };

  let levelScore = null;
  if (typeof data.level === 'number') {
    levelScore = linearNorm(data.level, 10);
  } else if (typeof data.level === 'string') {
    levelScore = levelMap[String(data.level).trim().toLowerCase()] ?? 0.2;
  }

  const contestScore = data.contestsParticipated != null ? logNorm(data.contestsParticipated, 30) : null;

  const domainBreadth = Array.isArray(data.badges)
    ? logNorm(data.badges.filter((b) => toNumber(b.stars) >= 3).length, 6)
    : data.domainScores && typeof data.domainScores === 'object'
      ? logNorm(Object.keys(data.domainScores).length, 6)
      : null;

  const signals = [
    { name: 'stars', value: starScore, weight: 0.32 },
    { name: 'badge_quality', value: badgeQuality, weight: 0.24 },
    { name: 'level', value: levelScore, weight: 0.22 },
    { name: 'domain_breadth', value: domainBreadth, weight: 0.12 },
    { name: 'contests', value: contestScore, weight: 0.1 },
  ];

  const result = combineSignals(signals);
  return {
    ...result,
    signals: Object.fromEntries(signals.map((s) => [s.name, s.value])),
  };
}

function scoreCodeChef(data = {}) {
  const starsCount = data.starsCount != null ? data.starsCount : parseStarsCount(data.stars);

  const currentRating = data.currentRating != null ? piecewiseNorm(data.currentRating, CC_RATING_TIERS) : null;
  const peakRating = data.highestRating != null ? piecewiseNorm(data.highestRating, CC_RATING_TIERS) * 0.8 : null;

  const ratingScore = currentRating != null || peakRating != null
    ? (currentRating ?? 0) * 0.7 + (peakRating ?? 0) * 0.3
    : null;

  const solveVolume = data.fullySolvedCount != null
    ? logNorm(data.fullySolvedCount, 500)
    : data.problemsSolved != null
      ? logNorm(data.problemsSolved, 500)
      : null;

  const contestActivity = data.contestCount != null ? logNorm(data.contestCount, 100) : null;

  const globalRankScore = data.globalRank != null && data.globalRank > 0
    ? Math.max(0, 1 - Math.log10(data.globalRank) / Math.log10(200000))
    : null;

  const starScore = starsCount != null ? linearNorm(starsCount, 7) : null;

  const signals = [
    { name: 'rating', value: ratingScore, weight: 0.4 },
    { name: 'solve_volume', value: solveVolume, weight: 0.22 },
    { name: 'contest', value: contestActivity, weight: 0.18 },
    { name: 'global_rank', value: globalRankScore, weight: 0.12 },
    { name: 'stars', value: starScore, weight: 0.08 },
  ];

  const result = combineSignals(signals);
  return {
    ...result,
    signals: Object.fromEntries(signals.map((s) => [s.name, s.value])),
  };
}

function scoreKaggle(data = {}) {
  const tierScores = {
    novice: 0.05,
    contributor: 0.2,
    expert: 0.48,
    master: 0.73,
    grandmaster: 0.93,
  };

  const tierKey = String(data.tier || '').trim().toLowerCase();
  const tierScore = tierKey ? (tierScores[tierKey] ?? 0.05) : null;

  const medalPoints = data.goldMedals != null || data.silverMedals != null || data.bronzeMedals != null
    ? toNumber(data.goldMedals) * 3 + toNumber(data.silverMedals) * 2 + toNumber(data.bronzeMedals)
    : data.totalMedals != null
      ? toNumber(data.totalMedals)
      : null;
  const medalScore = medalPoints != null ? logNorm(medalPoints, 25) : null;

  const competitionMedals = medalBucketTotal(data.competitionMedals);
  const notebookMedals = medalBucketTotal(data.notebookMedals);
  const datasetMedals = medalBucketTotal(data.datasetMedals);

  const medalDiversityBonus = competitionMedals > 0 && notebookMedals > 0 && datasetMedals > 0 ? 0.06 : 0;

  const notebookImpact = data.notebookVotesReceived != null ? logNorm(data.notebookVotesReceived, 500) : null;
  const datasetImpact = data.datasetDownloads != null ? logNorm(data.datasetDownloads, 10000) : null;
  const community = data.followers != null ? logNorm(data.followers, 500) : null;
  const competitionActivity = data.competitionsCount != null ? logNorm(data.competitionsCount, 50) : null;

  const signals = [
    { name: 'tier', value: tierScore, weight: 0.35 },
    {
      name: 'medals',
      value: medalScore != null ? Math.min(1, medalScore + medalDiversityBonus) : null,
      weight: 0.27,
    },
    { name: 'notebook_impact', value: notebookImpact, weight: 0.16 },
    { name: 'dataset_impact', value: datasetImpact, weight: 0.1 },
    { name: 'competition_activity', value: competitionActivity, weight: 0.07 },
    { name: 'community', value: community, weight: 0.05 },
  ];

  const result = combineSignals(signals);
  return {
    ...result,
    signals: Object.fromEntries(signals.map((s) => [s.name, s.value])),
  };
}

function scoreHuggingFace(data = {}) {
  let totalDownloads = toNumber(data.modelDownloads) + toNumber(data.datasetDownloads) * 0.5;
  if (totalDownloads <= 0 && data.totalDownloads != null) {
    totalDownloads = toNumber(data.totalDownloads);
  }

  const downloadImpact = totalDownloads > 0 ? logNorm(totalDownloads, 100000) : null;
  const modelDepth = data.modelsPublished != null ? logNorm(data.modelsPublished, 20) : null;

  const contentTotal = data.modelsPublished != null || data.datasetsPublished != null || data.spacesCreated != null
    ? toNumber(data.modelsPublished)
      + toNumber(data.datasetsPublished) * 1.2
      + toNumber(data.spacesCreated) * 0.8
    : null;
  const contentBreadth = contentTotal != null ? logNorm(contentTotal, 40) : null;

  const likeScore = data.totalLikes != null
    ? logNorm(data.totalLikes, 1000)
    : data.spacesLikes != null
      ? logNorm(data.spacesLikes, 200)
      : null;

  const community = data.followers != null ? logNorm(data.followers, 1000) : null;

  const pipelineDiversity = Array.isArray(data.topModels) && data.topModels.length
    ? logNorm(
      new Set(data.topModels.map((model) => model.pipeline || model.pipeline_tag).filter(Boolean)).size,
      5
    )
    : null;

  const signals = [
    { name: 'download_impact', value: downloadImpact, weight: 0.3 },
    { name: 'model_depth', value: modelDepth, weight: 0.24 },
    { name: 'content_breadth', value: contentBreadth, weight: 0.18 },
    { name: 'likes', value: likeScore, weight: 0.14 },
    { name: 'community', value: community, weight: 0.08 },
    { name: 'pipeline_diversity', value: pipelineDiversity, weight: 0.06 },
  ];

  const result = combineSignals(signals);
  return {
    ...result,
    signals: Object.fromEntries(signals.map((s) => [s.name, s.value])),
  };
}

const PLATFORM_SCORERS = {
  github: scoreGitHub,
  leetcode: scoreLeetCode,
  codeforces: scoreCodeforces,
  hackerrank: scoreHackerRank,
  codechef: scoreCodeChef,
  kaggle: scoreKaggle,
  huggingface: scoreHuggingFace,
};

function aggregatePlatforms(platformResults, domain, secondaryDomain) {
  const primaryAff = DOMAIN_AFFINITIES[domain] || DOMAIN_AFFINITIES.all_rounder;
  const secondaryAff = secondaryDomain ? (DOMAIN_AFFINITIES[secondaryDomain] || primaryAff) : null;

  let weightedSum = 0;
  let totalWeight = 0;
  let activePlatformCount = 0;
  const effectiveWeights = {};

  for (const platform of ALL_PLATFORMS) {
    const result = platformResults[platform];
    if (!result) continue;

    if (result.score < 0.12 && result.confidence < 0.28) continue;

    const primaryAffinity = toNumber(primaryAff[platform]);
    const secondaryAffinity = secondaryAff ? toNumber(secondaryAff[platform]) : primaryAffinity;
    const blendedAffinity = secondaryDomain
      ? primaryAffinity * 0.7 + secondaryAffinity * 0.3
      : primaryAffinity;

    const effectiveWeight = blendedAffinity * (0.35 + 0.65 * result.confidence);
    if (effectiveWeight <= 0) continue;

    weightedSum += result.score * effectiveWeight;
    totalWeight += effectiveWeight;
    effectiveWeights[platform] = effectiveWeight;

    if (result.score >= 0.2) activePlatformCount += 1;
  }

  if (totalWeight <= 0) {
    return {
      rawRatio: 0,
      normalizedWeights: {},
      activePlatformCount: 0,
    };
  }

  const baseScore = weightedSum / totalWeight;
  const breadthBonus = Math.min(0.06, Math.max(0, activePlatformCount - 1) * 0.015);
  const rawRatio = Math.min(1, baseScore + breadthBonus);

  const normalizedWeights = Object.fromEntries(
    Object.entries(effectiveWeights).map(([platform, weight]) => [platform, weight / totalWeight])
  );

  return {
    rawRatio,
    normalizedWeights,
    activePlatformCount,
  };
}

function computePillars(platformResults) {
  const scoreOf = (platform) => platformResults[platform]?.score ?? null;
  const confidenceOf = (platform) => platformResults[platform]?.confidence ?? 0;
  const signalOf = (platform, signalId) => platformResults[platform]?.signals?.[signalId] ?? null;

  const problemSolving = combineSignals([
    { name: 'leetcode', value: scoreOf('leetcode'), weight: 1.0 * confidenceOf('leetcode') },
    { name: 'codeforces', value: scoreOf('codeforces'), weight: 1.0 * confidenceOf('codeforces') },
    { name: 'codechef', value: scoreOf('codechef'), weight: 0.75 * confidenceOf('codechef') },
    { name: 'hackerrank', value: scoreOf('hackerrank'), weight: 0.5 * confidenceOf('hackerrank') },
  ]);

  const building = combineSignals([
    { name: 'gh_repos', value: signalOf('github', 'repo_quality'), weight: 1.0 },
    { name: 'hf_models', value: signalOf('huggingface', 'model_depth'), weight: 0.9 },
    { name: 'hf_breadth', value: signalOf('huggingface', 'content_breadth'), weight: 0.7 },
    { name: 'kg_nb', value: signalOf('kaggle', 'notebook_impact'), weight: 0.6 },
  ]);

  const community = combineSignals([
    { name: 'gh_community', value: signalOf('github', 'community'), weight: 1.0 },
    { name: 'gh_stars', value: signalOf('github', 'repo_quality'), weight: 0.8 },
    { name: 'hf_downloads', value: signalOf('huggingface', 'download_impact'), weight: 0.7 },
    { name: 'hf_likes', value: signalOf('huggingface', 'likes'), weight: 0.6 },
    { name: 'kg_community', value: signalOf('kaggle', 'community'), weight: 0.5 },
    { name: 'kg_nb_votes', value: signalOf('kaggle', 'notebook_impact'), weight: 0.45 },
  ]);

  const consistency = combineSignals([
    { name: 'gh_consistency', value: signalOf('github', 'consistency'), weight: 1.0 },
    { name: 'gh_streak', value: signalOf('github', 'streak'), weight: 0.8 },
    { name: 'lc_consistency', value: signalOf('leetcode', 'consistency'), weight: 0.9 },
    { name: 'cf_recent', value: signalOf('codeforces', 'recent_activity'), weight: 0.7 },
    { name: 'cf_trajectory', value: signalOf('codeforces', 'trajectory'), weight: 0.4 },
  ]);

  const specialization = combineSignals([
    { name: 'lc_hard', value: signalOf('leetcode', 'hard_focus'), weight: 0.9 },
    { name: 'cf_rating', value: signalOf('codeforces', 'current_rating'), weight: 0.9 },
    { name: 'hf_pipeline', value: signalOf('huggingface', 'pipeline_diversity'), weight: 0.8 },
    { name: 'kg_tier', value: signalOf('kaggle', 'tier'), weight: 0.85 },
    { name: 'gh_collab', value: signalOf('github', 'collaboration'), weight: 0.7 },
  ]);

  return {
    problemSolving: Math.round(problemSolving.score * 100),
    building: Math.round(building.score * 100),
    community: Math.round(community.score * 100),
    consistency: Math.round(consistency.score * 100),
    specialization: Math.round(specialization.score * 100),
  };
}

function transformToDevScore(rawRatio) {
  const clamped = clamp(rawRatio, 0, 1);
  return Math.round(Math.pow(clamped, 1.15) * 1000);
}

function gradeFromDevScore(score) {
  if (score >= 920) return 'S';
  if (score >= 820) return 'A+';
  if (score >= 700) return 'A';
  if (score >= 580) return 'B+';
  if (score >= 450) return 'B';
  if (score >= 300) return 'C+';
  if (score >= 180) return 'C';
  return 'D';
}

function pillarGradeFromPercentile(percentile) {
  if (percentile >= 95) return 'A+';
  if (percentile >= 85) return 'A';
  if (percentile >= 75) return 'B+';
  if (percentile >= 65) return 'B';
  if (percentile >= 55) return 'C+';
  if (percentile >= 45) return 'C';
  if (percentile >= 35) return 'D';
  return 'F';
}

function toLegacyPillar(percentileValue) {
  const percentile = Math.round(clamp(toNumber(percentileValue), 0, 100));
  return {
    score: Math.round((percentile / 100) * 200),
    max: 200,
    percentile,
    grade: pillarGradeFromPercentile(percentile),
  };
}

function formatSignalName(signalId) {
  return String(signalId || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getSignalEntries(platformResults) {
  const entries = [];

  for (const platform of ALL_PLATFORMS) {
    const result = platformResults[platform];
    if (!result) continue;

    for (const [signalId, signalValue] of Object.entries(result.signals || {})) {
      if (signalValue == null || Number.isNaN(signalValue)) continue;
      const score = Math.round(clamp(signalValue, 0, 1) * 100);

      entries.push({
        key: `${platform}.${signalId}`,
        platform,
        platformLabel: PLATFORM_LABELS[platform] || platform,
        signalId,
        metric: formatSignalName(signalId),
        score,
        value: signalValue,
      });
    }
  }

  entries.sort((a, b) => b.value - a.value);
  return entries;
}

function computeDiagnostics(domain, platformResults) {
  const connectedPlatforms = ALL_PLATFORMS.filter((platform) => platformResults[platform] != null);
  const activePlatforms = ALL_PLATFORMS.filter(
    (platform) => (platformResults[platform]?.score ?? 0) >= 0.2 && (platformResults[platform]?.confidence ?? 0) >= 0.28
  );

  const allSignals = getSignalEntries(platformResults);
  const strongestSignals = allSignals.slice(0, 5);
  const weakSignals = allSignals.filter((signal) => signal.value < 0.3).slice(-5);

  const strongestSignalKeys = strongestSignals.map((signal) => signal.key);
  const weakSignalKeys = weakSignals.map((signal) => signal.key);

  const affinities = DOMAIN_AFFINITIES[domain] || DOMAIN_AFFINITIES.all_rounder;
  const actualAffinity = connectedPlatforms.reduce((sum, platform) => sum + toNumber(affinities[platform]), 0);
  const maxAffinity = ALL_PLATFORMS.reduce((sum, platform) => sum + toNumber(affinities[platform]), 0);
  const domainFitScore = maxAffinity > 0 ? Math.round((actualAffinity / maxAffinity) * 100) : 0;

  const domainScores = Object.keys(DOMAIN_AFFINITIES).map((domainId) => ({
    domain: domainId,
    score: activePlatforms.reduce(
      (sum, platform) => sum + toNumber(DOMAIN_AFFINITIES[domainId][platform]) * toNumber(platformResults[platform]?.score),
      0
    ),
  }));

  domainScores.sort((a, b) => b.score - a.score);
  const suggestedDomain = domainScores[0]?.domain || 'all_rounder';

  const unconnectedPlatforms = ALL_PLATFORMS.filter((platform) => !platformResults[platform]);
  const unconnectedPlatformRecommendations = unconnectedPlatforms
    .filter((platform) => toNumber(affinities[platform]) >= 0.45)
    .sort((a, b) => toNumber(affinities[b]) - toNumber(affinities[a]))
    .slice(0, 3)
    .map((platform) => ({
      platform,
      platformLabel: PLATFORM_LABELS[platform] || platform,
      expectedWeight: Math.round(toNumber(affinities[platform]) * 100),
      reason: `High relevance for ${DOMAIN_LABELS[domain] || 'selected domain'}`,
    }));

  const totalConfidence = connectedPlatforms.length
    ? Math.round((connectedPlatforms.reduce((sum, platform) => sum + toNumber(platformResults[platform]?.confidence), 0) / connectedPlatforms.length) * 100) / 100
    : 0;

  const domainFitCandidates = domainScores.slice(0, 5).map((entry) => ({
    domain: entry.domain,
    label: DOMAIN_LABELS[entry.domain] || entry.domain,
    score: Math.round(entry.score * 100),
  }));

  return {
    strongestSignals,
    weakSignals,
    strongestSignalKeys,
    weakSignalKeys,
    domainFitScore,
    suggestedDomain,
    suggestedDomainLabel: DOMAIN_LABELS[suggestedDomain] || suggestedDomain,
    unconnectedPlatformRecommendations,
    totalConfidence,
    connectedPlatforms,
    activePlatforms,
    domainFitCandidates,
  };
}

function buildStrengths(diagnostics) {
  return diagnostics.strongestSignals.slice(0, 3).map((signal) => {
    return `${signal.metric} on ${signal.platformLabel} is strong (${Math.round(signal.score)}/100)`;
  });
}

function buildImprovements(diagnostics) {
  const improvements = [];

  for (const signal of diagnostics.weakSignals.slice(0, 3)) {
    improvements.push(`Improve ${String(signal.metric).toLowerCase()} on ${signal.platformLabel} (${Math.round(signal.score)}/100)`);
  }

  for (const recommendation of diagnostics.unconnectedPlatformRecommendations.slice(0, 2)) {
    improvements.push(`Connect ${recommendation.platformLabel} to strengthen your ${recommendation.expectedWeight}% domain coverage`);
  }

  return improvements;
}

export function computeDevScore({
  archetype,
  secondaryArchetype,
  domain,
  secondaryDomain,
  platformData = {},
} = {}) {
  const safeArchetype = archetype || 'none';
  const safeSecondaryArchetype = secondaryArchetype || 'none';

  const selectedDomain = normalizeDomain(domain || archetype);
  const hasSecondaryDomain = Boolean(
    (secondaryDomain && String(secondaryDomain).toLowerCase() !== 'none')
      || (secondaryArchetype && String(secondaryArchetype).toLowerCase() !== 'none')
  );

  let resolvedSecondaryDomain = hasSecondaryDomain
    ? normalizeDomain(secondaryDomain || secondaryArchetype)
    : null;

  if (resolvedSecondaryDomain === selectedDomain) {
    resolvedSecondaryDomain = null;
  }

  const connectedPlatforms = ALL_PLATFORMS.filter((platform) => {
    const value = platformData[platform];
    return value && typeof value === 'object' && Object.keys(value).length > 0;
  });

  const platformResults = {};
  for (const platform of connectedPlatforms) {
    const scorer = PLATFORM_SCORERS[platform];
    if (!scorer) continue;
    platformResults[platform] = scorer(platformData[platform] || {});
  }

  const aggregation = aggregatePlatforms(platformResults, selectedDomain, resolvedSecondaryDomain);
  const rawRatio = aggregation.rawRatio;

  const overallScore = transformToDevScore(rawRatio);
  const rawScore = Math.round(rawRatio * 100);
  const weightedRawScore = rawScore;

  const rawPillars = computePillars(platformResults);
  const pillars = {
    problemSolving: toLegacyPillar(rawPillars.problemSolving),
    building: toLegacyPillar(rawPillars.building),
    community: toLegacyPillar(rawPillars.community),
    consistency: toLegacyPillar(rawPillars.consistency),
    specialization: toLegacyPillar(rawPillars.specialization),
  };

  const diagnosticsBase = computeDiagnostics(selectedDomain, platformResults);
  const diagnostics = {
    selectedDomain,
    selectedDomainLabel: DOMAIN_LABELS[selectedDomain] || 'All Rounder',
    ...diagnosticsBase,
  };

  const platformScores = {};
  for (const platform of connectedPlatforms) {
    const result = platformResults[platform];
    const normalizedWeight = toNumber(aggregation.normalizedWeights[platform]);

    platformScores[platform] = {
      platformLabel: PLATFORM_LABELS[platform] || platform,
      score: Math.round(toNumber(result?.score) * 10000) / 100,
      confidence: Math.round(toNumber(result?.confidence) * 100) / 100,
      coverage: Math.round(toNumber(result?.confidence) * 100) / 100,
      weight: Math.round(normalizedWeight * 10000) / 10000,
      active: normalizedWeight > 0,
    };
  }

  const strengths = buildStrengths(diagnostics);
  const improvements = buildImprovements(diagnostics);

  return {
    overallScore,
    devScore: overallScore,
    maxScore: 1000,
    rawScore,
    weightedRawScore,
    grade: gradeFromDevScore(overallScore),

    archetype: safeArchetype,
    secondaryArchetype: safeSecondaryArchetype,
    domain: selectedDomain,
    domainLabel: DOMAIN_LABELS[selectedDomain] || 'All Rounder',

    connectedPlatforms: connectedPlatforms.length,
    pillars,
    strengths,
    improvements,
    platformScores,
    diagnostics,

    meta: {
      scoringVersion: SCORING_VERSION,
      timestamp: new Date().toISOString(),
    },
  };
}

export default computeDevScore;
