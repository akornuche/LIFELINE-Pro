/**
 * Standardized API Response Formatter
 * Provides consistent response structure across all endpoints
 */

class ResponseFormatter {
  /**
   * Success response
   */
  success(res, data = null, message = 'Success', statusCode = 200, meta = {}) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Add metadata if provided (pagination, etc.)
    if (Object.keys(meta).length > 0) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   */
  error(res, message = 'An error occurred', statusCode = 500, errors = null, errorCode = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    // Add error code if provided
    if (errorCode) {
      response.errorCode = errorCode;
    }

    // Add detailed errors if provided (e.g., validation errors)
    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Created response (201)
   */
  created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * No content response (204)
   */
  noContent(res) {
    return res.status(204).send();
  }

  /**
   * Bad request response (400)
   */
  badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, 400, errors, 'BAD_REQUEST');
  }

  /**
   * Unauthorized response (401)
   */
  unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401, null, 'UNAUTHORIZED');
  }

  /**
   * Forbidden response (403)
   */
  forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, 403, null, 'FORBIDDEN');
  }

  /**
   * Not found response (404)
   */
  notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404, null, 'NOT_FOUND');
  }

  /**
   * Conflict response (409)
   */
  conflict(res, message = 'Resource conflict', errors = null) {
    return this.error(res, message, 409, errors, 'CONFLICT');
  }

  /**
   * Validation error response (422)
   */
  validationError(res, errors, message = 'Validation failed') {
    return this.error(res, message, 422, errors, 'VALIDATION_ERROR');
  }

  /**
   * Internal server error response (500)
   */
  serverError(res, message = 'Internal server error') {
    return this.error(res, message, 500, null, 'INTERNAL_ERROR');
  }

  /**
   * Service unavailable response (503)
   */
  serviceUnavailable(res, message = 'Service temporarily unavailable') {
    return this.error(res, message, 503, null, 'SERVICE_UNAVAILABLE');
  }

  /**
   * Paginated response
   */
  paginated(res, data, pagination, message = 'Success') {
    const meta = {
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1,
      },
    };

    return this.success(res, data, message, 200, meta);
  }

  /**
   * Custom response with specific status code
   */
  custom(res, statusCode, data, message, success = true) {
    const response = {
      success,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }
}

// Export singleton instance
const responseFormatter = new ResponseFormatter();
export default responseFormatter;
export { ResponseFormatter };

// Export convenience functions
export const successResponse = (res, data, message, statusCode, meta) => responseFormatter.success(res, data, message, statusCode, meta);
export const errorResponse = (res, message, statusCode, errors, errorCode) => responseFormatter.error(res, message, statusCode, errors, errorCode);
export const createdResponse = (res, data, message) => responseFormatter.created(res, data, message);
export const noContentResponse = (res) => responseFormatter.noContent(res);
export const badRequestResponse = (res, message, errors) => responseFormatter.badRequest(res, message, errors);
export const unauthorizedResponse = (res, message) => responseFormatter.unauthorized(res, message);
export const forbiddenResponse = (res, message) => responseFormatter.forbidden(res, message);
export const notFoundResponse = (res, message) => responseFormatter.notFound(res, message);
export const conflictResponse = (res, message, errors) => responseFormatter.conflict(res, message, errors);
export const validationErrorResponse = (res, errors, message) => responseFormatter.validationError(res, errors, message);
export const serverErrorResponse = (res, message) => responseFormatter.serverError(res, message);
export const serviceUnavailableResponse = (res, message) => responseFormatter.serviceUnavailable(res, message);
export const paginatedResponse = (res, data, pagination, message) => responseFormatter.paginated(res, data, pagination, message);
export const customResponse = (res, statusCode, data, message, success) => responseFormatter.custom(res, statusCode, data, message, success);
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Export common error codes
export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Package Entitlement
  PACKAGE_NOT_ENTITLED: 'PACKAGE_NOT_ENTITLED',
  SERVICE_NOT_ALLOWED: 'SERVICE_NOT_ALLOWED',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  
  // Payment
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  
  // Provider
  PROVIDER_NOT_VERIFIED: 'PROVIDER_NOT_VERIFIED',
  PROVIDER_NOT_AVAILABLE: 'PROVIDER_NOT_AVAILABLE',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};
