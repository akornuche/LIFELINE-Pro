import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';
import { toast } from 'vue3-toastify';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const authStore = useAuthStore();
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = authStore.refreshToken;
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken } = response.data.data;
          authStore.setToken(accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        authStore.logout();
        router.push('/login');
        toast.error('Session expired. Please login again.');
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      toast.error('You do not have permission to perform this action.');
      router.push('/403');
    }

    // Handle 404 Not Found
    if (status === 404) {
      toast.error(data.message || 'Resource not found.');
    }

    // Handle 422 Validation Error
    if (status === 422) {
      const errors = data.errors || {};
      const firstError = Object.values(errors)[0];
      toast.error(firstError || 'Validation error occurred.');
    }

    // Handle 429 Too Many Requests
    if (status === 429) {
      toast.error('Too many requests. Please try again later.');
    }

    // Handle 500 Server Error
    if (status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
