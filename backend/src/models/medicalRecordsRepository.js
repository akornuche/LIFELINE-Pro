import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { NotFoundError, BusinessLogicError } from '../middleware/errorHandler.js';

/**
 * Medical Records Repository
 * Database operations for consultations, prescriptions, surgeries, and lab tests
 */

// ============= CONSULTATIONS =============

/**
 * Create consultation
 */
export const createConsultation = async (consultationData) => {
  const {
    patientId,
    doctorId,
    hospitalId = null,
    dependentId = null,
    consultationType,
    reasonForVisit,
    appointmentDate,
    status = 'scheduled',
  } = consultationData;

  try {
    const result = await database.query(
      `INSERT INTO consultations (
        patient_id, doctor_id, hospital_id, dependent_id,
        consultation_type, reason_for_visit, appointment_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        patientId,
        doctorId,
        hospitalId,
        dependentId,
        consultationType,
        reasonForVisit,
        appointmentDate,
        status,
      ]
    );

    logger.info('Consultation created', {
      consultationId: result.rows[0].id,
      patientId,
      doctorId,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating consultation', {
      error: error.message,
      patientId,
      doctorId,
    });
    throw error;
  }
};

/**
 * Get consultation by ID
 */
export const findConsultationById = async (consultationId) => {
  try {
    const result = await database.query(
      `SELECT c.*, 
              p.lifeline_id as patient_lifeline_id,
              d.lifeline_id as doctor_lifeline_id,
              u1.first_name as patient_first_name, u1.last_name as patient_last_name,
              u2.first_name as doctor_first_name, u2.last_name as doctor_last_name,
              doc.specialization
       FROM consultations c
       JOIN patients pat ON c.patient_id = pat.id
       JOIN users u1 ON pat.user_id = u1.id
       JOIN doctors doc ON c.doctor_id = doc.id
       JOIN users u2 ON doc.user_id = u2.id
       LEFT JOIN users p ON pat.user_id = p.id
       LEFT JOIN users d ON doc.user_id = d.id
       WHERE c.id = $1`,
      [consultationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Consultation');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding consultation', {
      error: error.message,
      consultationId,
    });
    throw error;
  }
};

/**
 * Update consultation
 */
export const updateConsultation = async (consultationId, updates) => {
  const allowedFields = [
    'status',
    'diagnosis',
    'symptoms',
    'findings',
    'treatment',
    'follow_up_date',
    'notes',
    'total_cost',
  ];

  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(consultationId);

  try {
    const result = await database.query(
      `UPDATE consultations
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Consultation');
    }

    logger.info('Consultation updated', { consultationId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating consultation', {
      error: error.message,
      consultationId,
    });
    throw error;
  }
};

/**
 * Get consultations for patient
 */
