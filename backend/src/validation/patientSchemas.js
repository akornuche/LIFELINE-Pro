import Joi from 'joi';

/**
 * Patient Validation Schemas
 * Joi schemas for patient-specific operations
 */

/**
 * Profile update schema
 */
export const updatePatientProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100),
  lastName: Joi.string().trim().min(2).max(100),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  dateOfBirth: Joi.date().max('now'),
  gender: Joi.string().valid('male', 'female', 'other'),
  address: Joi.string().trim().min(10).max(500),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  genotype: Joi.string().valid('AA', 'AS', 'SS', 'AC', 'SC'),
  allergies: Joi.array().items(Joi.string().trim().max(200)),
  chronicConditions: Joi.array().items(Joi.string().trim().max(200)),
  emergencyContact: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    relationship: Joi.string().trim().max(50),
  }),
}).min(1);

/**
 * Subscription management schemas
 */

// Create subscription
export const createSubscriptionSchema = Joi.object({
  packageType: Joi.string().valid('basic', 'medium', 'advanced').required().messages({
    'any.only': 'Package type must be basic, medium, or advanced',
    'any.required': 'Package type is required',
  }),
  billingCycle: Joi.string().valid('monthly', 'quarterly', 'annual').default('monthly'),
  paymentMethod: Joi.string()
    .valid('card', 'bank_transfer', 'wallet')
    .default('card'),
  autoRenew: Joi.boolean().default(true),
});

// Upgrade subscription
export const upgradeSubscriptionSchema = Joi.object({
  newPackageType: Joi.string()
    .valid('basic', 'medium', 'advanced')
    .required()
    .messages({
      'any.required': 'New package type is required',
    }),
  effectiveDate: Joi.date()
    .min('now')
    .default(new Date())
    .messages({
      'date.min': 'Effective date cannot be in the past',
    }),
  prorateBilling: Joi.boolean().default(true),
});

// Cancel subscription
export const cancelSubscriptionSchema = Joi.object({
  reason: Joi.string()
    .valid(
      'too_expensive',
      'not_using',
      'poor_service',
      'switching_provider',
      'other'
    )
    .required(),
  feedback: Joi.string().trim().max(1000),
  cancelImmediately: Joi.boolean().default(false),
  effectiveDate: Joi.date().min('now').when('cancelImmediately', {
    is: false,
    then: Joi.required(),
  }),
});

// Renew subscription
export const renewSubscriptionSchema = Joi.object({
  packageType: Joi.string().valid('basic', 'medium', 'advanced'),
  billingCycle: Joi.string().valid('monthly', 'quarterly', 'annual'),
  paymentMethod: Joi.string().valid('card', 'bank_transfer', 'wallet'),
});

// Update subscription
export const updateSubscriptionSchema = Joi.object({
  packageType: Joi.string().valid('basic', 'medium', 'advanced'),
  billingCycle: Joi.string().valid('monthly', 'quarterly', 'annual'),
  paymentMethod: Joi.string().valid('card', 'bank_transfer', 'wallet'),
  autoRenew: Joi.boolean(),
}).min(1);

/**
 * Dependent management schemas
 */

// Add dependent
export const addDependentSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).required(),
  lastName: Joi.string().trim().min(2).max(100).required(),
  dateOfBirth: Joi.date().max('now').required().messages({
    'date.max': 'Date of birth cannot be in the future',
  }),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  relationship: Joi.string()
    .valid('spouse', 'child', 'parent', 'sibling', 'other')
    .required(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  genotype: Joi.string().valid('AA', 'AS', 'SS', 'AC', 'SC'),
  allergies: Joi.array().items(Joi.string().trim().max(200)),
  chronicConditions: Joi.array().items(Joi.string().trim().max(200)),
  isMinor: Joi.boolean().default(false),
});

// Update dependent
export const updateDependentSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100),
  lastName: Joi.string().trim().min(2).max(100),
  dateOfBirth: Joi.date().max('now'),
  gender: Joi.string().valid('male', 'female', 'other'),
  relationship: Joi.string().valid('spouse', 'child', 'parent', 'sibling', 'other'),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  genotype: Joi.string().valid('AA', 'AS', 'SS', 'AC', 'SC'),
  allergies: Joi.array().items(Joi.string().trim().max(200)),
  chronicConditions: Joi.array().items(Joi.string().trim().max(200)),
  isMinor: Joi.boolean(),
}).min(1);

// Remove dependent
export const removeDependentSchema = Joi.object({
  reason: Joi.string().trim().max(500),
  effectiveDate: Joi.date().min('now').default(new Date()),
});

/**
 * Medical history schemas
 */

// Add medical condition
export const addMedicalConditionSchema = Joi.object({
  conditionName: Joi.string().trim().min(2).max(200).required(),
  diagnosedDate: Joi.date().max('now').required(),
  severity: Joi.string().valid('mild', 'moderate', 'severe').default('moderate'),
  currentStatus: Joi.string()
    .valid('active', 'resolved', 'chronic', 'in_remission')
    .default('active'),
  medications: Joi.array().items(Joi.string().trim().max(200)),
  notes: Joi.string().trim().max(1000),
});

