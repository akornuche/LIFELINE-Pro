import * as userRepository from '../models/userRepository.js';
import * as patientRepository from '../models/patientRepository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken, verifyRefreshToken, blacklistToken } from '../utils/jwt.js';
import { generateLifelineId } from '../utils/idGenerator.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */

/**
 * Register new user
 */
export const register = async (userData) => {
  const { email, password, firstName, lastName, phone, role = 'patient', dateOfBirth = null } = userData;

  try {
    // Check if email already exists
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
      throw new BusinessLogicError('Email already registered');
    }

    // Generate LifeLine ID
    const lifelineId = generateLifelineId(role);

    // Check if LifeLine ID exists (extremely rare collision)
    const lifelineIdExists = await userRepository.lifelineIdExists(lifelineId);
    if (lifelineIdExists) {
      throw new BusinessLogicError('ID generation conflict. Please try again.');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await userRepository.createUser({
      lifelineId,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      dateOfBirth,
    });

    // If patient role, create patient record
    if (role === 'patient') {
      await patientRepository.createPatient({
        userId: user.id,
      });
    }

    logger.info('User registered successfully', {
      userId: user.id,
      lifelineId: user.lifeline_id,
      role: user.role,
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      lifelineId: user.lifeline_id,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('Registration error', {
      error: error.message,
      email,
    });
    throw error;
  }
};

/**
 * Login user
 */
export const login = async (credentials) => {
  const { email, password } = credentials;

  try {
    // Find user by email
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account is active
    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      lifelineId: user.lifeline_id,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    logger.info('User logged in successfully', {
      userId: user.id,
      lifelineId: user.lifeline_id,
      role: user.role,
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      email,
    });
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user
    const user = await userRepository.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User not found or account deactivated');
    }

    // Generate new access token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      lifelineId: user.lifeline_id,
    };
    const accessToken = generateAccessToken(tokenPayload);

    logger.info('Access token refreshed', {
      userId: user.id,
    });

    return {
      accessToken,
    };
  } catch (error) {
    logger.error('Token refresh error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async (accessToken, refreshToken) => {
  try {
    // Blacklist both tokens
    await blacklistToken(accessToken);
    await blacklistToken(refreshToken);

    logger.info('User logged out successfully');

    return {
      message: 'Logged out successfully',
    };
  } catch (error) {
    logger.error('Logout error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email) => {
  try {
    // Find user by email
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists
      logger.info('Password reset requested for non-existent email', { email });
      return {
        message: 'If the email exists, a reset link has been sent',
      };
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = generateAccessToken(
      { userId: user.id, purpose: 'password-reset' },
      '1h'
    );

    // TODO: Send email with reset link
    // For now, just log it
    logger.info('Password reset token generated', {
      userId: user.id,
      email: user.email,
      resetToken,
    });

    // In production, send email here
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: 'If the email exists, a reset link has been sent',
      // Remove this in production - only for testing
      resetToken,
    };
  } catch (error) {
    logger.error('Password reset request error', {
      error: error.message,
      email,
    });
    throw error;
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (resetToken, newPassword) => {
  try {
    // Verify reset token
    const decoded = verifyToken(resetToken, 'access');

    if (!decoded || decoded.purpose !== 'password-reset') {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Get user
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await userRepository.updatePassword(user.id, hashedPassword);

    // Blacklist the reset token
    await blacklistToken(resetToken);

    logger.info('Password reset successfully', {
      userId: user.id,
    });

    return {
      message: 'Password reset successfully',
    };
  } catch (error) {
    logger.error('Password reset error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Change password (authenticated user)
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    // Get user
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify old password
    const isPasswordValid = await verifyPassword(oldPassword, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await userRepository.updatePassword(userId, hashedPassword);

    logger.info('Password changed successfully', {
      userId,
    });

    return {
      message: 'Password changed successfully',
    };
  } catch (error) {
    logger.error('Password change error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (verificationToken) => {
  try {
    // Verify token
    const decoded = verifyToken(verificationToken, 'access');

    if (!decoded || decoded.purpose !== 'email-verification') {
      throw new UnauthorizedError('Invalid or expired verification token');
    }

    // Get user
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.is_email_verified) {
      return {
        message: 'Email already verified',
      };
    }

    // Verify email
    await userRepository.verifyEmail(user.id);

    // Blacklist the verification token
    await blacklistToken(verificationToken);

    logger.info('Email verified successfully', {
      userId: user.id,
    });

    return {
      message: 'Email verified successfully',
    };
  } catch (error) {
    logger.error('Email verification error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Resend email verification
 */
export const resendEmailVerification = async (userId) => {
  try {
    // Get user
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.is_email_verified) {
      throw new BusinessLogicError('Email already verified');
    }

    // Generate verification token (valid for 24 hours)
    const verificationToken = generateAccessToken(
      { userId: user.id, purpose: 'email-verification' },
      '24h'
    );

    // TODO: Send email with verification link
    // For now, just log it
    logger.info('Email verification token generated', {
      userId: user.id,
      email: user.email,
      verificationToken,
    });

    // In production, send email here
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: 'Verification email sent',
      // Remove this in production - only for testing
      verificationToken,
    };
  } catch (error) {
    logger.error('Resend verification error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (userId) => {
  try {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  } catch (error) {
    logger.error('Get current user error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, updateData) => {
  const { firstName, lastName, phone, dateOfBirth, address } = updateData;

  try {
    const updatedUser = await userRepository.updateProfile(userId, {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address,
    });

    logger.info('User profile updated', {
      userId,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  } catch (error) {
    logger.error('Update profile error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Deactivate account
 */
export const deactivateAccount = async (userId, password) => {
  try {
    // Get user
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Password is incorrect');
    }

    // Deactivate account
    await userRepository.deactivateAccount(userId);

    logger.info('Account deactivated', {
      userId,
    });

    return {
      message: 'Account deactivated successfully',
    };
  } catch (error) {
    logger.error('Account deactivation error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

export default {
  register,
  login,
  refreshAccessToken,
  logout,
  requestPasswordReset,
  resetPassword,
  changePassword,
  verifyEmail,
  resendEmailVerification,
  getCurrentUser,
  updateProfile,
  deactivateAccount,
};
