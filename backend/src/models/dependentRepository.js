import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { NotFoundError, BusinessLogicError } from '../middleware/errorHandler.js';
import { PACKAGE_ENTITLEMENTS } from '../config/constants.js';

/**
 * Dependent Repository
 * Database operations for patient dependents
 */

/**
 * Create dependent
 */
export const createDependent = async (dependentData) => {
  const {
    patientId,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    relationship,
    bloodGroup = null,
    allergies = null,
    chronicConditions = null,
    emergencyContact = null,
  } = dependentData;

  try {
    const result = await database.query(
      `INSERT INTO dependents (
        patient_id, first_name, last_name, date_of_birth, gender,
        relationship, blood_group, allergies, chronic_conditions,
        emergency_contact, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      RETURNING *`,
      [
        patientId,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        relationship,
        bloodGroup,
        allergies ? JSON.stringify(allergies) : null,
        chronicConditions ? JSON.stringify(chronicConditions) : null,
        emergencyContact ? JSON.stringify(emergencyContact) : null,
      ]
    );

    logger.info('Dependent created', {
      dependentId: result.rows[0].id,
      patientId,
      firstName,
      lastName,
    });

    const dependent = result.rows[0];
    dependent.allergies = dependent.allergies || [];
    dependent.chronic_conditions = dependent.chronic_conditions || [];
    dependent.emergency_contact = dependent.emergency_contact || null;

    return dependent;
  } catch (error) {
    logger.error('Error creating dependent', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Find dependent by ID
 */
export const findDependentById = async (dependentId) => {
  try {
    const result = await database.query(
      `SELECT d.*,
              pat.lifeline_id as patient_lifeline_id,
              u.first_name as patient_first_name,
              u.last_name as patient_last_name
       FROM dependents d
       JOIN patients pat ON d.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       WHERE d.id = $1`,
      [dependentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Dependent');
    }

    const dependent = result.rows[0];
    dependent.allergies = dependent.allergies || [];
    dependent.chronic_conditions = dependent.chronic_conditions || [];
    dependent.emergency_contact = dependent.emergency_contact || null;

    return dependent;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding dependent', {
      error: error.message,
      dependentId,
    });
    throw error;
  }
};

/**
 * Update dependent profile
 */
export const updateDependentProfile = async (dependentId, updateData) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    relationship,
    bloodGroup,
    allergies,
    chronicConditions,
    emergencyContact,
  } = updateData;

  try {
    const result = await database.query(
      `UPDATE dependents
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           date_of_birth = COALESCE($3, date_of_birth),
           gender = COALESCE($4, gender),
           relationship = COALESCE($5, relationship),
           blood_group = COALESCE($6, blood_group),
           allergies = COALESCE($7, allergies),
           chronic_conditions = COALESCE($8, chronic_conditions),
           emergency_contact = COALESCE($9, emergency_contact),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        firstName,
        lastName,
        dateOfBirth,
        gender,
        relationship,
        bloodGroup,
        allergies ? JSON.stringify(allergies) : null,
        chronicConditions ? JSON.stringify(chronicConditions) : null,
        emergencyContact ? JSON.stringify(emergencyContact) : null,
        dependentId,
      ]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Dependent');
    }

    logger.info('Dependent profile updated', { dependentId });

    const dependent = result.rows[0];
    dependent.allergies = dependent.allergies || [];
    dependent.chronic_conditions = dependent.chronic_conditions || [];
    dependent.emergency_contact = dependent.emergency_contact || null;

    return dependent;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating dependent profile', {
      error: error.message,
      dependentId,
    });
    throw error;
  }
};

/**
 * Get patient dependents
 */
export const getPatientDependents = async (patientId, options = {}) => {
  const { activeOnly = false } = options;

  try {
    let query = `SELECT * FROM dependents WHERE patient_id = $1`;
    const params = [patientId];

    if (activeOnly) {
      query += ` AND is_active = true`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await database.query(query, params);

    return result.rows.map((dep) => ({
      ...dep,
      allergies: dep.allergies || [],
      chronic_conditions: dep.chronic_conditions || [],
      emergency_contact: dep.emergency_contact || null,
    }));
  } catch (error) {
    logger.error('Error getting patient dependents', {
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
      `SELECT COUNT(*) as count FROM dependents
       WHERE patient_id = $1 AND is_active = true`,
      [patientId]
    );

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error counting active dependents', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Check if patient can add dependent
 */
export const canAddDependent = async (patientId) => {
  try {
    // Get patient subscription package
    const patientResult = await database.query(
      `SELECT ps.package_type
       FROM patients p
       JOIN patient_subscriptions ps ON p.id = ps.patient_id
       WHERE p.id = $1 AND ps.is_active = true
       ORDER BY ps.start_date DESC
       LIMIT 1`,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      throw new BusinessLogicError('No active subscription found');
    }

    const packageType = patientResult.rows[0].package_type;
    const entitlements = PACKAGE_ENTITLEMENTS[packageType];

    if (!entitlements) {
      throw new BusinessLogicError(`Invalid package type: ${packageType}`);
    }

    // Count current active dependents
    const currentCount = await countActiveDependents(patientId);

    return {
      canAdd: currentCount < entitlements.max_dependents,
      currentCount,
      maxAllowed: entitlements.max_dependents,
      packageType,
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
 * Validate dependent addition
 */
export const validateDependentAddition = async (patientId) => {
  const check = await canAddDependent(patientId);

  if (!check.canAdd) {
    throw new BusinessLogicError(
      `Maximum number of dependents (${check.maxAllowed}) reached for ${check.packageType} package`
    );
  }

  return check;
};

/**
 * Deactivate dependent
 */
export const deactivateDependent = async (dependentId, reason = null) => {
  try {
    const result = await database.query(
      `UPDATE dependents
       SET is_active = false,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [dependentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Dependent');
    }

    logger.info('Dependent deactivated', { dependentId, reason });

    const dependent = result.rows[0];
    dependent.allergies = dependent.allergies || [];
    dependent.chronic_conditions = dependent.chronic_conditions || [];
    dependent.emergency_contact = dependent.emergency_contact || null;

    return dependent;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error deactivating dependent', {
      error: error.message,
      dependentId,
    });
    throw error;
  }
};