// Update medical condition
export const updateMedicalConditionSchema = Joi.object({
  conditionName: Joi.string().trim().min(2).max(200),
  severity: Joi.string().valid('mild', 'moderate', 'severe'),
  currentStatus: Joi.string().valid('active', 'resolved', 'chronic', 'in_remission'),
  medications: Joi.array().items(Joi.string().trim().max(200)),
  notes: Joi.string().trim().max(1000),
}).min(1);

/**
 * Medical document schemas
 */

// Upload medical document
export const uploadMedicalDocumentSchema = Joi.object({
  documentType: Joi.string()
    .valid(
      'lab_result',
      'prescription',
      'imaging',
      'referral',
      'insurance',
      'vaccination',
      'other'
    )
    .required(),
  documentName: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(500),
  documentDate: Joi.date().max('now').required(),
  relatedCondition: Joi.string().trim().max(200),
  isForDependent: Joi.boolean().default(false),
  dependentId: Joi.string().uuid().when('isForDependent', {
    is: true,
    then: Joi.required(),
  }),
});

/**
 * Appointment preference schemas
 */

// Set appointment preferences
export const setAppointmentPreferencesSchema = Joi.object({
  preferredDoctors: Joi.array().items(Joi.string().uuid()),
  preferredHospitals: Joi.array().items(Joi.string().uuid()),
  preferredTimeSlots: Joi.array().items(
    Joi.object({
      dayOfWeek: Joi.string()
        .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
        .required(),
      timeRange: Joi.object({
        start: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        end: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
      }).required(),
    })
  ),
  notificationPreferences: Joi.object({
    email: Joi.boolean().default(true),
    sms: Joi.boolean().default(true),
    push: Joi.boolean().default(true),
    reminderHours: Joi.number().integer().min(1).max(72).default(24),
  }),
});

/**
 * Package entitlement check schema
 */
export const checkEntitlementSchema = Joi.object({
  serviceType: Joi.string()
    .valid('consultation', 'minor_surgery', 'major_surgery', 'lab_test', 'drug_coverage')
    .required(),
  serviceDetails: Joi.object().when('serviceType', {
    is: 'drug_coverage',
    then: Joi.object({
      drugClass: Joi.string().valid('generic', 'branded', 'specialized').required(),
    }),
  }),
  isForDependent: Joi.boolean().default(false),
  dependentId: Joi.string().uuid().when('isForDependent', {
    is: true,
    then: Joi.required(),
  }),
});

/**
 * Usage history query schema
 */
export const getUsageHistorySchema = Joi.object({
  startDate: Joi.date().max('now').required(),
  endDate: Joi.date().min(Joi.ref('startDate')).max('now').required(),
  serviceType: Joi.string().valid(
    'consultation',
    'prescription',
    'surgery',
    'lab_test',
    'all'
  ),
  includeDependent: Joi.boolean().default(true),
});

/**
 * Notification preferences schema
 */
export const updateNotificationPreferencesSchema = Joi.object({
  email: Joi.boolean(),
  sms: Joi.boolean(),
  push: Joi.boolean(),
  appointmentReminders: Joi.boolean(),
  prescriptionReminders: Joi.boolean(),
  billingAlerts: Joi.boolean(),
  healthTips: Joi.boolean(),
  marketingEmails: Joi.boolean(),
}).min(1);

/**
 * Emergency contact update schema
 */
export const updateEmergencyContactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  relationship: Joi.string().trim().max(50).required(),
  alternatePhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
});

/**
 * Health metrics schema
 */
export const addHealthMetricSchema = Joi.object({
  metricType: Joi.string()
    .valid(
      'blood_pressure',
      'blood_sugar',
      'weight',
      'temperature',
      'heart_rate',
      'oxygen_level'
    )
    .required(),
  value: Joi.string().required(),
  unit: Joi.string().required(),
  recordedAt: Joi.date().max('now').default(new Date()),
  notes: Joi.string().trim().max(500),
});

/**
 * ID parameter validation
 */
export const patientIdParamSchema = Joi.object({
  patientId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid patient ID format',
    'any.required': 'Patient ID is required',
  }),
});

export const dependentIdParamSchema = Joi.object({
  dependentId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid dependent ID format',
    'any.required': 'Dependent ID is required',
  }),
});

export default {
  updatePatientProfileSchema,
  createSubscriptionSchema,
  upgradeSubscriptionSchema,
  cancelSubscriptionSchema,
  renewSubscriptionSchema,
  updateSubscriptionSchema,
  addDependentSchema,
  updateDependentSchema,
  removeDependentSchema,
  addMedicalConditionSchema,
  updateMedicalConditionSchema,
  uploadMedicalDocumentSchema,
  setAppointmentPreferencesSchema,
  checkEntitlementSchema,
  getUsageHistorySchema,
  updateNotificationPreferencesSchema,
  updateEmergencyContactSchema,
  addHealthMetricSchema,
  patientIdParamSchema,
  dependentIdParamSchema,
};
