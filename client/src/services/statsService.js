import apiClient from '../lib/apiClient';

export const statsService = {
  async getGithubStats(userId) {
    const response = await apiClient.get(`/stats/github/${userId}`);
    return response.data;
  },

  async getDsaStats(userId) {
    const response = await apiClient.get(`/stats/dsa/${userId}`);
    return response.data;
  },

  async getPlatformStats(userId) {
    const response = await apiClient.get(`/stats/platforms/${userId}`);
    return response.data;
  },

  async syncStats() {
    const response = await apiClient.post('/stats/sync');
    return response;
  },
};
