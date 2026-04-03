import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

export const leaderboardService = {
  async getLeaderboard({ page = 1, limit = 20, college, archetype, mode = 'devscore' } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (college) params.append('college', college);
    if (archetype) params.append('archetype', archetype);
    if (mode) params.append('mode', mode);
    return unwrapApiData(await apiClient.get(`/leaderboard?${params}`));
  },

  async getCollegeLeaderboard(collegeName) {
    return unwrapApiData(await apiClient.get(`/leaderboard/college/${encodeURIComponent(collegeName)}`));
  },
};
