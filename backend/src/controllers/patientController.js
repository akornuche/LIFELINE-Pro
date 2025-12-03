import * as patientService from '../services/patientService.js';
import { successResponse } from '../utils/response.js';

/**
 * Patient Controller
 * HTTP request handlers for patient operations
 */

/**
 * Get patient profile
 * GET /api/patients/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await patientService.getPatientProfile(userId);

    return successResponse(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient profile
 * PUT /api/patients/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const profile = await patientService.updatePatientProfile(userId, req.body);

    return successResponse(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create subscription
 * POST /api/patients/subscriptions
 */
export const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const subscription = await patientService.createSubscription(userId, req.body);

    return successResponse(res, subscription, 'Subscription created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription
 * PUT /api/patients/subscriptions
 */
export const updateSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const subscription = await patientService.updateSubscription(userId, req.body);

    return successResponse(res, subscription, 'Subscription updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 * DELETE /api/patients/subscriptions
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { reason } = req.body;

    const subscription = await patientService.cancelSubscription(userId, reason);

    return successResponse(res, subscription, 'Subscription cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription details
 * GET /api/patients/subscriptions
 */
export const getSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const subscription = await patientService.getSubscriptionDetails(userId);

    return successResponse(res, subscription, 'Subscription retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add dependent
 * POST /api/patients/dependents
 */
export const addDependent = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const dependent = await patientService.addDependent(userId, req.body);

    return successResponse(res, dependent, 'Dependent added successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get dependents
 * GET /api/patients/dependents
 */
export const getDependents = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const dependents = await patientService.getDependents(userId);

    return successResponse(res, dependents, 'Dependents retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update dependent
 * PUT /api/patients/dependents/:dependentId
 */
export const updateDependent = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { dependentId } = req.params;

    const dependent = await patientService.updateDependent(userId, dependentId, req.body);

    return successResponse(res, dependent, 'Dependent updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove dependent
 * DELETE /api/patients/dependents/:dependentId
 */
export const removeDependent = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { dependentId } = req.params;

    const dependent = await patientService.removeDependent(userId, dependentId);

    return successResponse(res, dependent, 'Dependent removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get medical history
 * GET /api/patients/medical-history
 */
export const getMedicalHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { includeDependent } = req.query;

    const history = await patientService.getMedicalHistory(userId, {
      includeDependent,
    });

    return successResponse(res, history, 'Medical history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get usage statistics
 * GET /api/patients/usage-statistics
 */
export const getUsageStatistics = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const stats = await patientService.getUsageStatistics(userId);

    return successResponse(res, stats, 'Usage statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Check subscription status
 * GET /api/patients/subscription-status
 */
export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const status = await patientService.checkSubscriptionStatus(userId);

    return successResponse(res, status, 'Subscription status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Search patients (admin only)
 * GET /api/patients/search
 */
export const searchPatients = async (req, res, next) => {
  try {
    const { q, limit, offset } = req.query;

    const patients = await patientService.searchPatients(q, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, patients, 'Patients retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient by ID (admin/provider)
 * GET /api/patients/:patientId
 */
export const getPatientById = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await patientService.getPatientById(patientId);

    return successResponse(res, patient, 'Patient retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscription,
  addDependent,
  getDependents,
  updateDependent,
  removeDependent,
  getMedicalHistory,
  getUsageStatistics,
  checkSubscriptionStatus,
  searchPatients,
  getPatientById,
};
