import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services';
import { toast } from 'vue3-toastify';

export const useAuthStore = defineStore('auth', () => {
  // On app load: if user logged in without Remember Me and browser session ended, clear persisted tokens
  const _rememberPref = localStorage.getItem('lifeline_remember');
  if (_rememberPref === 'false' && !sessionStorage.getItem('lifeline_session')) {
    localStorage.removeItem('lifeline_token');
    localStorage.removeItem('lifeline_refresh_token');
  }

  // State
  const token = ref(localStorage.getItem('lifeline_token') || sessionStorage.getItem('lifeline_token') || null);
  const refreshToken = ref(localStorage.getItem('lifeline_refresh_token') || sessionStorage.getItem('lifeline_refresh_token') || null);
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);
  const isEmailVerified = computed(() => !!(user.value?.email_verified || user.value?.is_email_verified));
  const userName = computed(() => {
    if (!user.value) return '';
    // Hospitals/pharmacies may have full_name or hospital_name instead of first/last
    if (user.value.full_name) return user.value.full_name;
    if (user.value.hospital_name) return user.value.hospital_name;
    if (user.value.pharmacy_name) return user.value.pharmacy_name;
    const first = user.value.first_name || '';
    const last = user.value.last_name || '';
    return `${first} ${last}`.trim() || user.value.email || '';
  });
  const profilePictureUrl = computed(() => {
    const pic = user.value?.profile_picture;
    if (!pic) return null;
    if (pic.startsWith('http')) return pic;
    // Relative path from backend — prefix with API URL
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}${pic}`;
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

  async function login(credentials, { rememberMe = false } = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.login(credentials);
      const { accessToken, refreshToken: newRefreshToken, user: userData } = response.data;

      // Persist the rememberMe preference so we can check it on next app load
      localStorage.setItem('lifeline_remember', String(rememberMe));
      if (!rememberMe) {
        // Mark active browser session so we know when it ends
        sessionStorage.setItem('lifeline_session', '1');
      }

      setToken(accessToken, rememberMe);
      setRefreshToken(newRefreshToken, rememberMe);
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
      // Update local user state so the banner disappears immediately
      if (user.value) {
        user.value = { ...user.value, email_verified: 1, is_email_verified: 1 };
      }
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
      const data = response.data?.data || response.data;
      if (data?.alreadyVerified) {
        // DB says already verified — sync local state so banner disappears
        user.value = { ...user.value, email_verified: 1, is_email_verified: 1 };
        toast.success('Your email is already verified!');
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to send verification email';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Resend verification using an expired token from the URL (public — no login needed).
   * The backend decodes the token without verifying expiry to find the user.
   */
  async function resendVerificationByToken(expiredToken) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.resendVerificationByToken(expiredToken);
      const data = response.data?.data || response.data;
      if (data?.alreadyVerified) {
        if (user.value) {
          user.value = { ...user.value, email_verified: 1, is_email_verified: 1 };
        }
        toast.success('Your email is already verified!');
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to resend verification email';
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

  /**
   * Patch the local auth user with updated fields (e.g. after a provider profile update).
   * No API call — just keeps the sidebar name/photo in sync.
   */
  function patchUser(fields = {}) {
    if (!user.value) return;

    const patchedFields = { ...fields };

    // Automatically split full_name into first/last if provided
    if (patchedFields.full_name) {
      const parts = patchedFields.full_name.trim().split(/\s+/);
      patchedFields.first_name = parts[0];
      patchedFields.last_name = parts.slice(1).join(' ');
      delete patchedFields.full_name;
    }

    user.value = { ...user.value, ...patchedFields };
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

  async function deleteAccount() {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.deleteAccount();
      clearAuth();
      toast.success('Account deleted successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Account deletion failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function setToken(newToken, persist = true) {
    token.value = newToken;
    if (persist) {
      localStorage.setItem('lifeline_token', newToken);
      sessionStorage.removeItem('lifeline_token');
    } else {
      sessionStorage.setItem('lifeline_token', newToken);
      localStorage.removeItem('lifeline_token');
    }
  }

  function setRefreshToken(newRefreshToken, persist = true) {
    refreshToken.value = newRefreshToken;
    if (persist) {
      localStorage.setItem('lifeline_refresh_token', newRefreshToken);
      sessionStorage.removeItem('lifeline_refresh_token');
    } else {
      sessionStorage.setItem('lifeline_refresh_token', newRefreshToken);
      localStorage.removeItem('lifeline_refresh_token');
    }
  }

  function clearAuth() {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem('lifeline_token');
    localStorage.removeItem('lifeline_refresh_token');
    localStorage.removeItem('lifeline_remember');
    sessionStorage.removeItem('lifeline_token');
    sessionStorage.removeItem('lifeline_refresh_token');
    sessionStorage.removeItem('lifeline_session');
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
    isEmailVerified,
    userRole,
    userName,
    profilePictureUrl,
    // Actions
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerification,
    resendVerificationByToken,
    getCurrentUser,
    updateProfile,
    patchUser,
    deactivateAccount,
    deleteAccount,
    setToken,
    setRefreshToken,
    clearAuth
  };
}, {
  persist: {
    paths: ['token', 'refreshToken', 'user']
  }
});
