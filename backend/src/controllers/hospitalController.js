import * as hospitalService from '../services/hospitalService.js';
import { successResponse } from '../utils/response.js';

/**
 * Hospital Controller
 * HTTP request handlers for hospital operations
 */

/**
 * Get hospital profile
 * GET /api/hospitals/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await hospitalService.getHospitalProfile(userId);

    return successResponse(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update hospital profile
 * PUT /api/hospitals/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await hospitalService.updateHospitalProfile(userId, req.body);

    return successResponse(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update bed availability
 * PUT /api/hospitals/beds
 */
export const updateBedAvailability = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const hospital = await hospitalService.updateBedAvailability(userId, req.body);

    return successResponse(res, hospital, 'Bed availability updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update license
 * PUT /api/hospitals/license
 */
export const updateLicense = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const hospital = await hospitalService.updateLicense(userId, req.body);

    return successResponse(res, hospital, 'License updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get surgeries
 * GET /api/hospitals/surgeries
 */
export const getSurgeries = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit, offset, status, startDate, endDate } = req.query;

    const surgeries = await hospitalService.getSurgeries(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status,
      startDate,
      endDate,
    });

    return successResponse(res, surgeries, 'Surgeries retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule surgery
 * POST /api/hospitals/surgeries
 */
export const scheduleSurgery = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const surgery = await hospitalService.scheduleSurgery(userId, req.body);

    return successResponse(res, surgery, 'Surgery scheduled successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update surgery
 * PUT /api/hospitals/surgeries/:surgeryId
 */
export const updateSurgery = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { surgeryId } = req.params;

    const surgery = await hospitalService.updateSurgery(userId, surgeryId, req.body);

    return successResponse(res, surgery, 'Surgery updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Complete surgery
 * POST /api/hospitals/surgeries/:surgeryId/complete
 */
export const completeSurgery = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { surgeryId } = req.params;

    const surgery = await hospitalService.completeSurgery(userId, surgeryId, req.body);

    return successResponse(res, surgery, 'Surgery completed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics
 * GET /api/hospitals/statistics
 */
export const getStatistics = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const stats = await hospitalService.getStatistics(userId, {
      startDate,
      endDate,
    });

    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search hospitals
 * GET /api/hospitals/search
 */
export const searchHospitals = async (req, res, next) => {
  try {
    const { q, limit, offset, verifiedOnly } = req.query;

    const hospitals = await hospitalService.searchHospitals(q, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      verifiedOnly: verifiedOnly === 'true',
    });

    return successResponse(res, hospitals, 'Hospitals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Find hospitals by location
 * GET /api/hospitals/location
 */
export const findHospitalsByLocation = async (req, res, next) => {
  try {
    const { location, limit, offset } = req.query;

    const hospitals = await hospitalService.findHospitalsByLocation(location, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, hospitals, 'Hospitals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get hospitals with emergency services
 * GET /api/hospitals/with-emergency
 */
export const getHospitalsWithEmergency = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const hospitals = await hospitalService.getHospitalsWithEmergency({
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, hospitals, 'Emergency hospitals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get hospitals with available beds
 * GET /api/hospitals/with-available-beds
 */
export const getHospitalsWithAvailableBeds = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const hospitals = await hospitalService.getHospitalsWithAvailableBeds({
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, hospitals, 'Hospitals with beds retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top-rated hospitals
 * GET /api/hospitals/top-rated
 */
export const getTopRatedHospitals = async (req, res, next) => {
  try {
    const { limit, minRating } = req.query;

    const hospitals = await hospitalService.getTopRatedHospitals({
      limit: parseInt(limit) || 10,
      minRating: parseFloat(minRating) || 4.0,
    });

    return successResponse(res, hospitals, 'Top-rated hospitals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get hospital by ID
 * GET /api/hospitals/:hospitalId
 */
export const getHospitalById = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;

    const hospital = await hospitalService.getHospitalById(hospitalId);

    return successResponse(res, hospital, 'Hospital retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update verification status (admin only)
 * PUT /api/hospitals/:hospitalId/verification
 */
export const updateVerificationStatus = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const { status, notes } = req.body;

    const hospital = await hospitalService.updateVerificationStatus(hospitalId, status, notes);

    return successResponse(res, hospital, 'Verification status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending verifications (admin only)
 * GET /api/hospitals/admin/pending-verifications
 */
export const getPendingVerifications = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const hospitals = await hospitalService.getPendingVerifications({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, hospitals, 'Pending verifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get expiring licenses (admin only)
 * GET /api/hospitals/admin/expiring-licenses
 */
export const getExpiringLicenses = async (req, res, next) => {
  try {
    const { days, limit, offset } = req.query;

    const hospitals = await hospitalService.getExpiringLicenses(parseInt(days) || 30, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, hospitals, 'Expiring licenses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update hospital rating
 * POST /api/hospitals/:hospitalId/rating
 */
export const updateRating = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const { rating } = req.body;

    const hospital = await hospitalService.updateRating(hospitalId, rating);

    return successResponse(res, hospital, 'Rating updated successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
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
