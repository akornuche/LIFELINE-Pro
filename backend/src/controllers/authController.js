import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Auth Controller
 * HTTP request handlers for authentication endpoints
 */

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    return successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    return successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    return successResponse(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const { refreshToken } = req.body;

    const result = await authService.logout(accessToken, refreshToken);

    return successResponse(res, result, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    return successResponse(res, result, 'Password reset instructions sent');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    const result = await authService.resetPassword(resetToken, newPassword);

    return successResponse(res, result, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (authenticated)
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    const result = await authService.changePassword(userId, oldPassword, newPassword);

    return successResponse(res, result, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 * GET /api/auth/verify-email/:token
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await authService.verifyEmail(token);

    return successResponse(res, result, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend email verification
 * POST /api/auth/resend-verification
 */
export const resendVerification = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await authService.resendEmailVerification(userId);

    return successResponse(res, result, 'Verification email sent');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await authService.getCurrentUser(userId);

    return successResponse(res, { user }, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await authService.updateProfile(userId, req.body);

    return successResponse(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate account
 * POST /api/auth/deactivate
 */
export const deactivateAccount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    const result = await authService.deactivateAccount(userId, password);

    return successResponse(res, result, 'Account deactivated successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  getCurrentUser,
  updateProfile,
  deactivateAccount,
};
