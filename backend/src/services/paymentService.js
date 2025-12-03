import * as paymentRepository from '../models/paymentRepository.js';
import * as patientRepository from '../models/patientRepository.js';
import * as pricingRepository from '../models/pricingRepository.js';
import * as userRepository from '../models/userRepository.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, NotFoundError } from '../middleware/errorHandler.js';

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

    // In production, integrate with payment gateway (Paystack/Flutterwave)
    // const gatewayResponse = await paymentGateway.initialize(payment);

    return {
      payment,
      paymentReference,
      // authorizationUrl: gatewayResponse.authorization_url, // From gateway
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

    // In production, verify with payment gateway
    // const gatewayVerification = await paymentGateway.verify(paymentReference);

    // For now, simulate verification
    const verified = true; // gatewayVerification.status === 'success'

    if (verified) {
      await paymentRepository.updatePaymentStatus(payment.id, 'completed', {
        // gatewayResponse: gatewayVerification
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
        // gatewayResponse: gatewayVerification
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
  const { gateway, event, payload } = webhookData;

  try {
    // Log webhook
    const webhook = await paymentRepository.createWebhookLog({
      gateway,
      event,
      payload,
      processingStatus: 'pending',
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
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const payments = await paymentRepository.getProviderPayments(userId, options);

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
export const generateMonthlyStatement = async (providerId, providerType, month, year) => {
  try {
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
    const statements = await paymentRepository.getProviderStatements(userId, options);

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
  approveStatement,
  rejectStatement,
  getPendingStatements,
  calculateRevenue,
  getPaymentAnalytics,
  recordPatientPayment,
  getOverduePayments,
  processRefund,
};
