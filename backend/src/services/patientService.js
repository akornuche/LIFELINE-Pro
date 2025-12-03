import * as patientRepository from '../models/patientRepository.js';
import * as dependentRepository from '../models/dependentRepository.js';
import * as userRepository from '../models/userRepository.js';
import * as medicalRecordsRepository from '../models/medicalRecordsRepository.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, NotFoundError } from '../middleware/errorHandler.js';
import { PACKAGE_ENTITLEMENTS } from '../config/constants.js';

/**
 * Patient Service
 * Business logic for patient operations
 */

/**
 * Get patient profile
 */
export const getPatientProfile = async (userId) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    // Get user details
    const user = await userRepository.findById(userId);

    // Get active subscription
    const subscription = await patientRepository.getActiveSubscription(patient.id);

    return {
      ...patient,
      user: {
        lifeline_id: user.lifeline_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
      },
      subscription,
    };
  } catch (error) {
    logger.error('Get patient profile error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update patient profile
 */
export const updatePatientProfile = async (userId, updateData) => {
  const { bloodGroup, allergies, chronicConditions, emergencyContact } = updateData;

  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const updatedPatient = await patientRepository.updateProfile(patient.id, {
      bloodGroup,
      allergies,
      chronicConditions,
      emergencyContact,
    });

    logger.info('Patient profile updated', {
      userId,
      patientId: patient.id,
    });

    return updatedPatient;
  } catch (error) {
    logger.error('Update patient profile error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Create subscription
 */
export const createSubscription = async (userId, subscriptionData) => {
  const { packageType, startDate, endDate, price } = subscriptionData;

  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    // Check if there's an active subscription
    const hasActive = await patientRepository.hasActiveSubscription(patient.id);

    if (hasActive) {
      throw new BusinessLogicError('Patient already has an active subscription');
    }

    // Validate package type
    if (!PACKAGE_ENTITLEMENTS[packageType]) {
      throw new BusinessLogicError(`Invalid package type: ${packageType}`);
    }

    const subscription = await patientRepository.createSubscription(patient.id, {
      packageType,
      startDate,
      endDate,
      price,
    });

    logger.info('Subscription created', {
      userId,
      patientId: patient.id,
      packageType,
    });

    return subscription;
  } catch (error) {
    logger.error('Create subscription error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update subscription
 */
export const updateSubscription = async (userId, subscriptionData) => {
  const { packageType, endDate } = subscriptionData;

  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const subscription = await patientRepository.updateSubscription(patient.id, {
      packageType,
      endDate,
    });

    logger.info('Subscription updated', {
      userId,
      patientId: patient.id,
      packageType,
    });

    return subscription;
  } catch (error) {
    logger.error('Update subscription error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (userId, reason = null) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const subscription = await patientRepository.cancelSubscription(patient.id, reason);

    logger.info('Subscription cancelled', {
      userId,
      patientId: patient.id,
      reason,
    });

    return subscription;
  } catch (error) {
    logger.error('Cancel subscription error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get subscription details
 */
export const getSubscriptionDetails = async (userId) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const subscription = await patientRepository.getActiveSubscription(patient.id);

    if (!subscription) {
      return null;
    }

    // Get package entitlements
    const entitlements = patientRepository.getPackageEntitlements(subscription.package_type);

    return {
      ...subscription,
      entitlements,
    };
  } catch (error) {
    logger.error('Get subscription details error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Add dependent
 */
export const addDependent = async (userId, dependentData) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    // Validate if patient can add dependent
    await dependentRepository.validateDependentAddition(patient.id);

    const dependent = await dependentRepository.createDependent({
      patientId: patient.id,
      ...dependentData,
    });

    logger.info('Dependent added', {
      userId,
      patientId: patient.id,
      dependentId: dependent.id,
    });

    return dependent;
  } catch (error) {
    logger.error('Add dependent error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get patient dependents
 */
export const getDependents = async (userId) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const dependents = await dependentRepository.getPatientDependents(patient.id, {
      activeOnly: false,
    });

    // Get package limits
    const subscription = await patientRepository.getActiveSubscription(patient.id);
    let maxDependents = 0;

    if (subscription) {
      const entitlements = PACKAGE_ENTITLEMENTS[subscription.package_type];
      maxDependents = entitlements?.max_dependents || 0;
    }

    return {
      dependents,
      activeCount: dependents.filter((d) => d.is_active).length,
      maxAllowed: maxDependents,
    };
  } catch (error) {
    logger.error('Get dependents error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update dependent
 */
export const updateDependent = async (userId, dependentId, updateData) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    // Verify dependent belongs to patient
    const dependent = await dependentRepository.findDependentById(dependentId);

    if (dependent.patient_id !== patient.id) {
      throw new BusinessLogicError('Unauthorized to update this dependent');
    }

    const updated = await dependentRepository.updateDependentProfile(dependentId, updateData);

    logger.info('Dependent updated', {
      userId,
      dependentId,
    });

    return updated;
  } catch (error) {
    logger.error('Update dependent error', {
      error: error.message,
      userId,
      dependentId,
    });
    throw error;
  }
};

/**
 * Remove dependent
 */
export const removeDependent = async (userId, dependentId) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    // Verify dependent belongs to patient
    const dependent = await dependentRepository.findDependentById(dependentId);

    if (dependent.patient_id !== patient.id) {
      throw new BusinessLogicError('Unauthorized to remove this dependent');
    }

    const deactivated = await dependentRepository.deactivateDependent(dependentId);

    logger.info('Dependent removed', {
      userId,
      dependentId,
    });

    return deactivated;
  } catch (error) {
    logger.error('Remove dependent error', {
      error: error.message,
      userId,
      dependentId,
    });
    throw error;
  }
};

/**
 * Get medical history
 */
export const getMedicalHistory = async (userId, options = {}) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const { includeDependent = null } = options;

    // Get consultations
    const consultations = await medicalRecordsRepository.getPatientConsultations(patient.id, {
      limit: 50,
    });

    // Get prescriptions
    const prescriptions = await medicalRecordsRepository.getPatientPrescriptions(patient.id, {
      limit: 50,
    });

    // Get surgeries
    const surgeries = await medicalRecordsRepository.getPatientSurgeries(patient.id, {
      limit: 50,
    });

    // Get lab tests
    const labTests = await medicalRecordsRepository.getPatientLabTests(patient.id, {
      limit: 50,
    });

    // If includeDependent specified, get dependent's history
    let dependentHistory = null;
    if (includeDependent) {
      dependentHistory = await dependentRepository.getDependentMedicalHistory(includeDependent);
    }

    return {
      consultations,
      prescriptions,
      surgeries,
      labTests,
      dependentHistory,
    };
  } catch (error) {
    logger.error('Get medical history error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get usage statistics
 */
export const getUsageStatistics = async (userId) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const stats = await patientRepository.getUsageStats(patient.id);

    // Get subscription info
    const subscription = await patientRepository.getActiveSubscription(patient.id);

    let entitlements = null;
    if (subscription) {
      entitlements = PACKAGE_ENTITLEMENTS[subscription.package_type];
    }

    return {
      ...stats,
      subscription: subscription
        ? {
            package_type: subscription.package_type,
            entitlements,
          }
        : null,
    };
  } catch (error) {
    logger.error('Get usage statistics error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Search patients (admin only)
 */
export const searchPatients = async (searchTerm, options = {}) => {
  try {
    const patients = await patientRepository.searchPatients(searchTerm, options);

    return patients;
  } catch (error) {
    logger.error('Search patients error', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Get patient by ID (admin/provider access)
 */
export const getPatientById = async (patientId) => {
  try {
    const patient = await patientRepository.findById(patientId);

    if (!patient) {
      throw new NotFoundError('Patient');
    }

    // Get user details
    const user = await userRepository.findById(patient.user_id);

    // Get active subscription
    const subscription = await patientRepository.getActiveSubscription(patient.id);

    return {
      ...patient,
      user: {
        lifeline_id: user.lifeline_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
      },
      subscription,
    };
  } catch (error) {
    logger.error('Get patient by ID error', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Check subscription status
 */
export const checkSubscriptionStatus = async (userId) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const hasActive = await patientRepository.hasActiveSubscription(patient.id);
    const subscription = hasActive
      ? await patientRepository.getActiveSubscription(patient.id)
      : null;

    return {
      hasActiveSubscription: hasActive,
      subscription,
    };
  } catch (error) {
    logger.error('Check subscription status error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

export default {
  getPatientProfile,
  updatePatientProfile,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptionDetails,
  addDependent,
  getDependents,
  updateDependent,
  removeDependent,
  getMedicalHistory,
  getUsageStatistics,
  searchPatients,
  getPatientById,
  checkSubscriptionStatus,
};
