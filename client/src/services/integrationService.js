import apiClient from '../lib/apiClient';

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
    return response;
  },

  async connectGithub(code) {
    const response = await apiClient.post('/integrations/github/connect', { code });
    return response.data;
  },

  async disconnectPlatform(platformId) {
    try {
      const response = await apiClient.patch(`/integrations/platforms/${platformId}/disconnect`);
      return response;
    } catch (error) {
      const status = Number(error?.status);
      if (status === 404 || status === 405) {
        // Compatibility fallback for runtimes/proxies where PATCH path is not available.
        return apiClient.post(`/integrations/platforms/${platformId}/disconnect`);
      }
      throw error;
    }
  },
};
