import * as paymentService from '../services/paymentService.js';
import { successResponse } from '../utils/response.js';

/**
 * Payment Controller
 * HTTP request handlers for payment operations
 */

/**
 * Initialize payment
 * POST /api/payments/initialize
 */
export const initializePayment = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await paymentService.initializePayment(userId, req.body);

    return successResponse(res, result, 'Payment initialized successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify payment
 * GET /api/payments/verify/:reference
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const result = await paymentService.verifyPayment(reference);

    return successResponse(res, result, 'Payment verification completed');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle payment webhook
 * POST /api/payments/webhook/:gateway
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const { gateway } = req.params;

    const result = await paymentService.handleWebhook({
      gateway,
      event: req.body.event || req.body.type,
      payload: req.body,
    });

    return successResponse(res, result, 'Webhook processed');
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history
 * GET /api/payments/history
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit, offset, status, paymentType } = req.query;

    const payments = await paymentService.getPaymentHistory(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status,
      paymentType,
    });

    return successResponse(res, payments, 'Payment history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get provider payments
 * GET /api/payments/provider
 */
export const getProviderPayments = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit, offset, status, startDate, endDate } = req.query;

    const payments = await paymentService.getProviderPayments(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status,
      startDate,
      endDate,
    });

    return successResponse(res, payments, 'Provider payments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Generate monthly statement
 * POST /api/payments/statements/generate
 */
export const generateStatement = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { providerType, month, year } = req.body;

    const statement = await paymentService.generateMonthlyStatement(
      userId,
      providerType,
      month,
      year
    );

    return successResponse(res, statement, 'Statement generated successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get provider statements
 * GET /api/payments/statements
 */
export const getStatements = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit, offset, status } = req.query;

    const statements = await paymentService.getProviderStatements(userId, {
      limit: parseInt(limit) || 12,
      offset: parseInt(offset) || 0,
      status,
    });

    return successResponse(res, statements, 'Statements retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get statement by ID
 * GET /api/payments/statements/:statementId
 */
export const getStatementById = async (req, res, next) => {
  try {
    const { statementId } = req.params;

    const statement = await paymentService.getStatementById(statementId);

    return successResponse(res, statement, 'Statement retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Approve statement (admin only)
 * POST /api/payments/statements/:statementId/approve
 */
export const approveStatement = async (req, res, next) => {
  try {
    const { statementId } = req.params;
    const approvedBy = req.user.userId;
    const { notes } = req.body;

    const statement = await paymentService.approveStatement(statementId, approvedBy, notes);

    return successResponse(res, statement, 'Statement approved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject statement (admin only)
 * POST /api/payments/statements/:statementId/reject
 */
export const rejectStatement = async (req, res, next) => {
  try {
    const { statementId } = req.params;
    const rejectedBy = req.user.userId;
    const { notes } = req.body;

    const statement = await paymentService.rejectStatement(statementId, rejectedBy, notes);

    return successResponse(res, statement, 'Statement rejected');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending statements (admin only)
 * GET /api/payments/statements/pending
 */
export const getPendingStatements = async (req, res, next) => {
  try {
    const { limit, offset, providerType } = req.query;

    const statements = await paymentService.getPendingStatements({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      providerType,
    });

    return successResponse(res, statements, 'Pending statements retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate revenue (admin only)
 * GET /api/payments/revenue
 */
export const calculateRevenue = async (req, res, next) => {
  try {
    const { providerId, startDate, endDate, status } = req.query;

    const revenue = await paymentService.calculateRevenue({
      providerId,
      startDate,
      endDate,
      status: status || 'completed',
    });

    return successResponse(res, revenue, 'Revenue calculated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment analytics (admin only)
 * GET /api/payments/analytics
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, providerType, paymentType } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const analytics = await paymentService.getPaymentAnalytics(startDate, endDate, {
      providerType,
      paymentType,
    });

    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Record patient payment (admin only)
 * POST /api/payments/patient-payment
 */
export const recordPatientPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.recordPatientPayment(req.body);

    return successResponse(res, payment, 'Patient payment recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue payments (admin only)
 * GET /api/payments/overdue
 */
export const getOverduePayments = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const payments = await paymentService.getOverduePayments({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    return successResponse(res, payments, 'Overdue payments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund (admin only)
 * POST /api/payments/:paymentId/refund
 */
export const processRefund = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const result = await paymentService.processRefund(paymentId, {
      amount,
      reason,
    });

    return successResponse(res, result, 'Refund processed successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getProviderPayments,
  generateStatement,
  getStatements,
  getStatementById,
  approveStatement,
  rejectStatement,
  getPendingStatements,
  calculateRevenue,
  getAnalytics,
  recordPatientPayment,
  getOverduePayments,
  processRefund,
};
