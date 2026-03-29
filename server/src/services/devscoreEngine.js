/**
 * DevScore v3 — Fair quality-first scoring engine (0-1000)
 *
 * Layer 1: Per-platform normalized signal scoring (0-100)
 * Layer 2: Domain weight matrix with connected-platform redistribution
 * Layer 3: Non-linear amplification from raw (0-100) to DevScore (0-1000)
 * Layer 4: Diagnostics and guidance
 */

const DOMAIN_WEIGHT_MATRIX = {
  competitive_programming: {
    leetcode: 35,
    codeforces: 30,
    codechef: 20,
    github: 10,
    hackerrank: 5,
  },
  open_source: {
    github: 45,
    gitlab: 20,
    stackoverflow: 10,
    devto: 10,
    leetcode: 10,
    huggingface: 5,
  },
  ai_ml: {
    kaggle: 30,
    huggingface: 30,
    github: 20,
    leetcode: 10,
    stackoverflow: 5,
    devto: 5,
  },
  full_stack: {
    github: 30,
    stackoverflow: 20,
    leetcode: 15,
    devto: 15,
    gitlab: 10,
    hackerrank: 10,
  },
  mobile: {
    playstore: 40,
    github: 25,
    stackoverflow: 10,
    leetcode: 10,
    codeforces: 5,
    devto: 10,
  },
  data_science: {
    kaggle: 40,
    github: 20,
    stackoverflow: 15,
    leetcode: 10,
    huggingface: 10,
    devto: 5,
  },
  security: {
    tryhackme: 35,
    github: 20,
    stackoverflow: 15,
    codeforces: 10,
    hackerrank: 10,
    devto: 10,
  },
  learner: {
    leetcode: 20,
    github: 20,
    hackerrank: 15,
    freecodecamp: 15,
    codeforces: 10,
    stackoverflow: 10,
    devto: 10,
  },
  all_rounder: {},
};

const DOMAIN_LABELS = {
  competitive_programming: 'Competitive Programming',
  open_source: 'Open Source',
  ai_ml: 'AI/ML',
  full_stack: 'Full Stack',
  mobile: 'Mobile',
  data_science: 'Data Science',
  security: 'Security',
  learner: 'Learner',
  all_rounder: 'All Rounder',
};

const ARCHETYPE_DOMAIN_MAP = {
  builder: 'full_stack',
  problem_solver: 'competitive_programming',
  ai_engineer: 'ai_ml',
  security_expert: 'security',
  open_source: 'open_source',
  competitor: 'competitive_programming',
  learner: 'learner',
};

const PLATFORM_LABELS = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  github: 'GitHub',
  gitlab: 'GitLab',
  kaggle: 'Kaggle',
  huggingface: 'Hugging Face',
  hackerrank: 'HackerRank',
  freecodecamp: 'freeCodeCamp',
  stackoverflow: 'Stack Overflow',
  devto: 'Dev.to',
  replit: 'Replit',
  codesandbox: 'CodeSandbox',
  playstore: 'Play Store',
  roboflow: 'Roboflow',
  geeksforgeeks: 'GeeksforGeeks',
  atcoder: 'AtCoder',
  hackerearth: 'HackerEarth',
  tryhackme: 'TryHackMe',
  codesignal: 'CodeSignal',
};

const PLATFORM_WEIGHT_ALIAS = {
  atcoder: 'codeforces',
  geeksforgeeks: 'leetcode',
  hackerearth: 'hackerrank',
  codesignal: 'hackerrank',
};

const PILLAR_WEIGHTS = {
  problemSolving: {
    leetcode: 28,
    codeforces: 24,
    codechef: 12,
    atcoder: 12,
    hackerrank: 8,
    geeksforgeeks: 8,
    hackerearth: 5,
    codesignal: 3,
  },
  building: {
    github: 35,
    gitlab: 20,
    huggingface: 12,
    kaggle: 10,
    playstore: 8,
    replit: 8,
    codesandbox: 7,
  },
  community: {
    stackoverflow: 35,
    devto: 25,
    github: 15,
    kaggle: 10,
    huggingface: 8,
    gitlab: 7,
  },
  consistency: {
    github: 22,
    leetcode: 18,
    codeforces: 14,
    hackerrank: 10,
    devto: 9,
    kaggle: 7,
    gitlab: 7,
    atcoder: 7,
    tryhackme: 6,
  },
};

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

function hasAnyOwn(data, keys) {
  return keys.some((key) => hasOwn(data, key));
}

function scaleLinear(value, min, max) {
  const v = toNumber(value);
  if (max <= min) return 0;
  return clamp(((v - min) / (max - min)) * 100, 0, 100);
}

function scaleInverse(value, best, worst) {
  const v = toNumber(value);
  if (worst <= best) return 0;
  return clamp(((worst - v) / (worst - best)) * 100, 0, 100);
}

function scaleLog(value, fullAt) {
  const v = Math.max(0, toNumber(value));
  const cap = Math.max(1, toNumber(fullAt, 1));
  return clamp((Math.log1p(v) / Math.log1p(cap)) * 100, 0, 100);
}

function parseStarCount(value) {
  if (typeof value === 'number') return clamp(value, 0, 7);
  const str = String(value || '');
  const numeric = parseInt(str, 10);
  if (Number.isFinite(numeric) && numeric > 0) return clamp(numeric, 0, 7);
  const stars = (str.match(/★/g) || []).length;
  return clamp(stars, 0, 7);
}

