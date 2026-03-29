import * as doctorRepository from '../models/doctorRepository.js';
import * as userRepository from '../models/userRepository.js';
import * as medicalRecordsRepository from '../models/medicalRecordsRepository.js';
import * as patientRepository from '../models/patientRepository.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { BusinessLogicError, NotFoundError, ConflictError } from '../middleware/errorHandler.js';

/**
 * Doctor Service
 * Business logic for doctor operations
 */

/**
 * Get doctor profile
 */
const ensureDoctorProfile = async (userId) => {
  try {
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) throw new NotFoundError('Doctor profile');
    return doctor;
  } catch (err) {
    if (err instanceof NotFoundError) {
      // Auto-create profile if missing for an existing user (fail-safe)
      const user = await userRepository.findById(userId);
      try {
        return await doctorRepository.createDoctor(userId, {
          specialization: 'General Practice',
          licenseNumber: `AUTO-${user.lifeline_id || Math.random().toString(36).substring(7).toUpperCase()}`,
          yearsOfExperience: 0,
          consultationFee: 0,
        });
      } catch (createErr) {
        // Fallback for concurrent request collision where another request already created it
        if (createErr instanceof ConflictError || (createErr.message && createErr.message.includes('UNIQUE'))) {
          return await doctorRepository.findByUserId(userId);
        }
        throw createErr;
      }
    }
    throw err;
  }
};

