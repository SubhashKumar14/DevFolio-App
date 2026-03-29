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
    const response = await apiClient.patch(`/integrations/platforms/${platformId}/disconnect`);
    return response;
  },
};
