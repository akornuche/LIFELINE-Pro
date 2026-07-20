import * as userRepository from '../models/userRepository.js';
import * as patientRepository from '../models/patientRepository.js';
import * as doctorRepository from '../models/doctorRepository.js';
import * as pharmacyRepository from '../models/pharmacyRepository.js';
import * as hospitalRepository from '../models/hospitalRepository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken, verifyRefreshToken, blacklistToken, decodeToken } from '../utils/jwt.js';
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

    // Generate LifeLine ID (retry up to 5 times on collision)
    let lifelineId;
    for (let attempt = 0; attempt < 5; attempt++) {
      lifelineId = await generateLifelineId(userType);
      logger.info('Generated lifelineId', { lifelineId, userType, attempt });
      const exists = await userRepository.lifelineIdExists(lifelineId);
      if (!exists) break;
      logger.warn('LifeLine ID collision, retrying', { lifelineId, attempt });
      if (attempt === 4) {
        throw new BusinessLogicError('ID generation failed after multiple attempts. Please try again.');
      }
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

    // Send verification email (non-blocking)
    const verificationToken = generateAccessToken(
      { userId: user.id, purpose: 'email-verification' },
      '24h'
    );
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3003'}/verify-email/${verificationToken}`;
    sendEmail({
      to: email,
      subject: 'Verify your LifeLine Pro email address',
      template: 'emailVerification',
      data: {
        name: firstName || email,
        verificationUrl,
      },
    }).catch(err => {
      logger.warn('Verification email failed', { error: err.message });
      console.warn(`\n[LIFELINE] Email verification link for ${email}:\n  ${verificationUrl}\n`);
    });

    // Send welcome email (non-blocking)
    const ROLE_WELCOME_MESSAGES = {
      patient: 'You\'re all set! You can now browse and request healthcare services across your city.',
      doctor: 'Welcome, Doctor! Your account is pending admin verification. Once approved, patients in your city will be assigned to you automatically.',
      pharmacy: 'Welcome! Your pharmacy account is pending admin verification. Once approved, you\'ll start receiving prescription fulfilment requests.',
      hospital: 'Welcome! Your hospital account is pending admin verification. Once approved, patients in your city will be able to request your services.',
    };
    sendEmail({
      to: email,
      subject: 'Welcome to LifeLine Pro!',
      template: 'welcome',
      data: {
        name: firstName || email,
        lifelineId,
        role: userType,
        roleMessage: ROLE_WELCOME_MESSAGES[userType] || 'Your account has been created successfully.',
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
    // Plain Errors from verifyRefreshToken (invalid JWT, expired, revoked) must be
    // mapped to UnauthorizedError so the global error handler returns 401, not 500.
    const jwtErrorPhrases = ['Invalid refresh token', 'Refresh token has expired', 'Refresh token has been revoked', 'Invalid token type'];
    if (jwtErrorPhrases.some(p => error.message.includes(p))) {
      throw new UnauthorizedError(error.message);
    }
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
    let decoded;
    try {
      decoded = verifyToken(verificationToken, 'access');
    } catch (tokenErr) {
      // Re-throw with a clear message so the frontend can show the right copy
      if (tokenErr.message === 'Token has expired') {
        throw new UnauthorizedError('Verification link has expired. Please request a new one.');
      }
      throw new UnauthorizedError('Invalid verification link. Please request a new one.');
    }

    // Accept tokens with explicit purpose OR legacy tokens (no purpose field)
    // issued before the purpose field was added.
    // Still reject tokens with a DIFFERENT purpose (e.g. password-reset).
    const hasWrongPurpose = decoded.purpose && decoded.purpose !== 'email-verification';
    if (!decoded.userId || hasWrongPurpose) {
      throw new UnauthorizedError('Invalid verification link. Please request a new one.');
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
 * Resend email verification (for authenticated users)
 */
export const resendEmailVerification = async (userId) => {
  return _sendVerificationEmail(userId);
};

/**
 * Resend email verification using an expired/invalid token (public endpoint).
 * Decodes the token without signature verification to extract userId — no
 * re-entry of email needed.
 */
export const resendVerificationByToken = async (expiredToken) => {
  let decoded;
  try {
    // decodeToken does NOT verify the signature or expiry — intentional here
    const result = decodeToken(expiredToken);
    decoded = result?.payload || result;
  } catch {
    decoded = null;
  }

  // Accept tokens whose purpose was email-verification OR plain auth tokens
  // (the initial registration returns an auth token; user may paste that in)
  if (!decoded || !decoded.userId) {
    throw new BusinessLogicError('Invalid or unreadable token. Please log in and use the resend option from your dashboard.');
  }

  return _sendVerificationEmail(decoded.userId);
};

/**
 * Internal helper — builds and sends the verification email for a userId.
 */
async function _sendVerificationEmail(userId) {
  try {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.is_email_verified) {
      return { alreadyVerified: true, message: 'Email address is already verified' };
    }

    // Generate a fresh verification token (valid for 24 hours)
    const verificationToken = generateAccessToken(
      { userId: user.id, purpose: 'email-verification' },
      '24h'
    );

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

    // Attempt to send verification email
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Verify your LifeLine Pro email address',
      template: 'emailVerification',
      data: {
        name: user.first_name || user.email,
        verificationUrl,
      },
    }).catch(err => ({ success: false, error: err.message }));

    if (!emailResult?.success) {
      // SMTP not configured — log the link so it can be used manually
      logger.warn('Email not sent (SMTP unconfigured). Verification link below:');
      // eslint-disable-next-line no-console
      console.warn(`\n[LIFELINE DEV] Email verification link for ${user.email}:\n  ${verificationUrl}\n`);
    }

    return {
      message: 'Verification email sent',
      // Remove in production — only for local dev/testing
      ...(process.env.NODE_ENV !== 'production' && { verificationToken }),
    };
  } catch (error) {
    logger.error('Send verification email error', { error: error.message, userId });
    throw error;
  }
}

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
  resendVerificationByToken,
  getCurrentUser,
  updateProfile,
  deactivateAccount,
  deleteAccount,
};
