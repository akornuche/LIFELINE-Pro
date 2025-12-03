import responseFormatter from '../utils/response.js';
import logger from '../utils/logger.js';
import database from '../database/connection.js';
import { USER_ROLES } from '../constants/packages.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access based on user roles
 */

/**
 * Check if user has required role(s)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return responseFormatter.unauthorized(res, 'Authentication required');
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Unauthorized role access attempt', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          endpoint: req.path,
        });

        return responseFormatter.forbidden(
          res,
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        );
      }

      next();
    } catch (error) {
      logger.error('RBAC middleware error', {
        error: error.message,
        stack: error.stack,
      });
      return responseFormatter.serverError(res, 'Authorization check failed');
    }
  };
};

/**
 * Check if user has required role(s) - alias for requireRole
 */
export const checkRole = requireRole;

/**
 * Patient-only access
 */
export const isPatient = requireRole(USER_ROLES.PATIENT);

/**
 * Doctor-only access
 */
export const isDoctor = requireRole(USER_ROLES.DOCTOR);

/**
 * Pharmacy-only access
 */
export const isPharmacy = requireRole(USER_ROLES.PHARMACY);

/**
 * Hospital-only access
 */
export const isHospital = requireRole(USER_ROLES.HOSPITAL);

/**
 * Admin-only access
 */
export const isAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Any provider (doctor, pharmacy, or hospital)
 */
export const isProvider = requireRole(
  USER_ROLES.DOCTOR,
  USER_ROLES.PHARMACY,
  USER_ROLES.HOSPITAL
);

/**
 * Healthcare provider (doctor or hospital)
 */
export const isHealthcareProvider = requireRole(
  USER_ROLES.DOCTOR,
  USER_ROLES.HOSPITAL
);

/**
 * Admin or specific provider
 */
export const isAdminOrProvider = requireRole(
  USER_ROLES.ADMIN,
  USER_ROLES.DOCTOR,
  USER_ROLES.PHARMACY,
  USER_ROLES.HOSPITAL
);

/**
 * Patient or Admin (for viewing patient data)
 */
export const isPatientOrAdmin = requireRole(
  USER_ROLES.PATIENT,
  USER_ROLES.ADMIN
);

/**
 * Check if user owns the resource
 */
export const isOwner = (resourceUserIdGetter) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return responseFormatter.unauthorized(res, 'Authentication required');
      }

      // Get resource user ID
      let resourceUserId;
      if (typeof resourceUserIdGetter === 'function') {
        resourceUserId = await resourceUserIdGetter(req);
      } else if (typeof resourceUserIdGetter === 'string') {
        resourceUserId = req.params[resourceUserIdGetter] || req.body[resourceUserIdGetter];
      } else {
        resourceUserId = resourceUserIdGetter;
      }

      // Check ownership
      if (req.user.id !== resourceUserId) {
        // Allow admin to access
        if (req.user.role === USER_ROLES.ADMIN) {
          return next();
        }

        logger.warn('Unauthorized resource access attempt', {
          userId: req.user.id,
          resourceUserId,
          endpoint: req.path,
        });

        return responseFormatter.forbidden(res, 'You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      logger.error('Ownership check error', {
        error: error.message,
        stack: error.stack,
      });
      return responseFormatter.serverError(res, 'Authorization check failed');
    }
  };
};

/**
 * Check if user is owner OR has specific role
 */
export const isOwnerOrRole = (resourceUserIdGetter, ...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return responseFormatter.unauthorized(res, 'Authentication required');
      }

      // Check if user has allowed role
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      // Check ownership
      let resourceUserId;
      if (typeof resourceUserIdGetter === 'function') {
        resourceUserId = await resourceUserIdGetter(req);
      } else if (typeof resourceUserIdGetter === 'string') {
        resourceUserId = req.params[resourceUserIdGetter] || req.body[resourceUserIdGetter];
      } else {
        resourceUserId = resourceUserIdGetter;
      }

      if (req.user.id === resourceUserId) {
        return next();
      }

      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        resourceUserId,
        endpoint: req.path,
      });

      return responseFormatter.forbidden(res, 'Access denied');
    } catch (error) {
      logger.error('Authorization middleware error', {
        error: error.message,
      });
      return responseFormatter.serverError(res, 'Authorization check failed');
    }
  };
};

/**
 * Check if provider is verified
 */
export const isVerifiedProvider = async (req, res, next) => {
  try {
    if (!req.user) {
      return responseFormatter.unauthorized(res, 'Authentication required');
    }

    // Only check for provider roles
    const providerRoles = [USER_ROLES.DOCTOR, USER_ROLES.PHARMACY, USER_ROLES.HOSPITAL];
    if (!providerRoles.includes(req.user.role)) {
      return next(); // Not a provider, skip check
    }

    // Query provider verification status
    let tableName;
    switch (req.user.role) {
      case USER_ROLES.DOCTOR:
        tableName = 'doctors';
        break;
      case USER_ROLES.PHARMACY:
        tableName = 'pharmacies';
        break;
      case USER_ROLES.HOSPITAL:
        tableName = 'hospitals';
        break;
    }

    const result = await database.query(
      `SELECT verification_status FROM ${tableName} WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return responseFormatter.forbidden(res, 'Provider profile not found');
    }

    const verificationStatus = result.rows[0].verification_status;

    if (verificationStatus !== 'approved') {
      return responseFormatter.forbidden(
        res,
        `Your account is ${verificationStatus}. Please wait for admin approval.`
      );
    }

    next();
  } catch (error) {
    logger.error('Provider verification check error', {
      error: error.message,
    });
    return responseFormatter.serverError(res, 'Verification check failed');
  }
};

/**
 * Custom permission check
 */
export const hasPermission = (permissionCheck) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return responseFormatter.unauthorized(res, 'Authentication required');
      }

      const hasAccess = await permissionCheck(req.user, req);

      if (!hasAccess) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          endpoint: req.path,
        });
        return responseFormatter.forbidden(res, 'You do not have permission to perform this action');
      }

      next();
    } catch (error) {
      logger.error('Permission check error', {
        error: error.message,
      });
      return responseFormatter.serverError(res, 'Permission check failed');
    }
  };
};

export default {
  requireRole,
  checkRole,
  isPatient,
  isDoctor,
  isPharmacy,
  isHospital,
  isAdmin,
  isProvider,
  isHealthcareProvider,
  isAdminOrProvider,
  isPatientOrAdmin,
  isOwner,
  isOwnerOrRole,
  isVerifiedProvider,
  hasPermission,
};
