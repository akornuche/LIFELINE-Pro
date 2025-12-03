import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';

/**
 * Pharmacy Repository
 * Database operations for pharmacy-specific data
 */

/**
 * Create pharmacy record
 */
export const createPharmacy = async (userId, pharmacyData) => {
  const {
    pharmacyName,
    address,
    licenseNumber,
    licenseExpiryDate,
    operatingHours = null,
    hasDelivery = false,
    deliveryRadius = null,
  } = pharmacyData;

  try {
    const result = await database.query(
      `INSERT INTO pharmacies (
        user_id, pharmacy_name, address, license_number, 
        license_expiry_date, operating_hours, has_delivery, delivery_radius
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userId,
        pharmacyName,
        address,
        licenseNumber,
        licenseExpiryDate,
        operatingHours ? JSON.stringify(operatingHours) : null,
        hasDelivery,
        deliveryRadius,
      ]
    );

    logger.info('Pharmacy record created', { userId, pharmacyId: result.rows[0].id });

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint === 'pharmacies_user_id_key') {
        throw new ConflictError('Pharmacy record already exists for this user');
      }
      if (error.constraint === 'pharmacies_license_number_key') {
        throw new ConflictError('License number already exists');
      }
    }
    logger.error('Error creating pharmacy record', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get pharmacy by user ID
 */
export const findByUserId = async (userId) => {
  try {
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.email, u.phone
       FROM pharmacies p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pharmacy');
    }

    const pharmacy = result.rows[0];
    pharmacy.operating_hours = pharmacy.operating_hours || {};

    return pharmacy;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding pharmacy by user ID', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get pharmacy by ID
 */
export const findById = async (pharmacyId) => {
  try {
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.email, u.phone
       FROM pharmacies p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [pharmacyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pharmacy');
    }

    const pharmacy = result.rows[0];
    pharmacy.operating_hours = pharmacy.operating_hours || {};

    return pharmacy;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding pharmacy by ID', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Update pharmacy profile
 */
export const updateProfile = async (pharmacyId, updates) => {
  const allowedFields = [
    'pharmacy_name',
    'address',
    'operating_hours',
    'has_delivery',
    'delivery_radius',
  ];

  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      
      // Handle JSON fields
      if (key === 'operating_hours') {
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
  values.push(pharmacyId);

  try {
    const result = await database.query(
      `UPDATE pharmacies
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pharmacy');
    }

    logger.info('Pharmacy profile updated', { pharmacyId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating pharmacy profile', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Update license information
 */
export const updateLicense = async (pharmacyId, licenseData) => {
  const { licenseNumber, licenseExpiryDate } = licenseData;

  try {
    const result = await database.query(
      `UPDATE pharmacies
       SET license_number = $1,
           license_expiry_date = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [licenseNumber, licenseExpiryDate, pharmacyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pharmacy');
    }

    logger.info('Pharmacy license updated', { pharmacyId });

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'pharmacies_license_number_key') {
      throw new ConflictError('License number already exists');
    }
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating pharmacy license', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Update verification status
 */
export const updateVerificationStatus = async (pharmacyId, status, verifiedAt = null) => {
  try {
    const result = await database.query(
      `UPDATE pharmacies
       SET verification_status = $1,
           verified_at = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, verifiedAt || (status === 'verified' ? new Date() : null), pharmacyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pharmacy');
    }

    logger.info('Pharmacy verification status updated', { pharmacyId, status });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating verification status', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Update rating
 */
export const updateRating = async (pharmacyId, newRating, reviewCount) => {
  try {
    const result = await database.query(
      `UPDATE pharmacies
       SET average_rating = $1,
           total_reviews = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newRating, reviewCount, pharmacyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pharmacy');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating pharmacy rating', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Get all pharmacies with filters
 */
export const findAll = async (options = {}) => {
  const {
    verificationStatus = null,
    hasDelivery = null,
    minRating = null,
    isActive = true,
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = options;

  try {
    let query = `
      SELECT p.*, u.lifeline_id, u.email, u.phone, u.is_active
      FROM pharmacies p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (verificationStatus) {
      paramCount++;
      query += ` AND p.verification_status = $${paramCount}`;
      params.push(verificationStatus);
    }

    if (hasDelivery !== null) {
      paramCount++;
      query += ` AND p.has_delivery = $${paramCount}`;
      params.push(hasDelivery);
    }

    if (minRating) {
      paramCount++;
      query += ` AND p.average_rating >= $${paramCount}`;
      params.push(minRating);
    }

    if (isActive !== null) {
      paramCount++;
      query += ` AND u.is_active = $${paramCount}`;
      params.push(isActive);
    }

    query += ` ORDER BY p.${sortBy} ${sortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error finding all pharmacies', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Search pharmacies
 */
export const searchPharmacies = async (searchTerm, options = {}) => {
  const { limit = 50, offset = 0, verificationStatus = 'verified' } = options;

  try {
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.email, u.phone
       FROM pharmacies p
       JOIN users u ON p.user_id = u.id
       WHERE p.verification_status = $1
         AND (
           LOWER(p.pharmacy_name) LIKE LOWER($2) OR
           LOWER(p.address) LIKE LOWER($2) OR
           u.lifeline_id LIKE $2
         )
       ORDER BY p.average_rating DESC, p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [verificationStatus, `%${searchTerm}%`, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching pharmacies', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Find pharmacies by location (within radius)
 */
export const findByLocation = async (location, radiusKm = 10, options = {}) => {
  const { limit = 50, offset = 0, verificationStatus = 'verified' } = options;

  try {
    // Simple location-based search (in production, use PostGIS for actual distance calculation)
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.email, u.phone
       FROM pharmacies p
       JOIN users u ON p.user_id = u.id
       WHERE p.verification_status = $1
         AND LOWER(p.address) LIKE LOWER($2)
         AND u.is_active = true
       ORDER BY p.average_rating DESC, p.total_prescriptions DESC
       LIMIT $3 OFFSET $4`,
      [verificationStatus, `%${location}%`, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error finding pharmacies by location', {
      error: error.message,
      location,
    });
    throw error;
  }
};

/**
 * Get pharmacies with delivery
 */
export const findWithDelivery = async (options = {}) => {
  const { limit = 50, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.email, u.phone
       FROM pharmacies p
       JOIN users u ON p.user_id = u.id
       WHERE p.has_delivery = true
         AND p.verification_status = 'verified'
         AND u.is_active = true
       ORDER BY p.average_rating DESC, p.total_prescriptions DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error finding pharmacies with delivery', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get top-rated pharmacies
 */
export const getTopRated = async (limit = 10) => {
  try {
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.phone
       FROM pharmacies p
       JOIN users u ON p.user_id = u.id
       WHERE p.verification_status = 'verified'
         AND p.total_reviews >= 5
         AND u.is_active = true
       ORDER BY p.average_rating DESC, p.total_reviews DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting top-rated pharmacies', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Increment prescription count
 */
export const incrementPrescriptions = async (pharmacyId) => {
  try {
    await database.query(
      `UPDATE pharmacies
       SET total_prescriptions = total_prescriptions + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [pharmacyId]
    );

    logger.debug('Pharmacy prescription count incremented', { pharmacyId });
  } catch (error) {
    logger.error('Error incrementing prescription count', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Get pharmacy statistics
 */
export const getStatistics = async (pharmacyId, startDate, endDate) => {
  try {
    const result = await database.query(
      `SELECT 
        (SELECT COUNT(*) FROM prescriptions 
         WHERE pharmacy_id = $1 AND dispensed_at BETWEEN $2 AND $3 
         AND status = 'dispensed') as prescriptions_dispensed,
        (SELECT COUNT(DISTINCT patient_id) FROM prescriptions 
         WHERE pharmacy_id = $1 AND dispensed_at BETWEEN $2 AND $3) as unique_patients,
        (SELECT COALESCE(SUM(total_amount), 0) FROM payment_records 
         WHERE provider_id = (SELECT user_id FROM pharmacies WHERE id = $1)
         AND created_at BETWEEN $2 AND $3) as total_earnings`,
      [pharmacyId, startDate, endDate]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting pharmacy statistics', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

/**
 * Count pharmacies
 */
export const countPharmacies = async (filters = {}) => {
  const { verificationStatus = null, hasDelivery = null } = filters;

  try {
    let query = 'SELECT COUNT(*) as count FROM pharmacies WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (verificationStatus) {
      paramCount++;
      query += ` AND verification_status = $${paramCount}`;
      params.push(verificationStatus);
    }

    if (hasDelivery !== null) {
      paramCount++;
      query += ` AND has_delivery = $${paramCount}`;
      params.push(hasDelivery);
    }

    const result = await database.query(query, params);

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error counting pharmacies', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get pharmacies pending verification
 */
export const getPendingVerification = async (options = {}) => {
  const { limit = 50, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.email, u.phone
       FROM pharmacies p
       JOIN users u ON p.user_id = u.id
       WHERE p.verification_status = 'pending'
       ORDER BY p.created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting pharmacies pending verification', {
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
      `SELECT p.*, u.lifeline_id, u.email, u.phone
       FROM pharmacies p
       JOIN users u ON p.user_id = u.id
       WHERE p.license_expiry_date <= $1
         AND p.license_expiry_date > NOW()
         AND p.verification_status = 'verified'
       ORDER BY p.license_expiry_date ASC`,
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
  createPharmacy,
  findByUserId,
  findById,
  updateProfile,
  updateLicense,
  updateVerificationStatus,
  updateRating,
  findAll,
  searchPharmacies,
  findByLocation,
  findWithDelivery,
  getTopRated,
  incrementPrescriptions,
  getStatistics,
  countPharmacies,
  getPendingVerification,
  getExpiringLicenses,
};
