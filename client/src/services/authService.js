import apiClient from '../lib/apiClient';

export const authService = {
  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async logout() {
    return await apiClient.post('/auth/logout');
  },

  async getMe() {
    const response = await apiClient.get('/user/me');
    return response.data;
  },

  async refreshToken(token) {
    const response = await apiClient.post('/auth/refresh', { refreshToken: token });
    return response.data;
  },
};