import Joi from 'joi';

/**
 * Authentication Validation Schemas
 * Joi schemas for user authentication and account management
 */

/**
 * Common validation rules
 */
const emailRule = Joi.string()
  .email()
  .lowercase()
  .trim()
  .max(255)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required',
  });

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  });

const phoneRule = Joi.string()
  .pattern(/^(\+234|0)[78901]\d{9}$/)
  .required()
  .messages({
    'string.pattern.base': 'Please provide a valid Nigerian phone number (e.g., 08012345678 or +2348012345678)',
    'string.empty': 'Phone number is required',
    'any.required': 'Phone number is required',
  });

/**
 * Registration schemas
 */

// Patient registration
export const registerPatientSchema = Joi.object({
  email: emailRule,
  password: passwordRule,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),
  firstName: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'string.empty': 'First name is required',
  }),
  lastName: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.empty': 'Last name is required',
  }),
  phone: phoneRule,
  dateOfBirth: Joi.date().max('now').required().messages({
    'date.max': 'Date of birth cannot be in the future',
    'any.required': 'Date of birth is required',
  }),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  address: Joi.string().trim().min(10).max(500).required(),
  packageType: Joi.string().valid('basic', 'medium', 'advanced').default('basic'),
  emergencyContact: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    phone: phoneRule,
    relationship: Joi.string().trim().max(50).required(),
  }).required(),
});

// Doctor registration
export const registerDoctorSchema = Joi.object({
  email: emailRule,
  password: passwordRule,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
  firstName: Joi.string().trim().min(2).max(100).required(),
  lastName: Joi.string().trim().min(2).max(100).required(),
  phone: phoneRule,
  specialization: Joi.string().trim().min(2).max(100).required(),
  licenseNumber: Joi.string().trim().min(5).max(50).required(),
  licenseExpiryDate: Joi.date().min('now').required().messages({
    'date.min': 'License must be valid',
  }),
  yearsOfExperience: Joi.number().integer().min(0).max(70).required(),
  qualifications: Joi.array().items(Joi.string().trim().max(200)).min(1).required(),
  hospitalAffiliations: Joi.array().items(Joi.string().trim().max(200)),
  consultationFee: Joi.number().positive().precision(2).required(),
  bio: Joi.string().trim().max(1000),
});

// Pharmacy registration
export const registerPharmacySchema = Joi.object({
  email: emailRule,
  password: passwordRule,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
  pharmacyName: Joi.string().trim().min(2).max(200).required(),
  phone: phoneRule,
  address: Joi.string().trim().min(10).max(500).required(),
  licenseNumber: Joi.string().trim().min(5).max(50).required(),
  licenseExpiryDate: Joi.date().min('now').required(),
  operatingHours: Joi.object({
    monday: Joi.string().trim(),
    tuesday: Joi.string().trim(),
    wednesday: Joi.string().trim(),
    thursday: Joi.string().trim(),
    friday: Joi.string().trim(),
    saturday: Joi.string().trim(),
    sunday: Joi.string().trim(),
  }),
  hasDelivery: Joi.boolean().default(false),
  deliveryRadius: Joi.number().positive().when('hasDelivery', {
    is: true,
    then: Joi.required(),
  }),
});

// Hospital registration
export const registerHospitalSchema = Joi.object({
  email: emailRule,
  password: passwordRule,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
  hospitalName: Joi.string().trim().min(2).max(200).required(),
  phone: phoneRule,
  address: Joi.string().trim().min(10).max(500).required(),
  hospitalType: Joi.string()
    .valid('general', 'specialized', 'teaching', 'clinic')
    .required(),
  licenseNumber: Joi.string().trim().min(5).max(50).required(),
  licenseExpiryDate: Joi.date().min('now').required(),
  numberOfBeds: Joi.number().integer().positive().required(),
  hasEmergency: Joi.boolean().default(false),
  hasICU: Joi.boolean().default(false),
  departments: Joi.array().items(Joi.string().trim().max(100)).min(1).required(),
  accreditation: Joi.string().trim().max(200),
});

/**
 * Login schema
 */
export const loginSchema = Joi.object({
  email: emailRule,
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
  rememberMe: Joi.boolean().default(false),
});

/**
 * Password management schemas
 */

// Request password reset
export const requestPasswordResetSchema = Joi.object({
  email: emailRule,
});

// Reset password with token
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required',
  }),
  password: passwordRule,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

// Change password (authenticated)
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),
  newPassword: passwordRule,
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

/**
 * Token management schemas
 */

// Refresh access token
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required',
  }),
});

// Logout
export const logoutSchema = Joi.object({
  refreshToken: Joi.string(),
});

/**
 * Email verification schemas
 */

// Request email verification
export const requestEmailVerificationSchema = Joi.object({
  email: emailRule,
});

// Verify email with code
export const verifyEmailSchema = Joi.object({
  email: emailRule,
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'Verification code must be 6 digits',
    'string.pattern.base': 'Verification code must contain only numbers',
  }),
});

/**
 * Email change schema
 */
export const changeEmailSchema = Joi.object({
  newEmail: Joi.string()
    .email()
    .lowercase()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required to change email',
  }),
});

/**
 * Phone update schema
 */