function activityDaysInWindow(series = [], days = 90) {
  if (!Array.isArray(series) || series.length === 0) return 0;
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days + 1);
  let count = 0;
  for (const entry of series) {
    const dateStr = entry?.date;
    if (!dateStr) continue;
    const day = new Date(`${dateStr}T00:00:00.000Z`);
    if (Number.isNaN(day.getTime())) continue;
    if (day >= cutoff && toNumber(entry?.count) > 0) count += 1;
  }
  return count;
}

function makeSignal({ id, label, weight, score, available = true, rawValue = null }) {
  return {
    id,
    label,
    weight: toNumber(weight),
    score: clamp(toNumber(score), 0, 100),
    available: !!available,
    rawValue,
  };
}

function finalizePlatformScore(platform, signals) {
  const availableSignals = signals.filter((s) => s.available && s.weight > 0);
  const weightSum = availableSignals.reduce((sum, s) => sum + s.weight, 0);

  if (weightSum <= 0) {
    return {
      platform,
      score: 0,
      coverage: 0,
      signals: signals.map((s) => ({
        ...s,
        effectiveWeight: 0,
      })),
    };
  }

  let weighted = 0;
  const normalizedSignals = signals.map((s) => {
    const effectiveWeight = s.available ? (s.weight / weightSum) : 0;
    weighted += s.score * effectiveWeight;
    return {
      ...s,
      effectiveWeight,
    };
  });

  return {
    platform,
    score: clamp(weighted, 0, 100),
    coverage: availableSignals.length / Math.max(1, signals.length),
    signals: normalizedSignals,
  };
}

function codeforcesTierScore(rating) {
  const r = toNumber(rating);
  if (r >= 2400) return 100;
  if (r >= 2100) return 90;
  if (r >= 1900) return 80;
  if (r >= 1600) return 65;
  if (r >= 1400) return 50;
  if (r >= 1200) return 35;
  return 20;
}

function kaggleTierScore(tier) {
  const t = String(tier || '').toLowerCase();
  if (t.includes('grandmaster')) return 100;
  if (t.includes('master')) return 90;
  if (t.includes('expert')) return 75;
  if (t.includes('contributor')) return 55;
  if (t.includes('novice')) return 35;
  return 15;
}

function scoreLeetcode(data = {}) {
  const totalSolved = toNumber(data.totalSolved);
  const easySolved = toNumber(data.easySolved);
  const mediumSolved = toNumber(data.mediumSolved);
  const hardSolved = toNumber(data.hardSolved);
  const weightedSolved = easySolved * 0.5 + mediumSolved + hardSolved * 2;
  const activeDays90 = activityDaysInWindow(data.dailyActivity, 90) || toNumber(data.activeDays);
  const contestRating = toNumber(data.contestRating ?? data.rating);
  const topPercentage = toNumber(data.topPercentage);
  const contestsParticipated = toNumber(data.contestsParticipated);
  const badges = toNumber(data.badgesEarned ?? data.badges);

  const signals = [
    makeSignal({
      id: 'contest_rating',
      label: 'Contest rating percentile',
      weight: 0.18,
      score: scaleLinear(contestRating, 1100, 2500),
      available: hasAnyOwn(data, ['contestRating', 'rating']),
      rawValue: contestRating,
    }),
    makeSignal({
      id: 'problem_tier',
      label: 'Problem solving depth',
      weight: 0.24,
      score: scaleLog(weightedSolved, 700),
      available: hasAnyOwn(data, ['totalSolved', 'easySolved', 'mediumSolved', 'hardSolved']),
      rawValue: { totalSolved, weightedSolved },
    }),
    makeSignal({
      id: 'acceptance_rate',
      label: 'Acceptance quality',
      weight: 0.11,
      score: scaleLinear(data.acceptanceRate, 25, 70),
      available: hasOwn(data, 'acceptanceRate'),
      rawValue: toNumber(data.acceptanceRate),
    }),
    makeSignal({
      id: 'consistency_90d',
      label: '90-day consistency',
      weight: 0.14,
      score: scaleLinear(activeDays90, 5, 90),
      available: Array.isArray(data.dailyActivity) || hasOwn(data, 'activeDays'),
      rawValue: activeDays90,
    }),
    makeSignal({
      id: 'top_percentile_rank',
      label: 'Global rank percentile',
      weight: 0.1,
      score: scaleInverse(topPercentage, 1, 60),
      available: hasOwn(data, 'topPercentage'),
      rawValue: topPercentage,
    }),
    makeSignal({
      id: 'contest_attendance',
      label: 'Contest attendance',
      weight: 0.11,
      score: scaleLog(contestsParticipated, 60),
      available: hasOwn(data, 'contestsParticipated'),
      rawValue: contestsParticipated,
    }),
    makeSignal({
      id: 'badges',
      label: 'Badges earned',
      weight: 0.05,
      score: scaleLog(badges, 20),
      available: hasAnyOwn(data, ['badgesEarned', 'badges']),
      rawValue: badges,
    }),
    makeSignal({
      id: 'category_depth',
      label: 'Category hard-problem depth',
      weight: 0.07,
      score: scaleLinear(hardSolved, 8, 120),
      available: hasOwn(data, 'hardSolved'),
      rawValue: hardSolved,
    }),
  ];

  return finalizePlatformScore('leetcode', signals);
}

