import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

export const portfolioService = {
  async getPortfolio(userId) {
    return unwrapApiData(await apiClient.get(`/portfolio/${userId}`));
  },

  async savePortfolio(data) {
    return unwrapApiData(await apiClient.post('/portfolio', data));
  },

  async toggleVisibility(isPublic) {
    return unwrapApiData(await apiClient.patch('/portfolio/visibility', { isPublic }));
  },
};
