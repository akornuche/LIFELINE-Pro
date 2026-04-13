import * as hospitalRepository from '../models/hospitalRepository.js';
import * as userRepository from '../models/userRepository.js';
import * as medicalRecordsRepository from '../models/medicalRecordsRepository.js';
import * as patientRepository from '../models/patientRepository.js';
import entitlementChecker from '../utils/entitlementChecker.js';
import { SERVICE_TYPES } from '../constants/packages.js';
import * as paymentService from './paymentService.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, NotFoundError, ConflictError } from '../middleware/errorHandler.js';

/**
 * Hospital Service
 * Business logic for hospital operations
 */

/**
 * Get hospital profile
 */
const ensureHospitalProfile = async (userId) => {
  try {
    const hospital = await hospitalRepository.findByUserId(userId);
    if (!hospital) throw new NotFoundError('Hospital profile');
    return hospital;
  } catch (err) {
    if (err instanceof NotFoundError) {
      // Auto-create profile if missing for an existing user (fail-safe)
      const user = await userRepository.findById(userId);
      try {
        return await hospitalRepository.createHospital(userId, {
          hospitalName: `${user.first_name || 'Hospital'} ${user.last_name || ''}`.trim(),
          address: user.address || 'Pending Address',
          hospitalType: 'General',
          licenseNumber: `HOSP-AUTO-${user.lifeline_id || Math.random().toString(36).substring(7).toUpperCase()}`,
          numberOfBeds: 0,
        });
      } catch (createErr) {
        if (createErr instanceof ConflictError || (createErr.message && createErr.message.includes('UNIQUE'))) {
          return await hospitalRepository.findByUserId(userId);
        }
        throw createErr;
      }
    }
    throw err;
  }
};

