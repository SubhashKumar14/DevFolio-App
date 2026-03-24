import apiClient from '../lib/apiClient';

export const integrationService = {
  async connectDsa(data) {
    // Accept all 7 platform fields
    const response = await apiClient.post('/integrations/dsa/connect', {
      githubUsername: data.githubUsername,
      leetcodeUsername: data.leetcodeUsername,
      codeforcesUsername: data.codeforcesUsername,
      hackerrankUsername: data.hackerrankUsername,
      codechefUsername: data.codechefUsername,
      kaggleUsername: data.kaggleUsername,
      gfgUsername: data.gfgUsername,
    });
    return response.data;
  },

  async connectGithub(code) {
    const response = await apiClient.post('/integrations/github/connect', { code });
    return response.data;
  },
};
