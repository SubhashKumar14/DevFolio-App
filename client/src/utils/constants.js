// App-wide constants (supplementary to lib/constants.js)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const QUERY_KEYS = {
  USER_ME: ['user', 'me'],
  GITHUB_STATS: (userId) => ['githubStats', userId],
  DSA_STATS: (userId) => ['dsaStats', userId],
  DEV_SCORE: (userId) => ['devScore', userId],
  SCORE_HISTORY: (userId) => ['scoreHistory', userId],
  PROFILE: (userId) => ['profile', userId],
  PROJECTS: (userId) => ['projects', userId],
  PORTFOLIO: (userId) => ['portfolio', userId],
  LEADERBOARD: (page, college) => ['leaderboard', page, college],
};

export const STALE_TIMES = {
  USER: 5 * 60 * 1000,       // 5 min
  STATS: 10 * 60 * 1000,     // 10 min
  LEADERBOARD: 2 * 60 * 1000, // 2 min
};
