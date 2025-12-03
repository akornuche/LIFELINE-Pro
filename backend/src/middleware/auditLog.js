import database from '../database/connection.js';
import logger from '../utils/logger.js';

/**
 * Audit Logging Middleware
 * Automatically logs sensitive operations to audit_logs table
 */

/**
 * Audit event types
 */
export const AuditEventTypes = {
  // Authentication events
  LOGIN: 'user.login',
  LOGOUT: 'user.logout',
  PASSWORD_CHANGE: 'user.password_change',
  PASSWORD_RESET: 'user.password_reset',
  REGISTRATION: 'user.registration',
  
  // Account management
  ACCOUNT_UPDATE: 'user.account_update',
  ACCOUNT_DELETE: 'user.account_delete',
  ACCOUNT_SUSPEND: 'user.account_suspend',
  ACCOUNT_ACTIVATE: 'user.account_activate',
  
  // Patient operations
  SUBSCRIPTION_CREATE: 'patient.subscription_create',
  SUBSCRIPTION_UPGRADE: 'patient.subscription_upgrade',
  SUBSCRIPTION_CANCEL: 'patient.subscription_cancel',
  DEPENDENT_ADD: 'patient.dependent_add',
  DEPENDENT_REMOVE: 'patient.dependent_remove',
  
  // Medical records
  MEDICAL_RECORD_CREATE: 'medical.record_create',
  MEDICAL_RECORD_UPDATE: 'medical.record_update',
  MEDICAL_RECORD_DELETE: 'medical.record_delete',
  MEDICAL_RECORD_VIEW: 'medical.record_view',
  
  // Consultations
  CONSULTATION_CREATE: 'consultation.create',
  CONSULTATION_COMPLETE: 'consultation.complete',
  CONSULTATION_CANCEL: 'consultation.cancel',
  
  // Prescriptions
  PRESCRIPTION_CREATE: 'prescription.create',
  PRESCRIPTION_DISPENSE: 'prescription.dispense',
  PRESCRIPTION_REJECT: 'prescription.reject',
  
  // Surgeries
  SURGERY_SCHEDULE: 'surgery.schedule',
  SURGERY_COMPLETE: 'surgery.complete',
  SURGERY_CANCEL: 'surgery.cancel',
  
  // Lab tests
  LAB_TEST_ORDER: 'lab.test_order',
  LAB_TEST_COMPLETE: 'lab.test_complete',
  LAB_RESULTS_UPLOAD: 'lab.results_upload',
  
  // Payments
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_APPROVE: 'payment.approve',
  PAYMENT_REJECT: 'payment.reject',
  PAYMENT_PROCESS: 'payment.process',
  REFUND_PROCESS: 'payment.refund',
  
  // Provider approvals
  PROVIDER_VERIFY: 'provider.verify',
  PROVIDER_SUSPEND: 'provider.suspend',
  PROVIDER_REJECT: 'provider.reject',
  
  // Admin operations
  ADMIN_USER_CREATE: 'admin.user_create',
  ADMIN_USER_UPDATE: 'admin.user_update',
  ADMIN_USER_DELETE: 'admin.user_delete',
  ADMIN_ROLE_CHANGE: 'admin.role_change',
  ADMIN_CONFIG_CHANGE: 'admin.config_change',
  ADMIN_PRICING_UPDATE: 'admin.pricing_update',
  
  // Data access
  SENSITIVE_DATA_EXPORT: 'data.export',
  BULK_DATA_ACCESS: 'data.bulk_access',
  REPORT_GENERATE: 'data.report_generate',
};

/**
 * Create audit log entry
 */