function scoreCodeforces(data = {}) {
  const currentRating = toNumber(data.currentRating ?? data.rating);
  const maxRating = toNumber(data.maxRating);
  const contests = toNumber(data.contestsParticipated);
  const solved = toNumber(data.totalSolved);
  const recentActiveDays = activityDaysInWindow(data.dailySubmissions, 90);

  const signals = [
    makeSignal({
      id: 'rating_tier',
      label: 'Current rating tier',
      weight: 0.34,
      score: codeforcesTierScore(currentRating),
      available: hasAnyOwn(data, ['currentRating', 'rating']),
      rawValue: currentRating,
    }),
    makeSignal({
      id: 'peak_rating',
      label: 'Peak rating',
      weight: 0.18,
      score: codeforcesTierScore(maxRating),
      available: hasOwn(data, 'maxRating'),
      rawValue: maxRating,
    }),
    makeSignal({
      id: 'contest_count',
      label: 'Contest participation count',
      weight: 0.2,
      score: scaleLog(contests, 80),
      available: hasOwn(data, 'contestsParticipated'),
      rawValue: contests,
    }),
    makeSignal({
      id: 'solve_count_quality',
      label: 'Accepted solve volume',
      weight: 0.16,
      score: scaleLog(solved, 900),
      available: hasOwn(data, 'totalSolved'),
      rawValue: solved,
    }),
    makeSignal({
      id: 'recent_activity',
      label: 'Recent contest activity',
      weight: 0.12,
      score: scaleLinear(recentActiveDays, 5, 80),
      available: Array.isArray(data.dailySubmissions),
      rawValue: recentActiveDays,
    }),
  ];

  return finalizePlatformScore('codeforces', signals);
}

function scoreGithub(data = {}) {
  const publicRepos = toNumber(data.publicRepos);
  const stars = toNumber(data.starsReceived ?? data.totalStars);
  const forks = toNumber(data.forksCount ?? data.totalForks);
  const watchers = toNumber(data.watchers ?? data.subscribers);
  const pullRequests = toNumber(data.pullRequests ?? data.externalPullRequests);
  const issues = toNumber(data.issuesCreated ?? data.issues);
  const currentStreak = toNumber(data.currentStreak);
  const longestStreak = toNumber(data.longestStreak);
  const activeDays365 = activityDaysInWindow(data.contributionCalendar, 365);
  const languageCount = Array.isArray(data.languageDistribution)
    ? data.languageDistribution.length
    : Array.isArray(data.languages)
      ? data.languages.length
      : 0;
  const repoQualityRaw = stars * 3 + forks * 2 + watchers + publicRepos * 0.5;

  const signals = [
    makeSignal({
      id: 'consistency_365d',
      label: '365-day contribution consistency',
      weight: 0.26,
      score: scaleLinear(activeDays365, 30, 330),
      available: Array.isArray(data.contributionCalendar),
      rawValue: activeDays365,
    }),
    makeSignal({
      id: 'repo_quality',
      label: 'Repository quality signal',
      weight: 0.24,
      score: scaleLog(repoQualityRaw, 2500),
      available: hasAnyOwn(data, ['starsReceived', 'totalStars', 'forksCount', 'totalForks', 'publicRepos']),
      rawValue: repoQualityRaw,
    }),
    makeSignal({
      id: 'language_breadth',
      label: 'Language breadth',
      weight: 0.14,
      score: scaleLog(languageCount, 10),
      available: Array.isArray(data.languageDistribution) || Array.isArray(data.languages),
      rawValue: languageCount,
    }),
    makeSignal({
      id: 'external_contrib',
      label: 'External collaboration (PR/issues)',
      weight: 0.18,
      score: scaleLog(pullRequests + issues, 250),
      available: hasAnyOwn(data, ['pullRequests', 'externalPullRequests', 'issuesCreated', 'issues']),
      rawValue: pullRequests + issues,
    }),
    makeSignal({
      id: 'streak_quality',
      label: 'Contribution streak quality',
      weight: 0.1,
      score: scaleLinear(currentStreak * 0.7 + longestStreak * 0.3, 7, 180),
      available: hasAnyOwn(data, ['currentStreak', 'longestStreak']),
      rawValue: { currentStreak, longestStreak },
    }),
    makeSignal({
      id: 'documentation_quality',
      label: 'Documentation/README quality',
      weight: 0.08,
      score: scaleLinear(data.readmeQualityScore, 20, 90),
      available: hasOwn(data, 'readmeQualityScore'),
      rawValue: toNumber(data.readmeQualityScore),
    }),
  ];

  return finalizePlatformScore('github', signals);
}

