import express from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  updateDoctorProfileSchema,
  updateLicenseSchema,
  createConsultationSchema,
  updateConsultationSchema,
  createPrescriptionSchema,
  updateVerificationStatusSchema,
  updateRatingSchema,
} from '../validation/providerSchemas.js';

const router = express.Router();

/**
 * @route   GET /api/doctors/profile
 * @desc    Get doctor profile
 * @access  Private (Doctor)
 */
router.get('/profile', authenticate, checkRole(['doctor']), doctorController.getProfile);

/**
 * @route   PUT /api/doctors/profile
 * @desc    Update doctor profile
 * @access  Private (Doctor)
 */
router.put(
  '/profile',
  authenticate,
  checkRole(['doctor']),
  validate(updateDoctorProfileSchema),
  doctorController.updateProfile
);

/**
 * @route   PUT /api/doctors/license
 * @desc    Update license
 * @access  Private (Doctor)
 */
router.put(
  '/license',
  authenticate,
  checkRole(['doctor']),
  validate(updateLicenseSchema),
  doctorController.updateLicense
);

/**
 * @route   GET /api/doctors/consultations
 * @desc    Get consultations
 * @access  Private (Doctor)
 */
router.get('/consultations', authenticate, checkRole(['doctor']), doctorController.getConsultations);

/**
 * @route   POST /api/doctors/consultations
 * @desc    Create consultation
 * @access  Private (Doctor)
 */
router.post(
  '/consultations',
  authenticate,
  checkRole(['doctor']),
  validate(createConsultationSchema),
  doctorController.createConsultation
);

/**
 * @route   PUT /api/doctors/consultations/:consultationId
 * @desc    Update consultation
 * @access  Private (Doctor)
 */
router.put(
  '/consultations/:consultationId',
  authenticate,
  checkRole(['doctor']),
  validate(updateConsultationSchema),
  doctorController.updateConsultation
);

/**
 * @route   POST /api/doctors/prescriptions
 * @desc    Create prescription
 * @access  Private (Doctor)
 */
router.post(
  '/prescriptions',
  authenticate,
  checkRole(['doctor']),
  validate(createPrescriptionSchema),
  doctorController.createPrescription
);

/**
 * @route   GET /api/doctors/statistics
 * @desc    Get statistics
 * @access  Private (Doctor)
 */
router.get('/statistics', authenticate, checkRole(['doctor']), doctorController.getStatistics);

/**
 * @route   GET /api/doctors/specializations
 * @desc    Get all specializations
 * @access  Public
 */
router.get('/specializations', doctorController.getAllSpecializations);

/**
 * @route   GET /api/doctors/search
 * @desc    Search doctors
 * @access  Public
 */
router.get('/search', doctorController.searchDoctors);

/**
 * @route   GET /api/doctors/specialization/:specialization
 * @desc    Get doctors by specialization
 * @access  Public
 */
router.get('/specialization/:specialization', doctorController.getDoctorsBySpecialization);

/**
 * @route   GET /api/doctors/top-rated
 * @desc    Get top-rated doctors
 * @access  Public
 */
router.get('/top-rated', doctorController.getTopRatedDoctors);

/**
 * @route   GET /api/doctors/admin/pending-verifications
 * @desc    Get pending verifications
 * @access  Private (Admin)
 */
router.get(
  '/admin/pending-verifications',
  authenticate,
  checkRole(['admin']),
  doctorController.getPendingVerifications
);

/**
 * @route   GET /api/doctors/admin/expiring-licenses
 * @desc    Get expiring licenses
 * @access  Private (Admin)
 */
router.get(
  '/admin/expiring-licenses',
  authenticate,
  checkRole(['admin']),
  doctorController.getExpiringLicenses
);

/**
 * @route   PUT /api/doctors/:doctorId/verification
 * @desc    Update verification status
 * @access  Private (Admin)
 */
router.put(
  '/:doctorId/verification',
  authenticate,
  checkRole(['admin']),
  validate(updateVerificationStatusSchema),
  doctorController.updateVerificationStatus
);

/**
 * @route   POST /api/doctors/:doctorId/rating
 * @desc    Update doctor rating
 * @access  Private (Patient)
 */
router.post(
  '/:doctorId/rating',
  authenticate,
  checkRole(['patient']),
  validate(updateRatingSchema),
  doctorController.updateRating
);

/**
 * @route   GET /api/doctors/:doctorId
 * @desc    Get doctor by ID
 * @access  Public
 */
router.get('/:doctorId', doctorController.getDoctorById);

export default router;
