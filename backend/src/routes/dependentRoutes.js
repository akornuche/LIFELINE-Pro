import express from 'express';
import * as dependentController from '../controllers/dependentController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { 
  createDependentSchema,
  updateDependentSchema 
} from '../validation/dependentSchemas.js';

const router = express.Router();

/**
 * @route   GET /api/dependents
 * @desc    Get all dependents for authenticated patient
 * @access  Private (Patient)
 */
router.get('/', authenticate, dependentController.getDependents);

/**
 * @route   GET /api/dependents/:id
 * @desc    Get dependent by ID
 * @access  Private (Patient/Admin)
 */
router.get('/:id', authenticate, dependentController.getDependentById);

/**
 * @route   POST /api/dependents
 * @desc    Add a new dependent (max 4 per patient)
 * @access  Private (Patient)
 */
router.post(
  '/',
  authenticate,
  validate(createDependentSchema),
  dependentController.createDependent
);

/**
 * @route   PATCH /api/dependents/:id
 * @desc    Update dependent information
 * @access  Private (Patient)
 */
router.patch(
  '/:id',
  authenticate,
  validate(updateDependentSchema),
  dependentController.updateDependent
);

/**
 * @route   DELETE /api/dependents/:id
 * @desc    Remove a dependent
 * @access  Private (Patient)
 */
router.delete('/:id', authenticate, dependentController.deleteDependent);

/**
 * @route   GET /api/dependents/:id/medical-records
 * @desc    Get medical records for a dependent
 * @access  Private (Patient/Doctor)
 */
router.get('/:id/medical-records', authenticate, dependentController.getDependentMedicalRecords);

/**
 * @route   POST /api/dependents/:id/upload-document
 * @desc    Upload identification document for dependent
 * @access  Private (Patient)
 */
router.post('/:id/upload-document', authenticate, dependentController.uploadDocument);

export default router;