function scoreKaggle(data = {}) {
  const medals = toNumber(data.goldMedals) * 3 + toNumber(data.silverMedals) * 2 + toNumber(data.bronzeMedals);
  const notebookSignal = toNumber(data.notebookVotes ?? data.notebooks);
  const datasetSignal = toNumber(data.datasetDownloads ?? data.datasets);

  const signals = [
    makeSignal({
      id: 'tier',
      label: 'Tier level',
      weight: 0.35,
      score: kaggleTierScore(data.tier),
      available: hasOwn(data, 'tier'),
      rawValue: data.tier,
    }),
    makeSignal({
      id: 'competition_medals',
      label: 'Competition medals',
      weight: 0.3,
      score: scaleLog(medals, 35),
      available: hasAnyOwn(data, ['goldMedals', 'silverMedals', 'bronzeMedals']),
      rawValue: medals,
    }),
    makeSignal({
      id: 'notebook_impact',
      label: 'Notebook impact',
      weight: 0.2,
      score: scaleLog(notebookSignal, 120),
      available: hasAnyOwn(data, ['notebookVotes', 'notebooks']),
      rawValue: notebookSignal,
    }),
    makeSignal({
      id: 'dataset_impact',
      label: 'Dataset impact',
      weight: 0.15,
      score: scaleLog(datasetSignal, 80),
      available: hasAnyOwn(data, ['datasetDownloads', 'datasets']),
      rawValue: datasetSignal,
    }),
  ];

  return finalizePlatformScore('kaggle', signals);
}

function scoreStackoverflow(data = {}) {
  const topTagDepth = Array.isArray(data.topTags)
    ? data.topTags.reduce((sum, tag) => sum + Math.min(10, toNumber(tag.answerCount) * 0.6 + toNumber(tag.answerScore) * 0.04), 0)
    : 0;

  const signals = [
    makeSignal({
      id: 'reputation',
      label: 'Reputation score',
      weight: 0.4,
      score: scaleLog(data.reputation, 70000),
      available: hasOwn(data, 'reputation'),
      rawValue: toNumber(data.reputation),
    }),
    makeSignal({
      id: 'answers',
      label: 'Answer contribution',
      weight: 0.22,
      score: scaleLog(data.answerCount, 600),
      available: hasOwn(data, 'answerCount'),
      rawValue: toNumber(data.answerCount),
    }),
    makeSignal({
      id: 'gold_badges',
      label: 'Gold badge quality',
      weight: 0.18,
      score: scaleLog(data.goldBadges, 30),
      available: hasOwn(data, 'goldBadges'),
      rawValue: toNumber(data.goldBadges),
    }),
    makeSignal({
      id: 'top_tag_depth',
      label: 'Top tag depth',
      weight: 0.2,
      score: scaleLinear(topTagDepth, 5, 60),
      available: Array.isArray(data.topTags),
      rawValue: topTagDepth,
    }),
  ];

  return finalizePlatformScore('stackoverflow', signals);
}

function scoreCodechef(data = {}) {
  const stars = parseStarCount(data.stars);

  const signals = [
    makeSignal({
      id: 'rating',
      label: 'Rating quality',
      weight: 0.4,
      score: scaleLinear(data.currentRating, 1100, 2400),
      available: hasOwn(data, 'currentRating'),
      rawValue: toNumber(data.currentRating),
    }),
    makeSignal({
      id: 'solves',
      label: 'Problem solved volume',
      weight: 0.25,
      score: scaleLog(data.problemsSolved, 500),
      available: hasOwn(data, 'problemsSolved'),
      rawValue: toNumber(data.problemsSolved),
    }),
    makeSignal({
      id: 'stars',
      label: 'Star tier',
      weight: 0.2,
      score: scaleLinear(stars, 1, 7),
      available: hasOwn(data, 'stars'),
      rawValue: stars,
    }),
    makeSignal({
      id: 'global_rank',
      label: 'Global rank percentile',
      weight: 0.15,
      score: scaleInverse(data.globalRank, 1, 150000),
      available: hasOwn(data, 'globalRank'),
      rawValue: toNumber(data.globalRank),
    }),
  ];

  return finalizePlatformScore('codechef', signals);
}

function scoreHackerrank(data = {}) {
  const signals = [
    makeSignal({
      id: 'stars',
      label: 'Star accumulation',
      weight: 0.35,
      score: scaleLinear(data.totalStars, 5, 70),
      available: hasOwn(data, 'totalStars'),
      rawValue: toNumber(data.totalStars),
    }),
    makeSignal({
      id: 'badges',
      label: 'Badge quality',
      weight: 0.25,
      score: scaleLog(data.totalBadges, 35),
      available: hasOwn(data, 'totalBadges'),
      rawValue: toNumber(data.totalBadges),
    }),
    makeSignal({
      id: 'level',
      label: 'Level progression',
      weight: 0.25,
      score: scaleLinear(data.level, 1, 10),
      available: hasOwn(data, 'level'),
      rawValue: toNumber(data.level),
    }),
    makeSignal({
      id: 'certificates',
      label: 'Certificates earned',
      weight: 0.15,
      score: scaleLog(data.certificates, 12),
      available: hasOwn(data, 'certificates'),
      rawValue: toNumber(data.certificates),
    }),
  ];

  return finalizePlatformScore('hackerrank', signals);
}

