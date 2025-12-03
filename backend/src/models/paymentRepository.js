import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { NotFoundError, BusinessLogicError } from '../middleware/errorHandler.js';

/**
 * Payment Repository
 * Database operations for payments, statements, and provider compensation
 */

// ============= PAYMENT RECORDS =============

/**
 * Create payment record
 */
export const createPayment = async (paymentData) => {
  const {
    patientId,
    providerId = null,
    providerType = null,
    amount,
    paymentMethod,
    paymentType,
    paymentReference,
    gatewayResponse = null,
    status = 'pending',
    description,
    metadata = null,
  } = paymentData;

  try {
    const result = await database.query(
      `INSERT INTO payment_records (
        patient_id, provider_id, provider_type, amount,
        payment_method, payment_type, payment_reference,
        gateway_response, status, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        patientId,
        providerId,
        providerType,
        amount,
        paymentMethod,
        paymentType,
        paymentReference,
        gatewayResponse ? JSON.stringify(gatewayResponse) : null,
        status,
        description,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    logger.info('Payment record created', {
      paymentId: result.rows[0].id,
      patientId,
      amount,
      paymentType,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating payment record', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Find payment by ID
 */
export const findPaymentById = async (paymentId) => {
  try {
    const result = await database.query(
      `SELECT p.*,
              pat.lifeline_id as patient_lifeline_id,
              u.first_name as patient_first_name,
              u.last_name as patient_last_name,
              u.email as patient_email
       FROM payment_records p
       JOIN patients pat ON p.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payment');
    }

    const payment = result.rows[0];
    payment.gateway_response = payment.gateway_response || null;
    payment.metadata = payment.metadata || null;

    return payment;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding payment', {
      error: error.message,
      paymentId,
    });
    throw error;
  }
};

/**
 * Find payment by reference
 */
export const findPaymentByReference = async (paymentReference) => {
  try {
    const result = await database.query(
      `SELECT * FROM payment_records WHERE payment_reference = $1`,
      [paymentReference]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error finding payment by reference', {
      error: error.message,
      paymentReference,
    });
    throw error;
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId, status, gatewayResponse = null) => {
  try {
    const result = await database.query(
      `UPDATE payment_records
       SET status = $1,
           gateway_response = COALESCE($2, gateway_response),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, gatewayResponse ? JSON.stringify(gatewayResponse) : null, paymentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payment');
    }

    logger.info('Payment status updated', { paymentId, status });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating payment status', {
      error: error.message,
      paymentId,
    });
    throw error;
  }
};

/**
 * Get patient payments
 */
export const getPatientPayments = async (patientId, options = {}) => {
  const { limit = 50, offset = 0, status = null, paymentType = null } = options;

  try {
    let query = `
      SELECT * FROM payment_records
      WHERE patient_id = $1
    `;
    const params = [patientId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (paymentType) {
      paramCount++;
      query += ` AND payment_type = $${paramCount}`;
      params.push(paymentType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting patient payments', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get provider payments
 */
export const getProviderPayments = async (providerId, options = {}) => {
  const { limit = 50, offset = 0, status = 'completed', startDate = null, endDate = null } = options;

  try {
    let query = `
      SELECT p.*,
             pat.lifeline_id as patient_lifeline_id,
             u.first_name as patient_first_name,
             u.last_name as patient_last_name
      FROM payment_records p
      JOIN patients pat ON p.patient_id = pat.id
      JOIN users u ON pat.user_id = u.id
      WHERE p.provider_id = $1
    `;
    const params = [providerId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (startDate) {
      paramCount++;
      query += ` AND p.created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND p.created_at <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting provider payments', {
      error: error.message,
      providerId,
    });
    throw error;
  }
};

/**
 * Calculate total revenue
 */
