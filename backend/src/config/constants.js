/**
 * Application Constants
 * 
 * Re-exports from constants/packages.js (single source of truth).
 * Legacy aliases maintained for backward compatibility.
 */

// Re-export everything from the canonical source
export {
  PACKAGE_TYPES,
  PACKAGE_CATEGORIES,
  PACKAGE_PRICES,
  PACKAGE_ENTITLEMENTS,
  USER_ROLES,
  VERIFICATION_STATUS,
  PAYMENT_STATUS,
  SERVICE_TYPES,
} from '../constants/packages.js';

// Additional status constants for service logic
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
  CONSULTATION_STATUS,
  PRESCRIPTION_STATUS,
  SURGERY_STATUS,
  BED_STATUS,
  NOTIFICATION_TYPES,
};