function scoreGeeksforgeeks(data = {}) {
  const signals = [
    makeSignal({
      id: 'solves',
      label: 'Problems solved',
      weight: 0.3,
      score: scaleLog(data.totalProblemsSolved, 650),
      available: hasOwn(data, 'totalProblemsSolved'),
      rawValue: toNumber(data.totalProblemsSolved),
    }),
    makeSignal({
      id: 'coding_score',
      label: 'Coding score',
      weight: 0.3,
      score: scaleLog(data.score, 1200),
      available: hasOwn(data, 'score'),
      rawValue: toNumber(data.score),
    }),
    makeSignal({
      id: 'streak',
      label: 'Daily streak',
      weight: 0.2,
      score: scaleLinear(data.streak, 5, 160),
      available: hasOwn(data, 'streak'),
      rawValue: toNumber(data.streak),
    }),
    makeSignal({
      id: 'rank',
      label: 'Institute rank percentile',
      weight: 0.2,
      score: scaleInverse(data.instituteRank, 1, 5000),
      available: hasOwn(data, 'instituteRank'),
      rawValue: toNumber(data.instituteRank),
    }),
  ];

  return finalizePlatformScore('geeksforgeeks', signals);
}

function scoreAtcoder(data = {}) {
  const signals = [
    makeSignal({
      id: 'rating',
      label: 'Rating quality',
      weight: 0.35,
      score: scaleLinear(data.rating, 800, 2600),
      available: hasOwn(data, 'rating'),
      rawValue: toNumber(data.rating),
    }),
    makeSignal({
      id: 'max_rating',
      label: 'Peak rating',
      weight: 0.2,
      score: scaleLinear(data.maxRating, 1000, 2800),
      available: hasOwn(data, 'maxRating'),
      rawValue: toNumber(data.maxRating),
    }),
    makeSignal({
      id: 'solves',
      label: 'Solved count',
      weight: 0.25,
      score: scaleLog(data.problemsSolved, 500),
      available: hasOwn(data, 'problemsSolved'),
      rawValue: toNumber(data.problemsSolved),
    }),
    makeSignal({
      id: 'contests',
      label: 'Contest participation',
      weight: 0.2,
      score: scaleLog(data.contestsParticipated, 70),
      available: hasOwn(data, 'contestsParticipated'),
      rawValue: toNumber(data.contestsParticipated),
    }),
  ];

  return finalizePlatformScore('atcoder', signals);
}

function scoreHackerearth(data = {}) {
  const signals = [
    makeSignal({
      id: 'rating',
      label: 'Rating quality',
      weight: 0.4,
      score: scaleLinear(data.rating, 900, 2200),
      available: hasOwn(data, 'rating'),
      rawValue: toNumber(data.rating),
    }),
    makeSignal({
      id: 'solves',
      label: 'Problems solved',
      weight: 0.35,
      score: scaleLog(data.problemsSolved, 350),
      available: hasOwn(data, 'problemsSolved'),
      rawValue: toNumber(data.problemsSolved),
    }),
    makeSignal({
      id: 'contests',
      label: 'Contests participated',
      weight: 0.25,
      score: scaleLog(data.contestsParticipated, 50),
      available: hasOwn(data, 'contestsParticipated'),
      rawValue: toNumber(data.contestsParticipated),
    }),
  ];

  return finalizePlatformScore('hackerearth', signals);
}

function scoreHuggingface(data = {}) {
  const projects = toNumber(data.modelsPublished) + toNumber(data.datasetsPublished) + toNumber(data.spacesCreated);
  const signals = [
    makeSignal({
      id: 'published_assets',
      label: 'Published assets',
      weight: 0.35,
      score: scaleLog(projects, 80),
      available: hasAnyOwn(data, ['modelsPublished', 'datasetsPublished', 'spacesCreated']),
      rawValue: projects,
    }),
    makeSignal({
      id: 'downloads',
      label: 'Download impact',
      weight: 0.25,
      score: scaleLog(data.totalDownloads, 500000),
      available: hasOwn(data, 'totalDownloads'),
      rawValue: toNumber(data.totalDownloads),
    }),
    makeSignal({
      id: 'likes',
      label: 'Community likes',
      weight: 0.2,
      score: scaleLog(data.totalLikes, 1200),
      available: hasOwn(data, 'totalLikes'),
      rawValue: toNumber(data.totalLikes),
    }),
    makeSignal({
      id: 'model_depth',
      label: 'Model publishing depth',
      weight: 0.2,
      score: scaleLog(data.modelsPublished, 40),
      available: hasOwn(data, 'modelsPublished'),
      rawValue: toNumber(data.modelsPublished),
    }),
  ];

  return finalizePlatformScore('huggingface', signals);
}

function scoreTryhackme(data = {}) {
  const signals = [
    makeSignal({
      id: 'points',
      label: 'Points earned',
      weight: 0.35,
      score: scaleLog(data.points, 60000),
      available: hasOwn(data, 'points'),
      rawValue: toNumber(data.points),
    }),
    makeSignal({
      id: 'rooms_completed',
      label: 'Rooms completed',
      weight: 0.25,
      score: scaleLog(data.roomsCompleted, 350),
      available: hasOwn(data, 'roomsCompleted'),
      rawValue: toNumber(data.roomsCompleted),
    }),
    makeSignal({
      id: 'rank',
      label: 'Rank percentile',
      weight: 0.25,
      score: scaleInverse(data.rank, 1, 250000),
      available: hasOwn(data, 'rank'),
      rawValue: toNumber(data.rank),
    }),
    makeSignal({
      id: 'streak',
      label: 'Streak consistency',
      weight: 0.15,
      score: scaleLinear(data.streak, 2, 60),
      available: hasOwn(data, 'streak'),
      rawValue: toNumber(data.streak),
    }),
  ];

  return finalizePlatformScore('tryhackme', signals);
}

