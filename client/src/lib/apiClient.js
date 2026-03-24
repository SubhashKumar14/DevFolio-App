import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // For httpOnly cookies like refresh token
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
    // Expected to return { success: true, data: ... }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Use raw axios (not apiClient) to avoid interceptor loop
        // withCredentials sends the httpOnly refresh cookie if the server uses cookies
        const refreshRes = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const newToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        
        if (!newToken) {
          throw new Error('No token in refresh response');
        }
        
        // Update token in store
        useAuthStore.getState().setAccessToken(newToken);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest).then(res => res.data);
      } catch (refreshError) {
        // Refresh failed, logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Return unified error object
    const apiError = error.response?.data?.error || { message: error.message };
    return Promise.reject(apiError);
  }
);

export default apiClient;