export const getDoctorProfile = async (userId) => {
  try {
    const doctor = await ensureDoctorProfile(userId);

    // Get user details
    const user = await userRepository.findById(userId);

    // Resolve full photo URL
    const apiUrl = config.apiUrl;
    const profilePhoto = doctor.profile_photo;
    const absolutePhotoUrl = profilePhoto ? (profilePhoto.startsWith('http') ? profilePhoto : `${apiUrl}${profilePhoto}`) : null;

    return {
      ...doctor,
      profile_photo: absolutePhotoUrl,
      user: {
        lifeline_id: user.lifeline_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      },
    };
  } catch (error) {
    logger.error('Get doctor profile error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Upload profile photo
 */
export const uploadProfilePhoto = async (userId, file) => {
  try {
    const apiUrl = config.apiUrl;
    const photoUrl = `/uploads/${file.filename}`;
    const absolutePhotoUrl = `${apiUrl}${photoUrl}`;

    await userRepository.updateProfile(userId, {
      profilePicture: photoUrl, // Store relative URL in DB
    });

    return absolutePhotoUrl;
  } catch (error) {
    logger.error('Upload profile photo error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update doctor profile
 */
export const updateDoctorProfile = async (userId, updateData) => {
  const { specialization, qualifications, yearsOfExperience, consultationFee, bio, availableHours } =
    updateData;

  try {
    const doctor = await ensureDoctorProfile(userId);

    // Update identity fields in userRepository if present
    const identityUpdates = {};
    if (updateData.full_name) {
      const parts = updateData.full_name.trim().split(/\s+/);
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

    const updatedDoctor = await doctorRepository.updateProfile(doctor.id, updateData);

    logger.info('Doctor profile updated', {
      userId,
      doctorId: doctor.id,
    });

    return updatedDoctor;
  } catch (error) {
    logger.error('Update doctor profile error', {
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
    const doctor = await ensureDoctorProfile(userId);

    const updatedDoctor = await doctorRepository.updateLicense(doctor.id, {
      licenseNumber,
      licenseExpiry,
      licenseDocument,
    });

    logger.info('Doctor license updated', {
      userId,
      doctorId: doctor.id,
    });

    return updatedDoctor;
  } catch (error) {
    logger.error('Update doctor license error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get doctor consultations
 */
export const getConsultations = async (userId, options = {}) => {
  try {
    const doctor = await ensureDoctorProfile(userId);

    const consultations = await medicalRecordsRepository.getDoctorConsultations(doctor.id, options);

    return consultations;
  } catch (error) {
    logger.error('Get doctor consultations error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Create consultation
 */
export const createConsultation = async (userId, consultationData) => {
  const {
    patientId,
    dependentId = null,
    consultationDate,
    chiefComplaint,
    diagnosis,
    notes,
    followUpDate = null,
  } = consultationData;

  try {
    const doctor = await ensureDoctorProfile(userId);

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

    const consultation = await medicalRecordsRepository.createConsultation({
      patientId,
      doctorId: doctor.id,
      dependentId,
      consultationDate,
      chiefComplaint,
      diagnosis,
      notes,
      followUpDate,
    });

    // Increment consultation count
    await doctorRepository.incrementConsultations(doctor.id);

    logger.info('Consultation created', {
      userId,
      doctorId: doctor.id,
      consultationId: consultation.id,
      patientId,
    });

    return consultation;
  } catch (error) {
    logger.error('Create consultation error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Update consultation
 */
export const updateConsultation = async (userId, consultationId, updateData) => {
  try {
    const doctor = await ensureDoctorProfile(userId);

    // Verify consultation belongs to doctor
    const consultation = await medicalRecordsRepository.findConsultationById(consultationId);

    if (consultation.doctor_id !== doctor.id) {
      throw new BusinessLogicError('Unauthorized to update this consultation');
    }

    const updated = await medicalRecordsRepository.updateConsultation(consultationId, updateData);

    logger.info('Consultation updated', {
      userId,
      consultationId,
    });

    return updated;
  } catch (error) {
    logger.error('Update consultation error', {
      error: error.message,
      userId,
      consultationId,
    });
    throw error;
  }
};

/**
 * Create prescription
 */
export const createPrescription = async (userId, prescriptionData) => {
  const {
    patientId,
    dependentId = null,
    consultationId = null,
    medications,
    instructions,
    validUntil,
  } = prescriptionData;

  try {
    const doctor = await ensureDoctorProfile(userId);

    // Verify patient exists
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient');
    }

    const prescription = await medicalRecordsRepository.createPrescription({
      patientId,
      doctorId: doctor.id,
      dependentId,
      consultationId,
      medications,
      instructions,
      validUntil,
    });

    logger.info('Prescription created', {
      userId,
      doctorId: doctor.id,
      prescriptionId: prescription.id,
      patientId,
    });

    return prescription;
  } catch (error) {
    logger.error('Create prescription error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get doctor prescriptions
 */
export const getPrescriptions = async (userId, options = {}) => {
  try {
    const doctor = await ensureDoctorProfile(userId);

    const prescriptions = await medicalRecordsRepository.getDoctorPrescriptions(
      doctor.id,
      options
    );

    return prescriptions;
  } catch (error) {
    logger.error('Get doctor prescriptions error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get doctor statistics
 */
export const getStatistics = async (userId, options = {}) => {
  try {
    const doctor = await ensureDoctorProfile(userId);

    const stats = await doctorRepository.getStatistics(doctor.id, options);

    return stats;
  } catch (error) {
    logger.error('Get doctor statistics error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Search doctors
 */
export const searchDoctors = async (searchTerm, options = {}) => {
  try {
    const doctors = await doctorRepository.searchDoctors(searchTerm, options);

    return doctors;
  } catch (error) {
    logger.error('Search doctors error', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Get doctors by specialization
 */
export const getDoctorsBySpecialization = async (specialization, options = {}) => {
  try {
    const doctors = await doctorRepository.findBySpecialization(specialization, options);

    return doctors;
  } catch (error) {
    logger.error('Get doctors by specialization error', {
      error: error.message,
      specialization,
    });
    throw error;
  }
};

/**
 * Get top-rated doctors
 */
export const getTopRatedDoctors = async (options = {}) => {
  try {
    const doctors = await doctorRepository.getTopRated(options);

    return doctors;
  } catch (error) {
    logger.error('Get top-rated doctors error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get doctor by ID (public view)
 */
export const getDoctorById = async (doctorId) => {
  try {
    const doctor = await doctorRepository.findById(doctorId);

    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    // Get user details
    const user = await userRepository.findById(doctor.user_id);

    return {
      ...doctor,
      user: {
        lifeline_id: user.lifeline_id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  } catch (error) {
    logger.error('Get doctor by ID error', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

/**
 * Update verification status (admin only)
 */
export const updateVerificationStatus = async (doctorId, status, notes = null) => {
  try {
    const updatedDoctor = await doctorRepository.updateVerificationStatus(doctorId, status, notes);

    logger.info('Doctor verification status updated', {
      doctorId,
      status,
    });

    return updatedDoctor;
  } catch (error) {
    logger.error('Update doctor verification error', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

/**
 * Get pending verification requests (admin only)
 */
export const getPendingVerifications = async (options = {}) => {
  try {
    const doctors = await doctorRepository.getPendingVerification(options);

    return doctors;
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
    const doctors = await doctorRepository.getExpiringLicenses(days, options);

    return doctors;
  } catch (error) {
    logger.error('Get expiring licenses error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get all specializations
 */
export const getAllSpecializations = async () => {
  try {
    const specializations = await doctorRepository.getAllSpecializations();

    return specializations;
  } catch (error) {
    logger.error('Get all specializations error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Update doctor rating
 */
export const updateRating = async (doctorId, rating) => {
  try {
    if (rating < 1 || rating > 5) {
      throw new BusinessLogicError('Rating must be between 1 and 5');
    }

    const updatedDoctor = await doctorRepository.updateRating(doctorId, rating);

    logger.info('Doctor rating updated', {
      doctorId,
      rating,
    });

    return updatedDoctor;
  } catch (error) {
    logger.error('Update doctor rating error', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

export default {
  getDoctorProfile,
  updateDoctorProfile,
  updateLicense,
  getConsultations,
  createConsultation,
  updateConsultation,
  createPrescription,
  getStatistics,
  searchDoctors,
  getDoctorsBySpecialization,
  getTopRatedDoctors,
  getDoctorById,
  updateVerificationStatus,
  getPendingVerifications,
  getExpiringLicenses,
  getAllSpecializations,
  updateRating,
};
