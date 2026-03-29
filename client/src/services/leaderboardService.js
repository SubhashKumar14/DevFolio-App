import apiClient from '../lib/apiClient';

export const leaderboardService = {
  async getLeaderboard({ page = 1, limit = 20, college, archetype, mode = 'devscore' } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (college) params.append('college', college);
    if (archetype) params.append('archetype', archetype);
    if (mode) params.append('mode', mode);
    const response = await apiClient.get(`/leaderboard?${params}`);
    return response.data;
  },

  async getCollegeLeaderboard(collegeName) {
    const response = await apiClient.get(`/leaderboard/college/${encodeURIComponent(collegeName)}`);
    return response.data;
  },
};
