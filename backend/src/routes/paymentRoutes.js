import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { isPatient, isProvider, isAdmin, isAdminOrProvider } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  initializePaymentSchema,
  generateStatementSchema,
  approveStatementSchema,
  rejectStatementSchema,
  recordPatientPaymentSchema,
  processRefundSchema,
} from '../validation/paymentSchemas.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/payments/initialize
 * @desc    Initialize payment
 * @access  Private (Patient)
 */
router.post(
  '/initialize',
  authenticate,
  isPatient,
  paymentLimiter,
  validate(initializePaymentSchema),
  paymentController.initializePayment
);

/**
 * @route   GET /api/payments/verify/:reference
 * @desc    Verify payment
 * @access  Public
 */
router.get('/verify/:reference', paymentController.verifyPayment);

/**
 * @route   POST /api/payments/webhook/:gateway
 * @desc    Handle payment webhook
 * @access  Public (Payment Gateway)
 */
router.post('/webhook/:gateway', paymentController.handleWebhook);

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history
 * @access  Private (Patient)
 */
router.get('/history', authenticate, isPatient, paymentController.getPaymentHistory);

/**
 * @route   GET /api/payments/provider
 * @desc    Get provider payments
 * @access  Private (Doctor, Pharmacy, Hospital)
 */
router.get(
  '/provider',
  authenticate,
  isProvider,
  paymentController.getProviderPayments
);

/**
 * @route   POST /api/payments/statements/generate
 * @desc    Generate monthly statement
 * @access  Private (Doctor, Pharmacy, Hospital)
 */
router.post(
  '/statements/generate',
  authenticate,
  isProvider,
  validate(generateStatementSchema),
  paymentController.generateStatement
);

/**
 * @route   GET /api/payments/statements
 * @desc    Get provider statements
 * @access  Private (Doctor, Pharmacy, Hospital)
 */
router.get(
  '/statements',
  authenticate,
  isProvider,
  paymentController.getStatements
);

/**
 * @route   GET /api/payments/statements/pending
 * @desc    Get pending statements
 * @access  Private (Admin)
 */
router.get(
  '/statements/pending',
  authenticate,
  isAdmin,
  paymentController.getPendingStatements
);

/**
 * @route   GET /api/payments/statements/:statementId
 * @desc    Get statement by ID
 * @access  Private (Provider, Admin)
 */
router.get(
  '/statements/:statementId',
  authenticate,
  isAdminOrProvider,
  paymentController.getStatementById
);

/**
 * @route   POST /api/payments/statements/:statementId/approve
 * @desc    Approve statement
 * @access  Private (Admin)
 */
router.post(
  '/statements/:statementId/approve',
  authenticate,
  isAdmin,
  validate(approveStatementSchema),
  paymentController.approveStatement
);

/**
 * @route   POST /api/payments/statements/:statementId/reject
 * @desc    Reject statement
 * @access  Private (Admin)
 */
router.post(
  '/statements/:statementId/reject',
  authenticate,
  isAdmin,
  validate(rejectStatementSchema),
  paymentController.rejectStatement
);

/**
 * @route   GET /api/payments/revenue
 * @desc    Calculate revenue
 * @access  Private (Admin)
 */
router.get('/revenue', authenticate, isAdmin, paymentController.calculateRevenue);

/**
 * @route   GET /api/payments/analytics
 * @desc    Get payment analytics
 * @access  Private (Admin)
 */
router.get('/analytics', authenticate, isAdmin, paymentController.getAnalytics);

/**
 * @route   POST /api/payments/patient-payment
 * @desc    Record patient payment
 * @access  Private (Admin)
 */
router.post(
  '/patient-payment',
  authenticate,
  isAdmin,
  validate(recordPatientPaymentSchema),
  paymentController.recordPatientPayment
);

/**
 * @route   GET /api/payments/overdue
 * @desc    Get overdue payments
 * @access  Private (Admin)
 */
router.get('/overdue', authenticate, isAdmin, paymentController.getOverduePayments);

/**
 * @route   POST /api/payments/:paymentId/refund
 * @desc    Process refund
 * @access  Private (Admin)
 */
router.post(
  '/:paymentId/refund',
  authenticate,
  isAdmin,
  validate(processRefundSchema),
  paymentController.processRefund
);

export default router;
