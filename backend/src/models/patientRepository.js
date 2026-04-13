import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { NotFoundError, ConflictError, BusinessLogicError } from '../middleware/errorHandler.js';
import { PACKAGE_TYPES, PACKAGE_ENTITLEMENTS, PACKAGE_PRICES } from '../constants/packages.js';
import { randomUUID } from 'crypto';

/**
 * Patient Repository
 * Database operations for patient-specific data
 */

/**
 * Create patient record
 */
export const createPatient = async (userId, patientData) => {
  const id = randomUUID();
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    address,
    bloodGroup = null,
    genotype = null,
    allergies = [],
    chronicConditions = [],
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelationship,
  } = patientData;

  try {
    // Get user's lifeline_id
    const userResult = await database.query('SELECT lifeline_id FROM users WHERE id = $1', [userId]);
    const lifelineId = userResult.rows[0]?.lifeline_id;

    const result = await database.query(
      `INSERT INTO patients (
        id, user_id, lifeline_id,
        emergency_contact_name, emergency_contact_phone, 
        emergency_contact_relationship,
        blood_type, allergies, medical_conditions,
        current_medications, current_package, subscription_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        userId,
        lifelineId,
        emergencyContactName || null,
        emergencyContactPhone || null,
        emergencyContactRelationship || null,
        bloodGroup || null,
        JSON.stringify(allergies),
        JSON.stringify(chronicConditions),
        JSON.stringify([]),
        'GENERAL',
        'inactive'
      ]
    );

    // Get the created patient record
    const patientResult = await database.query(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );

    logger.info('Patient record created', { userId, patientId: patientResult.rows[0].id });

    return patientResult.rows[0];
  } catch (error) {
    if (error.code === '23505' || error.code === 'SQLITE_CONSTRAINT') {
      throw new ConflictError('Patient record already exists for this user');
    }
    logger.error('Error creating patient record', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get patient by user ID
 */
export const findByUserId = async (userId) => {
  try {
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null; // Return null instead of throwing error
    }

    // Parse JSON fields
    const patient = result.rows[0];
    if (typeof patient.allergies === 'string') {
      try { patient.allergies = JSON.parse(patient.allergies); } catch { patient.allergies = []; }
    }
    if (typeof patient.medical_conditions === 'string') {
      try { patient.medical_conditions = JSON.parse(patient.medical_conditions); } catch { patient.medical_conditions = []; }
    }

    return patient;
  } catch (error) {
    logger.error('Error finding patient by user ID', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get patient subscriptions
 */
export const getSubscriptions = async (patientId) => {
  try {
    // Get current subscription from patients table
    const result = await database.query(
      `SELECT 
        current_package as package_type,
        subscription_status as status,
        subscription_start_date as start_date,
        subscription_end_date as end_date,
        auto_renew
       FROM patients 
       WHERE id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      return [];
    }

    return [result.rows[0]];
  } catch (error) {
    logger.error('Error getting subscriptions', {
      error: error.message,
      patientId,
    });
    // Return empty array instead of throwing
    return [];
  }
};

/**
 * Get patient by ID
 */
