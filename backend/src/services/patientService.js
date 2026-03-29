import * as patientRepository from '../models/patientRepository.js';
import * as dependentRepository from '../models/dependentRepository.js';
import * as userRepository from '../models/userRepository.js';
import * as medicalRecordsRepository from '../models/medicalRecordsRepository.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, NotFoundError } from '../middleware/errorHandler.js';
import { PACKAGE_ENTITLEMENTS } from '../config/constants.js';

/**
 * Map subscription data to frontend format
 */
const mapSubscription = (subscription) => {
  if (!subscription) return null;

  const entitlements = PACKAGE_ENTITLEMENTS[subscription.current_package || subscription.package_type] || null;

  return {
    id: subscription.id,
    package_type: subscription.current_package || subscription.package_type,
    start_date: subscription.subscription_start_date || subscription.start_date,
    end_date: subscription.subscription_end_date || subscription.end_date,
    status: subscription.subscription_status || subscription.status,
    auto_renew: subscription.auto_renew,
    isExpired: subscription.isExpired || false,
    entitlements,
  };
};

/**
 * Patient Service
 * Business logic for patient operations
 */

/**
 * Get patient profile
 */
export const getPatientProfile = async (userId) => {
  try {
    let patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      // Create default patient record if it doesn't exist
      logger.info('Patient record not found, creating default record', { userId });
      
      // Get user data to populate patient record
      const user = await userRepository.findById(userId);
      
      await patientRepository.createPatient(userId, {
        firstName: user.first_name,
        lastName: user.last_name,
        dateOfBirth: user.date_of_birth || null,
        gender: null,
        address: 'Not provided',
      });
      patient = await patientRepository.findByUserId(userId);
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

    // Sync to user record if identity/base fields are present
    const identityUpdates = {};
    if (updateData.first_name) identityUpdates.firstName = updateData.first_name;
    if (updateData.last_name) identityUpdates.lastName = updateData.last_name;
    if (updateData.email) identityUpdates.email = updateData.email;
    if (updateData.phone) identityUpdates.phone = updateData.phone;
    if (updateData.date_of_birth) identityUpdates.dateOfBirth = updateData.date_of_birth;
    if (updateData.gender) identityUpdates.gender = updateData.gender;
    if (updateData.address) identityUpdates.address = updateData.address;
    if (updateData.profile_picture) identityUpdates.profilePicture = updateData.profile_picture;

    if (Object.keys(identityUpdates).length > 0) {
      await userRepository.updateProfile(userId, identityUpdates);
    }

    const updatedPatient = await patientRepository.updateProfile(patient.id, {
      bloodGroup,
      allergies,
      chronicConditions,
      emergencyContact,
    });

    // Fetch full profile to return consistent data
    const fullProfile = await getPatientProfile(userId);

    logger.info('Patient profile updated', {
      userId,
      patientId: patient.id,
    });

    return fullProfile;
  } catch (error) {
    logger.error('Update patient profile error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get subscriptions
 */
export const getSubscriptions = async (userId) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient');
    }

    const subscriptions = await patientRepository.getSubscriptions(patient.id);

    return subscriptions.map(s => mapSubscription(s));
  } catch (error) {
    logger.error('Get subscriptions error', {
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
  const { packageType, autoRenew } = subscriptionData;

  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    // Normalize package type to uppercase
    const normalizedPackageType = packageType.toUpperCase();

    // Validate package type
    if (!PACKAGE_ENTITLEMENTS[normalizedPackageType]) {
      throw new BusinessLogicError(`Invalid package type: ${packageType}`);
    }

    // Calculate subscription dates (365 days from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    const subscription = await patientRepository.updateSubscription(patient.id, {
      packageType: normalizedPackageType,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      subscriptionStatus: 'active',
      autoRenew: autoRenew !== undefined ? autoRenew : true,
    });

    logger.info('Subscription created', {
      userId,
      patientId: patient.id,
      packageType: normalizedPackageType,
    });

    return mapSubscription(subscription);
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
  const { packageType, autoRenew, subscriptionStatus } = subscriptionData;

  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    // Normalize package type to uppercase
    const normalizedPackageType = packageType ? packageType.toUpperCase() : undefined;

    // Validate package type if provided
    if (normalizedPackageType && !PACKAGE_ENTITLEMENTS[normalizedPackageType]) {
      throw new BusinessLogicError(`Invalid package type: ${packageType}`);
    }

    // Calculate new subscription dates (365 days from now for simplicity)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    const subscription = await patientRepository.updateSubscription(patient.id, {
      packageType: normalizedPackageType,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      subscriptionStatus: subscriptionStatus || 'active',
      autoRenew: autoRenew !== undefined ? autoRenew : true,
    });

    logger.info('Subscription updated', {
      userId,
      patientId: patient.id,
      packageType: normalizedPackageType,
    });

    return mapSubscription(subscription);
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

    return mapSubscription(subscription);
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

    // Get package entitlements directly from constants
    const entitlements = PACKAGE_ENTITLEMENTS[subscription.current_package] || null;

    // Map database field names to frontend expected names
    return mapSubscription(subscription);

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
      activeOnly: true,
    });

    // Get package limits
    const subscription = await patientRepository.getActiveSubscription(patient.id);
    let maxDependents = 0;

    if (subscription) {
      const entitlements = PACKAGE_ENTITLEMENTS[subscription.package_type?.toUpperCase()];
      maxDependents = entitlements?.maxDependents || 0;
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
