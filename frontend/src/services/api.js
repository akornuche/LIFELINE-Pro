import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';
import { toast } from 'vue3-toastify';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
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

    // Standard human-friendly messages for common status codes
    const errorMap = {
      400: 'Invalid request. Please check your data.',
      401: 'Session expired. Please login again.',
      403: 'You do not have permission to perform this action.',
      404: 'Requested resource was not found.',
      405: 'This action is not allowed.',
      408: 'Request timeout. Please try again.',
      422: 'Information provided is invalid. Please check your inputs.',
      429: 'Too many requests. Please slow down.',
      500: 'Systems are currently experiencing issues. Our team is on it.',
      503: 'Service temporarily unavailable. Maintenance in progress.'
    };

    // Handle network/timeout errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') toast.error('Request timed out. Please try again.');
      else toast.error('Network error. Please check your internet connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const errorMessage = data.message || errorMap[status] || 'An unexpected error occurred.';

    // Handle 401 Unauthorized (Token Refresh logic)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = authStore.refreshToken;
        if (refreshToken) {
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = response.data.data;
          authStore.setToken(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        authStore.logout();
        router.push('/login');
        toast.error('Session expired. Please login again.');
        return Promise.reject(refreshError);
      }
    }

    // Role-specific redirect for patients with no subscription
    if (status === 403 && data.code === 'SUBSCRIPTION_REQUIRED') {
      toast.error(errorMessage);
      router.push('/patient/subscription');
      return Promise.reject(error);
    }

    // Handle 422 Validation Errors specifically (show the first one if available)
    if (status === 422 && data.errors) {
      const firstField = Object.keys(data.errors)[0];
      const detail = Array.isArray(data.errors[firstField]) ? data.errors[firstField][0] : data.errors[firstField];
      toast.error(detail || errorMessage);
    } else {
      // Don't show toast for 401 as it's handled above/silently during refresh
      if (status !== 401) {
        toast.error(errorMessage);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
