/**
 * LifeLine Pro - Package Definitions and Entitlements
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all package/subscription definitions.
 * 
 * Two subscription categories:
 * 1. GENERAL (₦1,500/month) — Doctor consultations only, up to 4 dependents
 * 2. INSURANCE PLANS:
 *    - BASIC    (₦3,500/month) — Common illnesses coverage
 *    - STANDARD (₦5,500/month) — Common illnesses + minor surgeries
 *    - PREMIUM  (₦10,000/month) — Full coverage including childbirth & major surgeries
 */

// Package Types
export const PACKAGE_TYPES = {
  GENERAL: 'GENERAL',
  BASIC: 'BASIC',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
};

// Package Category (General vs Insurance)
export const PACKAGE_CATEGORIES = {
  GENERAL: 'general',
  INSURANCE: 'insurance',
};

// Package Prices (in Naira, per month)
export const PACKAGE_PRICES = {
  GENERAL: 1500,
  BASIC: 3500,
  STANDARD: 5500,
  PREMIUM: 10000,
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
  [PACKAGE_TYPES.GENERAL]: {
    name: 'General Plan',
    category: PACKAGE_CATEGORIES.GENERAL,
    price: PACKAGE_PRICES.GENERAL,
    currency: 'NGN',
    maxDependents: 4,
    consultationsPerMonth: 5,
    prescriptionsPerMonth: 10,
    labTestsPerMonth: 3,
    surgeriesPerYear: 0,
    allowedProviderTypes: ['doctor'], // General plan: doctors ONLY
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
        allowed: false, // No pharmacy access on General plan
        categories: [],
        limitPerMonth: 0,
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
        coverage: 'basic_emergency_care',
      },
    },
    limitations: [
      'Doctor consultations only — no pharmacy or hospital access',
      'No surgeries',
      'No specialist consultations',
      'Limited to essential medications (prescribed only)',
      'No imaging',
      'No hospital admissions',
    ],
  },

  [PACKAGE_TYPES.BASIC]: {
    name: 'Basic Insurance',
    category: PACKAGE_CATEGORIES.INSURANCE,
    price: PACKAGE_PRICES.BASIC,
    currency: 'NGN',
    maxDependents: 4,
    consultationsPerMonth: 8,
    prescriptionsPerMonth: 15,
    labTestsPerMonth: 5,
    surgeriesPerYear: 0,
    allowedProviderTypes: ['doctor', 'pharmacy', 'hospital'], // Full provider access
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
        limitPerMonth: 10,
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
        limitPerMonth: 5,
      },
      imaging: {
        allowed: false,
        types: [],
      },
      admissions: {
        allowed: true,
        maxDays: 3,
        type: 'general_ward',
      },
      emergency: {
        allowed: true,
        coverage: 'basic_emergency_care',
      },
    },
    limitations: [
      'No surgeries',
      'No specialist consultations',
      'Limited to essential medications',
      'No advanced diagnostic tests',
      'Admission limited to 3 days',
    ],
  },

  [PACKAGE_TYPES.STANDARD]: {
    name: 'Standard Insurance',
    category: PACKAGE_CATEGORIES.INSURANCE,
    price: PACKAGE_PRICES.STANDARD,
    currency: 'NGN',
    maxDependents: 4,
    consultationsPerMonth: 10,
    prescriptionsPerMonth: 20,
    labTestsPerMonth: 10,
    surgeriesPerYear: 2,
    allowedProviderTypes: ['doctor', 'pharmacy', 'hospital'],
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
        limitPerMonth: 10,
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

  [PACKAGE_TYPES.PREMIUM]: {
    name: 'Premium Insurance',
    category: PACKAGE_CATEGORIES.INSURANCE,
    price: PACKAGE_PRICES.PREMIUM,
    currency: 'NGN',
    maxDependents: 6,
    consultationsPerMonth: -1, // unlimited
    prescriptionsPerMonth: -1, // unlimited
    labTestsPerMonth: -1, // unlimited
    surgeriesPerYear: -1, // unlimited
    allowedProviderTypes: ['doctor', 'pharmacy', 'hospital'],
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
        limitPerMonth: null,
      },
      surgeries: {
        allowed: true,
        types: [...SURGERY_TYPES.MINOR, ...SURGERY_TYPES.MAJOR],
        limitPerYear: null,
      },
      specialists: {
        allowed: true,
        types: 'all',
        limitPerMonth: null,
      },
      laboratoryTests: {
        allowed: true,
        types: 'all',
        limitPerMonth: null,
      },
      imaging: {
        allowed: true,
        types: [...IMAGING_TYPES.BASIC, ...IMAGING_TYPES.ADVANCED],
        limitPerMonth: null,
      },
      admissions: {
        allowed: true,
        maxDays: null,
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
  PACKAGE_CATEGORIES,
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
