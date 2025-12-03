import express from 'express';
import * as hospitalController from '../controllers/hospitalController.js';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  updateHospitalProfileSchema,
  updateBedAvailabilitySchema,
  updateLicenseSchema,
  scheduleSurgerySchema,
  updateSurgerySchema,
  completeSurgerySchema,
  updateVerificationStatusSchema,
  updateRatingSchema,
} from '../validation/providerSchemas.js';

const router = express.Router();

/**
 * @route   GET /api/hospitals/profile
 * @desc    Get hospital profile
 * @access  Private (Hospital)
 */
router.get('/profile', authenticate, checkRole(['hospital']), hospitalController.getProfile);

/**
 * @route   PUT /api/hospitals/profile
 * @desc    Update hospital profile
 * @access  Private (Hospital)
 */
router.put(
  '/profile',
  authenticate,
  checkRole(['hospital']),
  validate(updateHospitalProfileSchema),
  hospitalController.updateProfile
);

/**
 * @route   PUT /api/hospitals/beds
 * @desc    Update bed availability
 * @access  Private (Hospital)
 */
router.put(
  '/beds',
  authenticate,
  checkRole(['hospital']),
  validate(updateBedAvailabilitySchema),
  hospitalController.updateBedAvailability
);

/**
 * @route   PUT /api/hospitals/license
 * @desc    Update license
 * @access  Private (Hospital)
 */
router.put(
  '/license',
  authenticate,
  checkRole(['hospital']),
  validate(updateLicenseSchema),
  hospitalController.updateLicense
);

/**
 * @route   GET /api/hospitals/surgeries
 * @desc    Get surgeries
 * @access  Private (Hospital)
 */
router.get('/surgeries', authenticate, checkRole(['hospital']), hospitalController.getSurgeries);

/**
 * @route   POST /api/hospitals/surgeries
 * @desc    Schedule surgery
 * @access  Private (Hospital)
 */
router.post(
  '/surgeries',
  authenticate,
  checkRole(['hospital']),
  validate(scheduleSurgerySchema),
  hospitalController.scheduleSurgery
);

/**
 * @route   PUT /api/hospitals/surgeries/:surgeryId
 * @desc    Update surgery
 * @access  Private (Hospital)
 */
router.put(
  '/surgeries/:surgeryId',
  authenticate,
  checkRole(['hospital']),
  validate(updateSurgerySchema),
  hospitalController.updateSurgery
);

/**
 * @route   POST /api/hospitals/surgeries/:surgeryId/complete
 * @desc    Complete surgery
 * @access  Private (Hospital)
 */
router.post(
  '/surgeries/:surgeryId/complete',
  authenticate,
  checkRole(['hospital']),
  validate(completeSurgerySchema),
  hospitalController.completeSurgery
);

/**
 * @route   GET /api/hospitals/statistics
 * @desc    Get statistics
 * @access  Private (Hospital)
 */
router.get('/statistics', authenticate, checkRole(['hospital']), hospitalController.getStatistics);

/**
 * @route   GET /api/hospitals/search
 * @desc    Search hospitals
 * @access  Public
 */
router.get('/search', hospitalController.searchHospitals);

/**
 * @route   GET /api/hospitals/location
 * @desc    Find hospitals by location
 * @access  Public
 */
router.get('/location', hospitalController.findHospitalsByLocation);

/**
 * @route   GET /api/hospitals/with-emergency
 * @desc    Get hospitals with emergency services
 * @access  Public
 */
router.get('/with-emergency', hospitalController.getHospitalsWithEmergency);

/**
 * @route   GET /api/hospitals/with-available-beds
 * @desc    Get hospitals with available beds
 * @access  Public
 */
router.get('/with-available-beds', hospitalController.getHospitalsWithAvailableBeds);

/**
 * @route   GET /api/hospitals/top-rated
 * @desc    Get top-rated hospitals
 * @access  Public
 */
router.get('/top-rated', hospitalController.getTopRatedHospitals);

/**
 * @route   GET /api/hospitals/admin/pending-verifications
 * @desc    Get pending verifications
 * @access  Private (Admin)
 */
router.get(
  '/admin/pending-verifications',
  authenticate,
  checkRole(['admin']),
  hospitalController.getPendingVerifications
);

/**
 * @route   GET /api/hospitals/admin/expiring-licenses
 * @desc    Get expiring licenses
 * @access  Private (Admin)
 */
router.get(
  '/admin/expiring-licenses',
  authenticate,
  checkRole(['admin']),
  hospitalController.getExpiringLicenses
);

/**
 * @route   PUT /api/hospitals/:hospitalId/verification
 * @desc    Update verification status
 * @access  Private (Admin)
 */
router.put(
  '/:hospitalId/verification',
  authenticate,
  checkRole(['admin']),
  validate(updateVerificationStatusSchema),
  hospitalController.updateVerificationStatus
);

/**
 * @route   POST /api/hospitals/:hospitalId/rating
 * @desc    Update hospital rating
 * @access  Private (Patient)
 */
router.post(
  '/:hospitalId/rating',
  authenticate,
  checkRole(['patient']),
  validate(updateRatingSchema),
  hospitalController.updateRating
);

/**
 * @route   GET /api/hospitals/:hospitalId
 * @desc    Get hospital by ID
 * @access  Public
 */
router.get('/:hospitalId', hospitalController.getHospitalById);

export default router;