function scoreCodesignal(data = {}) {
  const signals = [
    makeSignal({
      id: 'gca_score',
      label: 'GCA score',
      weight: 0.45,
      score: scaleLinear(data.gcaScore, 300, 850),
      available: hasOwn(data, 'gcaScore'),
      rawValue: toNumber(data.gcaScore),
    }),
    makeSignal({
      id: 'coding_score',
      label: 'Coding score',
      weight: 0.3,
      score: scaleLinear(data.codingScore, 300, 1000),
      available: hasOwn(data, 'codingScore'),
      rawValue: toNumber(data.codingScore),
    }),
    makeSignal({
      id: 'challenges_completed',
      label: 'Challenges completed',
      weight: 0.25,
      score: scaleLog(data.challengesCompleted, 220),
      available: hasOwn(data, 'challengesCompleted'),
      rawValue: toNumber(data.challengesCompleted),
    }),
  ];

  return finalizePlatformScore('codesignal', signals);
}

function scoreDevto(data = {}) {
  const signals = [
    makeSignal({
      id: 'articles',
      label: 'Articles published',
      weight: 0.35,
      score: scaleLog(data.articlesPublished, 80),
      available: hasOwn(data, 'articlesPublished'),
      rawValue: toNumber(data.articlesPublished),
    }),
    makeSignal({
      id: 'reactions',
      label: 'Post reactions',
      weight: 0.3,
      score: scaleLog(data.totalReactions, 4000),
      available: hasOwn(data, 'totalReactions'),
      rawValue: toNumber(data.totalReactions),
    }),
    makeSignal({
      id: 'followers',
      label: 'Follower growth',
      weight: 0.2,
      score: scaleLog(data.followers, 1500),
      available: hasOwn(data, 'followers'),
      rawValue: toNumber(data.followers),
    }),
    makeSignal({
      id: 'comments',
      label: 'Comment engagement',
      weight: 0.15,
      score: scaleLog(data.totalComments, 1000),
      available: hasOwn(data, 'totalComments'),
      rawValue: toNumber(data.totalComments),
    }),
  ];

  return finalizePlatformScore('devto', signals);
}

function scoreGitlab(data = {}) {
  const quality = toNumber(data.totalStars) * 2 + toNumber(data.totalForks);
  const languageCount = Array.isArray(data.languages) ? data.languages.length : 0;

  const signals = [
    makeSignal({
      id: 'projects',
      label: 'Projects published',
      weight: 0.4,
      score: scaleLog(data.projectsCount, 80),
      available: hasOwn(data, 'projectsCount'),
      rawValue: toNumber(data.projectsCount),
    }),
    makeSignal({
      id: 'project_quality',
      label: 'Project quality signal',
      weight: 0.3,
      score: scaleLog(quality, 250),
      available: hasAnyOwn(data, ['totalStars', 'totalForks']),
      rawValue: quality,
    }),
    makeSignal({
      id: 'language_breadth',
      label: 'Language breadth',
      weight: 0.3,
      score: scaleLog(languageCount, 10),
      available: Array.isArray(data.languages),
      rawValue: languageCount,
    }),
  ];

  return finalizePlatformScore('gitlab', signals);
}

function scoreFallback(platform, data = {}) {
  const numericValues = Object.values(data).filter((v) => typeof v === 'number');
  const base = numericValues.reduce((sum, n) => sum + Math.max(0, n), 0);
  const score = scaleLog(base, 500);

  const signals = [
    makeSignal({
      id: 'general_activity',
      label: 'General platform activity',
      weight: 1,
      score,
      available: numericValues.length > 0,
      rawValue: base,
    }),
  ];

  return finalizePlatformScore(platform, signals);
}

const PLATFORM_SCORERS = {
  leetcode: scoreLeetcode,
  codeforces: scoreCodeforces,
  github: scoreGithub,
  kaggle: scoreKaggle,
  stackoverflow: scoreStackoverflow,
  codechef: scoreCodechef,
  hackerrank: scoreHackerrank,
  geeksforgeeks: scoreGeeksforgeeks,
  atcoder: scoreAtcoder,
  hackerearth: scoreHackerearth,
  huggingface: scoreHuggingface,
  tryhackme: scoreTryhackme,
  codesignal: scoreCodesignal,
  devto: scoreDevto,
  gitlab: scoreGitlab,
};

function isConnectedPlatform(data) {
  return !!data && typeof data === 'object' && Object.keys(data).length > 0;
}

function resolveDomainFromArchetype(archetype) {
  const mapped = ARCHETYPE_DOMAIN_MAP[archetype];
  return mapped || 'all_rounder';
}

function blendDomainWeights(primaryDomain, secondaryDomain) {
  const primary = DOMAIN_WEIGHT_MATRIX[primaryDomain] || DOMAIN_WEIGHT_MATRIX.all_rounder;
  if (!secondaryDomain || secondaryDomain === primaryDomain) {
    return { ...primary };
  }

  const secondary = DOMAIN_WEIGHT_MATRIX[secondaryDomain] || DOMAIN_WEIGHT_MATRIX.all_rounder;
  const keys = new Set([...Object.keys(primary), ...Object.keys(secondary)]);
  const blended = {};
  for (const key of keys) {
    blended[key] = toNumber(primary[key]) * 0.7 + toNumber(secondary[key]) * 0.3;
  }
  return blended;
}