export const updatePhoneSchema = Joi.object({
  phone: phoneRule,
  password: Joi.string().required().messages({
    'string.empty': 'Password is required to change phone number',
  }),
});

/**
 * OTP schemas
 */

// Request OTP
export const requestOtpSchema = Joi.object({
  phone: phoneRule,
  purpose: Joi.string().valid('login', 'verification', 'transaction').required(),
});

// Verify OTP
export const verifyOtpSchema = Joi.object({
  phone: phoneRule,
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
  }),
  purpose: Joi.string().valid('login', 'verification', 'transaction').required(),
});

/**
 * Two-factor authentication schemas
 */

// Enable 2FA
export const enable2FASchema = Joi.object({
  password: Joi.string().required(),
  method: Joi.string().valid('sms', 'email', 'app').required(),
});

// Verify 2FA setup
export const verify2FASetupSchema = Joi.object({
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
});

// Disable 2FA
export const disable2FASchema = Joi.object({
  password: Joi.string().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
});

/**
 * Account deactivation schema
 */
export const deactivateAccountSchema = Joi.object({
  password: Joi.string().required().messages({
    'string.empty': 'Password is required to deactivate account',
  }),
  reason: Joi.string().trim().max(500),
  confirmation: Joi.string().valid('DEACTIVATE').required().messages({
    'any.only': 'Please type DEACTIVATE to confirm account deactivation',
  }),
});

/**
 * Generic registration schema (for all user types)
 */
export const registerSchema = Joi.object({
  userType: Joi.string().valid('patient', 'doctor', 'pharmacy', 'hospital').required().messages({
    'any.only': 'User type must be patient, doctor, pharmacy, or hospital',
    'any.required': 'User type is required',
  }),
  email: emailRule,
  password: passwordRule,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),
  // Patient specific fields
  firstName: Joi.string().trim().min(2).max(100).when('userType', {
    is: 'patient',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  lastName: Joi.string().trim().min(2).max(100).when('userType', {
    is: 'patient',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  phone: phoneRule,
  dateOfBirth: Joi.date().max('now').when('userType', {
    is: 'patient',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  gender: Joi.string().valid('male', 'female', 'other').when('userType', {
    is: 'patient',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  address: Joi.string().trim().min(10).max(500).when('userType', {
    is: 'patient',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  packageType: Joi.string().valid('basic', 'medium', 'advanced').default('basic'),
  emergencyContact: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    phone: phoneRule,
    relationship: Joi.string().trim().max(50).required(),
  }).when('userType', {
    is: 'patient',
    then: Joi.optional(),
    otherwise: Joi.optional()
  }),
  // Doctor specific fields
  specialization: Joi.string().trim().min(2).max(100).optional(),
  licenseNumber: Joi.string().trim().min(5).max(50).optional(),
  licenseExpiryDate: Joi.date().min('now').optional(),
  yearsOfExperience: Joi.number().integer().min(0).max(70).optional(),
  qualifications: Joi.array().items(Joi.string().trim().max(200)).optional(),
  hospitalAffiliations: Joi.array().items(Joi.string().trim().max(200)).optional(),
  consultationFee: Joi.number().positive().precision(2).optional(),
  bio: Joi.string().trim().max(1000).optional(),
  // Pharmacy specific fields
  pharmacyName: Joi.string().trim().min(2).max(200).optional(),
  operatingHours: Joi.object({
    monday: Joi.string().trim(),
    tuesday: Joi.string().trim(),
    wednesday: Joi.string().trim(),
    thursday: Joi.string().trim(),
    friday: Joi.string().trim(),
    saturday: Joi.string().trim(),
    sunday: Joi.string().trim(),
  }).optional(),
  hasDelivery: Joi.boolean().default(false),
  deliveryRadius: Joi.number().positive().when('hasDelivery', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  // Hospital specific fields
  hospitalName: Joi.string().trim().min(2).max(200).optional(),
  hospitalType: Joi.string().valid('general', 'specialized', 'teaching', 'clinic').optional(),
  numberOfBeds: Joi.number().integer().positive().optional(),
  hasEmergency: Joi.boolean().default(false),
  hasICU: Joi.boolean().default(false),
  departments: Joi.array().items(Joi.string().trim().max(100)).optional(),
  accreditation: Joi.string().trim().max(200).optional(),
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = Joi.object({
  email: emailRule,
});

/**
 * Update profile schema
 */
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 100 characters',
  }),
  lastName: Joi.string().trim().min(2).max(100).messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 100 characters',
  }),
  phone: phoneRule,
  dateOfBirth: Joi.date().max('now').messages({
    'date.max': 'Date of birth cannot be in the future',
  }),
  address: Joi.string().trim().min(10).max(500).messages({
    'string.min': 'Address must be at least 10 characters',
    'string.max': 'Address cannot exceed 500 characters',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export default {
  registerSchema,
  registerPatientSchema,
  registerDoctorSchema,
  registerPharmacySchema,
  registerHospitalSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  logoutSchema,
  requestEmailVerificationSchema,
  verifyEmailSchema,
  changeEmailSchema,
  updatePhoneSchema,
  requestOtpSchema,
  verifyOtpSchema,
  enable2FASchema,
  verify2FASetupSchema,
  disable2FASchema,
  deactivateAccountSchema,
  forgotPasswordSchema,
  updateProfileSchema,
};
