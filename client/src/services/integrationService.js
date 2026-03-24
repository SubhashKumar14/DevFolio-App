import apiClient from '../lib/apiClient';

export const integrationService = {
  async connectDsa({ githubUsername, leetcodeUsername, codeforcesUsername }) {
    const response = await apiClient.post('/integrations/dsa/connect', {
      githubUsername,
      leetcodeUsername,
      codeforcesUsername,
    });
    return response.data;
  },

  async connectGithub(code) {
    const response = await apiClient.post('/integrations/github/connect', { code });
    return response.data;
  },
};
