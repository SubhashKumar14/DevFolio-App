import apiClient from '../lib/apiClient';

export const projectService = {
  async getProjects(userId) {
    const response = await apiClient.get(`/projects/${userId}`);
    return response.data;
  },

  async createProject(data) {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  async updateProject(projectId, data) {
    const response = await apiClient.put(`/projects/${projectId}`, data);
    return response.data;
  },

  async deleteProject(projectId) {
    const response = await apiClient.delete(`/projects/${projectId}`);
    return response;
  },
};
