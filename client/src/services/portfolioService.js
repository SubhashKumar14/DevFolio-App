import apiClient from '../lib/apiClient';

export const portfolioService = {
  async getPortfolio(userId) {
    const response = await apiClient.get(`/portfolio/${userId}`);
    return response.data;
  },

  async savePortfolio(data) {
    const response = await apiClient.post('/portfolio', data);
    return response.data;
  },

  async toggleVisibility(isPublic) {
    const response = await apiClient.patch('/portfolio/visibility', { isPublic });
    return response;
  },
};
