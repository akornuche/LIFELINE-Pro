import express from 'express';
import * as patientController from '../controllers/patientController.js';
import { authenticate } from '../middleware/auth.js';
import { isPatient, isAdmin, checkRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  updatePatientProfileSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  cancelSubscriptionSchema,
  addDependentSchema,
  updateDependentSchema,
} from '../validation/patientSchemas.js';

const router = express.Router();

/**
 * @route   GET /api/patients/profile
 * @desc    Get patient profile
 * @access  Private (Patient)
 */
router.get('/profile', authenticate, isPatient, patientController.getProfile);

/**
 * @route   PUT /api/patients/profile
 * @desc    Update patient profile
 * @access  Private (Patient)
 */
router.put(
  '/profile',
  authenticate,
  isPatient,
  validate(updatePatientProfileSchema),
  patientController.updateProfile
);

/**
 * @route   GET /api/patients/subscriptions
 * @desc    Get patient subscriptions
 * @access  Private (Patient)
 */
router.get('/subscriptions', authenticate, isPatient, patientController.getSubscriptions);

/**
 * @route   POST /api/patients/subscriptions
 * @desc    Create subscription
 * @access  Private (Patient)
 */
router.post(
  '/subscriptions',
  authenticate,
  isPatient,
  validate(createSubscriptionSchema),
  patientController.createSubscription
);

/**
 * @route   GET /api/patients/subscriptions
 * @desc    Get subscription details
 * @access  Private (Patient)
 */
router.get('/subscriptions', authenticate, isPatient, patientController.getSubscription);

/**
 * @route   PUT /api/patients/subscriptions
 * @desc    Update subscription
 * @access  Private (Patient)
 */
router.put(
  '/subscriptions',
  authenticate,
  isPatient,
  validate(updateSubscriptionSchema),
  patientController.updateSubscription
);

/**
 * @route   DELETE /api/patients/subscriptions
 * @desc    Cancel subscription
 * @access  Private (Patient)
 */
router.delete(
  '/subscriptions',
  authenticate,
  isPatient,
  validate(cancelSubscriptionSchema),
  patientController.cancelSubscription
);

/**
 * @route   GET /api/patients/subscription-status
 * @desc    Check subscription status
 * @access  Private (Patient)
 */
router.get(
  '/subscription-status',
  authenticate,
  isPatient,
  patientController.checkSubscriptionStatus
);

/**
 * @route   POST /api/patients/dependents
 * @desc    Add dependent
 * @access  Private (Patient)
 */
router.post(
  '/dependents',
  authenticate,
  isPatient,
  validate(addDependentSchema),
  patientController.addDependent
);

/**
 * @route   GET /api/patients/dependents
 * @desc    Get dependents
 * @access  Private (Patient)
 */
router.get('/dependents', authenticate, isPatient, patientController.getDependents);

/**
 * @route   PUT /api/patients/dependents/:dependentId
 * @desc    Update dependent
 * @access  Private (Patient)
 */
router.put(
  '/dependents/:dependentId',
  authenticate,
  isPatient,
  validate(updateDependentSchema),
  patientController.updateDependent
);

/**
 * @route   DELETE /api/patients/dependents/:dependentId
 * @desc    Remove dependent
 * @access  Private (Patient)
 */
router.delete(
  '/dependents/:dependentId',
  authenticate,
  isPatient,
  patientController.removeDependent
);

/**
 * @route   GET /api/patients/medical-history
 * @desc    Get medical history
 * @access  Private (Patient)
 */
router.get(
  '/medical-history',
  authenticate,
  isPatient,
  patientController.getMedicalHistory
);

/**
 * @route   GET /api/patients/usage-statistics
 * @desc    Get usage statistics
 * @access  Private (Patient)
 */
router.get(
  '/usage-statistics',
  authenticate,
  isPatient,
  patientController.getUsageStatistics
);

/**
 * @route   GET /api/patients/search
 * @desc    Search patients
 * @access  Private (Admin)
 */
router.get('/search', authenticate, isAdmin, patientController.searchPatients);

/**
 * @route   GET /api/patients/:patientId
 * @desc    Get patient by ID
 * @access  Private (Admin, Doctor, Pharmacy, Hospital)
 */
router.get(
  '/:patientId',
  authenticate,
  checkRole('admin', 'doctor', 'pharmacy', 'hospital'),
  patientController.getPatientById
);

export default router;
