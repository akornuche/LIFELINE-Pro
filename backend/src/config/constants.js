/**
 * Application Constants
 * Define package entitlements and other constants
 */

export const PACKAGE_ENTITLEMENTS = {
  basic: {
    maxDependents: 3,
    consultationsPerMonth: 2,
    prescriptionsPerMonth: 2,
    features: {
      telemedicine: true,
      emergencyCare: false,
      specialistConsultation: false,
      labTests: false,
      diagnostics: false,
    },
  },
  standard: {
    maxDependents: 5,
    consultationsPerMonth: 5,
    prescriptionsPerMonth: 5,
    features: {
      telemedicine: true,
      emergencyCare: true,
      specialistConsultation: true,
      labTests: true,
      diagnostics: false,
    },
  },
  premium: {
    maxDependents: 10,
    consultationsPerMonth: -1, // unlimited
    prescriptionsPerMonth: -1, // unlimited
    features: {
      telemedicine: true,
      emergencyCare: true,
      specialistConsultation: true,
      labTests: true,
      diagnostics: true,
    },
  },
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
