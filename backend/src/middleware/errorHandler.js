import logger from '../utils/logger.js';
import responseFormatter from '../utils/response.js';
import { ERROR_CATEGORIES } from '../constants/packages.js';

/**
 * Global Error Handling Middleware
 * Catches all errors and returns appropriate responses
 */

/**
 * Error types for classification
 */
const ErrorTypes = {
  VALIDATION_ERROR: 'ValidationError',
  AUTHENTICATION_ERROR: 'AuthenticationError',
  AUTHORIZATION_ERROR: 'AuthorizationError',
  NOT_FOUND_ERROR: 'NotFoundError',
  CONFLICT_ERROR: 'ConflictError',
  BUSINESS_LOGIC_ERROR: 'BusinessLogicError',
  DATABASE_ERROR: 'DatabaseError',
  EXTERNAL_API_ERROR: 'ExternalApiError',
  RATE_LIMIT_ERROR: 'RateLimitError',
};

/**
 * Custom Error Classes
 */
export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = ErrorTypes.VALIDATION_ERROR;
    this.statusCode = 422;
    this.errors = errors;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = ErrorTypes.AUTHENTICATION_ERROR;
    this.statusCode = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = ErrorTypes.AUTHORIZATION_ERROR;
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = ErrorTypes.NOT_FOUND_ERROR;
    this.statusCode = 404;
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource already exists') {
    super(message);
    this.name = ErrorTypes.CONFLICT_ERROR;
    this.statusCode = 409;
  }
}

export class BusinessLogicError extends Error {
  constructor(message, code = null) {
    super(message);
    this.name = ErrorTypes.BUSINESS_LOGIC_ERROR;
    this.statusCode = 400;
    this.code = code;
  }
}

export class DatabaseError extends Error {
  constructor(message = 'Database operation failed') {
    super(message);
    this.name = ErrorTypes.DATABASE_ERROR;
    this.statusCode = 500;
  }
}

export class ExternalApiError extends Error {
  constructor(message = 'External service unavailable', service = 'Unknown') {
    super(message);
    this.name = ErrorTypes.EXTERNAL_API_ERROR;
    this.statusCode = 503;
    this.service = service;
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message);
    this.name = ErrorTypes.RATE_LIMIT_ERROR;
    this.statusCode = 429;
    this.retryAfter = retryAfter;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = ErrorTypes.AUTHENTICATION_ERROR;
    this.statusCode = 401;
  }
}

/**
 * Error handler for development environment
 */
const developmentErrorHandler = (err, req, res) => {
  const errorResponse = {
    success: false,
    message: err.message,
    error: {
      name: err.name,
      statusCode: err.statusCode || 500,
      stack: err.stack,
      errors: err.errors || undefined,
      code: err.code || undefined,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user ? { id: req.user.id, role: req.user.role } : undefined,
    },
  };

  logger.error('Development Error', errorResponse);

  res.status(err.statusCode || 500).json(errorResponse);
};

/**
 * Error handler for production environment
 */
const productionErrorHandler = (err, req, res) => {
  // Don't expose internal errors to clients
  const isOperationalError = err.statusCode && err.statusCode < 500;

  if (isOperationalError) {
    // Operational errors (4xx) - safe to send to client
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || undefined,
      code: err.code || undefined,
    });
  }

  // Programming or unknown errors (5xx) - log but don't expose details
  logger.error('Production Error', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    request: {
      method: req.method,
      url: req.originalUrl,
      user: req.user ? { id: req.user.id, role: req.user.role } : undefined,
    },
  });

  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_ERROR',
  });
};

/**
 * Main error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Handle specific error types
  switch (err.name) {
    case ErrorTypes.VALIDATION_ERROR:
      logger.warn('Validation Error', {
        message: err.message,
        errors: err.errors,
        endpoint: req.path,
      });
      return responseFormatter.validationError(res, err.errors, err.message);

    case ErrorTypes.AUTHENTICATION_ERROR:
      logger.warn('Authentication Error', {
        message: err.message,
        endpoint: req.path,
        ip: req.ip,
      });
      return responseFormatter.unauthorized(res, err.message);

    case ErrorTypes.AUTHORIZATION_ERROR:
      logger.warn('Authorization Error', {
        message: err.message,
        endpoint: req.path,
        user: req.user ? { id: req.user.id, role: req.user.role } : undefined,
      });
      return responseFormatter.forbidden(res, err.message);

    case ErrorTypes.NOT_FOUND_ERROR:
      return responseFormatter.notFound(res, err.message);

    case ErrorTypes.CONFLICT_ERROR:
      logger.warn('Conflict Error', {
        message: err.message,
        endpoint: req.path,
      });
      return res.status(409).json({
        success: false,
        message: err.message,
      });

    case ErrorTypes.BUSINESS_LOGIC_ERROR:
      logger.warn('Business Logic Error', {
        message: err.message,
        code: err.code,
        endpoint: req.path,
      });
      return responseFormatter.badRequest(res, err.message);

    case ErrorTypes.RATE_LIMIT_ERROR:
      logger.warn('Rate Limit Exceeded', {
        endpoint: req.path,
        ip: req.ip,
        user: req.user ? { id: req.user.id } : undefined,
      });
      return res.status(429).json({
        success: false,
        message: err.message,
        retryAfter: err.retryAfter,
      });

    case ErrorTypes.DATABASE_ERROR:
      logger.error('Database Error', {
        message: err.message,
        stack: err.stack,
        endpoint: req.path,
      });
      return responseFormatter.serverError(res, 'Database operation failed');

    case ErrorTypes.EXTERNAL_API_ERROR:
      logger.error('External API Error', {
        message: err.message,
        service: err.service,
        endpoint: req.path,
      });
      return res.status(503).json({
        success: false,
        message: 'External service temporarily unavailable',
      });

    // Handle Joi validation errors
    case 'ValidationError':
      if (err.isJoi) {
        const errors = err.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
        return responseFormatter.validationError(res, errors);
      }
      break;

    // Handle JWT errors
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      return responseFormatter.unauthorized(res, 'Invalid or expired token');

    // Handle database constraint errors
    case 'QueryFailedError':
      if (err.code === '23505') {
        // Unique constraint violation
        return responseFormatter.badRequest(res, 'Resource already exists');
      }
      if (err.code === '23503') {
        // Foreign key constraint violation
        return responseFormatter.badRequest(res, 'Referenced resource does not exist');
      }
      break;
  }

  // Use environment-specific error handler
  if (process.env.NODE_ENV === 'production') {
    productionErrorHandler(err, req, res);
  } else {
    developmentErrorHandler(err, req, res);
  }
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  responseFormatter.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Operational error checker
 */
export const isOperationalError = (error) => {
  if (error instanceof Error) {
    return error.statusCode && error.statusCode < 500;
  }
  return false;
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason,
      promise: promise,
    });
    
    // In production, we might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      logger.error('Shutting down due to unhandled rejection');
      process.exit(1);
    }
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });

    // Always exit on uncaught exception
    logger.error('Shutting down due to uncaught exception');
    process.exit(1);
  });
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  isOperationalError,
  handleUnhandledRejection,
  handleUncaughtException,
  // Error classes
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  DatabaseError,
  ExternalApiError,
  RateLimitError,
};
