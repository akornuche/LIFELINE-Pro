import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';

/**
 * Hospital Repository
 * Database operations for hospital-specific data
 */

/**
 * Create hospital record
 */
export const createHospital = async (userId, hospitalData) => {
  const {
    hospitalName,
    address,
    hospitalType,
    licenseNumber,
    licenseExpiryDate,
    numberOfBeds,
    hasEmergency = false,
    hasICU = false,
    departments = [],
    accreditation = null,
  } = hospitalData;

  try {
    const result = await database.query(
      `INSERT INTO hospitals (
        user_id, hospital_name, address, hospital_type,
        license_number, license_expiry_date, number_of_beds,
        has_emergency, has_icu, departments, accreditation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        userId,
        hospitalName,
        address,
        hospitalType,
        licenseNumber,
        licenseExpiryDate,
        numberOfBeds,
        hasEmergency,
        hasICU,
        JSON.stringify(departments),
        accreditation,
      ]
    );

    logger.info('Hospital record created', { userId, hospitalId: result.rows[0].id });

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint === 'hospitals_user_id_key') {
        throw new ConflictError('Hospital record already exists for this user');
      }
      if (error.constraint === 'hospitals_license_number_key') {
        throw new ConflictError('License number already exists');
      }
    }
    logger.error('Error creating hospital record', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get hospital by user ID
 */
export const findByUserId = async (userId) => {
  try {
    const result = await database.query(
      `SELECT h.*, u.lifeline_id, u.email, u.phone
       FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE h.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Hospital');
    }

    const hospital = result.rows[0];
    hospital.departments = hospital.departments || [];

    return hospital;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding hospital by user ID', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get hospital by ID
 */
export const findById = async (hospitalId) => {
  try {
    const result = await database.query(
      `SELECT h.*, u.lifeline_id, u.email, u.phone
       FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE h.id = $1`,
      [hospitalId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Hospital');
    }

    const hospital = result.rows[0];
    hospital.departments = hospital.departments || [];

    return hospital;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding hospital by ID', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Update hospital profile
 */
export const updateProfile = async (hospitalId, updates) => {
  const allowedFields = [
    'hospital_name',
    'address',
    'hospital_type',
    'number_of_beds',
    'available_beds',
    'has_emergency',
    'has_icu',
    'departments',
    'accreditation',
  ];

  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      
      // Handle JSON fields
      if (key === 'departments') {
        values.push(JSON.stringify(updates[key]));
      } else {
        values.push(updates[key]);
      }
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(hospitalId);

  try {
    const result = await database.query(
      `UPDATE hospitals
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Hospital');
    }

    logger.info('Hospital profile updated', { hospitalId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating hospital profile', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Update bed availability
 */
export const updateBedAvailability = async (hospitalId, availableBeds) => {
  try {
    const result = await database.query(
      `UPDATE hospitals
       SET available_beds = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [availableBeds, hospitalId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Hospital');
    }

    logger.info('Hospital bed availability updated', { hospitalId, availableBeds });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating bed availability', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Update license information
 */
export const updateLicense = async (hospitalId, licenseData) => {
  const { licenseNumber, licenseExpiryDate } = licenseData;

  try {
    const result = await database.query(
      `UPDATE hospitals
       SET license_number = $1,
           license_expiry_date = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [licenseNumber, licenseExpiryDate, hospitalId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Hospital');
    }

    logger.info('Hospital license updated', { hospitalId });

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'hospitals_license_number_key') {
      throw new ConflictError('License number already exists');
    }
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating hospital license', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Update verification status
 */
export const updateVerificationStatus = async (hospitalId, status, verifiedAt = null) => {
  try {
    const result = await database.query(
      `UPDATE hospitals
       SET verification_status = $1,
           verified_at = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, verifiedAt || (status === 'verified' ? new Date() : null), hospitalId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Hospital');
    }

    logger.info('Hospital verification status updated', { hospitalId, status });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating verification status', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Update rating
 */
export const updateRating = async (hospitalId, newRating, reviewCount) => {
  try {
    const result = await database.query(
      `UPDATE hospitals
       SET average_rating = $1,
           total_reviews = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newRating, reviewCount, hospitalId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Hospital');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating hospital rating', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Get all hospitals with filters
 */
export const findAll = async (options = {}) => {
  const {
    hospitalType = null,
    verificationStatus = null,
    hasEmergency = null,
    hasICU = null,
    hasAvailableBeds = null,
    minRating = null,
    isActive = true,
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = options;

  try {
    let query = `
      SELECT h.*, u.lifeline_id, u.email, u.phone, u.is_active
      FROM hospitals h
      JOIN users u ON h.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (hospitalType) {
      paramCount++;
      query += ` AND h.hospital_type = $${paramCount}`;
      params.push(hospitalType);
    }

    if (verificationStatus) {
      paramCount++;
      query += ` AND h.verification_status = $${paramCount}`;
      params.push(verificationStatus);
    }

    if (hasEmergency !== null) {
      paramCount++;
      query += ` AND h.has_emergency = $${paramCount}`;
      params.push(hasEmergency);
    }

    if (hasICU !== null) {
      paramCount++;
      query += ` AND h.has_icu = $${paramCount}`;
      params.push(hasICU);
    }

    if (hasAvailableBeds) {
      query += ` AND h.available_beds > 0`;
    }

    if (minRating) {
      paramCount++;
      query += ` AND h.average_rating >= $${paramCount}`;
      params.push(minRating);
    }

    if (isActive !== null) {
      paramCount++;
      query += ` AND u.is_active = $${paramCount}`;
      params.push(isActive);
    }

    query += ` ORDER BY h.${sortBy} ${sortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error finding all hospitals', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Search hospitals
 */
export const searchHospitals = async (searchTerm, options = {}) => {
  const { limit = 50, offset = 0, verificationStatus = 'verified' } = options;

  try {
    const result = await database.query(
      `SELECT h.*, u.lifeline_id, u.email, u.phone
       FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE h.verification_status = $1
         AND (
           LOWER(h.hospital_name) LIKE LOWER($2) OR
           LOWER(h.address) LIKE LOWER($2) OR
           LOWER(h.hospital_type) LIKE LOWER($2) OR
           u.lifeline_id LIKE $2
         )
       ORDER BY h.average_rating DESC, h.created_at DESC
       LIMIT $3 OFFSET $4`,
      [verificationStatus, `%${searchTerm}%`, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching hospitals', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Find hospitals by location
 */
export const findByLocation = async (location, options = {}) => {
  const { limit = 50, offset = 0, verificationStatus = 'verified' } = options;

  try {
    const result = await database.query(
      `SELECT h.*, u.lifeline_id, u.email, u.phone
       FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE h.verification_status = $1
         AND LOWER(h.address) LIKE LOWER($2)
         AND u.is_active = true
       ORDER BY h.average_rating DESC, h.total_surgeries DESC
       LIMIT $3 OFFSET $4`,
      [verificationStatus, `%${location}%`, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error finding hospitals by location', {
      error: error.message,
      location,
    });
    throw error;
  }
};

/**
 * Get hospitals with emergency services
 */
export const findWithEmergency = async (options = {}) => {
  const { limit = 50, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT h.*, u.lifeline_id, u.email, u.phone
       FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE h.has_emergency = true
         AND h.verification_status = 'verified'
         AND u.is_active = true
       ORDER BY h.average_rating DESC, h.available_beds DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error finding hospitals with emergency', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get hospitals with available beds
 */
export const findWithAvailableBeds = async (options = {}) => {
  const { limit = 50, offset = 0, minBeds = 1 } = options;

  try {
    const result = await database.query(
      `SELECT h.*, u.lifeline_id, u.email, u.phone
       FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE h.available_beds >= $1
         AND h.verification_status = 'verified'
         AND u.is_active = true
       ORDER BY h.available_beds DESC, h.average_rating DESC
       LIMIT $2 OFFSET $3`,
      [minBeds, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error finding hospitals with available beds', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get top-rated hospitals
 */
export const getTopRated = async (limit = 10) => {
  try {
    const result = await database.query(
      `SELECT h.*, u.lifeline_id, u.phone
       FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE h.verification_status = 'verified'
         AND h.total_reviews >= 5
         AND u.is_active = true
       ORDER BY h.average_rating DESC, h.total_reviews DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting top-rated hospitals', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Increment surgery count
 */
export const incrementSurgeries = async (hospitalId) => {
  try {
    await database.query(
      `UPDATE hospitals
       SET total_surgeries = total_surgeries + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [hospitalId]
    );

    logger.debug('Hospital surgery count incremented', { hospitalId });
  } catch (error) {
    logger.error('Error incrementing surgery count', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Get hospital statistics
 */
export const getStatistics = async (hospitalId, startDate, endDate) => {
  try {
    const result = await database.query(
      `SELECT 
        (SELECT COUNT(*) FROM surgeries 
         WHERE hospital_id = $1 AND created_at BETWEEN $2 AND $3) as surgeries,
        (SELECT COUNT(*) FROM consultations 
         WHERE hospital_id = $1 AND created_at BETWEEN $2 AND $3) as consultations,
        (SELECT COUNT(DISTINCT patient_id) FROM surgeries 
         WHERE hospital_id = $1 AND created_at BETWEEN $2 AND $3) as unique_patients,
        (SELECT COALESCE(SUM(total_amount), 0) FROM payment_records 
         WHERE provider_id = (SELECT user_id FROM hospitals WHERE id = $1)
         AND created_at BETWEEN $2 AND $3) as total_earnings`,
      [hospitalId, startDate, endDate]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting hospital statistics', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

/**
 * Count hospitals
 */
export const countHospitals = async (filters = {}) => {
  const { hospitalType = null, verificationStatus = null, hasEmergency = null } = filters;

  try {
    let query = 'SELECT COUNT(*) as count FROM hospitals WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (hospitalType) {
      paramCount++;
      query += ` AND hospital_type = $${paramCount}`;
      params.push(hospitalType);
    }

    if (verificationStatus) {
      paramCount++;
      query += ` AND verification_status = $${paramCount}`;
      params.push(verificationStatus);
    }

    if (hasEmergency !== null) {
      paramCount++;
      query += ` AND has_emergency = $${paramCount}`;
      params.push(hasEmergency);
    }

    const result = await database.query(query, params);

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error counting hospitals', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get hospitals pending verification
 */
export const getPendingVerification = async (options = {}) => {
  const { limit = 50, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT h.*, u.lifeline_id, u.email, u.phone
       FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE h.verification_status = 'pending'
       ORDER BY h.created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting hospitals pending verification', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get expiring licenses
 */
export const getExpiringLicenses = async (daysThreshold = 30) => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const result = await database.query(
      `SELECT h.*, u.lifeline_id, u.email, u.phone
       FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE h.license_expiry_date <= $1
         AND h.license_expiry_date > NOW()
         AND h.verification_status = 'verified'
       ORDER BY h.license_expiry_date ASC`,
      [thresholdDate]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting expiring licenses', {
      error: error.message,
    });
    throw error;
  }
};

export default {
  createHospital,
  findByUserId,
  findById,
  updateProfile,
  updateBedAvailability,
  updateLicense,
  updateVerificationStatus,
  updateRating,
  findAll,
  searchHospitals,
  findByLocation,
  findWithEmergency,
  findWithAvailableBeds,
  getTopRated,
  incrementSurgeries,
  getStatistics,
  countHospitals,
  getPendingVerification,
  getExpiringLicenses,
};