function getDomainPlatformWeight(domainWeights, domainId, platformId) {
  if (domainId === 'all_rounder') return 1;

  const direct = toNumber(domainWeights[platformId]);
  if (direct > 0) return direct;

  const aliasTo = PLATFORM_WEIGHT_ALIAS[platformId];
  if (aliasTo) {
    return toNumber(domainWeights[aliasTo]) * 0.75;
  }

  return 0;
}

function normalizeConnectedWeights(domainWeights, domainId, connectedPlatforms) {
  if (connectedPlatforms.length === 0) return {};

  const raw = {};
  let total = 0;

  for (const platform of connectedPlatforms) {
    const value = getDomainPlatformWeight(domainWeights, domainId, platform);
    raw[platform] = value;
    total += value;
  }

  if (total <= 0) {
    const equal = 1 / connectedPlatforms.length;
    return Object.fromEntries(connectedPlatforms.map((platform) => [platform, equal]));
  }

  return Object.fromEntries(
    connectedPlatforms.map((platform) => [platform, raw[platform] / total])
  );
}

function amplifyRawScore(rawScore) {
  const raw = clamp(toNumber(rawScore), 0, 100);
  if (raw < 20) return raw * 5;
  if (raw < 50) return 100 + (raw - 20) * 10;
  if (raw < 75) return 400 + (raw - 50) * 20;
  return 900 + (raw - 75) * 4;
}

function getGrade(percentile) {
  if (percentile >= 95) return 'A+';
  if (percentile >= 85) return 'A';
  if (percentile >= 75) return 'B+';
  if (percentile >= 65) return 'B';
  if (percentile >= 55) return 'C+';
  if (percentile >= 45) return 'C';
  if (percentile >= 35) return 'D';
  return 'F';
}

function computePillarFromPlatformScores(platformScores, weightMap, max = 200) {
  const entries = Object.entries(weightMap || {}).filter(([platform]) => platformScores[platform] != null);
  if (entries.length === 0) {
    return { score: 0, max, percentile: 0, grade: 'N/A' };
  }

  const totalWeight = entries.reduce((sum, [, w]) => sum + toNumber(w), 0);
  if (totalWeight <= 0) {
    return { score: 0, max, percentile: 0, grade: 'N/A' };
  }

  const avg = entries.reduce((sum, [platform, w]) => sum + platformScores[platform] * toNumber(w), 0) / totalWeight;
  const score = Math.round((clamp(avg, 0, 100) / 100) * max);
  const percentile = Math.round(clamp(avg, 0, 100));

  return {
    score,
    max,
    percentile,
    grade: getGrade(percentile),
  };
}

function toDistribution(values, keys) {
  const picked = keys.map((k) => Math.max(0, toNumber(values[k])));
  const sum = picked.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const eq = 1 / Math.max(1, keys.length);
    return Object.fromEntries(keys.map((k) => [k, eq]));
  }
  return Object.fromEntries(keys.map((k, i) => [k, picked[i] / sum]));
}

function cosineSimilarity(distA, distB, keys) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const key of keys) {
    const a = toNumber(distA[key]);
    const b = toNumber(distB[key]);
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  if (magA <= 0 || magB <= 0) return 0;
  return clamp(dot / (Math.sqrt(magA) * Math.sqrt(magB)), 0, 1);
}

function computeDomainFit(domainId, connectedPlatforms, platformScores) {
  if (connectedPlatforms.length === 0) return 0;

  const domainWeights = normalizeConnectedWeights(DOMAIN_WEIGHT_MATRIX[domainId] || {}, domainId, connectedPlatforms);
  const scoreWeights = toDistribution(platformScores, connectedPlatforms);
  return Math.round(cosineSimilarity(scoreWeights, domainWeights, connectedPlatforms) * 100);
}

function generateUnconnectedRecommendations(domainId, connectedSet) {
  const domainWeights = DOMAIN_WEIGHT_MATRIX[domainId] || {};
  const recommendations = Object.entries(domainWeights)
    .filter(([platform, weight]) => !connectedSet.has(platform) && toNumber(weight) > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([platform, weight]) => ({
      platform,
      platformLabel: PLATFORM_LABELS[platform] || platform,
      expectedWeight: Math.round(toNumber(weight)),
      reason: `High relevance for ${DOMAIN_LABELS[domainId] || 'selected domain'}`,
    }));

  return recommendations;
}

function buildInsights(strongestSignals, weakSignals, unconnectedRecommendations) {
  const strengths = strongestSignals.slice(0, 3).map((s) => {
    return `${s.metric} on ${s.platformLabel} is strong (${Math.round(s.score)}/100)`;
  });

  const improvements = [];

  for (const weak of weakSignals.slice(0, 3)) {
    improvements.push(`Improve ${weak.metric.toLowerCase()} on ${weak.platformLabel} (${Math.round(weak.score)}/100)`);
  }

  for (const rec of unconnectedRecommendations.slice(0, 2)) {
    improvements.push(`Connect ${rec.platformLabel} to strengthen your ${rec.expectedWeight}% domain coverage`);
  }

  return {
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 5),
  };
}

