import apiClient from '../lib/apiClient';

export const compareService = {
  async compareDevelopers(userId1, userId2, platform = 'devscore') {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    const response = await apiClient.get(`/compare/${userId1}/${userId2}${params.toString() ? `?${params}` : ''}`);
    return response.data;
  },
};
