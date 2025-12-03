import Joi from 'joi';

/**
 * Dependent Validation Schemas
 */

/**
 * Create dependent schema
 */
export const createDependentSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters',
  }),

  lastName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters',
  }),

  dateOfBirth: Joi.date().max('now').required().messages({
    'date.base': 'Invalid date of birth',
    'date.max': 'Date of birth cannot be in the future',
  }),

  gender: Joi.string().valid('male', 'female', 'other').required().messages({
    'any.only': 'Gender must be male, female, or other',
  }),

  relationship: Joi.string()
    .valid('spouse', 'child', 'parent', 'sibling', 'other')
    .required()
    .messages({
      'any.only': 'Invalid relationship type',
    }),

  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .optional()
    .allow('', null),

  genotype: Joi.string().valid('AA', 'AS', 'SS', 'AC', 'SC').optional().allow('', null),

  allergies: Joi.string().max(500).optional().allow('', null),

  chronicConditions: Joi.string().max(500).optional().allow('', null),

  emergencyContact: Joi.string().trim().max(100).optional().allow('', null),

  emergencyPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Invalid phone number format',
    }),

  idType: Joi.string()
    .valid('birth_certificate', 'nin', 'passport', 'other')
    .optional()
    .allow('', null),

  idNumber: Joi.string().max(50).optional().allow('', null),
});

/**
 * Update dependent schema
 */
export const updateDependentSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).optional(),
  lastName: Joi.string().trim().min(2).max(100).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  relationship: Joi.string()
    .valid('spouse', 'child', 'parent', 'sibling', 'other')
    .optional(),
  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .optional()
    .allow('', null),
  genotype: Joi.string().valid('AA', 'AS', 'SS', 'AC', 'SC').optional().allow('', null),
  allergies: Joi.string().max(500).optional().allow('', null),
  chronicConditions: Joi.string().max(500).optional().allow('', null),
  emergencyContact: Joi.string().trim().max(100).optional().allow('', null),
  emergencyPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow('', null),
  idType: Joi.string()
    .valid('birth_certificate', 'nin', 'passport', 'other')
    .optional()
    .allow('', null),
  idNumber: Joi.string().max(50).optional().allow('', null),
  isActive: Joi.boolean().optional(),
});
