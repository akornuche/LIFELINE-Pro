import express from 'express';
import * as pharmacyController from '../controllers/pharmacyController.js';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  updatePharmacyProfileSchema,
  updateLicenseSchema,
  dispensePrescriptionSchema,
  updateVerificationStatusSchema,
  updateRatingSchema,
} from '../validation/providerSchemas.js';

const router = express.Router();

/**
 * @route   GET /api/pharmacies/profile
 * @desc    Get pharmacy profile
 * @access  Private (Pharmacy)
 */
router.get('/profile', authenticate, checkRole(['pharmacy']), pharmacyController.getProfile);

/**
 * @route   PUT /api/pharmacies/profile
 * @desc    Update pharmacy profile
 * @access  Private (Pharmacy)
 */
router.put(
  '/profile',
  authenticate,
  checkRole(['pharmacy']),
  validate(updatePharmacyProfileSchema),
  pharmacyController.updateProfile
);

/**
 * @route   PUT /api/pharmacies/license
 * @desc    Update license
 * @access  Private (Pharmacy)
 */
router.put(
  '/license',
  authenticate,
  checkRole(['pharmacy']),
  validate(updateLicenseSchema),
  pharmacyController.updateLicense
);

/**
 * @route   GET /api/pharmacies/prescriptions
 * @desc    Get prescriptions
 * @access  Private (Pharmacy)
 */
router.get(
  '/prescriptions',
  authenticate,
  checkRole(['pharmacy']),
  pharmacyController.getPrescriptions
);

/**
 * @route   POST /api/pharmacies/prescriptions/:prescriptionId/dispense
 * @desc    Dispense prescription
 * @access  Private (Pharmacy)
 */
router.post(
  '/prescriptions/:prescriptionId/dispense',
  authenticate,
  checkRole(['pharmacy']),
  validate(dispensePrescriptionSchema),
  pharmacyController.dispensePrescription
);

/**
 * @route   GET /api/pharmacies/prescriptions/:prescriptionId/verify
 * @desc    Verify prescription
 * @access  Private (Pharmacy)
 */
router.get(
  '/prescriptions/:prescriptionId/verify',
  authenticate,
  checkRole(['pharmacy']),
  pharmacyController.verifyPrescription
);

/**
 * @route   GET /api/pharmacies/prescriptions/:prescriptionId/eligibility
 * @desc    Check prescription eligibility
 * @access  Private (Pharmacy)
 */
router.get(
  '/prescriptions/:prescriptionId/eligibility',
  authenticate,
  checkRole(['pharmacy']),
  pharmacyController.checkPrescriptionEligibility
);

/**
 * @route   GET /api/pharmacies/statistics
 * @desc    Get statistics
 * @access  Private (Pharmacy)
 */
router.get('/statistics', authenticate, checkRole(['pharmacy']), pharmacyController.getStatistics);

/**
 * @route   GET /api/pharmacies/search
 * @desc    Search pharmacies
 * @access  Public
 */
router.get('/search', pharmacyController.searchPharmacies);

/**
 * @route   GET /api/pharmacies/location
 * @desc    Find pharmacies by location
 * @access  Public
 */
router.get('/location', pharmacyController.findPharmaciesByLocation);

/**
 * @route   GET /api/pharmacies/with-delivery
 * @desc    Get pharmacies with delivery
 * @access  Public
 */
router.get('/with-delivery', pharmacyController.getPharmaciesWithDelivery);

/**
 * @route   GET /api/pharmacies/top-rated
 * @desc    Get top-rated pharmacies
 * @access  Public
 */
router.get('/top-rated', pharmacyController.getTopRatedPharmacies);

/**
 * @route   GET /api/pharmacies/admin/pending-verifications
 * @desc    Get pending verifications
 * @access  Private (Admin)
 */
router.get(
  '/admin/pending-verifications',
  authenticate,
  checkRole(['admin']),
  pharmacyController.getPendingVerifications
);

/**
 * @route   GET /api/pharmacies/admin/expiring-licenses
 * @desc    Get expiring licenses
 * @access  Private (Admin)
 */
router.get(
  '/admin/expiring-licenses',
  authenticate,
  checkRole(['admin']),
  pharmacyController.getExpiringLicenses
);

/**
 * @route   PUT /api/pharmacies/:pharmacyId/verification
 * @desc    Update verification status
 * @access  Private (Admin)
 */
router.put(
  '/:pharmacyId/verification',
  authenticate,
  checkRole(['admin']),
  validate(updateVerificationStatusSchema),
  pharmacyController.updateVerificationStatus
);

/**
 * @route   POST /api/pharmacies/:pharmacyId/rating
 * @desc    Update pharmacy rating
 * @access  Private (Patient)
 */
router.post(
  '/:pharmacyId/rating',
  authenticate,
  checkRole(['patient']),
  validate(updateRatingSchema),
  pharmacyController.updateRating
);

/**
 * @route   GET /api/pharmacies/:pharmacyId
 * @desc    Get pharmacy by ID
 * @access  Public
 */
router.get('/:pharmacyId', pharmacyController.getPharmacyById);

export default router;
