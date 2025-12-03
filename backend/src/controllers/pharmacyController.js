import * as pharmacyService from '../services/pharmacyService.js';
import { successResponse } from '../utils/response.js';

/**
 * Pharmacy Controller
 * HTTP request handlers for pharmacy operations
 */

/**
 * Get pharmacy profile
 * GET /api/pharmacies/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await pharmacyService.getPharmacyProfile(userId);

    return successResponse(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update pharmacy profile
 * PUT /api/pharmacies/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await pharmacyService.updatePharmacyProfile(userId, req.body);

    return successResponse(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update license
 * PUT /api/pharmacies/license
 */
export const updateLicense = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const pharmacy = await pharmacyService.updateLicense(userId, req.body);

    return successResponse(res, pharmacy, 'License updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get prescriptions
 * GET /api/pharmacies/prescriptions
 */
export const getPrescriptions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit, offset, status } = req.query;

    const prescriptions = await pharmacyService.getPrescriptions(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status,
    });

    return successResponse(res, prescriptions, 'Prescriptions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Dispense prescription
 * POST /api/pharmacies/prescriptions/:prescriptionId/dispense
 */
export const dispensePrescription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { prescriptionId } = req.params;

    const prescription = await pharmacyService.dispensePrescription(
      userId,
      prescriptionId,
      req.body
    );

    return successResponse(res, prescription, 'Prescription dispensed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify prescription
 * GET /api/pharmacies/prescriptions/:prescriptionId/verify
 */
export const verifyPrescription = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;

    const verification = await pharmacyService.verifyPrescription(prescriptionId);

    return successResponse(res, verification, 'Prescription verification completed');
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics
 * GET /api/pharmacies/statistics
 */
export const getStatistics = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const stats = await pharmacyService.getStatistics(userId, {
      startDate,
      endDate,
    });

    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search pharmacies
 * GET /api/pharmacies/search
 */
export const searchPharmacies = async (req, res, next) => {
  try {
    const { q, limit, offset, verifiedOnly } = req.query;

    const pharmacies = await pharmacyService.searchPharmacies(q, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      verifiedOnly: verifiedOnly === 'true',
    });

    return successResponse(res, pharmacies, 'Pharmacies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Find pharmacies by location
 * GET /api/pharmacies/location
 */
export const findPharmaciesByLocation = async (req, res, next) => {
  try {
    const { location, limit, offset } = req.query;

    const pharmacies = await pharmacyService.findPharmaciesByLocation(location, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, pharmacies, 'Pharmacies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pharmacies with delivery
 * GET /api/pharmacies/with-delivery
 */
export const getPharmaciesWithDelivery = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const pharmacies = await pharmacyService.getPharmaciesWithDelivery({
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, pharmacies, 'Pharmacies with delivery retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top-rated pharmacies
 * GET /api/pharmacies/top-rated
 */
export const getTopRatedPharmacies = async (req, res, next) => {
  try {
    const { limit, minRating } = req.query;

    const pharmacies = await pharmacyService.getTopRatedPharmacies({
      limit: parseInt(limit) || 10,
      minRating: parseFloat(minRating) || 4.0,
    });

    return successResponse(res, pharmacies, 'Top-rated pharmacies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pharmacy by ID
 * GET /api/pharmacies/:pharmacyId
 */
export const getPharmacyById = async (req, res, next) => {
  try {
    const { pharmacyId } = req.params;

    const pharmacy = await pharmacyService.getPharmacyById(pharmacyId);

    return successResponse(res, pharmacy, 'Pharmacy retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update verification status (admin only)
 * PUT /api/pharmacies/:pharmacyId/verification
 */
export const updateVerificationStatus = async (req, res, next) => {
  try {
    const { pharmacyId } = req.params;
    const { status, notes } = req.body;

    const pharmacy = await pharmacyService.updateVerificationStatus(pharmacyId, status, notes);

    return successResponse(res, pharmacy, 'Verification status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending verifications (admin only)
 * GET /api/pharmacies/admin/pending-verifications
 */
export const getPendingVerifications = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const pharmacies = await pharmacyService.getPendingVerifications({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, pharmacies, 'Pending verifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get expiring licenses (admin only)
 * GET /api/pharmacies/admin/expiring-licenses
 */
export const getExpiringLicenses = async (req, res, next) => {
  try {
    const { days, limit, offset } = req.query;

    const pharmacies = await pharmacyService.getExpiringLicenses(parseInt(days) || 30, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, pharmacies, 'Expiring licenses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update pharmacy rating
 * POST /api/pharmacies/:pharmacyId/rating
 */
export const updateRating = async (req, res, next) => {
  try {
    const { pharmacyId } = req.params;
    const { rating } = req.body;

    const pharmacy = await pharmacyService.updateRating(pharmacyId, rating);

    return successResponse(res, pharmacy, 'Rating updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Check prescription eligibility
 * GET /api/pharmacies/prescriptions/:prescriptionId/eligibility
 */
export const checkPrescriptionEligibility = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const { patientId } = req.query;

    const eligibility = await pharmacyService.checkPrescriptionEligibility(
      prescriptionId,
      patientId
    );

    return successResponse(res, eligibility, 'Eligibility check completed');
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
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
