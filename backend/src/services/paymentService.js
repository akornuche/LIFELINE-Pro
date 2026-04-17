import * as paymentRepository from '../models/paymentRepository.js';
import * as patientRepository from '../models/patientRepository.js';
import * as pricingRepository from '../models/pricingRepository.js';
import * as userRepository from '../models/userRepository.js';
import * as doctorRepository from '../models/doctorRepository.js';
import * as pharmacyRepository from '../models/pharmacyRepository.js';
import * as hospitalRepository from '../models/hospitalRepository.js';
import PDFDocument from 'pdfkit';
import paystack from '../utils/paystack.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, NotFoundError } from '../middleware/errorHandler.js';

const getProviderIdByUserId = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User');

  if (user.role === 'doctor') {
    const doc = await doctorRepository.findByUserId(userId);
    return doc.id;
  } else if (user.role === 'pharmacy') {
    const pharm = await pharmacyRepository.findByUserId(userId);
    return pharm.id;
  } else if (user.role === 'hospital') {
    const hosp = await hospitalRepository.findByUserId(userId);
    return hosp.id;
  }
  throw new BusinessLogicError('User is not a valid provider');
};

/**
 * Payment Service
 * Business logic for payment processing and provider compensation
 */

/**
 * Initialize payment
 */
export const initializePayment = async (userId, paymentData) => {
  const { amount, paymentMethod, paymentType, description, metadata = null } = paymentData;

  try {
    // Get patient
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    // Generate payment reference
    const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create payment record
    const payment = await paymentRepository.createPayment({
      patientId: patient.id,
      amount,
      paymentMethod,
      paymentType,
      paymentReference,
      description,
      metadata,
      status: 'pending',
    });

    logger.info('Payment initialized', {
      userId,
      patientId: patient.id,
      paymentId: payment.id,
      amount,
      paymentType,
    });

    // Initialize with Paystack gateway (returns mock when not enabled)
    const user = await userRepository.findById(userId);
    const gatewayResponse = await paystack.initializeTransaction({
      email: user.email,
      amount,
      reference: paymentReference,
      metadata: { paymentId: payment.id, patientId: patient.id, paymentType },
    });

    return {
      payment,
      paymentReference,
      authorizationUrl: gatewayResponse.authorization_url,
      accessCode: gatewayResponse.access_code,
    };
  } catch (error) {
    logger.error('Initialize payment error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Verify payment
 */
export const verifyPayment = async (paymentReference) => {
  try {
    const payment = await paymentRepository.findPaymentByReference(paymentReference);

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    // Verify with Paystack gateway (returns mock success when not enabled)
    const gatewayVerification = await paystack.verifyTransaction(paymentReference);

    const verified = gatewayVerification.status === 'success';

    if (verified) {
      await paymentRepository.updatePaymentStatus(payment.id, 'completed', {
        gatewayResponse: gatewayVerification,
      });

      logger.info('Payment verified successfully', {
        paymentId: payment.id,
        paymentReference,
      });

      return {
        status: 'success',
        payment,
      };
    } else {
      await paymentRepository.updatePaymentStatus(payment.id, 'failed', {
        gatewayResponse: gatewayVerification,
      });

      logger.warn('Payment verification failed', {
        paymentId: payment.id,
        paymentReference,
      });

      return {
        status: 'failed',
        payment,
      };
    }
  } catch (error) {
    logger.error('Verify payment error', {
      error: error.message,
      paymentReference,
    });
    throw error;
  }
};

/**
 * Process service payment
 */
export const processServicePayment = async (serviceData) => {
  const { patientId, providerId, providerType, serviceType, packageType } = serviceData;

  try {
    // Get pricing for service
    const pricing = await pricingRepository.getSpecificPricing(serviceType, packageType);

    // Create payment record
    const paymentReference = `SVC_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

    const payment = await paymentRepository.createPayment({
      patientId,
      providerId,
      providerType,
      amount: pricing.patient_price,
      paymentMethod: 'subscription',
      paymentType: serviceType,
      paymentReference,
      description: `${serviceType} service - ${packageType} package`,
      status: 'completed', // Auto-complete for subscription-based payments
    });

    logger.info('Service payment processed', {
      patientId,
      providerId,
      providerType,
      serviceType,
      amount: pricing.patient_price,
    });

    return {
      payment,
      pricing: {
        patientPrice: pricing.patient_price,
        providerShare: pricing.provider_share,
        platformFee: pricing.platform_fee,
      },
    };
  } catch (error) {
    logger.error('Process service payment error', {
      error: error.message,
      serviceData,
    });
    throw error;
  }
};

/**
 * Handle payment webhook
 */
export const handleWebhook = async (webhookData) => {
  const { gateway, event, payload, eventId = null } = webhookData;

  try {
    // Log webhook
    const webhook = await paymentRepository.createWebhookLog({
      gateway,
      event,
      payload,
      processingStatus: 'pending',
      eventId,
    });

    // Process based on event type
    if (event === 'charge.success' || event === 'payment.success') {
      const paymentReference = payload.reference || payload.tx_ref;

      if (paymentReference) {
        const payment = await paymentRepository.findPaymentByReference(paymentReference);

        if (payment) {
          await paymentRepository.updatePaymentStatus(payment.id, 'completed', payload);

          await paymentRepository.updateWebhookStatus(webhook.id, 'processed');

          logger.info('Webhook processed successfully', {
            webhookId: webhook.id,
            paymentReference,
          });

          return { status: 'processed', payment };
        }
      }
    }

    // Mark as processed if no action needed
    await paymentRepository.updateWebhookStatus(webhook.id, 'processed');

    return { status: 'processed' };
  } catch (error) {
    logger.error('Webhook processing error', {
      error: error.message,
      gateway,
      event,
    });

    // Update webhook status
    if (webhookData.webhookId) {
      await paymentRepository.updateWebhookStatus(webhookData.webhookId, 'failed', error.message);
    }

    throw error;
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (userId, options = {}) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError('Patient profile');
    }

    const payments = await paymentRepository.getPatientPayments(patient.id, options);

    return payments;
  } catch (error) {
    logger.error('Get payment history error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get provider payments
 */
export const getProviderPayments = async (userId, options = {}) => {
  try {
    const providerId = await getProviderIdByUserId(userId);
    const payments = await paymentRepository.getProviderPayments(providerId, options);

    return payments;
  } catch (error) {
    logger.error('Get provider payments error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Generate monthly statement
 */
export const generateMonthlyStatement = async (userId, providerType, month, year) => {
  try {
    const providerId = await getProviderIdByUserId(userId);

    // Check if statement already exists
    const existingStatements = await paymentRepository.getProviderStatements(providerId, {
      limit: 1,
    });

    const exists = existingStatements.some(
      (s) => s.month === month && s.year === year && s.provider_id === providerId
    );

    if (exists) {
      throw new BusinessLogicError('Statement already exists for this period');
    }

    // Generate statement
    const statement = await paymentRepository.generateStatement(
      providerId,
      providerType,
      month,
      year
    );

    logger.info('Monthly statement generated', {
      providerId,
      month,
      year,
      statementId: statement.id,
    });

    return statement;
  } catch (error) {
    logger.error('Generate monthly statement error', {
      error: error.message,
      providerId,
      month,
      year,
    });
    throw error;
  }
};

/**
 * Get provider statements
 */
export const getProviderStatements = async (userId, options = {}) => {
  try {
    const providerId = await getProviderIdByUserId(userId);
    const statements = await paymentRepository.getProviderStatements(providerId, options);

    return statements;
  } catch (error) {
    logger.error('Get provider statements error', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get statement by ID
 */
export const getStatementById = async (statementId) => {
  try {
    const statement = await paymentRepository.findStatementById(statementId);

    if (!statement) {
      throw new NotFoundError('Statement');
    }

    return statement;
  } catch (error) {
    logger.error('Get statement by ID error', {
      error: error.message,
      statementId,
    });
    throw error;
  }
};

/**
 * Approve statement (admin only)
 */
export const approveStatement = async (statementId, approvedBy, notes = null) => {
  try {
    const statement = await paymentRepository.updateStatementStatus(
      statementId,
      'approved',
      approvedBy,
      notes
    );

    logger.info('Statement approved', {
      statementId,
      approvedBy,
    });

    // TODO: Trigger payout process to provider
    // await payoutService.processProviderPayout(statement);

    return statement;
  } catch (error) {
    logger.error('Approve statement error', {
      error: error.message,
      statementId,
    });
    throw error;
  }
};

/**
 * Reject statement (admin only)
 */
export const rejectStatement = async (statementId, rejectedBy, notes) => {
  try {
    const statement = await paymentRepository.updateStatementStatus(
      statementId,
      'rejected',
      rejectedBy,
      notes
    );

    logger.info('Statement rejected', {
      statementId,
      rejectedBy,
      notes,
    });

    return statement;
  } catch (error) {
    logger.error('Reject statement error', {
      error: error.message,
      statementId,
    });
    throw error;
  }
};

/**
 * Get pending statements (admin only)
 */
export const getPendingStatements = async (options = {}) => {
  try {
    const statements = await paymentRepository.getPendingStatements(options);

    return statements;
  } catch (error) {
    logger.error('Get pending statements error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Calculate revenue
 */
export const calculateRevenue = async (filters = {}) => {
  try {
    const revenue = await paymentRepository.calculateRevenue(filters);

    return revenue;
  } catch (error) {
    logger.error('Calculate revenue error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get payment analytics
 */
export const getPaymentAnalytics = async (startDate, endDate, filters = {}) => {
  try {
    const analytics = await paymentRepository.getPaymentAnalytics(startDate, endDate, filters);

    return analytics;
  } catch (error) {
    logger.error('Get payment analytics error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Record patient payment
 */
export const recordPatientPayment = async (paymentData) => {
  const { patientId, amount, paymentMethod, paymentFor, dueDate } = paymentData;

  try {
    const paymentReference = `PAT_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

    const payment = await paymentRepository.recordPatientPayment({
      patientId,
      amount,
      paymentMethod,
      paymentFor,
      paymentReference,
      dueDate,
    });

    logger.info('Patient payment recorded', {
      patientId,
      paymentId: payment.id,
      amount,
    });

    return payment;
  } catch (error) {
    logger.error('Record patient payment error', {
      error: error.message,
      paymentData,
    });
    throw error;
  }
};

/**
 * Get overdue payments (admin only)
 */
export const getOverduePayments = async (options = {}) => {
  try {
    const payments = await paymentRepository.getOverduePayments(options);

    return payments;
  } catch (error) {
    logger.error('Get overdue payments error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Process refund
 */
export const processRefund = async (paymentId, refundData) => {
  const { amount, reason } = refundData;

  try {
    const payment = await paymentRepository.findPaymentById(paymentId);

    if (payment.status !== 'completed') {
      throw new BusinessLogicError('Can only refund completed payments');
    }

    if (amount > parseFloat(payment.amount)) {
      throw new BusinessLogicError('Refund amount cannot exceed payment amount');
    }

    // In production, process refund through payment gateway
    // const refundResponse = await paymentGateway.refund(payment, amount);

    await paymentRepository.updatePaymentStatus(paymentId, 'refunded', {
      refund_amount: amount,
      refund_reason: reason,
    });

    logger.info('Refund processed', {
      paymentId,
      amount,
      reason,
    });

    return {
      status: 'refunded',
      amount,
      payment,
    };
  } catch (error) {
    logger.error('Process refund error', {
      error: error.message,
      paymentId,
    });
    throw error;
  }
};

/**
 * Generate PDF for a monthly statement
 * Returns a Buffer containing the PDF
 */
export const generateStatementPdf = async (statementId) => {
  try {
    const statement = await paymentRepository.findStatementById(statementId);
    if (!statement) {
      throw new NotFoundError('Statement');
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('LIFELINE-Pro', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Healthcare Management Platform', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica-Bold').text('Monthly Statement', { align: 'center' });
      doc.moveDown(1);

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Statement Info
      doc.fontSize(11).font('Helvetica');
      doc.text(`Statement ID: ${statement.id}`);
      doc.text(`Period: ${monthNames[statement.month - 1]} ${statement.year}`);
      doc.text(`Provider Type: ${statement.provider_type?.charAt(0).toUpperCase()}${statement.provider_type?.slice(1)}`);
      doc.text(`Status: ${statement.status?.toUpperCase()}`);
      doc.text(`Generated: ${new Date(statement.created_at).toLocaleDateString()}`);
      if (statement.email) doc.text(`Email: ${statement.email}`);
      if (statement.lifeline_id) doc.text(`Lifeline ID: ${statement.lifeline_id}`);
      doc.moveDown(1);

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Financial Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Financial Summary');
      doc.moveDown(0.5);

      const formatCurrency = (amount) => `₦${parseFloat(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      doc.fontSize(11).font('Helvetica');

      const summaryY = doc.y;
      const col1 = 70;
      const col2 = 350;

      doc.text('Total Transactions:', col1, summaryY);
      doc.text(`${statement.transaction_count || 0}`, col2, summaryY);

      doc.text('Gross Amount:', col1);
      doc.text(formatCurrency(statement.total_amount), col2, doc.y - 14);

      doc.text('Platform Fee (10%):', col1);
      doc.text(formatCurrency(statement.platform_fee), col2, doc.y - 14);

      doc.moveDown(0.3);
      doc.moveTo(col1, doc.y).lineTo(480, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica-Bold');
      doc.text('Net Amount (Payable):', col1);
      doc.text(formatCurrency(statement.net_amount), col2, doc.y - 14);

      doc.moveDown(1.5);

      // Footer
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#666666');
      doc.text('This is a system-generated statement from LIFELINE-Pro.', { align: 'center' });
      doc.text('For questions, contact support@lifeline-pro.com', { align: 'center' });

      doc.end();
    });
  } catch (error) {
    logger.error('Generate statement PDF error', {
      error: error.message,
      statementId,
    });
    throw error;
  }
};

export default {
  initializePayment,
  verifyPayment,
  processServicePayment,
  handleWebhook,
  getPaymentHistory,
  getProviderPayments,
  generateMonthlyStatement,
  getProviderStatements,
  getStatementById,
  generateStatementPdf,
  approveStatement,
  rejectStatement,
  getPendingStatements,
  calculateRevenue,
  getPaymentAnalytics,
  recordPatientPayment,
  getOverduePayments,
  processRefund,
};
