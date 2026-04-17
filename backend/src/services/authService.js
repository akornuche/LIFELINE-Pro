import * as userRepository from '../models/userRepository.js';
import * as patientRepository from '../models/patientRepository.js';
import * as doctorRepository from '../models/doctorRepository.js';
import * as pharmacyRepository from '../models/pharmacyRepository.js';
import * as hospitalRepository from '../models/hospitalRepository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken, verifyRefreshToken, blacklistToken } from '../utils/jwt.js';
import { generateLifelineId } from '../utils/idGenerator.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';
import { sendEmail } from './emailService.js';

/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */

/**
 * Register new user
 */
export const register = async (userData) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    userType = 'patient',
    dateOfBirth = null,
    gender = null,
    address = null,
    city = null,
    state = null,
    emergencyContact = null,
    // Doctor fields
    specialization = null,
    licenseNumber = null,
    licenseExpiryDate = null,
    yearsOfExperience = 0,
    qualifications = [],
    consultationFee = 0,
    // Pharmacy fields
    pharmacyName = null,
    operatingHours = null,
    // Hospital fields
    hospitalName = null,
    hospitalType = 'general',
    numberOfBeds = 0,
    departments = [],
  } = userData;

  try {
    // Check if email already exists
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
      throw new BusinessLogicError('Email already registered');
    }

    // Generate LifeLine ID
    const lifelineId = await generateLifelineId(userType);
    logger.info('Generated lifelineId', { lifelineId, userType });

    // Check if LifeLine ID exists (extremely rare collision)
    const lifelineIdExists = await userRepository.lifelineIdExists(lifelineId);
    logger.info('Checked lifelineId existence', { lifelineId, exists: lifelineIdExists });
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
      role: userType,
      dateOfBirth,
      city,
      state,
    });

    // Create role-specific records
    if (userType === 'patient') {
      await patientRepository.createPatient(user.id, {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        address,
        emergencyContactName: emergencyContact?.name,
        emergencyContactPhone: emergencyContact?.phone,
        emergencyContactRelationship: emergencyContact?.relationship,
      });
    } else if (userType === 'doctor') {
      await doctorRepository.createDoctor(user.id, {
        specialization: specialization || 'General Practice',
        licenseNumber: licenseNumber || `PENDING-${lifelineId}`,
        licenseExpiryDate: licenseExpiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        yearsOfExperience: yearsOfExperience || 0,
        consultationFee: consultationFee || 0,
      });
    } else if (userType === 'pharmacy') {
      await pharmacyRepository.createPharmacy(user.id, {
        pharmacyName: pharmacyName || `${firstName} ${lastName} Pharmacy`,
        address: address || 'Pending Address',
        licenseNumber: licenseNumber || `PHARM-PENDING-${lifelineId}`,
        licenseExpiryDate: licenseExpiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        operatingHours: operatingHours || null,
      });
    } else if (userType === 'hospital') {
      await hospitalRepository.createHospital(user.id, {
        hospitalName: hospitalName || `${firstName} ${lastName} Hospital`,
        address: address || 'Pending Address',
        hospitalType: hospitalType || 'general',
        licenseNumber: licenseNumber || `HOSP-PENDING-${lifelineId}`,
        licenseExpiryDate: licenseExpiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        numberOfBeds: numberOfBeds || 0,
        departments: departments || [],
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

    // Send welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: 'Welcome to LifeLine Pro!',
      template: 'welcome',
      data: {
        name: firstName || email,
        lifelineId,
        role: userType,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
      },
    }).catch(err => logger.warn('Welcome email failed', { error: err.message }));

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
    // Send password reset email (non-blocking)
    sendEmail({
      to: user.email,
      subject: 'LifeLine Pro - Password Reset',
      template: 'password_reset',
      data: {
        name: user.first_name || user.email,
        resetLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
        expiresIn: '1 hour',
      },
    }).catch(err => logger.warn('Password reset email failed', { error: err.message }));

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
    logger.info('[DEBUG-SERVICE] starting changePassword for userId:', { userId });
    // Get user
    const user = await userRepository.findById(userId);

    if (!user) {
      logger.error('[ERROR-SERVICE] User not found during pwd change:', { userId });
      throw new NotFoundError('User');
    }

    logger.info('[DEBUG-SERVICE] Found user. Verifying password...');
    // Verify old password
    const isPasswordValid = await verifyPassword(oldPassword, user.password_hash);

    if (!isPasswordValid) {
      logger.warn('[WARN-SERVICE] Current password mismatch for user:', { userId });
      throw new UnauthorizedError('Current password is incorrect');
    }

    logger.info('[DEBUG-SERVICE] Password valid. Hashing new password...');
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    logger.info('[DEBUG-SERVICE] Updating password in DB...');
    // Update password
    await userRepository.updatePassword(userId, hashedPassword);

    logger.info('[DEBUG-SERVICE] Database update complete.');

    logger.info('Password changed successfully', {
      userId,
    });

    return {
      message: 'Password changed successfully',
    };
  } catch (error) {
    logger.error('[ERROR-SERVICE] error in changePassword service:', { error: error.message, stack: error.stack, userId });
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
  const { 
    firstName, first_name, 
    lastName, last_name, 
    phone, phone_number, 
    dateOfBirth, date_of_birth, 
    address, 
    profile_picture 
  } = updateData;

  try {
    const dbUpdates = {};
    if (firstName !== undefined || first_name !== undefined) dbUpdates.first_name = firstName || first_name;
    if (lastName !== undefined || last_name !== undefined) dbUpdates.last_name = lastName || last_name;
    if (phone !== undefined || phone_number !== undefined) dbUpdates.phone = phone || phone_number;
    if (dateOfBirth !== undefined || date_of_birth !== undefined) dbUpdates.date_of_birth = dateOfBirth || date_of_birth;
    if (address !== undefined) dbUpdates.address = address;
    if (profile_picture !== undefined) dbUpdates.profile_picture = profile_picture;

    const updatedUser = await userRepository.updateProfile(userId, dbUpdates);

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

    // Verify password if provided
    if (password) {
      const isPasswordValid = await verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Password is incorrect');
      }
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

/**
 * Delete account
 */
export const deleteAccount = async (userId, password) => {
  try {
    // Get user
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify password if provided
    if (password) {
      const isPasswordValid = await verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Password is incorrect');
      }
    }

    // Delete account
    await userRepository.deleteAccount(userId);

    logger.info('Account deleted', {
      userId,
    });

    return {
      message: 'Account deleted successfully',
    };
  } catch (error) {
    logger.error('Account deletion error', {
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
  deleteAccount,
};
