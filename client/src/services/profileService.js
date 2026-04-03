import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

export const profileService = {
  async getProfile(userId) {
    return unwrapApiData(await apiClient.get(`/profile/${userId}`));
  },

  async updateProfile(data) {
    return unwrapApiData(await apiClient.put('/profile/me', data));
  },
};