export const calculateRevenue = async (filters = {}) => {
  const { providerId = null, startDate = null, endDate = null, status = 'completed' } = filters;

  try {
    let query = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) as transaction_count
      FROM payment_records
      WHERE status = $1
    `;
    const params = [status];
    let paramCount = 1;

    if (providerId) {
      paramCount++;
      query += ` AND provider_id = $${paramCount}`;
      params.push(providerId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
    }

    const result = await database.query(query, params);

    return {
      totalRevenue: parseFloat(result.rows[0].total_revenue),
      transactionCount: parseInt(result.rows[0].transaction_count, 10),
    };
  } catch (error) {
    logger.error('Error calculating revenue', {
      error: error.message,
    });
    throw error;
  }
};

// ============= PAYMENT WEBHOOKS =============

/**
 * Create webhook log
 */
export const createWebhookLog = async (webhookData) => {
  const { gateway, event, payload, processingStatus = 'pending', paymentReference = null } = webhookData;

  try {
    const result = await database.query(
      `INSERT INTO payment_webhooks (
        gateway, event, payload, processing_status, payment_reference
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [gateway, event, JSON.stringify(payload), processingStatus, paymentReference]
    );

    logger.info('Webhook log created', {
      webhookId: result.rows[0].id,
      gateway,
      event,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating webhook log', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Update webhook processing status
 */
export const updateWebhookStatus = async (webhookId, status, errorMessage = null) => {
  try {
    const result = await database.query(
      `UPDATE payment_webhooks
       SET processing_status = $1,
           error_message = $2,
           processed_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, errorMessage, webhookId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Webhook');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating webhook status', {
      error: error.message,
      webhookId,
    });
    throw error;
  }
};

// ============= MONTHLY STATEMENTS =============

/**
 * Create monthly statement
 */
export const createMonthlyStatement = async (statementData) => {
  const {
    providerId,
    providerType,
    month,
    year,
    totalAmount,
    transactionCount,
    platformFee,
    netAmount,
  } = statementData;

  try {
    const result = await database.query(
      `INSERT INTO monthly_statements (
        provider_id, provider_type, month, year,
        total_amount, transaction_count, platform_fee, net_amount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *`,
      [providerId, providerType, month, year, totalAmount, transactionCount, platformFee, netAmount]
    );

    logger.info('Monthly statement created', {
      statementId: result.rows[0].id,
      providerId,
      month,
      year,
    });

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new BusinessLogicError('Statement already exists for this provider and period');
    }
    logger.error('Error creating monthly statement', {
      error: error.message,
      providerId,
    });
    throw error;
  }
};

/**
 * Find statement by ID
 */
export const findStatementById = async (statementId) => {
  try {
    const result = await database.query(
      `SELECT s.*, u.lifeline_id, u.email, u.phone
       FROM monthly_statements s
       JOIN users u ON s.provider_id = u.id
       WHERE s.id = $1`,
      [statementId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Statement');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding statement', {
      error: error.message,
      statementId,
    });
    throw error;
  }
};

/**
 * Get provider statements
 */
export const getProviderStatements = async (providerId, options = {}) => {
  const { limit = 12, offset = 0, status = null } = options;

  try {
    let query = `
      SELECT * FROM monthly_statements
      WHERE provider_id = $1
    `;
    const params = [providerId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY year DESC, month DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting provider statements', {
      error: error.message,
      providerId,
    });
    throw error;
  }
};

/**
 * Update statement status
 */
export const updateStatementStatus = async (statementId, status, approvedBy = null, notes = null) => {
  try {
    const result = await database.query(
      `UPDATE monthly_statements
       SET status = $1,
           approved_by = COALESCE($2, approved_by),
           approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, approvedBy, notes, statementId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Statement');
    }

    logger.info('Statement status updated', { statementId, status });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating statement status', {
      error: error.message,
      statementId,
    });
    throw error;
  }
};

/**
 * Get pending statements
 */
export const getPendingStatements = async (options = {}) => {
  const { limit = 50, offset = 0, providerType = null } = options;

  try {
    let query = `
      SELECT s.*, u.lifeline_id, u.email,
             CASE 
               WHEN s.provider_type = 'doctor' THEN u.first_name || ' ' || u.last_name
               WHEN s.provider_type = 'pharmacy' THEN ph.pharmacy_name
               WHEN s.provider_type = 'hospital' THEN h.hospital_name
             END as provider_name
      FROM monthly_statements s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN doctors d ON s.provider_id = d.user_id AND s.provider_type = 'doctor'
      LEFT JOIN pharmacies ph ON s.provider_id = ph.user_id AND s.provider_type = 'pharmacy'
      LEFT JOIN hospitals h ON s.provider_id = h.user_id AND s.provider_type = 'hospital'
      WHERE s.status = 'pending'
    `;
    const params = [];
    let paramCount = 0;

    if (providerType) {
      paramCount++;
      query += ` AND s.provider_type = $${paramCount}`;
      params.push(providerType);
    }

    query += ` ORDER BY s.year DESC, s.month DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting pending statements', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Generate statement for provider
 */
export const generateStatement = async (providerId, providerType, month, year) => {
  try {
    // Calculate totals for the period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await database.query(
      `SELECT 
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as total_amount
       FROM payment_records
       WHERE provider_id = $1
         AND status = 'completed'
         AND created_at BETWEEN $2 AND $3`,
      [providerId, startDate, endDate]
    );

    const { transaction_count, total_amount } = result.rows[0];

    // Calculate platform fee (assume 10%)
    const platformFee = parseFloat(total_amount) * 0.10;
    const netAmount = parseFloat(total_amount) - platformFee;

    // Create statement
    return await createMonthlyStatement({
      providerId,
      providerType,
      month,
      year,
      totalAmount: parseFloat(total_amount),
      transactionCount: parseInt(transaction_count, 10),
      platformFee,
      netAmount,
    });
  } catch (error) {
    logger.error('Error generating statement', {
      error: error.message,
      providerId,
      month,
      year,
    });
    throw error;
  }
};

// ============= PATIENT PAYMENTS =============

/**
 * Record patient payment
 */
export const recordPatientPayment = async (paymentData) => {
  const { patientId, amount, paymentMethod, paymentFor, paymentReference, dueDate } = paymentData;

  try {
    const result = await database.query(
      `INSERT INTO patient_payments (
        patient_id, amount, payment_method, payment_for,
        payment_reference, due_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *`,
      [patientId, amount, paymentMethod, paymentFor, paymentReference, dueDate]
    );

    logger.info('Patient payment recorded', {
      paymentId: result.rows[0].id,
      patientId,
      amount,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error recording patient payment', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Update patient payment status
 */
export const updatePatientPaymentStatus = async (paymentId, status, paidAt = null) => {
  try {
    const result = await database.query(
      `UPDATE patient_payments
       SET status = $1,
           paid_at = COALESCE($2, paid_at),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, paidAt, paymentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Patient payment');
    }

    logger.info('Patient payment status updated', { paymentId, status });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating patient payment status', {
      error: error.message,
      paymentId,
    });
    throw error;
  }
};

