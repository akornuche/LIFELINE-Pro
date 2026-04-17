import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { NotFoundError, BusinessLogicError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get beds for a hospital
 */
export const findByHospitalId = async (hospitalId, options = {}) => {
  const { ward = null, status = null, search = null, limit = 100, offset = 0 } = options;

  try {
    let query = 'SELECT * FROM beds WHERE hospital_id = $1';
    const params = [hospitalId];
    let paramCount = 1;

    if (ward) {
      paramCount++;
      query += ` AND ward = $${paramCount}`;
      params.push(ward);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (bed_number LIKE $${paramCount} OR patient_name LIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY ward, bed_number LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting beds', { error: error.message, hospitalId });
    throw error;
  }
};

/**
 * Find bed by ID
 */
export const findById = async (bedId) => {
  try {
    const result = await database.query('SELECT * FROM beds WHERE id = $1', [bedId]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Bed');
    }
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding bed', { error: error.message, bedId });
    throw error;
  }
};

/**
 * Create a bed
 */
export const create = async (bedData) => {
  const { hospitalId, bedNumber, ward = 'General Ward', status = 'available', patientName = null, notes = null } = bedData;

  try {
    const id = uuidv4();
    const result = await database.query(
      `INSERT INTO beds (id, hospital_id, bed_number, ward, status, patient_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, hospitalId, bedNumber, ward, status, patientName, notes]
    );

    return result.rows[0];
  } catch (error) {
    if (error.message?.includes('UNIQUE')) {
      throw new BusinessLogicError(`Bed number ${bedNumber} already exists in this hospital`);
    }
    logger.error('Error creating bed', { error: error.message, hospitalId });
    throw error;
  }
};

/**
 * Update a bed
 */
export const update = async (bedId, updateData) => {
  const { status, patientName, ward, notes } = updateData;

  try {
    const fields = [];
    const params = [];
    let paramCount = 0;

    if (status !== undefined) {
      paramCount++;
      fields.push(`status = $${paramCount}`);
      params.push(status);
    }
    if (patientName !== undefined) {
      paramCount++;
      fields.push(`patient_name = $${paramCount}`);
      params.push(patientName);
    }
    if (ward !== undefined) {
      paramCount++;
      fields.push(`ward = $${paramCount}`);
      params.push(ward);
    }
    if (notes !== undefined) {
      paramCount++;
      fields.push(`notes = $${paramCount}`);
      params.push(notes);
    }

    if (fields.length === 0) {
      return await findById(bedId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    paramCount++;
    params.push(bedId);

    const result = await database.query(
      `UPDATE beds SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Bed');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating bed', { error: error.message, bedId });
    throw error;
  }
};

/**
 * Delete a bed
 */
export const remove = async (bedId) => {
  try {
    const result = await database.query('DELETE FROM beds WHERE id = $1 RETURNING *', [bedId]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Bed');
    }
    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error deleting bed', { error: error.message, bedId });
    throw error;
  }
};

/**
 * Get bed counts by ward for a hospital
 */
export const getCounts = async (hospitalId) => {
  try {
    const result = await database.query(
      `SELECT 
        ward,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
       FROM beds
       WHERE hospital_id = $1
       GROUP BY ward`,
      [hospitalId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting bed counts', { error: error.message, hospitalId });
    throw error;
  }
};

export default {
  findByHospitalId,
  findById,
  create,
  update,
  remove,
  getCounts,
};