export const getPatientConsultations = async (patientId, options = {}) => {
  const { limit = 50, offset = 0, status = null } = options;

  try {
    let query = `
      SELECT c.*, 
             u.first_name as doctor_first_name, u.last_name as doctor_last_name,
             doc.specialization
      FROM consultations c
      JOIN doctors doc ON c.doctor_id = doc.id
      JOIN users u ON doc.user_id = u.id
      WHERE c.patient_id = $1
    `;
    const params = [patientId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY c.appointment_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting patient consultations', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get consultations for doctor
 */
export const getDoctorConsultations = async (doctorId, options = {}) => {
  const { limit = 50, offset = 0, status = null, date = null } = options;

  try {
    let query = `
      SELECT c.*, 
             u.first_name as patient_first_name, u.last_name as patient_last_name,
             pu.lifeline_id as patient_lifeline_id
      FROM consultations c
      JOIN patients pat ON c.patient_id = pat.id
      JOIN users u ON pat.user_id = u.id
      JOIN users pu ON pat.user_id = pu.id
      WHERE c.doctor_id = $1
    `;
    const params = [doctorId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
    }

    if (date) {
      paramCount++;
      query += ` AND DATE(c.appointment_date) = $${paramCount}`;
      params.push(date);
    }

    query += ` ORDER BY c.appointment_date ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting doctor consultations', {
      error: error.message,
      doctorId,
    });
    throw error;
  }
};

// ============= PRESCRIPTIONS =============

/**
 * Create prescription
 */
export const createPrescription = async (prescriptionData) => {
  const {
    consultationId,
    patientId,
    doctorId,
    pharmacyId = null,
    medications,
    diagnosis,
    notes = null,
    refillsAllowed = 0,
    expiryDate,
  } = prescriptionData;

  try {
    const result = await database.query(
      `INSERT INTO prescriptions (
        consultation_id, patient_id, doctor_id, pharmacy_id,
        medications, diagnosis, notes, refills_allowed, expiry_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *`,
      [
        consultationId,
        patientId,
        doctorId,
        pharmacyId,
        JSON.stringify(medications),
        diagnosis,
        notes,
        refillsAllowed,
        expiryDate,
      ]
    );

    logger.info('Prescription created', {
      prescriptionId: result.rows[0].id,
      patientId,
      doctorId,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating prescription', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get prescription by ID
 */
export const findPrescriptionById = async (prescriptionId) => {
  try {
    const result = await database.query(
      `SELECT p.*, 
              pat.lifeline_id as patient_lifeline_id,
              u1.first_name as patient_first_name, u1.last_name as patient_last_name,
              u2.first_name as doctor_first_name, u2.last_name as doctor_last_name
       FROM prescriptions p
       JOIN patients pat ON p.patient_id = pat.id
       JOIN users u1 ON pat.user_id = u1.id
       JOIN doctors doc ON p.doctor_id = doc.id
       JOIN users u2 ON doc.user_id = u2.id
       WHERE p.id = $1`,
      [prescriptionId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Prescription');
    }

    const prescription = result.rows[0];
    prescription.medications = prescription.medications || [];

    return prescription;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding prescription', {
      error: error.message,
      prescriptionId,
    });
    throw error;
  }
};

/**
 * Update prescription status
 */
export const updatePrescriptionStatus = async (prescriptionId, status, pharmacyId = null, dispensedAt = null) => {
  try {
    const result = await database.query(
      `UPDATE prescriptions
       SET status = $1, 
           pharmacy_id = COALESCE($2, pharmacy_id),
           dispensed_at = COALESCE($3, dispensed_at),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, pharmacyId, dispensedAt, prescriptionId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Prescription');
    }

    logger.info('Prescription status updated', { prescriptionId, status });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating prescription status', {
      error: error.message,
      prescriptionId,
    });
    throw error;
  }
};

/**
 * Get patient prescriptions
 */
export const getPatientPrescriptions = async (patientId, options = {}) => {
  const { limit = 50, offset = 0, status = null } = options;

  try {
    let query = `
      SELECT p.*, 
             u.first_name as doctor_first_name, u.last_name as doctor_last_name
      FROM prescriptions p
      JOIN doctors doc ON p.doctor_id = doc.id
      JOIN users u ON doc.user_id = u.id
      WHERE p.patient_id = $1
    `;
    const params = [patientId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting patient prescriptions', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get pharmacy prescriptions
 */
export const getPharmacyPrescriptions = async (pharmacyId, options = {}) => {
  const { limit = 50, offset = 0, status = 'pending' } = options;

  try {
    const result = await database.query(
      `SELECT p.*, 
              u1.first_name as patient_first_name, u1.last_name as patient_last_name,
              pat.lifeline_id as patient_lifeline_id
       FROM prescriptions p
       JOIN patients pat ON p.patient_id = pat.id
       JOIN users u1 ON pat.user_id = u1.id
       WHERE (p.pharmacy_id = $1 OR p.status = 'pending')
         AND p.status = $2
       ORDER BY p.created_at DESC
       LIMIT $3 OFFSET $4`,
      [pharmacyId, status, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting pharmacy prescriptions', {
      error: error.message,
      pharmacyId,
    });
    throw error;
  }
};

// ============= SURGERIES =============

/**
 * Create surgery
 */
export const createSurgery = async (surgeryData) => {
  const {
    patientId,
    doctorId,
    hospitalId,
    surgeryType,
    surgeryName,
    diagnosis,
    scheduledDate,
    estimatedDuration,
    estimatedCost,
    status = 'scheduled',
  } = surgeryData;

  try {
    const result = await database.query(
      `INSERT INTO surgeries (
        patient_id, doctor_id, hospital_id, surgery_type,
        surgery_name, diagnosis, scheduled_date, estimated_duration,
        estimated_cost, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        patientId,
        doctorId,
        hospitalId,
        surgeryType,
        surgeryName,
        diagnosis,
        scheduledDate,
        estimatedDuration,
        estimatedCost,
        status,
      ]
    );

    logger.info('Surgery scheduled', {
      surgeryId: result.rows[0].id,
      patientId,
      doctorId,
      hospitalId,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating surgery', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get surgery by ID
 */
export const findSurgeryById = async (surgeryId) => {
  try {
    const result = await database.query(
      `SELECT s.*,
              u1.first_name as patient_first_name, u1.last_name as patient_last_name,
              u2.first_name as doctor_first_name, u2.last_name as doctor_last_name,
              h.hospital_name
       FROM surgeries s
       JOIN patients pat ON s.patient_id = pat.id
       JOIN users u1 ON pat.user_id = u1.id
       JOIN doctors doc ON s.doctor_id = doc.id
       JOIN users u2 ON doc.user_id = u2.id
       JOIN hospitals h ON s.hospital_id = h.id
       WHERE s.id = $1`,
      [surgeryId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Surgery');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding surgery', {
      error: error.message,
      surgeryId,
    });
    throw error;
  }
};

/**
 * Update surgery
 */
export const updateSurgery = async (surgeryId, updates) => {
  const allowedFields = [
    'status',
    'actual_start_time',
    'actual_end_time',
    'surgeon_notes',
    'complications',
    'post_op_instructions',
    'follow_up_date',
    'actual_cost',
  ];

  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(surgeryId);

  try {
    const result = await database.query(
      `UPDATE surgeries
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Surgery');
    }

    logger.info('Surgery updated', { surgeryId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating surgery', {
      error: error.message,
      surgeryId,
    });
    throw error;
  }
};

/**
 * Get patient surgeries
 */
export const getPatientSurgeries = async (patientId, options = {}) => {
  const { limit = 50, offset = 0, status = null } = options;

  try {
    let query = `
      SELECT s.*,
             u.first_name as doctor_first_name, u.last_name as doctor_last_name,
             h.hospital_name
      FROM surgeries s
      JOIN doctors doc ON s.doctor_id = doc.id
      JOIN users u ON doc.user_id = u.id
      JOIN hospitals h ON s.hospital_id = h.id
      WHERE s.patient_id = $1
    `;
    const params = [patientId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND s.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY s.scheduled_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting patient surgeries', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get hospital surgeries
 */
export const getHospitalSurgeries = async (hospitalId, options = {}) => {
  const { limit = 50, offset = 0, status = null, date = null } = options;

  try {
    let query = `
      SELECT s.*,
             u1.first_name as patient_first_name, u1.last_name as patient_last_name,
             u2.first_name as doctor_first_name, u2.last_name as doctor_last_name
      FROM surgeries s
      JOIN patients pat ON s.patient_id = pat.id
      JOIN users u1 ON pat.user_id = u1.id
      JOIN doctors doc ON s.doctor_id = doc.id
      JOIN users u2 ON doc.user_id = u2.id
      WHERE s.hospital_id = $1
    `;
    const params = [hospitalId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND s.status = $${paramCount}`;
      params.push(status);
    }

    if (date) {
      paramCount++;
      query += ` AND DATE(s.scheduled_date) = $${paramCount}`;
      params.push(date);
    }

    query += ` ORDER BY s.scheduled_date ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting hospital surgeries', {
      error: error.message,
      hospitalId,
    });
    throw error;
  }
};

// ============= LAB TESTS =============

/**
 * Create lab test
 */
export const createLabTest = async (labTestData) => {
  const {
    patientId,
    doctorId,
    consultationId = null,
    testType,
    testCategory,
    clinicalIndication,
    urgency = 'routine',
    estimatedCost,
    status = 'pending',
  } = labTestData;

  try {
    const result = await database.query(
      `INSERT INTO lab_tests (
        patient_id, doctor_id, consultation_id, test_type,
        test_category, clinical_indication, urgency, estimated_cost, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        patientId,
        doctorId,
        consultationId,
        testType,
        testCategory,
        clinicalIndication,
        urgency,
        estimatedCost,
        status,
      ]
    );

    logger.info('Lab test created', {
      labTestId: result.rows[0].id,
      patientId,
      testType,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating lab test', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

/**
 * Get lab test by ID
 */
export const findLabTestById = async (labTestId) => {
  try {
    const result = await database.query(
      `SELECT l.*,
              u1.first_name as patient_first_name, u1.last_name as patient_last_name,
              u2.first_name as doctor_first_name, u2.last_name as doctor_last_name
       FROM lab_tests l
       JOIN patients pat ON l.patient_id = pat.id
       JOIN users u1 ON pat.user_id = u1.id
       JOIN doctors doc ON l.doctor_id = doc.id
       JOIN users u2 ON doc.user_id = u2.id
       WHERE l.id = $1`,
      [labTestId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Lab test');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding lab test', {
      error: error.message,
      labTestId,
    });
    throw error;
  }
};

/**
 * Update lab test
 */
export const updateLabTest = async (labTestId, updates) => {
  const allowedFields = ['status', 'results', 'test_date', 'performed_by', 'notes'];

  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(labTestId);

  try {
    const result = await database.query(
      `UPDATE lab_tests
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Lab test');
    }

    logger.info('Lab test updated', { labTestId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating lab test', {
      error: error.message,
      labTestId,
    });
    throw error;
  }
};

/**
 * Get patient lab tests
 */
export const getPatientLabTests = async (patientId, options = {}) => {
  const { limit = 50, offset = 0, status = null } = options;

  try {
    let query = `
      SELECT l.*,
             u.first_name as doctor_first_name, u.last_name as doctor_last_name
      FROM lab_tests l
      JOIN doctors doc ON l.doctor_id = doc.id
      JOIN users u ON doc.user_id = u.id
      WHERE l.patient_id = $1
    `;
    const params = [patientId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND l.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting patient lab tests', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

export default {
  // Consultations
  createConsultation,
  findConsultationById,
  updateConsultation,
  getPatientConsultations,
  getDoctorConsultations,
  
  // Prescriptions
  createPrescription,
  findPrescriptionById,
  updatePrescriptionStatus,
  getPatientPrescriptions,
  getPharmacyPrescriptions,
  
  // Surgeries
  createSurgery,
  findSurgeryById,
  updateSurgery,
  getPatientSurgeries,
  getHospitalSurgeries,
  
  // Lab Tests
  createLabTest,
  findLabTestById,
  updateLabTest,
  getPatientLabTests,
};
