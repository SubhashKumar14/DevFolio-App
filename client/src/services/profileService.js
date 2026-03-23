import apiClient from '../lib/apiClient';

export const profileService = {
  async getProfile(userId) {
    const response = await apiClient.get(`/profile/${userId}`);
    return response.data;
  },

  async updateProfile(data) {
    const response = await apiClient.put('/profile/me', data);
    return response.data;
  },
};
