/**
 * LifeLine Pro - Package Definitions and Entitlements
 * 
 * This file defines the three coverage plans and their entitlements:
 * - BASIC (₦1,500/month)
 * - MEDIUM 
 * - ADVANCED
 */

// Package Types
export const PACKAGE_TYPES = {
  BASIC: 'BASIC',
  MEDIUM: 'MEDIUM',
  ADVANCED: 'ADVANCED',
};

// Package Prices (in Naira)
export const PACKAGE_PRICES = {
  BASIC: 3500,
  MEDIUM: 5000,
  ADVANCED: 10000,
};

// Service Types
export const SERVICE_TYPES = {
  CONSULTATION: 'consultation',
  PRESCRIPTION: 'prescription',
  DRUG_DISPENSING: 'drug_dispensing',
  MINOR_SURGERY: 'minor_surgery',
  MAJOR_SURGERY: 'major_surgery',
  LABORATORY_TEST: 'laboratory_test',
  IMAGING: 'imaging', // X-Ray, Ultrasound, CT, MRI
  ADMISSION: 'admission',
  EMERGENCY: 'emergency',
};

// Ailment Categories
export const AILMENT_CATEGORIES = {
  BASIC: [
    'malaria',
    'typhoid',
    'flu',
    'common_cold',
    'infections',
    'stomach_issues',
    'headache',
    'fever',
    'cough',
    'diarrhea',
    'minor_wounds',
  ],
  SPECIALTY: [
    'orthopedic',
    'cardiology',
    'neurology',
    'ophthalmology',
    'ent', // Ear, Nose, Throat
    'dermatology',
    'gynecology',
    'pediatrics',
  ],
};

// Drug Categories
export const DRUG_CATEGORIES = {
  ESSENTIAL: [ // Available for BASIC plan
    'paracetamol',
    'ibuprofen',
    'antimalarial',
    'antibiotics_basic', // Amoxicillin, etc.
    'antihistamines',
    'antacids',
    'oral_rehydration_salts',
    'vitamins_basic',
  ],
  STANDARD: [ // Available for MEDIUM and above
    'antibiotics_advanced',
    'pain_relief_advanced',
    'chronic_disease_meds', // Diabetes, Hypertension
    'inhalers',
    'eye_drops',
    'topical_creams',
  ],
  SPECIALIZED: [ // Available for ADVANCED only
    'oncology_drugs',
    'cardiac_medications',
    'neurological_medications',
    'immunosuppressants',
    'specialty_injections',
  ],
};

// Surgery Types
export const SURGERY_TYPES = {
  MINOR: [
    'appendectomy',
    'wound_suturing',
    'minor_orthopedic',
    'cyst_removal',
    'hernia_repair_simple',
    'circumcision',
    'dental_extraction',
  ],
  MAJOR: [
    'cardiac_surgery',
    'major_orthopedic',
    'abdominal_surgery',
    'neurosurgery',
    'cancer_surgery',
    'organ_transplant',
    'major_reconstructive',
  ],
};

// Laboratory Test Types
export const LAB_TEST_TYPES = {
  BASIC: [
    'blood_count',
    'malaria_test',
    'typhoid_test',
    'urinalysis',
    'blood_sugar',
    'pregnancy_test',
  ],
  ADVANCED: [
    'lipid_profile',
    'liver_function',
    'kidney_function',
    'thyroid_function',
    'hiv_test',
    'hepatitis_panel',
    'culture_sensitivity',
  ],
};

// Imaging Test Types
export const IMAGING_TYPES = {
  BASIC: ['x_ray', 'ultrasound'],
  ADVANCED: ['ct_scan', 'mri', 'mammography', 'ecg', 'echo'],
};

