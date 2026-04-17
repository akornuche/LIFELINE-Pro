import express from 'express';
import * as queueService from '../services/queueService.js';
import { authenticate } from '../middleware/auth.js';
import { isPatient, checkRole } from '../middleware/rbac.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   POST /api/queue/request
 * @desc    Patient creates a service request
 * @access  Private (Patient)
 */
router.post('/request', authenticate, isPatient, async (req, res, next) => {
  try {
    const { serviceType, description, preferredDate, priority } = req.body;

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Service type is required',
      });
    }

    const validServiceTypes = [
      'consultation', 'prescription', 'drug_dispensing',
      'minor_surgery', 'major_surgery', 'laboratory_test',
      'imaging', 'admission', 'emergency',
    ];

    if (!validServiceTypes.includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid service type. Must be one of: ${validServiceTypes.join(', ')}`,
      });
    }

    // Get patient record from user
    const { default: database } = await import('../database/connection.js');
    const patientResult = await database.query(
      `SELECT id FROM patients WHERE user_id = $1`,
      [req.user.userId]
    );

    if (!patientResult.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found',
      });
    }

    const request = await queueService.createRequest(patientResult.rows[0].id, {
      serviceType,
      description,
      preferredDate,
      priority,
    });

    res.status(201).json({
      success: true,
      message: request.status === 'assigned'
        ? 'Service request created and a provider has been assigned'
        : 'Service request created. We are looking for an available provider in your area.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/queue/my-requests
 * @desc    Patient views their service requests
 * @access  Private (Patient)
 */
router.get('/my-requests', authenticate, isPatient, async (req, res, next) => {
  try {
    const { status } = req.query;

    const { default: database } = await import('../database/connection.js');
    const patientResult = await database.query(
      `SELECT id FROM patients WHERE user_id = $1`,
      [req.user.userId]
    );

    if (!patientResult.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found',
      });
    }

    const requests = await queueService.getPatientRequests(patientResult.rows[0].id, status || null);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/queue/request/:id
 * @desc    Patient cancels a service request
 * @access  Private (Patient)
 */
router.delete('/request/:id', authenticate, isPatient, async (req, res, next) => {
  try {
    const { reason } = req.body;

    const { default: database } = await import('../database/connection.js');
    const patientResult = await database.query(
      `SELECT id FROM patients WHERE user_id = $1`,
      [req.user.userId]
    );

    const request = await queueService.cancelRequest(
      req.params.id,
      patientResult.rows[0].id,
      reason || 'Cancelled by patient'
    );

    res.json({
      success: true,
      message: 'Service request cancelled',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/queue/assignments
 * @desc    Provider views their assigned service requests
 * @access  Private (Doctor, Pharmacy, Hospital)
 */
router.get('/assignments', authenticate, checkRole('doctor', 'pharmacy', 'hospital'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const { default: database } = await import('../database/connection.js');

    let providerId;
    const providerType = req.user.role;

    if (providerType === 'doctor') {
      const result = await database.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'pharmacy') {
      const result = await database.query(`SELECT id FROM pharmacies WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'hospital') {
      const result = await database.query(`SELECT id FROM hospitals WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    }

    if (!providerId) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
      });
    }

    const requests = await queueService.getProviderRequests(providerId, providerType, status || null);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/queue/assignments/:id/accept
 * @desc    Provider accepts a service request
 * @access  Private (Doctor, Pharmacy, Hospital)
 */
router.post('/assignments/:id/accept', authenticate, checkRole('doctor', 'pharmacy', 'hospital'), async (req, res, next) => {
  try {
    const { default: database } = await import('../database/connection.js');
    const providerType = req.user.role;
    let providerId;

    if (providerType === 'doctor') {
      const result = await database.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'pharmacy') {
      const result = await database.query(`SELECT id FROM pharmacies WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'hospital') {
      const result = await database.query(`SELECT id FROM hospitals WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    }

    const request = await queueService.acceptRequest(req.params.id, providerId);

    res.json({
      success: true,
      message: 'Service request accepted',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/queue/assignments/:id/reject
 * @desc    Provider rejects a service request (re-assigns to next)
 * @access  Private (Doctor, Pharmacy, Hospital)
 */
router.post('/assignments/:id/reject', authenticate, checkRole('doctor', 'pharmacy', 'hospital'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const { default: database } = await import('../database/connection.js');
    const providerType = req.user.role;
    let providerId;

    if (providerType === 'doctor') {
      const result = await database.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'pharmacy') {
      const result = await database.query(`SELECT id FROM pharmacies WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'hospital') {
      const result = await database.query(`SELECT id FROM hospitals WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    }

    const request = await queueService.rejectRequest(req.params.id, providerId, reason || 'Rejected by provider');

    res.json({
      success: true,
      message: request.status === 'assigned'
        ? 'Request rejected and reassigned to another provider'
        : 'Request rejected. No alternative provider available — request returned to pending.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/queue/assignments/:id/start
 * @desc    Provider starts working on a request
 * @access  Private (Doctor, Pharmacy, Hospital)
 */
router.post('/assignments/:id/start', authenticate, checkRole('doctor', 'pharmacy', 'hospital'), async (req, res, next) => {
  try {
    const { default: database } = await import('../database/connection.js');
    const providerType = req.user.role;
    let providerId;

    if (providerType === 'doctor') {
      const result = await database.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'pharmacy') {
      const result = await database.query(`SELECT id FROM pharmacies WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'hospital') {
      const result = await database.query(`SELECT id FROM hospitals WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    }

    const request = await queueService.startRequest(req.params.id, providerId);

    res.json({
      success: true,
      message: 'Service request started',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/queue/assignments/:id/complete
 * @desc    Provider completes a service request
 * @access  Private (Doctor, Pharmacy, Hospital)
 */
router.post('/assignments/:id/complete', authenticate, checkRole('doctor', 'pharmacy', 'hospital'), async (req, res, next) => {
  try {
    const { consultationId } = req.body;
    const { default: database } = await import('../database/connection.js');
    const providerType = req.user.role;
    let providerId;

    if (providerType === 'doctor') {
      const result = await database.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'pharmacy') {
      const result = await database.query(`SELECT id FROM pharmacies WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    } else if (providerType === 'hospital') {
      const result = await database.query(`SELECT id FROM hospitals WHERE user_id = $1`, [req.user.userId]);
      providerId = result.rows[0]?.id;
    }

    const request = await queueService.completeRequest(req.params.id, providerId, consultationId);

    res.json({
      success: true,
      message: 'Service request completed',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/queue/stats
 * @desc    Get queue statistics (admin)
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, checkRole('admin'), async (req, res, next) => {
  try {
    const stats = await queueService.getQueueStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
