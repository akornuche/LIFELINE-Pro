import * as pharmacyRepository from '../models/pharmacyRepository.js';
import * as userRepository from '../models/userRepository.js';
import * as medicalRecordsRepository from '../models/medicalRecordsRepository.js';
import * as patientRepository from '../models/patientRepository.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Pharmacy Service
 * Business logic for pharmacy operations
 */

/**
 * Get pharmacy profile
 */
export const getPharmacyProfile = async (userId) => {
  try {
    const pharmacy = await pharmacyRepository.findByUserId(userId);

    if (!pharmacy) {
      throw new NotFoundError('Pharmacy profile');
    }

    // Get user details
    const user = await userRepository.findById(userId);

    return {
      ...pharmacy,
      user: {
        lifeline_id: user.lifeline_id,
        email: user.email,
        phone: user.phone,
      },
    };
  } catch (error) {
    logger.error('Get pharmacy profile error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update pharmacy profile
 */
export const updatePharmacyProfile = async (userId, updateData) => {
  const {
    pharmacyName,
    address,
    operatingHours,
    hasDelivery,
    deliveryRadius,
    emergencyService,
    description,
  } = updateData;

  try {
    const pharmacy = await pharmacyRepository.findByUserId(userId);

    if (!pharmacy) {
      throw new NotFoundError('Pharmacy profile');
    }

    const updatedPharmacy = await pharmacyRepository.updateProfile(pharmacy.id, {
      pharmacyName,
      address,
      operatingHours,
      hasDelivery,
      deliveryRadius,
      emergencyService,
      description,
    });

    logger.info('Pharmacy profile updated', {
      userId,
      pharmacyId: pharmacy.id,
    });

    return updatedPharmacy;
  } catch (error) {
    logger.error('Update pharmacy profile error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update license information
 */
export const updateLicense = async (userId, licenseData) => {
  const { licenseNumber, licenseExpiry, licenseDocument } = licenseData;

  try {
    const pharmacy = await pharmacyRepository.findByUserId(userId);

    if (!pharmacy) {
      throw new NotFoundError('Pharmacy profile');
    }

    const updatedPharmacy = await pharmacyRepository.updateLicense(pharmacy.id, {
      licenseNumber,
      licenseExpiry,
      licenseDocument,
    });

    logger.info('Pharmacy license updated', {
      userId,
      pharmacyId: pharmacy.id,
    });

    return updatedPharmacy;
  } catch (error) {
    logger.error('Update pharmacy license error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get pharmacy prescriptions
 */
export const getPrescriptions = async (userId, options = {}) => {
  try {
    const pharmacy = await pharmacyRepository.findByUserId(userId);

    if (!pharmacy) {
      throw new NotFoundError('Pharmacy profile');
    }

    const prescriptions = await medicalRecordsRepository.getPharmacyPrescriptions(
      pharmacy.id,
      options
    );

    return prescriptions;
  } catch (error) {
    logger.error('Get pharmacy prescriptions error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Dispense prescription
 */
export const dispensePrescription = async (userId, prescriptionId, dispensingData = {}) => {
  const { notes = null } = dispensingData;

  try {
    const pharmacy = await pharmacyRepository.findByUserId(userId);

    if (!pharmacy) {
      throw new NotFoundError('Pharmacy profile');
    }

    // Get prescription
    const prescription = await medicalRecordsRepository.findPrescriptionById(prescriptionId);

    // Check if prescription is already dispensed
    if (prescription.status === 'dispensed') {
      throw new BusinessLogicError('Prescription already dispensed');
    }

    // Check if prescription is expired
    if (new Date(prescription.valid_until) < new Date()) {
      throw new BusinessLogicError('Prescription has expired');
    }

    // Update prescription status
    const updated = await medicalRecordsRepository.updatePrescriptionStatus(prescriptionId, {
      status: 'dispensed',
      pharmacyId: pharmacy.id,
      dispensedAt: new Date(),
      notes,
    });

    // Increment prescription count
    await pharmacyRepository.incrementPrescriptions(pharmacy.id);

    logger.info('Prescription dispensed', {
      userId,
      pharmacyId: pharmacy.id,
      prescriptionId,
    });

    return updated;
  } catch (error) {
    logger.error('Dispense prescription error', {
      error: error.message,
      userId,
      prescriptionId,
    });
    throw error;
  }
};

/**
 * Verify prescription validity
 */
export const verifyPrescription = async (prescriptionId) => {
  try {
    const prescription = await medicalRecordsRepository.findPrescriptionById(prescriptionId);

    const isValid = new Date(prescription.valid_until) >= new Date();
    const isNotDispensed = prescription.status !== 'dispensed';

    return {
      prescriptionId,
      isValid,
      isNotDispensed,
      canDispense: isValid && isNotDispensed,
      validUntil: prescription.valid_until,
      status: prescription.status,
      patient: {
        lifeline_id: prescription.patient_lifeline_id,
        name: `${prescription.patient_first_name} ${prescription.patient_last_name}`,
      },
      doctor: {
        lifeline_id: prescription.doctor_lifeline_id,
        name: `${prescription.doctor_first_name} ${prescription.doctor_last_name}`,
      },
      medications: prescription.medications,
    };
  } catch (error) {
    logger.error('Verify prescription error', {
      error: error.message,
      prescriptionId,
    });
    throw error;
  }
};

/**
 * Get pharmacy statistics
 */
export const getStatistics = async (userId, options = {}) => {
  try {
    const pharmacy = await pharmacyRepository.findByUserId(userId);

    if (!pharmacy) {
      throw new NotFoundError('Pharmacy profile');
    }

    const stats = await pharmacyRepository.getStatistics(pharmacy.id, options);

    return stats;
  } catch (error) {
    logger.error('Get pharmacy statistics error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Search pharmacies
 */
export const searchPharmacies = async (searchTerm, options = {}) => {
  try {
    const pharmacies = await pharmacyRepository.searchPharmacies(searchTerm, options);

    return pharmacies;
  } catch (error) {
    logger.error('Search pharmacies error', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Find pharmacies by location
 */
export const findPharmaciesByLocation = async (location, options = {}) => {
  try {
    const pharmacies = await pharmacyRepository.findByLocation(location, options);

    return pharmacies;
  } catch (error) {
    logger.error('Find pharmacies by location error', {
      error: error.message,
      location,
    });
    throw error;
  }
};

/**
 * Get pharmacies with delivery
 */
export const getPharmaciesWithDelivery = async (options = {}) => {
  try {
    const pharmacies = await pharmacyRepository.findWithDelivery(options);

    return pharmacies;
  } catch (error) {
    logger.error('Get pharmacies with delivery error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get top-rated pharmacies
 */
export const getTopRatedPharmacies = async (options = {}) => {
  try {
    const pharmacies = await pharmacyRepository.getTopRated(options);

    return pharmacies;
  } catch (error) {
    logger.error('Get top-rated pharmacies error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get pharmacy by ID (public view)
 */
export const getPharmacyById = async (pharmacyId) => {
  try {
    const pharmacy = await pharmacyRepository.findById(pharmacyId);

    if (!pharmacy) {
      throw new NotFoundError('Pharmacy');
    }

    // Get user details
    const user = await userRepository.findById(pharmacy.user_id);

    return {
      ...pharmacy,
      user: {
        lifeline_id: user.lifeline_id,
        phone: user.phone,
      },
    };
  } catch (error) {
    logger.error('Get pharmacy by ID error', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Update verification status (admin only)
 */
export const updateVerificationStatus = async (pharmacyId, status, notes = null) => {
  try {
    const updatedPharmacy = await pharmacyRepository.updateVerificationStatus(
      pharmacyId,
      status,
      notes
    );

    logger.info('Pharmacy verification status updated', {
      pharmacyId,
      status,
    });

    return updatedPharmacy;
  } catch (error) {
    logger.error('Update pharmacy verification error', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Get pending verification requests (admin only)
 */
export const getPendingVerifications = async (options = {}) => {
  try {
    const pharmacies = await pharmacyRepository.getPendingVerification(options);

    return pharmacies;
  } catch (error) {
    logger.error('Get pending verifications error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get expiring licenses (admin only)
 */
export const getExpiringLicenses = async (days = 30, options = {}) => {
  try {
    const pharmacies = await pharmacyRepository.getExpiringLicenses(days, options);

    return pharmacies;
  } catch (error) {
    logger.error('Get expiring licenses error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Update pharmacy rating
 */
export const updateRating = async (pharmacyId, rating) => {
  try {
    if (rating < 1 || rating > 5) {
      throw new BusinessLogicError('Rating must be between 1 and 5');
    }

    const updatedPharmacy = await pharmacyRepository.updateRating(pharmacyId, rating);

    logger.info('Pharmacy rating updated', {
      pharmacyId,
      rating,
    });

    return updatedPharmacy;
  } catch (error) {
    logger.error('Update pharmacy rating error', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Check prescription eligibility
 */
export const checkPrescriptionEligibility = async (prescriptionId, patientId) => {
  try {
    const prescription = await medicalRecordsRepository.findPrescriptionById(prescriptionId);

    // Verify prescription belongs to patient
    if (prescription.patient_id !== patientId) {
      throw new BusinessLogicError('Prescription does not belong to this patient');
    }

    // Check if patient has active subscription
    const hasActive = await patientRepository.hasActiveSubscription(patientId);

    if (!hasActive) {
      throw new BusinessLogicError('Patient does not have an active subscription');
    }

    // Check prescription validity
    const isValid = new Date(prescription.valid_until) >= new Date();
    const isNotDispensed = prescription.status !== 'dispensed';

    return {
      eligible: isValid && isNotDispensed && hasActive,
      hasActiveSubscription: hasActive,
      isValid,
      isNotDispensed,
      prescription,
    };
  } catch (error) {
    logger.error('Check prescription eligibility error', {
      error: error.message,
      prescriptionId,
      patientId,
    });
    throw error;
  }
};

export default {
  getPharmacyProfile,
  updatePharmacyProfile,
  updateLicense,
  getPrescriptions,
  dispensePrescription,
  verifyPrescription,
  getStatistics,
  searchPharmacies,
  findPharmaciesByLocation,
  getPharmaciesWithDelivery,
  getTopRatedPharmacies,
  getPharmacyById,
  updateVerificationStatus,
  getPendingVerifications,
  getExpiringLicenses,
  updateRating,
  checkPrescriptionEligibility,
};
