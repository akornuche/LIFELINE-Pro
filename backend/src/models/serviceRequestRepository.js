import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { randomUUID } from 'crypto';

/**
 * Service Request Repository
 * Handles CRUD operations for the queue/matching system
 */

/**
 * Create a new service request
 */
export const createServiceRequest = async (requestData) => {
  const id = randomUUID();
  const {
    patientId,
    serviceType,
    providerType,
    city,
    state,
    description = null,
    preferredDate = null,
    priority = 'normal',
  } = requestData;

  try {
    await database.query(
      `INSERT INTO service_requests (
        id, patient_id, service_type, provider_type,
        city, state, description, preferred_date, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, patientId, serviceType, providerType, city, state, description, preferredDate, priority]
    );

    const result = await database.query(
      `SELECT * FROM service_requests WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating service request', { error: error.message, patientId });
    throw error;
  }
};

/**
 * Find service request by ID
 */
export const findById = async (id) => {
  try {
    const result = await database.query(
      `SELECT sr.*,
              u_patient.first_name || ' ' || u_patient.last_name as patient_name,
              u_patient.email as patient_email,
              u_patient.phone as patient_phone,
              p.current_package as patient_plan,
              p.subscription_status as patient_subscription_status
       FROM service_requests sr
       JOIN patients p ON sr.patient_id = p.id
       JOIN users u_patient ON p.user_id = u_patient.id
       WHERE sr.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error finding service request', { error: error.message, id });
    throw error;
  }
};

/**
 * Get service requests for a patient
 */
export const findByPatientId = async (patientId, status = null) => {
  try {
    let query = `
      SELECT sr.*,
             CASE 
               WHEN sr.provider_type = 'doctor' THEN d_user.first_name || ' ' || d_user.last_name
               WHEN sr.provider_type = 'pharmacy' THEN ph.pharmacy_name
               WHEN sr.provider_type = 'hospital' THEN h.hospital_name
             END as provider_name
      FROM service_requests sr
      LEFT JOIN doctors d ON sr.assigned_provider_id = d.id AND sr.provider_type = 'doctor'
      LEFT JOIN users d_user ON d.user_id = d_user.id
      LEFT JOIN pharmacies ph ON sr.assigned_provider_id = ph.id AND sr.provider_type = 'pharmacy'
      LEFT JOIN hospitals h ON sr.assigned_provider_id = h.id AND sr.provider_type = 'hospital'
      WHERE sr.patient_id = $1
    `;
    const params = [patientId];

    if (status) {
      query += ` AND sr.status = $2`;
      params.push(status);
    }
    query += ` ORDER BY sr.created_at DESC`;

    const result = await database.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error finding patient service requests', { error: error.message, patientId });
    throw error;
  }
};

/**
 * Get service requests assigned to a provider
 */
export const findByProviderId = async (providerId, providerType, status = null) => {
  try {
    let query = `
      SELECT sr.*,
             u_patient.first_name || ' ' || u_patient.last_name as patient_name,
             u_patient.phone as patient_phone,
             p.current_package as patient_plan,
             p.subscription_status as patient_subscription_status
      FROM service_requests sr
      JOIN patients p ON sr.patient_id = p.id
      JOIN users u_patient ON p.user_id = u_patient.id
      WHERE sr.assigned_provider_id = $1 AND sr.provider_type = $2
    `;
    const params = [providerId, providerType];

    if (status) {
      query += ` AND sr.status = $3`;
      params.push(status);
    }
    query += ` ORDER BY sr.created_at DESC`;

    const result = await database.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error finding provider service requests', { error: error.message, providerId });
    throw error;
  }
};

/**
 * Get pending (unassigned) requests by city and provider type
 */
export const findPendingByCity = async (city, providerType) => {
  try {
    const result = await database.query(
      `SELECT sr.*, u.first_name || ' ' || u.last_name as patient_name
       FROM service_requests sr
       JOIN patients p ON sr.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE sr.city = $1 AND sr.provider_type = $2 AND sr.status = 'pending'
       ORDER BY 
         CASE sr.priority 
           WHEN 'emergency' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'normal' THEN 3 
           WHEN 'low' THEN 4 
         END,
         sr.created_at ASC`,
      [city, providerType]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error finding pending requests', { error: error.message, city, providerType });
    throw error;
  }
};

/**
 * Update service request status
 */
export const updateStatus = async (id, status, additionalData = {}) => {
  try {
    const timestampField = {
      assigned: 'assigned_at',
      accepted: 'accepted_at',
      completed: 'completed_at',
      cancelled: 'cancelled_at',
    }[status];

    let query = `UPDATE service_requests SET status = $1, updated_at = CURRENT_TIMESTAMP`;
    const params = [status];
    let paramIndex = 2;

    if (timestampField) {
      query += `, ${timestampField} = CURRENT_TIMESTAMP`;
    }

    if (additionalData.assignedProviderId) {
      query += `, assigned_provider_id = $${paramIndex}`;
      params.push(additionalData.assignedProviderId);
      paramIndex++;
    }

    if (additionalData.cancellationReason) {
      query += `, cancellation_reason = $${paramIndex}`;
      params.push(additionalData.cancellationReason);
      paramIndex++;
    }

    if (additionalData.rejectionReason) {
      query += `, rejection_reason = $${paramIndex}`;
      params.push(additionalData.rejectionReason);
      paramIndex++;
    }

    if (additionalData.consultationId) {
      query += `, consultation_id = $${paramIndex}`;
      params.push(additionalData.consultationId);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex}`;
    params.push(id);

    await database.query(query, params);

    return await findById(id);
  } catch (error) {
    logger.error('Error updating service request status', { error: error.message, id, status });
    throw error;
  }
};

/**
 * Get verified providers in a city (for round-robin assignment)
 * Falls back to same state if no providers in exact city
 */
export const getVerifiedProvidersByCity = async (city, providerType) => {
  try {
    // First try exact city match
    let query;
    if (providerType === 'doctor') {
      query = `
        SELECT d.id as provider_id, u.id as user_id,
               u.email, u.first_name, u.city, u.state,
               d.specialization,
               u.first_name || ' ' || u.last_name as provider_name,
               COALESCE(pac.assignment_count, 0) as assignment_count
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN provider_assignment_counters pac
          ON pac.provider_id = d.id AND pac.provider_type = 'doctor' AND pac.city = $1
        WHERE u.city = $1 AND d.verification_status = 'verified' AND u.status = 'active'
        ORDER BY COALESCE(pac.assignment_count, 0) ASC, d.created_at ASC
      `;
    } else if (providerType === 'pharmacy') {
      query = `
        SELECT ph.id as provider_id, u.id as user_id,
               u.email, u.first_name, u.city, u.state,
               ph.pharmacy_name as provider_name,
               COALESCE(pac.assignment_count, 0) as assignment_count
        FROM pharmacies ph
        JOIN users u ON ph.user_id = u.id
        LEFT JOIN provider_assignment_counters pac
          ON pac.provider_id = ph.id AND pac.provider_type = 'pharmacy' AND pac.city = $1
        WHERE u.city = $1 AND ph.verification_status = 'verified' AND u.status = 'active'
        ORDER BY COALESCE(pac.assignment_count, 0) ASC, ph.created_at ASC
      `;
    } else if (providerType === 'hospital') {
      query = `
        SELECT h.id as provider_id, u.id as user_id,
               u.email, u.first_name, u.city, u.state,
               h.hospital_name as provider_name,
               COALESCE(pac.assignment_count, 0) as assignment_count
        FROM hospitals h
        JOIN users u ON h.user_id = u.id
        LEFT JOIN provider_assignment_counters pac
          ON pac.provider_id = h.id AND pac.provider_type = 'hospital' AND pac.city = $1
        WHERE u.city = $1 AND h.verification_status = 'verified' AND u.status = 'active'
        ORDER BY COALESCE(pac.assignment_count, 0) ASC, h.created_at ASC
      `;
    }

    const result = await database.query(query, [city]);
    
    // If no providers found in exact city, try state-level fallback
    if (result.rows.length === 0) {
      logger.info('No providers found in city, falling back to state-level search', { city, providerType });
      
      // Get the state from the city (if we have it)
      const cityInfo = await database.query(
        `SELECT DISTINCT state FROM users WHERE city = $1 AND state IS NOT NULL LIMIT 1`,
        [city]
      );
      
      if (cityInfo.rows[0]) {
        const state = cityInfo.rows[0].state;
        logger.info('Falling back to state-level search', { state });
        
        // Use the same query but change WHERE u.city = $1 to WHERE u.state = $1
        // Rebuild queries with state filter
        const stateQuery = query.replace('u.city = $1', 'u.state = $1');
        const stateResult = await database.query(stateQuery, [state]);
        
        if (stateResult.rows.length > 0) {
          logger.info('Found providers in state', { state, count: stateResult.rows.length });
          return stateResult.rows;
        }
      }
    }

    return result.rows;
  } catch (error) {
    logger.error('Error getting verified providers', { error: error.message, city, providerType });
    throw error;
  }
};

/**
 * Find requests stuck in 'assigned' status for > cutoff time
 */
export const findStaleAssignedRequests = async (cutoffDate) => {
  try {
    const result = await database.query(
      `SELECT sr.*, u.first_name || ' ' || u.last_name as patient_name
       FROM service_requests sr
       JOIN patients p ON sr.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE sr.status = 'assigned'
         AND sr.assigned_at < $1
       ORDER BY sr.assigned_at ASC`,
      [cutoffDate]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error finding stale assigned requests', { error: error.message, cutoffDate });
    throw error;
  }
};

/**
 * Get active (pending/assigned) requests for a provider
 * Used to check if provider has capacity before assigning new requests
 */
export const getProviderActiveRequests = async (providerId, providerType) => {
  try {
    const result = await database.query(
      `SELECT COUNT(*) as count
       FROM service_requests
       WHERE assigned_provider_id = $1
         AND provider_type = $2
         AND status IN ('assigned', 'accepted', 'in_progress')`,
      [providerId, providerType]
    );
    return parseInt(result.rows[0].count, 10) || 0;
  } catch (error) {
    logger.error('Error getting provider active requests', { error: error.message, providerId });
    throw error;
  }
};

/**
 * Increment provider assignment counter (round-robin tracking)
 */
export const incrementAssignmentCounter = async (providerId, providerType, city) => {
  try {
    const id = randomUUID();
    await database.query(
      `INSERT INTO provider_assignment_counters (id, provider_id, provider_type, city, assignment_count, last_assigned_at)
       VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(provider_id, provider_type, city) 
       DO UPDATE SET assignment_count = provider_assignment_counters.assignment_count + 1,
                     last_assigned_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP`,
      [id, providerId, providerType, city]
    );
  } catch (error) {
    logger.error('Error incrementing assignment counter', { error: error.message, providerId });
    throw error;
  }
};

/**
 * Get the user_id for a provider (for socket notifications).
 * @deprecated Use getProviderUserInfo for new code.
 */
export const getProviderUserId = async (providerId, providerType) => {
  const info = await getProviderUserInfo(providerId, providerType);
  return info?.userId || null;
};

/**
 * Get user_id, email and first_name for a provider.
 * Used for socket notifications and email delivery on assignment.
 */
export const getProviderUserInfo = async (providerId, providerType) => {
  const tableMap = { doctor: 'doctors', pharmacy: 'pharmacies', hospital: 'hospitals' };
  const table = tableMap[providerType];
  if (!table) return null;
  try {
    const result = await database.query(
      `SELECT p.user_id, u.email, u.first_name
       FROM ${table} p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [providerId]
    );
    if (!result.rows[0]) return null;
    return {
      userId: result.rows[0].user_id,
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
    };
  } catch (error) {
    logger.error('Error getting provider user info', { error: error.message, providerId, providerType });
    return null;
  }
};

/**
 * Get queue statistics for admin dashboard
 */
export const getQueueStats = async () => {
  try {
    const result = await database.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM service_requests
      GROUP BY status
    `);

    const byCity = await database.query(`
      SELECT 
        city,
        status,
        COUNT(*) as count
      FROM service_requests
      WHERE status IN ('pending', 'assigned')
      GROUP BY city, status
      ORDER BY city
    `);

    return {
      statusCounts: result.rows,
      pendingByCity: byCity.rows,
    };
  } catch (error) {
    logger.error('Error getting queue stats', { error: error.message });
    throw error;
  }
};

export default {
  createServiceRequest,
  findById,
  findByPatientId,
  findByProviderId,
  findPendingByCity,
  updateStatus,
  getVerifiedProvidersByCity,
  incrementAssignmentCounter,
  getProviderUserId,
  getProviderUserInfo,
  getQueueStats,
};
