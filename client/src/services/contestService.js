import apiClient from '../lib/apiClient';

export const contestService = {
  async getUpcomingContests() {
    const response = await apiClient.get('/contests/upcoming');
    return response.data;
  },
};
