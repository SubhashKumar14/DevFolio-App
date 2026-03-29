import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshRes = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );
        
        const newAccessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        const newRefreshToken = refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;
        
        if (!newAccessToken) {
          throw new Error('No token in refresh response');
        }
        
        useAuthStore.getState().setAccessToken(newAccessToken);
        if (newRefreshToken) {
          useAuthStore.getState().setRefreshToken(newRefreshToken);
        }
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest).then(res => res.data);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    const responsePayload = error.response?.data || {};
    const payloadError = responsePayload.error || responsePayload;
    const apiError = {
      ...payloadError,
      status: Number(error.response?.status || payloadError?.status || 0) || undefined,
      message: payloadError?.message || error.message,
    };
    return Promise.reject(apiError);
  }
);

export default apiClient;