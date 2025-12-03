import jwtManager from '../utils/jwt.js';
import responseFormatter from '../utils/response.js';
import logger from '../utils/logger.js';
import database from '../database/connection.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */

/**
 * Main authentication middleware
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = jwtManager.extractTokenFromHeader(authHeader);

    if (!token) {
      return responseFormatter.unauthorized(res, 'No authentication token provided');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwtManager.verifyAccessToken(token);
    } catch (error) {
      if (error.message === 'Token has expired') {
        return responseFormatter.unauthorized(res, 'Token has expired. Please refresh your token.');
      }
      return responseFormatter.unauthorized(res, 'Invalid authentication token');
    }

    // Fetch user from database
    const userResult = await database.query(
      'SELECT id, lifeline_id, email, phone, role, email_verified, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return responseFormatter.unauthorized(res, 'User not found');
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      logger.warn('Inactive user attempted access', {
        userId: user.id,
        email: user.email,
      });
      return responseFormatter.forbidden(res, 'Account has been deactivated. Please contact support.');
    }

    // Check if user is verified (optional, depends on requirements)
    if (!user.email_verified && req.path !== '/api/auth/verify') {
      return responseFormatter.forbidden(res, 'Account not verified. Please verify your account.');
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      id: user.id,
      lifelineId: user.lifeline_id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.email_verified,
      isActive: user.status === 'active',
    };

    // Attach token to request (for blacklisting on logout)
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
    });
    return responseFormatter.serverError(res, 'Authentication failed');
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtManager.extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without user
      return next();
    }

    // Try to verify and attach user
    try {
      const decoded = jwtManager.verifyAccessToken(token);
      const userResult = await database.query(
        'SELECT id, lifeline_id, email, role, email_verified, status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        if (user.status === 'active') {
          req.user = {
            userId: user.id,
            id: user.id,
            lifelineId: user.lifeline_id,
            email: user.email,
            role: user.role,
            isVerified: user.email_verified,
            isActive: user.status === 'active',
          };
        }
      }
    } catch (error) {
      // Token invalid/expired, but we don't fail the request
      logger.debug('Optional auth token invalid', {
        error: error.message,
      });
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', {
      error: error.message,
    });
    next();
  }
};

/**
 * Refresh token authentication
 */
export const authenticateRefresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return responseFormatter.badRequest(res, 'Refresh token is required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwtManager.verifyRefreshToken(refreshToken);
    } catch (error) {
      return responseFormatter.unauthorized(res, 'Invalid or expired refresh token');
    }

    // Fetch user
    const userResult = await database.query(
      'SELECT id, lifeline_id, email, role, email_verified, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return responseFormatter.unauthorized(res, 'User not found');
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      return responseFormatter.forbidden(res, 'Account has been deactivated');
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      id: user.id,
      lifelineId: user.lifeline_id,
      email: user.email,
      role: user.role,
      isVerified: user.email_verified,
      isActive: user.status === 'active',
    };

    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    logger.error('Refresh token authentication error', {
      error: error.message,
    });
    return responseFormatter.serverError(res, 'Authentication failed');
  }
};

export default {
  authenticate,
  optionalAuth,
  authenticateRefresh,
};