/**
 * Reactivate dependent
 */
export const reactivateDependent = async (dependentId) => {
  try {
    // Check if patient can add another dependent
    const dependent = await findDependentById(dependentId);
    await validateDependentAddition(dependent.patient_id);

    const result = await database.query(
      `UPDATE dependents
       SET is_active = true,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [dependentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Dependent');
    }

    logger.info('Dependent reactivated', { dependentId });

    const reactivated = result.rows[0];
    reactivated.allergies = reactivated.allergies || [];
    reactivated.chronic_conditions = reactivated.chronic_conditions || [];
    reactivated.emergency_contact = reactivated.emergency_contact || null;

    return reactivated;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BusinessLogicError) throw error;
    logger.error('Error reactivating dependent', {
      error: error.message,
      dependentId,
    });
    throw error;
  }
};

/**
 * Delete dependent (hard delete - use with caution)
 */
export const deleteDependent = async (dependentId) => {
  try {
    const result = await database.query(
      `DELETE FROM dependents WHERE id = $1 RETURNING id`,
      [dependentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Dependent');
    }

    logger.warn('Dependent permanently deleted', { dependentId });

    return { id: dependentId, deleted: true };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error deleting dependent', {
      error: error.message,
      dependentId,
    });
    throw error;
  }
};

/**
 * Get dependent medical history
 */
export const getDependentMedicalHistory = async (dependentId) => {
  try {
    // Check if dependent exists
    await findDependentById(dependentId);

    // Get consultations
    const consultations = await database.query(
      `SELECT c.*, d.specialization,
              u.first_name as doctor_first_name,
              u.last_name as doctor_last_name
       FROM consultations c
       JOIN doctors d ON c.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE c.dependent_id = $1
       ORDER BY c.consultation_date DESC`,
      [dependentId]
    );

    // Get prescriptions
    const prescriptions = await database.query(
      `SELECT p.*,
              u1.first_name as doctor_first_name,
              u1.last_name as doctor_last_name,
              ph.pharmacy_name
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.id
       JOIN users u1 ON d.user_id = u1.id
       LEFT JOIN pharmacies ph ON p.pharmacy_id = ph.id
       WHERE p.dependent_id = $1
       ORDER BY p.created_at DESC`,
      [dependentId]
    );

    // Get lab tests
    const labTests = await database.query(
      `SELECT * FROM lab_tests
       WHERE dependent_id = $1
       ORDER BY test_date DESC`,
      [dependentId]
    );

    return {
      consultations: consultations.rows,
      prescriptions: prescriptions.rows,
      labTests: labTests.rows,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error getting dependent medical history', {
      error: error.message,
      dependentId,
    });
    throw error;
  }
};

/**
 * Search dependents
 */
export const searchDependents = async (searchTerm, options = {}) => {
  const { limit = 20, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT d.*,
              pat.lifeline_id as patient_lifeline_id,
              u.first_name as patient_first_name,
              u.last_name as patient_last_name
       FROM dependents d
       JOIN patients pat ON d.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       WHERE (d.first_name ILIKE $1 OR d.last_name ILIKE $1)
         AND d.is_active = true
       ORDER BY d.first_name, d.last_name
       LIMIT $2 OFFSET $3`,
      [`%${searchTerm}%`, limit, offset]
    );

    return result.rows.map((dep) => ({
      ...dep,
      allergies: dep.allergies || [],
      chronic_conditions: dep.chronic_conditions || [],
      emergency_contact: dep.emergency_contact || null,
    }));
  } catch (error) {
    logger.error('Error searching dependents', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Get dependents by relationship
 */
export const getDependentsByRelationship = async (patientId, relationship) => {
  try {
    const result = await database.query(
      `SELECT * FROM dependents
       WHERE patient_id = $1 AND relationship = $2 AND is_active = true
       ORDER BY date_of_birth DESC`,
      [patientId, relationship]
    );

    return result.rows.map((dep) => ({
      ...dep,
      allergies: dep.allergies || [],
      chronic_conditions: dep.chronic_conditions || [],
      emergency_contact: dep.emergency_contact || null,
    }));
  } catch (error) {
    logger.error('Error getting dependents by relationship', {
      error: error.message,
      patientId,
      relationship,
    });
    throw error;
  }
};

/**
 * Get dependents statistics
 */
export const getDependentsStatistics = async (patientId) => {
  try {
    const result = await database.query(
      `SELECT 
        COUNT(*) as total_dependents,
        COUNT(*) FILTER (WHERE is_active = true) as active_dependents,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_dependents,
        COUNT(DISTINCT relationship) as relationship_types
       FROM dependents
       WHERE patient_id = $1`,
      [patientId]
    );

    const relationshipBreakdown = await database.query(
      `SELECT relationship, COUNT(*) as count
       FROM dependents
       WHERE patient_id = $1 AND is_active = true
       GROUP BY relationship
       ORDER BY count DESC`,
      [patientId]
    );

    return {
      ...result.rows[0],
      total_dependents: parseInt(result.rows[0].total_dependents, 10),
      active_dependents: parseInt(result.rows[0].active_dependents, 10),
      inactive_dependents: parseInt(result.rows[0].inactive_dependents, 10),
      relationship_types: parseInt(result.rows[0].relationship_types, 10),
      relationshipBreakdown: relationshipBreakdown.rows,
    };
  } catch (error) {
    logger.error('Error getting dependents statistics', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Bulk update dependents status
 */
export const bulkUpdateDependentStatus = async (patientId, isActive) => {
  try {
    const result = await database.query(
      `UPDATE dependents
       SET is_active = $1,
           updated_at = NOW()
       WHERE patient_id = $2
       RETURNING id`,
      [isActive, patientId]
    );

    logger.info('Bulk dependent status update', {
      patientId,
      isActive,
      count: result.rows.length,
    });

    return {
      updated: result.rows.length,
      dependentIds: result.rows.map((r) => r.id),
    };
  } catch (error) {
    logger.error('Error bulk updating dependent status', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

export default {
  createDependent,
  findDependentById,
  updateDependentProfile,
  getPatientDependents,
  countActiveDependents,
  canAddDependent,
  validateDependentAddition,
  deactivateDependent,
  reactivateDependent,
  deleteDependent,
  getDependentMedicalHistory,
  searchDependents,
  getDependentsByRelationship,
  getDependentsStatistics,
  bulkUpdateDependentStatus,
};
