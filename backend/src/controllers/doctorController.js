import * as doctorService from '../services/doctorService.js';
import { successResponse } from '../utils/response.js';

/**
 * Doctor Controller
 * HTTP request handlers for doctor operations
 */

/**
 * Get doctor profile
 * GET /api/doctors/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await doctorService.getDoctorProfile(userId);

    return successResponse(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor profile
 * PUT /api/doctors/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await doctorService.updateDoctorProfile(userId, req.body);

    return successResponse(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update license
 * PUT /api/doctors/license
 */
export const updateLicense = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const doctor = await doctorService.updateLicense(userId, req.body);

    return successResponse(res, doctor, 'License updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get consultations
 * GET /api/doctors/consultations
 */
export const getConsultations = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit, offset, startDate, endDate } = req.query;

    const consultations = await doctorService.getConsultations(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      startDate,
      endDate,
    });

    return successResponse(res, consultations, 'Consultations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create consultation
 * POST /api/doctors/consultations
 */
export const createConsultation = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const consultation = await doctorService.createConsultation(userId, req.body);

    return successResponse(res, consultation, 'Consultation created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update consultation
 * PUT /api/doctors/consultations/:consultationId
 */
export const updateConsultation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { consultationId } = req.params;

    const consultation = await doctorService.updateConsultation(userId, consultationId, req.body);

    return successResponse(res, consultation, 'Consultation updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create prescription
 * POST /api/doctors/prescriptions
 */
export const createPrescription = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const prescription = await doctorService.createPrescription(userId, req.body);

    return successResponse(res, prescription, 'Prescription created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics
 * GET /api/doctors/statistics
 */
export const getStatistics = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const stats = await doctorService.getStatistics(userId, {
      startDate,
      endDate,
    });

    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search doctors
 * GET /api/doctors/search
 */
export const searchDoctors = async (req, res, next) => {
  try {
    const { q, limit, offset, verifiedOnly } = req.query;

    const doctors = await doctorService.searchDoctors(q, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      verifiedOnly: verifiedOnly === 'true',
    });

    return successResponse(res, doctors, 'Doctors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctors by specialization
 * GET /api/doctors/specialization/:specialization
 */
export const getDoctorsBySpecialization = async (req, res, next) => {
  try {
    const { specialization } = req.params;
    const { limit, offset } = req.query;

    const doctors = await doctorService.getDoctorsBySpecialization(specialization, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, doctors, 'Doctors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top-rated doctors
 * GET /api/doctors/top-rated
 */
export const getTopRatedDoctors = async (req, res, next) => {
  try {
    const { limit, minRating } = req.query;

    const doctors = await doctorService.getTopRatedDoctors({
      limit: parseInt(limit) || 10,
      minRating: parseFloat(minRating) || 4.0,
    });

    return successResponse(res, doctors, 'Top-rated doctors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor by ID
 * GET /api/doctors/:doctorId
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await doctorService.getDoctorById(doctorId);

    return successResponse(res, doctor, 'Doctor retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update verification status (admin only)
 * PUT /api/doctors/:doctorId/verification
 */
export const updateVerificationStatus = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { status, notes } = req.body;

    const doctor = await doctorService.updateVerificationStatus(doctorId, status, notes);

    return successResponse(res, doctor, 'Verification status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending verifications (admin only)
 * GET /api/doctors/admin/pending-verifications
 */
export const getPendingVerifications = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const doctors = await doctorService.getPendingVerifications({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, doctors, 'Pending verifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get expiring licenses (admin only)
 * GET /api/doctors/admin/expiring-licenses
 */
export const getExpiringLicenses = async (req, res, next) => {
  try {
    const { days, limit, offset } = req.query;

    const doctors = await doctorService.getExpiringLicenses(parseInt(days) || 30, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, doctors, 'Expiring licenses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all specializations
 * GET /api/doctors/specializations
 */
export const getAllSpecializations = async (req, res, next) => {
  try {
    const specializations = await doctorService.getAllSpecializations();

    return successResponse(res, specializations, 'Specializations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor rating
 * POST /api/doctors/:doctorId/rating
 */
export const updateRating = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { rating } = req.body;

    const doctor = await doctorService.updateRating(doctorId, rating);

    return successResponse(res, doctor, 'Rating updated successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
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
