import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/rbac.js';
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
  checkRole(['patient']),
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
router.get('/history', authenticate, checkRole(['patient']), paymentController.getPaymentHistory);

/**
 * @route   GET /api/payments/provider
 * @desc    Get provider payments
 * @access  Private (Doctor, Pharmacy, Hospital)
 */
router.get(
  '/provider',
  authenticate,
  checkRole(['doctor', 'pharmacy', 'hospital']),
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
  checkRole(['doctor', 'pharmacy', 'hospital']),
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
  checkRole(['doctor', 'pharmacy', 'hospital']),
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
  checkRole(['admin']),
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
  checkRole(['doctor', 'pharmacy', 'hospital', 'admin']),
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
  checkRole(['admin']),
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
  checkRole(['admin']),
  validate(rejectStatementSchema),
  paymentController.rejectStatement
);

/**
 * @route   GET /api/payments/revenue
 * @desc    Calculate revenue
 * @access  Private (Admin)
 */
router.get('/revenue', authenticate, checkRole(['admin']), paymentController.calculateRevenue);

/**
 * @route   GET /api/payments/analytics
 * @desc    Get payment analytics
 * @access  Private (Admin)
 */
router.get('/analytics', authenticate, checkRole(['admin']), paymentController.getAnalytics);

/**
 * @route   POST /api/payments/patient-payment
 * @desc    Record patient payment
 * @access  Private (Admin)
 */
router.post(
  '/patient-payment',
  authenticate,
  checkRole(['admin']),
  validate(recordPatientPaymentSchema),
  paymentController.recordPatientPayment
);

/**
 * @route   GET /api/payments/overdue
 * @desc    Get overdue payments
 * @access  Private (Admin)
 */
router.get('/overdue', authenticate, checkRole(['admin']), paymentController.getOverduePayments);

/**
 * @route   POST /api/payments/:paymentId/refund
 * @desc    Process refund
 * @access  Private (Admin)
 */
router.post(
  '/:paymentId/refund',
  authenticate,
  checkRole(['admin']),
  validate(processRefundSchema),
  paymentController.processRefund
);

export default router;