// Package Entitlements Configuration
export const PACKAGE_ENTITLEMENTS = {
  [PACKAGE_TYPES.BASIC]: {
    name: 'Basic Plan',
    price: PACKAGE_PRICES.BASIC,
    currency: 'NGN',
    maxDependents: 4,
    entitlements: {
      consultations: {
        allowed: true,
        types: ['general_practitioner'],
        ailments: AILMENT_CATEGORIES.BASIC,
      },
      prescriptions: {
        allowed: true,
        drugCategories: [DRUG_CATEGORIES.ESSENTIAL],
      },
      drugDispensing: {
        allowed: true,
        categories: DRUG_CATEGORIES.ESSENTIAL,
        limitPerMonth: 10, // Maximum 10 prescriptions per month
      },
      surgeries: {
        allowed: false,
        types: [],
      },
      specialists: {
        allowed: false,
        types: [],
      },
      laboratoryTests: {
        allowed: true,
        types: LAB_TEST_TYPES.BASIC,
        limitPerMonth: 3,
      },
      imaging: {
        allowed: false,
        types: [],
      },
      admissions: {
        allowed: false,
      },
      emergency: {
        allowed: true,
        coverage: 'basic_emergency_care', // Stabilization only
      },
    },
    limitations: [
      'No surgeries',
      'No specialist consultations',
      'Limited to essential medications',
      'No major diagnostic tests',
      'No admissions',
    ],
  },

  [PACKAGE_TYPES.MEDIUM]: {
    name: 'Medium Plan',
    price: PACKAGE_PRICES.MEDIUM,
    currency: 'NGN',
    maxDependents: 4,
    entitlements: {
      consultations: {
        allowed: true,
        types: ['general_practitioner', 'specialist_limited'],
        ailments: [...AILMENT_CATEGORIES.BASIC, ...AILMENT_CATEGORIES.SPECIALTY],
      },
      prescriptions: {
        allowed: true,
        drugCategories: [DRUG_CATEGORIES.ESSENTIAL, DRUG_CATEGORIES.STANDARD],
      },
      drugDispensing: {
        allowed: true,
        categories: [...DRUG_CATEGORIES.ESSENTIAL, ...DRUG_CATEGORIES.STANDARD],
        limitPerMonth: 20,
      },
      surgeries: {
        allowed: true,
        types: SURGERY_TYPES.MINOR,
        limitPerYear: 2,
      },
      specialists: {
        allowed: true,
        types: ['orthopedic', 'ent', 'dermatology', 'pediatrics'],
        limitPerMonth: 2,
      },
      laboratoryTests: {
        allowed: true,
        types: [...LAB_TEST_TYPES.BASIC, ...LAB_TEST_TYPES.ADVANCED],
        limitPerMonth: 5,
      },
      imaging: {
        allowed: true,
        types: IMAGING_TYPES.BASIC,
        limitPerMonth: 2,
      },
      admissions: {
        allowed: true,
        maxDays: 7,
        type: 'general_ward',
      },
      emergency: {
        allowed: true,
        coverage: 'full_emergency_care',
      },
    },
    limitations: [
      'No major surgeries',
      'Limited specialist access',
      'No advanced imaging (CT, MRI)',
      'Admission limited to 7 days',
    ],
  },

  [PACKAGE_TYPES.ADVANCED]: {
    name: 'Advanced Plan',
    price: PACKAGE_PRICES.ADVANCED,
    currency: 'NGN',
    maxDependents: 4,
    entitlements: {
      consultations: {
        allowed: true,
        types: ['general_practitioner', 'specialist_full', 'consultant'],
        ailments: 'all',
      },
      prescriptions: {
        allowed: true,
        drugCategories: 'all',
      },
      drugDispensing: {
        allowed: true,
        categories: 'all',
        limitPerMonth: null, // Unlimited
      },
      surgeries: {
        allowed: true,
        types: [...SURGERY_TYPES.MINOR, ...SURGERY_TYPES.MAJOR],
        limitPerYear: null, // Unlimited
      },
      specialists: {
        allowed: true,
        types: 'all',
        limitPerMonth: null, // Unlimited
      },
      laboratoryTests: {
        allowed: true,
        types: 'all',
        limitPerMonth: null, // Unlimited
      },
      imaging: {
        allowed: true,
        types: [...IMAGING_TYPES.BASIC, ...IMAGING_TYPES.ADVANCED],
        limitPerMonth: null, // Unlimited
      },
      admissions: {
        allowed: true,
        maxDays: null, // Unlimited
        type: 'private_ward',
      },
      emergency: {
        allowed: true,
        coverage: 'premium_emergency_care',
        ambulance: true,
      },
      priorityCare: true,
      secondOpinion: true,
      homeVisits: true,
    },
    limitations: [],
  },
};

// User Roles
export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  PHARMACY: 'pharmacy',
  HOSPITAL: 'hospital',
  ADMIN: 'admin',
};

// Verification Status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined',
  PAID: 'paid',
};

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended',
};

// Service Request Status
export const SERVICE_REQUEST_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

// Error Log Severity
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Error Categories
export const ERROR_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  DATABASE: 'database',
  PAYMENT: 'payment',
  ENTITLEMENT: 'entitlement',
  WORKFLOW: 'workflow',
  SYSTEM: 'system',
  EXTERNAL_API: 'external_api',
};

export default {
  PACKAGE_TYPES,
  PACKAGE_PRICES,
  PACKAGE_ENTITLEMENTS,
  SERVICE_TYPES,
  AILMENT_CATEGORIES,
  DRUG_CATEGORIES,
  SURGERY_TYPES,
  LAB_TEST_TYPES,
  IMAGING_TYPES,
  USER_ROLES,
  VERIFICATION_STATUS,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
  SERVICE_REQUEST_STATUS,
  ERROR_SEVERITY,
  ERROR_CATEGORIES,
};