export function computeDevScore({ archetype, secondaryArchetype, platformData = {} }) {
  const safeArchetype = archetype || 'none';
  const safeSecondary = secondaryArchetype || 'none';

  const connectedPlatforms = Object.keys(platformData).filter((platform) => isConnectedPlatform(platformData[platform]));
  const connectedSet = new Set(connectedPlatforms);

  const platformResults = {};
  const platformScoreMap = {};
  const allSignals = [];

  for (const platform of connectedPlatforms) {
    const scorer = PLATFORM_SCORERS[platform] || ((data) => scoreFallback(platform, data));
    const result = scorer(platformData[platform] || {});
    platformResults[platform] = result;
    platformScoreMap[platform] = result.score;

    for (const signal of result.signals) {
      if (!signal.available) continue;
      allSignals.push({
        platform,
        platformLabel: PLATFORM_LABELS[platform] || platform,
        metric: signal.label,
        signalId: signal.id,
        score: signal.score,
        weight: signal.effectiveWeight,
        rawValue: signal.rawValue,
      });
    }
  }

  const primaryDomain = resolveDomainFromArchetype(archetype);
  const secondaryDomain = resolveDomainFromArchetype(secondaryArchetype);
  const blendedDomainWeights = blendDomainWeights(primaryDomain, secondaryDomain);
  const connectedWeights = normalizeConnectedWeights(blendedDomainWeights, primaryDomain, connectedPlatforms);

  const weightedRawScore = connectedPlatforms.reduce((sum, platform) => {
    return sum + platformScoreMap[platform] * toNumber(connectedWeights[platform]);
  }, 0);

  const overallScore = Math.round(clamp(amplifyRawScore(weightedRawScore), 0, 1000));
  const rawScoreRounded = Math.round(weightedRawScore * 100) / 100;

  const strongestSignals = allSignals
    .filter((s) => s.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const weakSignals = allSignals
    .filter((s) => s.score < 35)
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);

  const unconnectedRecommendations = generateUnconnectedRecommendations(primaryDomain, connectedSet);

  const domainFitScores = Object.keys(DOMAIN_WEIGHT_MATRIX)
    .map((domainId) => ({
      domainId,
      score: computeDomainFit(domainId, connectedPlatforms, platformScoreMap),
    }))
    .sort((a, b) => b.score - a.score);

  const selectedDomainFit = computeDomainFit(primaryDomain, connectedPlatforms, platformScoreMap);
  const bestFit = domainFitScores[0] || { domainId: primaryDomain, score: selectedDomainFit };
  const suggestedDomain = bestFit.domainId !== primaryDomain && bestFit.score - selectedDomainFit >= 10
    ? bestFit.domainId
    : null;

  const pillars = {
    problemSolving: computePillarFromPlatformScores(platformScoreMap, PILLAR_WEIGHTS.problemSolving, 200),
    building: computePillarFromPlatformScores(platformScoreMap, PILLAR_WEIGHTS.building, 200),
    community: computePillarFromPlatformScores(platformScoreMap, PILLAR_WEIGHTS.community, 200),
    consistency: computePillarFromPlatformScores(platformScoreMap, PILLAR_WEIGHTS.consistency, 200),
    specialization: {
      score: Math.round((clamp(weightedRawScore, 0, 100) / 100) * 200),
      max: 200,
      percentile: Math.round(clamp(weightedRawScore, 0, 100)),
      grade: getGrade(Math.round(clamp(weightedRawScore, 0, 100))),
    },
  };

  const { strengths, improvements } = buildInsights(strongestSignals, weakSignals, unconnectedRecommendations);

  const platformScores = Object.fromEntries(
    connectedPlatforms.map((platform) => [
      platform,
      {
        platformLabel: PLATFORM_LABELS[platform] || platform,
        score: Math.round(platformScoreMap[platform] * 100) / 100,
        weight: Math.round(toNumber(connectedWeights[platform]) * 10000) / 10000,
        coverage: Math.round((platformResults[platform]?.coverage || 0) * 100) / 100,
      },
    ])
  );

  return {
    overallScore,
    maxScore: 1000,
    rawScore: rawScoreRounded,
    weightedRawScore: rawScoreRounded,
    archetype: safeArchetype,
    secondaryArchetype: safeSecondary,
    domain: primaryDomain,
    domainLabel: DOMAIN_LABELS[primaryDomain] || 'All Rounder',
    connectedPlatforms: connectedPlatforms.length,
    pillars,
    strengths,
    improvements,
    platformScores,
    diagnostics: {
      selectedDomain: primaryDomain,
      selectedDomainLabel: DOMAIN_LABELS[primaryDomain] || 'All Rounder',
      strongestSignals: strongestSignals.slice(0, 3),
      weakSignals: weakSignals.slice(0, 5),
      unconnectedPlatformRecommendations: unconnectedRecommendations,
      domainFitScore: selectedDomainFit,
      suggestedDomain,
      suggestedDomainLabel: suggestedDomain ? (DOMAIN_LABELS[suggestedDomain] || suggestedDomain) : null,
      domainFitCandidates: domainFitScores.slice(0, 5).map((entry) => ({
        domain: entry.domainId,
        label: DOMAIN_LABELS[entry.domainId] || entry.domainId,
        score: entry.score,
      })),
    },
  };
}

export default computeDevScore;