export const findById = async (patientId) => {
  try {
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Patient');
    }

    const patient = result.rows[0];
    patient.allergies = patient.allergies || [];
    patient.chronic_conditions = patient.chronic_conditions || [];

    return patient;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding patient by ID', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Update patient profile
 */
export const updateProfile = async (patientId, updates) => {
  const allowedFields = [
    'date_of_birth',
    'gender',
    'address',
    'blood_group',
    'genotype',
    'allergies',
    'chronic_conditions',
    'emergency_contact_name',
    'emergency_contact_phone',
    'emergency_contact_relationship',
  ];

  const mappedUpdates = {};
  const fieldMapping = {
    dateOfBirth: 'date_of_birth',
    bloodGroup: 'blood_group',
    chronicConditions: 'chronic_conditions',
    emergencyContactName: 'emergency_contact_name',
    emergencyContactPhone: 'emergency_contact_phone',
    emergencyContactRelationship: 'emergency_contact_relationship',
  };

  Object.keys(updates).forEach((key) => {
    const dbKey = fieldMapping[key] || key;
    if (allowedFields.includes(dbKey) && updates[key] !== undefined) {
      mappedUpdates[dbKey] = updates[key];
    }
  });

  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(mappedUpdates).forEach((key) => {
    fields.push(`${key} = $${paramCount}`);
    
    // Handle JSON fields
    if (key === 'allergies' || key === 'chronic_conditions') {
      values.push(JSON.stringify(mappedUpdates[key]));
    } else {
      values.push(mappedUpdates[key]);
    }
    paramCount++;
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push(`updated_at = datetime('now')`);
  values.push(patientId);

  try {
    const result = await database.query(
      `UPDATE patients
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Patient');
    }

    logger.info('Patient profile updated', { patientId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating patient profile', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Create or update subscription
 */
export const updateSubscription = async (patientId, subscriptionData) => {
  const {
    packageType,
    subscriptionStartDate,
    subscriptionEndDate,
    subscriptionStatus = 'active',
    autoRenew = true,
  } = subscriptionData;

  // Validate package type
  if (!Object.values(PACKAGE_TYPES).includes(packageType)) {
    throw new BusinessLogicError('Invalid package type');
  }

  try {
    const result = await database.query(
      `UPDATE patients
       SET current_package = $1,
           subscription_start_date = $2,
           subscription_end_date = $3,
           subscription_status = $4,
           auto_renew = $5,
           updated_at = datetime('now')
       WHERE id = $6
       RETURNING *`,
      [
        packageType,
        subscriptionStartDate,
        subscriptionEndDate,
        subscriptionStatus,
        autoRenew,
        patientId,
      ]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Patient');
    }

    logger.info('Patient subscription updated', {
      patientId,
      packageType,
      status: subscriptionStatus,
    });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating patient subscription', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get active subscription
 */
export const getActiveSubscription = async (patientId) => {
  try {
    const result = await database.query(
      `SELECT id, current_package, current_package as package_type, 
              subscription_start_date, subscription_start_date as start_date,
              subscription_end_date, subscription_end_date as end_date,
              subscription_status, subscription_status as status, 
              auto_renew
       FROM patients
       WHERE id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Patient');
    }

    const subscription = result.rows[0];

    // Check if subscription is expired
    if (subscription.subscription_end_date && new Date(subscription.subscription_end_date) < new Date()) {
      subscription.isExpired = true;
    } else {
      subscription.isExpired = false;
    }

    return subscription;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error getting active subscription', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Check if patient has active subscription
 */
export const hasActiveSubscription = async (patientId) => {
  try {
    const result = await database.query(
      `SELECT subscription_status, subscription_end_date
       FROM patients
       WHERE id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const { subscription_status, subscription_end_date } = result.rows[0];

    return (
      subscription_status === 'active' &&
      subscription_end_date &&
      new Date(subscription_end_date) > new Date()
    );
  } catch (error) {
    logger.error('Error checking active subscription', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get package entitlements
 */
export const getPackageEntitlements = async (patientId) => {
  try {
    const result = await database.query(
      `SELECT current_package FROM patients WHERE id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Patient');
    }

    const packageType = result.rows[0].current_package;
    
    if (!packageType) {
      return null;
    }

    return PACKAGE_ENTITLEMENTS[packageType] || null;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error getting package entitlements', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (patientId, cancellationDate = null) => {
  try {
    const endDate = cancellationDate || new Date();

    const result = await database.query(
      `UPDATE patients
       SET subscription_status = 'cancelled',
           subscription_end_date = $1,
           auto_renew = false,
           updated_at = datetime('now')
       WHERE id = $2
       RETURNING *`,
      [endDate, patientId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Patient');
    }

    logger.info('Patient subscription cancelled', { patientId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error cancelling subscription', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get dependents for a patient
 */
export const getDependents = async (patientId, options = {}) => {
  const { includeInactive = false } = options;

  try {
    let query = `
      SELECT * FROM dependents
      WHERE patient_id = $1
    `;

    if (!includeInactive) {
      query += ` AND is_active = true`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await database.query(query, [patientId]);

    return result.rows;
  } catch (error) {
    logger.error('Error getting dependents', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Count active dependents
 */
export const countActiveDependents = async (patientId) => {
  try {
    const result = await database.query(
      `SELECT COUNT(*) as count
       FROM dependents
       WHERE patient_id = $1 AND is_active = true`,
      [patientId]
    );

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error counting dependents', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Check dependent limit based on package
 */
export const canAddDependent = async (patientId) => {
  try {
    const patient = await findById(patientId);
    const currentCount = await countActiveDependents(patientId);

    const packageType = patient.current_package;
    if (!packageType) {
      return { canAdd: false, reason: 'No active subscription' };
    }

    const entitlements = PACKAGE_ENTITLEMENTS[packageType];
    const maxDependents = entitlements?.maxDependents || 0;

    if (currentCount >= maxDependents) {
      return {
        canAdd: false,
        reason: `Maximum dependents (${maxDependents}) reached for ${packageType} package`,
        current: currentCount,
        max: maxDependents,
      };
    }

    return {
      canAdd: true,
      current: currentCount,
      max: maxDependents,
      remaining: maxDependents - currentCount,
    };
  } catch (error) {
    logger.error('Error checking dependent limit', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get usage statistics
 */
export const getUsageStats = async (patientId, startDate, endDate) => {
  try {
    const result = await database.query(
      `SELECT 
        (SELECT COUNT(*) FROM consultations 
         WHERE patient_id = $1 AND created_at BETWEEN $2 AND $3) as consultations,
        (SELECT COUNT(*) FROM prescriptions 
         WHERE patient_id = $1 AND created_at BETWEEN $2 AND $3) as prescriptions,
        (SELECT COUNT(*) FROM surgeries 
         WHERE patient_id = $1 AND created_at BETWEEN $2 AND $3) as surgeries,
        (SELECT COUNT(*) FROM lab_tests 
         WHERE patient_id = $1 AND created_at BETWEEN $2 AND $3) as lab_tests`,
      [patientId, startDate, endDate]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting usage stats', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get all patients with filters
 */
export const findAll = async (options = {}) => {
  const {
    packageType = null,
    subscriptionStatus = null,
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = options;

  try {
    let query = `
      SELECT p.*, p.current_package as package_type, p.subscription_status as status,
             u.lifeline_id, u.first_name, u.last_name, u.email, u.phone, (u.status = 'active') as is_active
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (packageType) {
      paramCount++;
      query += ` AND p.current_package = $${paramCount}`;
      params.push(packageType);
    }

    if (subscriptionStatus) {
      paramCount++;
      query += ` AND p.subscription_status = $${paramCount}`;
      params.push(subscriptionStatus);
    }

    query += ` ORDER BY p.${sortBy} ${sortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error finding all patients', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Count patients
 */
export const countPatients = async (filters = {}) => {
  const { packageType = null, subscriptionStatus = null } = filters;

  try {
    let query = 'SELECT COUNT(*) as count FROM patients WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (packageType) {
      paramCount++;
      query += ` AND current_package = $${paramCount}`;
      params.push(packageType);
    }

    if (subscriptionStatus) {
      paramCount++;
      query += ` AND subscription_status = $${paramCount}`;
      params.push(subscriptionStatus);
    }

    const result = await database.query(query, params);

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error counting patients', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Search patients
 */
export const searchPatients = async (searchTerm, options = {}) => {
  const { limit = 50, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE (
         LOWER(u.first_name) LIKE LOWER($1) OR
         LOWER(u.last_name) LIKE LOWER($1) OR
         LOWER(u.email) LIKE LOWER($1) OR
         u.lifeline_id LIKE $1
       )
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${searchTerm}%`, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching patients', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Get expiring subscriptions
 */
export const getExpiringSubscriptions = async (daysThreshold = 7) => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.subscription_status = 'active'
         AND p.subscription_end_date <= $1
         AND p.subscription_end_date > datetime('now')
       ORDER BY p.subscription_end_date ASC`,
      [thresholdDate]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting expiring subscriptions', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Mark subscription as expired (scheduled task)
 */
export const expireSubscriptions = async () => {
  try {
    const result = await database.query(
      `UPDATE patients
       SET subscription_status = 'expired',
           updated_at = datetime('now')
       WHERE subscription_status = 'active'
         AND subscription_end_date < datetime('now')
       RETURNING id, user_id, subscription_end_date`
    );

    logger.info('Subscriptions expired', { count: result.rows.length });

    return result.rows;
  } catch (error) {
    logger.error('Error expiring subscriptions', {
      error: error.message,
    });
    throw error;
  }
};

export default {
  createPatient,
  findByUserId,
  findById,
  updateProfile,
  getSubscriptions,
  updateSubscription,
  getActiveSubscription,
  hasActiveSubscription,
  getPackageEntitlements,
  cancelSubscription,
  getDependents,
  countActiveDependents,
  canAddDependent,
  getUsageStats,
  findAll,
  countPatients,
  searchPatients,
  getExpiringSubscriptions,
  expireSubscriptions,
};
