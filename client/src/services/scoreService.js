import apiClient from '../lib/apiClient';

export const scoreService = {
  async getScore(userId) {
    const response = await apiClient.get(`/score/${userId}`);
    return response.data;
  },

  async getScoreHistory(userId) {
    const response = await apiClient.get(`/score/${userId}/history`);
    return response.data;
  },

  async getScoreBenchmark(userId) {
    const response = await apiClient.get(`/score/${userId}/benchmark`);
    return response.data;
  },

  async recomputeScore() {
    const response = await apiClient.post('/score/recompute');
    return response.data;
  },
};
