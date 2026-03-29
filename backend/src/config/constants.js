/**
 * Application Constants
 * Define package entitlements and other constants
 */

export const PACKAGE_ENTITLEMENTS = {
  BASIC: {
    maxDependents: 4,
    consultationsPerMonth: 5,
    prescriptionsPerMonth: 10,
    labTestsPerMonth: 5,
    surgeriesPerYear: 1,
    features: {
      telemedicine: true,
      emergencyCare: false,
      specialistConsultation: false,
      labTests: true,
      diagnostics: false,
    },
  },
  MEDIUM: {
    maxDependents: 4,
    consultationsPerMonth: 10,
    prescriptionsPerMonth: 20,
    labTestsPerMonth: 10,
    surgeriesPerYear: 2,
    features: {
      telemedicine: true,
      emergencyCare: true,
      specialistConsultation: true,
      labTests: true,
      diagnostics: true,
    },
  },
  ADVANCED: {
    maxDependents: 6,
    consultationsPerMonth: -1, // unlimited
    prescriptionsPerMonth: -1, // unlimited
    labTestsPerMonth: 20,
    surgeriesPerYear: 4,
    features: {
      telemedicine: true,
      emergencyCare: true,
      specialistConsultation: true,
      labTests: true,
      diagnostics: true,
    },
  },
  // Legacy support (lowercase aliases)
  basic: null, // Will be set below
  medium: null,
  advanced: null,
  standard: null,
  premium: null,
};

export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  PHARMACY: 'pharmacy',
  HOSPITAL: 'hospital',
  ADMIN: 'admin',
};

export const CONSULTATION_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PRESCRIPTION_STATUS = {
  PENDING: 'pending',
  DISPENSED: 'dispensed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const SURGERY_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const BED_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
};

export const NOTIFICATION_TYPES = {
  CONSULTATION: 'consultation',
  PRESCRIPTION: 'prescription',
  PAYMENT: 'payment',
  VERIFICATION: 'verification',
  SYSTEM: 'system',
};

// Set up legacy/lowercase aliases for package entitlements
PACKAGE_ENTITLEMENTS.basic = PACKAGE_ENTITLEMENTS.BASIC;
PACKAGE_ENTITLEMENTS.medium = PACKAGE_ENTITLEMENTS.MEDIUM;
PACKAGE_ENTITLEMENTS.advanced = PACKAGE_ENTITLEMENTS.ADVANCED;
PACKAGE_ENTITLEMENTS.standard = PACKAGE_ENTITLEMENTS.MEDIUM; // Legacy alias
PACKAGE_ENTITLEMENTS.premium = PACKAGE_ENTITLEMENTS.ADVANCED; // Legacy alias

export default {
  PACKAGE_ENTITLEMENTS,
  USER_ROLES,
  CONSULTATION_STATUS,
  PRESCRIPTION_STATUS,
  PAYMENT_STATUS,
  VERIFICATION_STATUS,
  SURGERY_STATUS,
  BED_STATUS,
  NOTIFICATION_TYPES,
};
