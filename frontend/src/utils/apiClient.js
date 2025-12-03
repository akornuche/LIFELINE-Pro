import axios from 'axios';
import { useToast } from '@/composables/useToast';

const { error: showError } = useToast();

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for tracking
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    if (import.meta.env.DEV && duration > 3000) {
      console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          showError(data.message || 'Invalid request. Please check your input.');
          break;
        case 401:
          showError('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          showError('You do not have permission to perform this action.');
          break;
        case 404:
          showError(data.message || 'The requested resource was not found.');
          break;
        case 409:
          showError(data.message || 'This operation conflicts with existing data.');
          break;
        case 422:
          showError(data.message || 'Validation failed. Please check your input.');
          break;
        case 429:
          showError('Too many requests. Please try again later.');
          break;
        case 500:
          showError('A server error occurred. Please try again later.');
          break;
        case 503:
          showError('Service temporarily unavailable. Please try again later.');
          break;
        default:
          showError(data.message || 'An unexpected error occurred.');
      }
    } else if (error.request) {
      // Request made but no response received
      if (!navigator.onLine) {
        showError('No internet connection. Please check your network.');
      } else if (error.code === 'ECONNABORTED') {
        showError('Request timeout. Please try again.');
      } else {
        showError('Cannot reach the server. Please try again later.');
      }
    } else {
      // Error in request setup
      showError('An error occurred while making the request.');
    }
    
    return Promise.reject(error);
  }
);

// Helper function for retry logic
export const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Helper function for handling file uploads
export const uploadFile = async (url, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    }
  });
};

// Helper function for downloading files
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename || 'download';
    link.click();
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    showError('Failed to download file.');
    throw error;
  }
};

export default api;
