import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services';
import { toast } from 'vue3-toastify';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('lifeline_token') || null);
  const refreshToken = ref(localStorage.getItem('lifeline_refresh_token') || null);
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);
  const userName = computed(() => {
    if (!user.value) return '';
    return `${user.value.first_name} ${user.value.last_name}`;
  });

  // Actions
  async function register(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.register(data);
      toast.success('Registration successful! Please verify your email.');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function login(credentials) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.login(credentials);
      const { accessToken, refreshToken: newRefreshToken, user: userData } = response.data;

      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      user.value = userData;

      toast.success(`Welcome back, ${userData.first_name}!`);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    // If already logged out, just return
    if (!token.value) {
      return;
    }

    loading.value = true;

    try {
      await authService.logout();
    } catch (error) {
      // Ignore 401 errors - user is already logged out
      if (error.response?.status !== 401) {
        console.error('Logout error:', error);
      }
    } finally {
      clearAuth();
      toast.info('You have been logged out');
      loading.value = false;
    }
  }

  async function forgotPassword(email) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.forgotPassword(email);
      toast.success('Password reset link sent to your email');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to send reset link';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function resetPassword(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.resetPassword(data);
      toast.success('Password reset successful! Please login.');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Password reset failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function changePassword(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.changePassword(data);
      toast.success('Password changed successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Password change failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function verifyEmail(verificationToken) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.verifyEmail(verificationToken);
      toast.success('Email verified successfully!');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Email verification failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function resendVerification() {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.resendVerification();
      toast.success('Verification email sent!');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to send verification email';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getCurrentUser() {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.getCurrentUser();
      user.value = response.data.user || response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch user';
      // Only clear auth on 401 (unauthorized) - not on network errors or other issues
      if (err.response?.status === 401) {
        clearAuth();
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.updateProfile(data);
      user.value = { ...user.value, ...response.data };
      toast.success('Profile updated successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Profile update failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deactivateAccount() {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.deactivateAccount();
      clearAuth();
      toast.success('Account deactivated successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Account deactivation failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function setToken(newToken) {
    token.value = newToken;
    localStorage.setItem('lifeline_token', newToken);
  }

  function setRefreshToken(newRefreshToken) {
    refreshToken.value = newRefreshToken;
    localStorage.setItem('lifeline_refresh_token', newRefreshToken);
  }

  function clearAuth() {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem('lifeline_token');
    localStorage.removeItem('lifeline_refresh_token');
  }

  return {
    // State
    token,
    refreshToken,
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    userRole,
    userName,
    // Actions
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerification,
    getCurrentUser,
    updateProfile,
    deactivateAccount,
    setToken,
    setRefreshToken,
    clearAuth
  };
}, {
  persist: {
    paths: ['token', 'refreshToken', 'user']
  }
});
