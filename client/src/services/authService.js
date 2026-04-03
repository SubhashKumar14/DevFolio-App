import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

export const authService = {
  async register(data) {
    return unwrapApiData(await apiClient.post('/auth/register', data));
  },

  async login(email, password) {
    return unwrapApiData(await apiClient.post('/auth/login', { email, password }));
  },

  async logout() {
    return unwrapApiData(await apiClient.post('/auth/logout'));
  },

  async getMe() {
    return unwrapApiData(await apiClient.get('/user/me'));
  },

  async refreshToken() {
    return unwrapApiData(await apiClient.post('/auth/refresh', {}));
  },
};