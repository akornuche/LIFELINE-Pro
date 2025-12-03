import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js';

/**
 * Doctor Repository
 * Database operations for doctor-specific data
 */

/**
 * Create doctor record
 */
export const createDoctor = async (userId, doctorData) => {
  const {
    specialization,
    licenseNumber,
    licenseExpiryDate,
    yearsOfExperience,
    qualifications = [],
    hospitalAffiliations = [],
    consultationFee,
    bio = null,
  } = doctorData;

  try {
    const result = await database.query(
      `INSERT INTO doctors (
        user_id, specialization, license_number, license_expiry_date,
        years_of_experience, qualifications, hospital_affiliations,
        consultation_fee, bio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        userId,
        specialization,
        licenseNumber,
        licenseExpiryDate,
        yearsOfExperience,
        JSON.stringify(qualifications),
        JSON.stringify(hospitalAffiliations),
        consultationFee,
        bio,
      ]
    );

    logger.info('Doctor record created', { userId, doctorId: result.rows[0].id });

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint === 'doctors_user_id_key') {
        throw new ConflictError('Doctor record already exists for this user');
      }
      if (error.constraint === 'doctors_license_number_key') {
        throw new ConflictError('License number already exists');
      }
    }
    logger.error('Error creating doctor record', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get doctor by user ID
 */
export const findByUserId = async (userId) => {
  try {
    const result = await database.query(
      `SELECT d.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Doctor');
    }

    const doctor = result.rows[0];
    doctor.qualifications = doctor.qualifications || [];
    doctor.hospital_affiliations = doctor.hospital_affiliations || [];

    return doctor;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding doctor by user ID', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get doctor by ID
 */
export const findById = async (doctorId) => {
  try {
    const result = await database.query(
      `SELECT d.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [doctorId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Doctor');
    }

    const doctor = result.rows[0];
    doctor.qualifications = doctor.qualifications || [];
    doctor.hospital_affiliations = doctor.hospital_affiliations || [];

    return doctor;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding doctor by ID', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

/**
 * Update doctor profile
 */
export const updateProfile = async (doctorId, updates) => {
  const allowedFields = [
    'specialization',
    'years_of_experience',
    'qualifications',
    'hospital_affiliations',
    'consultation_fee',
    'bio',
  ];

  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      
      // Handle JSON fields
      if (key === 'qualifications' || key === 'hospital_affiliations') {
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
  values.push(doctorId);

  try {
    const result = await database.query(
      `UPDATE doctors
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Doctor');
    }

    logger.info('Doctor profile updated', { doctorId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating doctor profile', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

/**
 * Update license information
 */
export const updateLicense = async (doctorId, licenseData) => {
  const { licenseNumber, licenseExpiryDate } = licenseData;

  try {
    const result = await database.query(
      `UPDATE doctors
       SET license_number = $1,
           license_expiry_date = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [licenseNumber, licenseExpiryDate, doctorId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Doctor');
    }

    logger.info('Doctor license updated', { doctorId });

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'doctors_license_number_key') {
      throw new ConflictError('License number already exists');
    }
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating doctor license', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

/**
 * Update verification status
 */
export const updateVerificationStatus = async (doctorId, status, verifiedAt = null) => {
  try {
    const result = await database.query(
      `UPDATE doctors
       SET verification_status = $1,
           verified_at = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, verifiedAt || (status === 'verified' ? new Date() : null), doctorId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Doctor');
    }

    logger.info('Doctor verification status updated', { doctorId, status });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating verification status', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

/**
 * Update rating
 */
export const updateRating = async (doctorId, newRating, reviewCount) => {
  try {
    const result = await database.query(
      `UPDATE doctors
       SET average_rating = $1,
           total_reviews = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newRating, reviewCount, doctorId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Doctor');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating doctor rating', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

/**
 * Get all doctors with filters
 */
export const findAll = async (options = {}) => {
  const {
    specialization = null,
    verificationStatus = null,
    minRating = null,
    isActive = true,
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = options;

  try {
    let query = `
      SELECT d.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone, 
             u.profile_image_url, u.status
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (specialization) {
      paramCount++;
      query += ` AND LOWER(d.specialization) = LOWER($${paramCount})`;
      params.push(specialization);
    }

    if (verificationStatus) {
      paramCount++;
      query += ` AND d.verification_status = $${paramCount}`;
      params.push(verificationStatus);
    }

    if (minRating) {
      paramCount++;
      query += ` AND d.average_rating >= $${paramCount}`;
      params.push(minRating);
    }

    if (isActive !== null) {
      paramCount++;
      query += ` AND u.is_active = $${paramCount}`;
      params.push(isActive);
    }

    query += ` ORDER BY d.${sortBy} ${sortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error finding all doctors', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Search doctors
 */
export const searchDoctors = async (searchTerm, options = {}) => {
  const { limit = 50, offset = 0, verificationStatus = 'verified' } = options;

  try {
    const result = await database.query(
      `SELECT d.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.verification_status = $1
         AND (
           LOWER(u.first_name) LIKE LOWER($2) OR
           LOWER(u.last_name) LIKE LOWER($2) OR
           LOWER(d.specialization) LIKE LOWER($2) OR
           u.lifeline_id LIKE $2
         )
       ORDER BY d.average_rating DESC, d.created_at DESC
       LIMIT $3 OFFSET $4`,
      [verificationStatus, `%${searchTerm}%`, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching doctors', {
      error: error.message,
      searchTerm,
    });
    throw error;
  }
};

/**
 * Get doctors by specialization
 */
export const findBySpecialization = async (specialization, options = {}) => {
  const { limit = 50, offset = 0, verificationStatus = 'verified' } = options;

  try {
    const result = await database.query(
      `SELECT d.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE LOWER(d.specialization) = LOWER($1)
         AND d.verification_status = $2
         AND u.status = 'active'
       ORDER BY d.average_rating DESC, d.total_consultations DESC
       LIMIT $3 OFFSET $4`,
      [specialization, verificationStatus, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error finding doctors by specialization', {
      error: error.message,
      specialization,
    });
    throw error;
  }
};

/**
 * Get top-rated doctors
 */
export const getTopRated = async (limit = 10) => {
  try {
    const result = await database.query(
      `SELECT d.*, u.lifeline_id, u.first_name, u.last_name, u.profile_image_url
       FROM doctors d
       INNER JOIN users u ON d.user_id = u.id
       WHERE d.verification_status = 'verified'
         AND d.total_reviews >= 5
         AND u.is_active = true
       ORDER BY d.average_rating DESC, d.total_reviews DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting top-rated doctors', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Increment consultation count
 */
export const incrementConsultations = async (doctorId) => {
  try {
    await database.query(
      `UPDATE doctors
       SET total_consultations = total_consultations + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [doctorId]
    );

    logger.debug('Doctor consultation count incremented', { doctorId });
  } catch (error) {
    logger.error('Error incrementing consultation count', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

/**
 * Get doctor statistics
 */
export const getStatistics = async (doctorId, startDate, endDate) => {
  try {
    const result = await database.query(
      `SELECT 
        (SELECT COUNT(*) FROM consultations 
         WHERE doctor_id = $1 AND created_at BETWEEN $2 AND $3) as consultations,
        (SELECT COUNT(*) FROM prescriptions 
         WHERE doctor_id = $1 AND created_at BETWEEN $2 AND $3) as prescriptions,
        (SELECT COUNT(*) FROM surgeries 
         WHERE doctor_id = $1 AND created_at BETWEEN $2 AND $3) as surgeries,
        (SELECT COALESCE(SUM(total_amount), 0) FROM payment_records 
         WHERE provider_id = (SELECT user_id FROM doctors WHERE id = $1)
         AND created_at BETWEEN $2 AND $3) as total_earnings`,
      [doctorId, startDate, endDate]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting doctor statistics', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

/**
 * Count doctors
 */
export const countDoctors = async (filters = {}) => {
  const { specialization = null, verificationStatus = null } = filters;

  try {
    let query = 'SELECT COUNT(*) as count FROM doctors WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (specialization) {
      paramCount++;
      query += ` AND LOWER(specialization) = LOWER($${paramCount})`;
      params.push(specialization);
    }

    if (verificationStatus) {
      paramCount++;
      query += ` AND verification_status = $${paramCount}`;
      params.push(verificationStatus);
    }

    const result = await database.query(query, params);

    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error('Error counting doctors', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get doctors pending verification
 */
export const getPendingVerification = async (options = {}) => {
  const { limit = 50, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT d.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.verification_status = 'pending'
       ORDER BY d.created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting doctors pending verification', {
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
      `SELECT d.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.license_expiry_date <= $1
         AND d.license_expiry_date > NOW()
         AND d.verification_status = 'verified'
       ORDER BY d.license_expiry_date ASC`,
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

/**
 * Get all specializations
 */
export const getAllSpecializations = async () => {
  try {
    const result = await database.query(
      `SELECT DISTINCT specialization, COUNT(*) as doctor_count
       FROM doctors
       WHERE verification_status = 'verified'
       GROUP BY specialization
       ORDER BY doctor_count DESC, specialization ASC`
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting specializations', {
      error: error.message,
    });
    throw error;
  }
};

export default {
  createDoctor,
  findByUserId,
  findById,
  updateProfile,
  updateLicense,
  updateVerificationStatus,
  updateRating,
  findAll,
  searchDoctors,
  findBySpecialization,
  getTopRated,
  incrementConsultations,
  getStatistics,
  countDoctors,
  getPendingVerification,
  getExpiringLicenses,
  getAllSpecializations,
};
