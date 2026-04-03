import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

export const integrationService = {
  async connectDsa(data) {
    // Accept supported platform fields
    const response = await apiClient.post('/integrations/dsa/connect', {
      githubUsername: data.githubUsername,
      leetcodeUsername: data.leetcodeUsername,
      codeforcesUsername: data.codeforcesUsername,
      hackerrankUsername: data.hackerrankUsername,
      codechefUsername: data.codechefUsername,
      kaggleUsername: data.kaggleUsername,
      huggingfaceUsername: data.huggingfaceUsername,
    });
    return unwrapApiData(response);
  },

  async connectGithub(code) {
    return unwrapApiData(await apiClient.post('/integrations/github/connect', { code }));
  },

  async disconnectPlatform(platformId) {
    try {
      return unwrapApiData(await apiClient.patch(`/integrations/platforms/${platformId}/disconnect`));
    } catch (error) {
      const status = Number(error?.status);
      if (status === 404 || status === 405) {
        // Compatibility fallback for runtimes/proxies where PATCH path is not available.
        return unwrapApiData(await apiClient.post(`/integrations/platforms/${platformId}/disconnect`));
      }
      throw error;
    }
  },
};