export const getHospitalProfile = async (userId) => {
  try {
    const hospital = await ensureHospitalProfile(userId);

    // Get user details
    const user = await userRepository.findById(userId);

    return {
      ...hospital,
      user: {
        lifeline_id: user.lifeline_id,
        email: user.email,
        phone: user.phone,
      },
    };
  } catch (error) {
    logger.error('Get hospital profile error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update hospital profile
 */
export const updateHospitalProfile = async (userId, updateData) => {
  const {
    hospitalName,
    hospitalType,
    address,
    totalBeds,
    availableBeds,
    hasEmergency,
    hasIcu,
    departments,
    description,
  } = updateData;

  try {
    const hospital = await ensureHospitalProfile(userId);

    // Sync to user record if identity fields are present
    const identityUpdates = {};
    if (updateData.name || updateData.hospitalName || updateData.hospital_name) {
      const name = updateData.name || updateData.hospitalName || updateData.hospital_name;
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        identityUpdates.firstName = parts[0];
        identityUpdates.lastName = parts.slice(1).join(' ');
      } else {
        identityUpdates.firstName = parts[0];
      }
    }
    if (updateData.email) identityUpdates.email = updateData.email;
    if (updateData.phone) identityUpdates.phone = updateData.phone;

    if (Object.keys(identityUpdates).length > 0) {
      await userRepository.updateProfile(userId, identityUpdates);
    }

    // Validate bed numbers
    if (totalBeds !== undefined && availableBeds !== undefined) {
      if (availableBeds > totalBeds) {
        throw new BusinessLogicError('Available beds cannot exceed total beds');
      }
    }

    const updatedHospital = await hospitalRepository.updateProfile(hospital.id, {
      hospitalName,
      hospitalType,
      address,
      totalBeds,
      availableBeds,
      hasEmergency,
      hasIcu,
      departments,
      description,
      email: updateData.email,
      phone: updateData.phone,
    });

    logger.info('Hospital profile updated', {
      userId,
      hospitalId: hospital.id,
    });

    return updatedHospital;
  } catch (error) {
    logger.error('Update hospital profile error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update bed availability
 */
export const updateBedAvailability = async (userId, bedData) => {
  const { totalBeds, availableBeds } = bedData;

  try {
    const hospital = await ensureHospitalProfile(userId);

    // Validate bed numbers
    if (availableBeds > totalBeds) {
      throw new BusinessLogicError('Available beds cannot exceed total beds');
    }

    if (availableBeds < 0 || totalBeds < 0) {
      throw new BusinessLogicError('Bed numbers cannot be negative');
    }

    const updatedHospital = await hospitalRepository.updateBedAvailability(hospital.id, {
      totalBeds,
      availableBeds,
    });

    logger.info('Hospital bed availability updated', {
      userId,
      hospitalId: hospital.id,
      totalBeds,
      availableBeds,
    });

    return updatedHospital;
  } catch (error) {
    logger.error('Update bed availability error', {
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
    const hospital = await ensureHospitalProfile(userId);

    const updatedHospital = await hospitalRepository.updateLicense(hospital.id, {
      licenseNumber,
      licenseExpiry,
      licenseDocument,
    });

    logger.info('Hospital license updated', {
      userId,
      hospitalId: hospital.id,
    });

    return updatedHospital;
  } catch (error) {
    logger.error('Update hospital license error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get hospital surgeries
 */
export const getSurgeries = async (userId, options = {}) => {
  try {
    const hospital = await ensureHospitalProfile(userId);

    const surgeries = await medicalRecordsRepository.getHospitalSurgeries(hospital.id, options);

    return surgeries;
  } catch (error) {
    logger.error('Get hospital surgeries error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Schedule surgery
 */
export const scheduleSurgery = async (userId, surgeryData) => {
  const {
    patientId,
    dependentId = null,
    doctorId,
    surgeryType,
    surgeryDate,
    description,
    estimatedDuration,
    preOpNotes = null,
  } = surgeryData;

  try {
    const hospital = await ensureHospitalProfile(userId);

    // Verify patient exists
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient');
    }

    // Check if patient has active subscription
    const hasActive = await patientRepository.hasActiveSubscription(patientId);
    if (!hasActive) {
      throw new BusinessLogicError('Patient does not have an active subscription');
    }

    // Entitlement checks
    const packageType = patient.current_package || 'GENERAL';

    const providerAccess = entitlementChecker.checkProviderAccess(packageType, 'hospital');
    if (!providerAccess.entitled) {
      throw new BusinessLogicError(providerAccess.reason);
    }

    // Determine surgery type for entitlement check
    const surgeryServiceType = surgeryType?.toLowerCase().includes('major')
      ? SERVICE_TYPES.MAJOR_SURGERY
      : SERVICE_TYPES.MINOR_SURGERY;
    const surgeryEntitlement = entitlementChecker.isServiceEntitled(
      packageType,
      surgeryServiceType,
      { surgeryType }
    );
    if (!surgeryEntitlement.entitled) {
      throw new BusinessLogicError(surgeryEntitlement.reason);
    }

    // Check bed availability
    if (hospital.available_beds <= 0) {
      throw new BusinessLogicError('No beds available for surgery scheduling');
    }

    const surgery = await medicalRecordsRepository.createSurgery({
      patientId,
      doctorId,
      hospitalId: hospital.id,
      dependentId,
      surgeryType,
      surgeryDate,
      description,
      estimatedDuration,
      preOpNotes,
      status: 'scheduled',
    });

    // Decrement available beds
    await hospitalRepository.updateBedAvailability(hospital.id, {
      totalBeds: hospital.total_beds,
      availableBeds: hospital.available_beds - 1,
    });

    // Increment surgery count
    await hospitalRepository.incrementSurgeries(hospital.id);

    // Create payment record for this surgery
    try {
      await paymentService.processServicePayment({
        patientId,
        providerId: hospital.id,
        providerType: 'hospital',
        serviceType: surgeryServiceType,
        packageType,
      });
    } catch (paymentError) {
      logger.warn('Payment record creation failed (surgery still scheduled)', {
        surgeryId: surgery.id,
        error: paymentError.message,
      });
    }

    logger.info('Surgery scheduled', {
      userId,
      hospitalId: hospital.id,
      surgeryId: surgery.id,
      patientId,
    });

    return surgery;
  } catch (error) {
    logger.error('Schedule surgery error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update surgery
 */
export const updateSurgery = async (userId, surgeryId, updateData) => {
  try {
    const hospital = await ensureHospitalProfile(userId);

    // Verify surgery belongs to hospital
    const surgery = await medicalRecordsRepository.findSurgeryById(surgeryId);

    if (surgery.hospital_id !== hospital.id) {
      throw new BusinessLogicError('Unauthorized to update this surgery');
    }

    const updated = await medicalRecordsRepository.updateSurgery(surgeryId, updateData);

    // If surgery is completed or cancelled, release the bed
    if (updateData.status === 'completed' || updateData.status === 'cancelled') {
      await hospitalRepository.updateBedAvailability(hospital.id, {
        totalBeds: hospital.total_beds,
        availableBeds: hospital.available_beds + 1,
      });
    }

    logger.info('Surgery updated', {
      userId,
      surgeryId,
      status: updateData.status,
    });

    return updated;
  } catch (error) {
    logger.error('Update surgery error', {
      error: error.message,
      userId,
      surgeryId,
    });
    throw error;
  }
};

/**
 * Complete surgery
 */
export const completeSurgery = async (userId, surgeryId, completionData) => {
  const { postOpNotes, complications = null, outcome } = completionData;

  try {
    const hospital = await ensureHospitalProfile(userId);

    // Verify surgery belongs to hospital
    const surgery = await medicalRecordsRepository.findSurgeryById(surgeryId);

    if (surgery.hospital_id !== hospital.id) {
      throw new BusinessLogicError('Unauthorized to complete this surgery');
    }

    if (surgery.status === 'completed') {
      throw new BusinessLogicError('Surgery already completed');
    }

    const updated = await medicalRecordsRepository.updateSurgery(surgeryId, {
      status: 'completed',
      postOpNotes,
      complications,
      outcome,
      actualDate: new Date(),
    });

    // Release the bed
    await hospitalRepository.updateBedAvailability(hospital.id, {
      totalBeds: hospital.total_beds,
      availableBeds: hospital.available_beds + 1,
    });

    logger.info('Surgery completed', {
      userId,
      surgeryId,
    });

    return updated;
  } catch (error) {
    logger.error('Complete surgery error', {
      error: error.message,
      userId,
      surgeryId,
    });
    throw error;
  }
};

/**
 * Get hospital statistics
 */
export const getStatistics = async (userId, options = {}) => {
  try {
    const hospital = await hospitalRepository.findByUserId(userId);

    if (!hospital) {
      throw new NotFoundError('Hospital profile');
    }

    const stats = await hospitalRepository.getStatistics(hospital.id, options);

    return {
      ...stats,
      bedUtilization: hospital.total_beds > 0
        ? ((hospital.total_beds - hospital.available_beds) / hospital.total_beds) * 100
        : 0,
    };
  } catch (error) {
    logger.error('Get hospital statistics error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Search hospitals
 */
export const searchHospitals = async (searchTerm, options = {}) => {
  try {
    const hospitals = await hospitalRepository.searchHospitals(searchTerm, options);

    return hospitals;
  } catch (error) {
    logger.error('Search hospitals error', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Find hospitals by location
 */
export const findHospitalsByLocation = async (location, options = {}) => {
  try {
    const hospitals = await hospitalRepository.findByLocation(location, options);

    return hospitals;
  } catch (error) {
    logger.error('Find hospitals by location error', {
      error: error.message,
      location,
    });
    throw error;
  }
};

/**
 * Get hospitals with emergency services
 */
export const getHospitalsWithEmergency = async (options = {}) => {
  try {
    const hospitals = await hospitalRepository.findWithEmergency(options);

    return hospitals;
  } catch (error) {
    logger.error('Get hospitals with emergency error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get hospitals with available beds
 */
export const getHospitalsWithAvailableBeds = async (options = {}) => {
  try {
    const hospitals = await hospitalRepository.findWithAvailableBeds(options);

    return hospitals;
  } catch (error) {
    logger.error('Get hospitals with available beds error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get top-rated hospitals
 */
export const getTopRatedHospitals = async (options = {}) => {
  try {
    const hospitals = await hospitalRepository.getTopRated(options);

    return hospitals;
  } catch (error) {
    logger.error('Get top-rated hospitals error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get hospital by ID (public view)
 */
export const getHospitalById = async (hospitalId) => {
  try {
    const hospital = await hospitalRepository.findById(hospitalId);

    if (!hospital) {
      throw new NotFoundError('Hospital');
    }

    // Get user details
    const user = await userRepository.findById(hospital.user_id);

    return {
      ...hospital,
      user: {
        lifeline_id: user.lifeline_id,
        phone: user.phone,
      },
    };
  } catch (error) {
    logger.error('Get hospital by ID error', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Update verification status (admin only)
 */
export const updateVerificationStatus = async (hospitalId, status, notes = null) => {
  try {
    const updatedHospital = await hospitalRepository.updateVerificationStatus(
      hospitalId,
      status,
      notes
    );

    logger.info('Hospital verification status updated', {
      hospitalId,
      status,
    });

    return updatedHospital;
  } catch (error) {
    logger.error('Update hospital verification error', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Get pending verification requests (admin only)
 */
export const getPendingVerifications = async (options = {}) => {
  try {
    const hospitals = await hospitalRepository.getPendingVerification(options);

    return hospitals;
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
    const hospitals = await hospitalRepository.getExpiringLicenses(days, options);

    return hospitals;
  } catch (error) {
    logger.error('Get expiring licenses error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Update hospital rating
 */
export const updateRating = async (hospitalId, rating) => {
  try {
    if (rating < 1 || rating > 5) {
      throw new BusinessLogicError('Rating must be between 1 and 5');
    }

    const updatedHospital = await hospitalRepository.updateRating(hospitalId, rating);

    logger.info('Hospital rating updated', {
      hospitalId,
      rating,
    });

    return updatedHospital;
  } catch (error) {
    logger.error('Update hospital rating error', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

export default {
  getHospitalProfile,
  updateHospitalProfile,
  updateBedAvailability,
  updateLicense,
  getSurgeries,
  scheduleSurgery,
  updateSurgery,
  completeSurgery,
  getStatistics,
  searchHospitals,
  findHospitalsByLocation,
  getHospitalsWithEmergency,
  getHospitalsWithAvailableBeds,
  getTopRatedHospitals,
  getHospitalById,
  updateVerificationStatus,
  getPendingVerifications,
  getExpiringLicenses,
  updateRating,
};
