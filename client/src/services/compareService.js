import apiClient from '../lib/apiClient';

export const compareService = {
  async compareDevelopers(userId1, userId2) {
    const response = await apiClient.get(`/compare/${userId1}/${userId2}`);
    return response.data;
  },
};