/**
 * Get overdue patient payments
 */
export const getOverduePayments = async (options = {}) => {
  const { limit = 50, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT pp.*, 
              pat.lifeline_id as patient_lifeline_id,
              u.first_name, u.last_name, u.email, u.phone
       FROM patient_payments pp
       JOIN patients pat ON pp.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       WHERE pp.status = 'pending'
         AND pp.due_date < NOW()
       ORDER BY pp.due_date ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting overdue payments', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get payment analytics
 */
export const getPaymentAnalytics = async (startDate, endDate, filters = {}) => {
  const { providerType = null, paymentType = null } = filters;

  try {
    let query = `
      SELECT 
        payment_type,
        provider_type,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        status
      FROM payment_records
      WHERE created_at BETWEEN $1 AND $2
    `;
    const params = [startDate, endDate];
    let paramCount = 2;

    if (providerType) {
      paramCount++;
      query += ` AND provider_type = $${paramCount}`;
      params.push(providerType);
    }

    if (paymentType) {
      paramCount++;
      query += ` AND payment_type = $${paramCount}`;
      params.push(paymentType);
    }

    query += ` GROUP BY payment_type, provider_type, status
               ORDER BY total_amount DESC`;

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting payment analytics', {
      error: error.message,
    });
    throw error;
  }
};

export default {
  // Payment Records
  createPayment,
  findPaymentById,
  findPaymentByReference,
  updatePaymentStatus,
  getPatientPayments,
  getProviderPayments,
  calculateRevenue,
  
  // Webhooks
  createWebhookLog,
  updateWebhookStatus,
  
  // Monthly Statements
  createMonthlyStatement,
  findStatementById,
  getProviderStatements,
  updateStatementStatus,
  getPendingStatements,
  generateStatement,
  
  // Patient Payments
  recordPatientPayment,
  updatePatientPaymentStatus,
  getOverduePayments,
  
  // Analytics
  getPaymentAnalytics,
};
