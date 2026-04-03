import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

export const scoreService = {
  async getScore(userId) {
    return unwrapApiData(await apiClient.get(`/score/${userId}`));
  },

  async getScoreHistory(userId) {
    return unwrapApiData(await apiClient.get(`/score/${userId}/history`));
  },

  async getScoreBenchmark(userId) {
    return unwrapApiData(await apiClient.get(`/score/${userId}/benchmark`));
  },

  async recomputeScore() {
    return unwrapApiData(await apiClient.post('/score/recompute'));
  },
};
