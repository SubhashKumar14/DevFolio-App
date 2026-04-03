import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

export const projectService = {
  async getProjects(userId) {
    return unwrapApiData(await apiClient.get(`/projects/${userId}`));
  },

  async createProject(data) {
    return unwrapApiData(await apiClient.post('/projects', data));
  },

  async updateProject(projectId, data) {
    return unwrapApiData(await apiClient.put(`/projects/${projectId}`, data));
  },

  async deleteProject(projectId) {
    return unwrapApiData(await apiClient.delete(`/projects/${projectId}`));
  },
};