export const createAuditLog = async (options) => {
  const {
    userId,
    userRole,
    eventType,
    eventCategory,
    resourceType,
    resourceId,
    action,
    changes = null,
    ipAddress = null,
    userAgent = null,
    metadata = null,
  } = options;

  try {
    await database.query(
      `INSERT INTO audit_logs (
        user_id, user_role, event_type, event_category,
        resource_type, resource_id, action, changes,
        ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        userRole,
        eventType,
        eventCategory,
        resourceType,
        resourceId,
        action,
        changes ? JSON.stringify(changes) : null,
        ipAddress,
        userAgent,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    logger.audit(eventType, {
      userId,
      userRole,
      resourceType,
      resourceId,
      action,
      ipAddress,
    });
  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error.message,
      eventType,
      userId,
    });
    // Don't throw - audit logging failure shouldn't break the request
  }
};

/**
 * Audit logging middleware
 * Usage: router.post('/endpoint', auditLog({ eventType: 'user.login' }), handler)
 */
export const auditLog = (options = {}) => {
  return async (req, res, next) => {
    const {
      eventType,
      eventCategory = 'general',
      resourceType = null,
      getResourceId = null,
      action = req.method,
      includeBody = false,
      includeChanges = false,
    } = options;

    // Store original data for comparison (if tracking changes)
    if (includeChanges) {
      req.auditOriginalData = { ...req.body };
    }

    // Override res.json to log after successful response
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            const resourceId = getResourceId
              ? getResourceId(req, data)
              : req.params.id || data.data?.id || null;

            const changes = includeChanges
              ? {
                  before: req.auditOriginalData,
                  after: includeBody ? req.body : null,
                }
              : null;

            const metadata = {
              endpoint: req.originalUrl,
              statusCode: res.statusCode,
              ...(includeBody && { requestBody: req.body }),
            };

            await createAuditLog({
              userId: req.user?.id || null,
              userRole: req.user?.role || 'anonymous',
              eventType,
              eventCategory,
              resourceType,
              resourceId,
              action,
              changes,
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
              metadata,
            });
          } catch (error) {
            logger.error('Audit logging failed', {
              error: error.message,
            });
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Audit authentication events
 */
export const auditAuth = (eventType) => {
  return auditLog({
    eventType,
    eventCategory: 'authentication',
    resourceType: 'user',
    getResourceId: (req) => req.user?.id || req.body?.email,
  });
};

/**
 * Audit medical record access
 */
export const auditMedicalRecord = (action) => {
  return auditLog({
    eventType: `medical.record_${action}`,
    eventCategory: 'medical',
    resourceType: 'medical_record',
    getResourceId: (req) => req.params.recordId || req.params.id,
    includeChanges: action === 'update',
  });
};

/**
 * Audit payment operations
 */
export const auditPayment = (action) => {
  return auditLog({
    eventType: `payment.${action}`,
    eventCategory: 'financial',
    resourceType: 'payment',
    getResourceId: (req, data) => req.params.paymentId || data.data?.paymentId,
    includeBody: true,
  });
};

/**
 * Audit admin operations
 */
export const auditAdmin = (action) => {
  return auditLog({
    eventType: `admin.${action}`,
    eventCategory: 'administration',
    includeBody: true,
    includeChanges: true,
  });
};

/**
 * Audit provider operations
 */
export const auditProvider = (action) => {
  return auditLog({
    eventType: `provider.${action}`,
    eventCategory: 'provider',
    resourceType: 'provider',
    getResourceId: (req) => req.params.providerId || req.params.id,
  });
};

/**
 * Audit data export/access
 */
export const auditDataAccess = (action) => {
  return auditLog({
    eventType: `data.${action}`,
    eventCategory: 'data_access',
    includeBody: true,
  });
};

/**
 * Get audit logs for a user
 */
export const getUserAuditLogs = async (userId, options = {}) => {
  const { limit = 50, offset = 0, eventType = null, startDate = null, endDate = null } =
    options;

  try {
    let query = `
      SELECT * FROM audit_logs
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (eventType) {
      paramCount++;
      query += ` AND event_type = $${paramCount}`;
      params.push(eventType);
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

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Failed to fetch audit logs', {
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Get audit logs for a resource
 */
export const getResourceAuditLogs = async (resourceType, resourceId, options = {}) => {
  const { limit = 50, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT * FROM audit_logs
       WHERE resource_type = $1 AND resource_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [resourceType, resourceId, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Failed to fetch resource audit logs', {
      error: error.message,
      resourceType,
      resourceId,
    });
    throw error;
  }
};

/**
 * Search audit logs (admin only)
 */
export const searchAuditLogs = async (filters = {}, options = {}) => {
  const {
    userId,
    userRole,
    eventType,
    eventCategory,
    resourceType,
    startDate,
    endDate,
    ipAddress,
  } = filters;

  const { limit = 100, offset = 0, orderBy = 'created_at', order = 'DESC' } = options;

  try {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      params.push(userId);
    }

    if (userRole) {
      paramCount++;
      query += ` AND user_role = $${paramCount}`;
      params.push(userRole);
    }

    if (eventType) {
      paramCount++;
      query += ` AND event_type = $${paramCount}`;
      params.push(eventType);
    }

    if (eventCategory) {
      paramCount++;
      query += ` AND event_category = $${paramCount}`;
      params.push(eventCategory);
    }

    if (resourceType) {
      paramCount++;
      query += ` AND resource_type = $${paramCount}`;
      params.push(resourceType);
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

    if (ipAddress) {
      paramCount++;
      query += ` AND ip_address = $${paramCount}`;
      params.push(ipAddress);
    }

    query += ` ORDER BY ${orderBy} ${order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await database.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Failed to search audit logs', {
      error: error.message,
    });
    throw error;
  }
};

export default {
  AuditEventTypes,
  createAuditLog,
  auditLog,
  auditAuth,
  auditMedicalRecord,
  auditPayment,
  auditAdmin,
  auditProvider,
  auditDataAccess,
  getUserAuditLogs,
  getResourceAuditLogs,
  searchAuditLogs,
};
