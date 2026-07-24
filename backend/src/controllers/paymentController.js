import * as paymentService from '../services/paymentService.js';
import { successResponse } from '../utils/response.js';
import paystack from '../utils/paystack.js';
import logger from '../utils/logger.js';

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
    // Extract idempotency key from header (client generates a UUID per payment attempt)
    const idempotencyKey = req.headers['x-idempotency-key'] || null;

    const result = await paymentService.initializePayment(userId, {
      ...req.body,
      idempotencyKey,
    });

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

    // Verify Paystack HMAC signature — fail closed: missing header is as bad as wrong header
    if (gateway === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
      const signature = req.headers['x-paystack-signature'];
      const rawBody = req.rawBody || JSON.stringify(req.body);
      if (!signature || !paystack.verifyWebhookSignature(rawBody, signature)) {
        logger.warn('Invalid or missing Paystack webhook signature');
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }
    }

    const result = await paymentService.handleWebhook({
      gateway,
      event: req.body.event || req.body.type,
      payload: req.body,
      eventId: req.body.data?.id ? String(req.body.data.id) : null,
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
 * Get provider payments — resolves the caller's user_id to their profile id
 * (doctors.id / pharmacies.id / hospitals.id) which is what payment_records.provider_id stores.
 * GET /api/payments/provider
 */
export const getProviderPayments = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const role   = req.user.role;
    const { limit, offset, status, startDate, endDate } = req.query;

    const { default: database } = await import('../database/connection.js');

    // Resolve profile id
    let profileId = null;
    if (role === 'doctor') {
      const r = await database.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
      profileId = r.rows[0]?.id;
    } else if (role === 'pharmacy') {
      const r = await database.query('SELECT id FROM pharmacies WHERE user_id = $1', [userId]);
      profileId = r.rows[0]?.id;
    } else if (role === 'hospital') {
      const r = await database.query('SELECT id FROM hospitals WHERE user_id = $1', [userId]);
      profileId = r.rows[0]?.id;
    }

    if (!profileId) {
      return successResponse(res, [], 'No provider profile found');
    }

    const payments = await paymentService.getProviderPayments(profileId, {
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
 * Download statement as PDF
 * GET /api/payments/statements/:statementId/download
 */
export const downloadStatement = async (req, res, next) => {
  try {
    const { statementId } = req.params;

    const pdfBuffer = await paymentService.generateStatementPdf(statementId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="statement-${statementId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
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
 * Provider monthly payments — groups completed payment_records by YYYY-MM
 * GET /api/payments/provider/monthly
 */
export const getProviderMonthly = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const role   = req.user.role;
    const { default: database } = await import('../database/connection.js');

    // Resolve profile id
    let profileId = null;
    if (role === 'doctor') {
      const r = await database.query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
      profileId = r.rows[0]?.id;
    } else if (role === 'pharmacy') {
      const r = await database.query('SELECT id FROM pharmacies WHERE user_id = $1', [userId]);
      profileId = r.rows[0]?.id;
    } else if (role === 'hospital') {
      const r = await database.query('SELECT id FROM hospitals WHERE user_id = $1', [userId]);
      profileId = r.rows[0]?.id;
    }

    if (!profileId) return successResponse(res, { months: [] }, 'No provider profile');

    const result = await database.query(
      `SELECT
         pr.id, pr.amount, pr.payment_type, pr.payment_reference,
         pr.status, pr.description, pr.created_at,
         SUBSTR(pr.created_at, 1, 7) AS month_key,
         pu.first_name AS patient_first_name,
         pu.last_name  AS patient_last_name,
         pu.lifeline_id AS patient_lifeline_id
       FROM payment_records pr
       LEFT JOIN patients  pat ON pr.patient_id = pat.id
       LEFT JOIN users     pu  ON pat.user_id   = pu.id
       WHERE pr.provider_id = $1
         AND (pr.status = 'completed' OR pr.status = 'success')
       ORDER BY pr.created_at DESC`,
      [profileId]
    );

    const bucketMap = new Map();
    for (const row of result.rows) {
      const key = row.month_key || 'unknown';
      if (!bucketMap.has(key)) {
        const [y, m] = key.split('-');
        const label = y && m
          ? new Date(parseInt(y), parseInt(m) - 1, 1)
              .toLocaleString('en-NG', { month: 'long', year: 'numeric' })
          : key;
        bucketMap.set(key, { monthKey: key, label, services: [], totals: { count: 0, total: 0 } });
      }
      const b = bucketMap.get(key);
      b.services.push(row);
      b.totals.count += 1;
      b.totals.total += parseFloat(row.amount || 0);
    }

    const months = Array.from(bucketMap.values());
    return successResponse(res, { months, totalServices: result.rows.length }, 'Provider monthly services retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Patient monthly consumption — groups their completed service charges by YYYY-MM
 * GET /api/payments/patient/monthly
 */
export const getPatientMonthly = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { default: database } = await import('../database/connection.js');

    const patResult = await database.query(
      'SELECT id FROM patients WHERE user_id = $1', [userId]
    );
    const patientId = patResult.rows[0]?.id;
    if (!patientId) return successResponse(res, { months: [] }, 'No patient profile');

    const result = await database.query(
      `SELECT
         pr.id, pr.amount, pr.payment_type, pr.payment_reference,
         pr.status, pr.provider_type, pr.description, pr.created_at,
         SUBSTR(pr.created_at, 1, 7) AS month_key,
         CASE
           WHEN pr.provider_type = 'doctor'   THEN du.first_name || ' ' || du.last_name
           WHEN pr.provider_type = 'pharmacy' THEN ph.pharmacy_name
           WHEN pr.provider_type = 'hospital' THEN ho.hospital_name
           ELSE NULL
         END AS provider_name
       FROM payment_records pr
       LEFT JOIN doctors   doc ON pr.provider_id = doc.id AND pr.provider_type = 'doctor'
       LEFT JOIN users     du  ON doc.user_id = du.id
       LEFT JOIN pharmacies ph ON pr.provider_id = ph.id  AND pr.provider_type = 'pharmacy'
       LEFT JOIN hospitals  ho ON pr.provider_id = ho.id  AND pr.provider_type = 'hospital'
       WHERE pr.patient_id = $1
         AND pr.payment_type != 'subscription'
         AND (pr.status = 'completed' OR pr.status = 'success')
       ORDER BY pr.created_at DESC`,
      [patientId]
    );

    const bucketMap = new Map();
    for (const row of result.rows) {
      const key = row.month_key || 'unknown';
      if (!bucketMap.has(key)) {
        const [y, m] = key.split('-');
        const label = y && m
          ? new Date(parseInt(y), parseInt(m) - 1, 1)
              .toLocaleString('en-NG', { month: 'long', year: 'numeric' })
          : key;
        bucketMap.set(key, { monthKey: key, label, services: [], totals: { count: 0, total: 0 } });
      }
      const b = bucketMap.get(key);
      b.services.push(row);
      b.totals.count += 1;
      b.totals.total += parseFloat(row.amount || 0);
    }

    const months = Array.from(bucketMap.values());
    return successResponse(res, { months, totalServices: result.rows.length }, 'Patient monthly consumption retrieved');
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
  downloadStatement,
  approveStatement,
  rejectStatement,
  getPendingStatements,
  calculateRevenue,
  getAnalytics,
  recordPatientPayment,
  getOverduePayments,
  processRefund,
};
