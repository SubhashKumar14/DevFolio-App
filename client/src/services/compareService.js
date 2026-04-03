import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

export const compareService = {
  async compareDevelopers(userId1, userId2, platform = 'devscore') {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    return unwrapApiData(await apiClient.get(`/compare/${userId1}/${userId2}${params.toString() ? `?${params}` : ''}`));
  },
};
