import responseFormatter from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Request Validation Middleware
 * Validates request data using Joi schemas
 */

/**
 * Validate request body, params, or query
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      // Get data based on source
      let data;
      switch (source) {
        case 'body':
          data = req.body;
          break;
        case 'params':
          data = req.params;
          break;
        case 'query':
          data = req.query;
          break;
        case 'headers':
          data = req.headers;
          break;
        default:
          data = req.body;
      }

      // Validate data against schema
      const { error, value } = schema.validate(data, {
        abortEarly: false, // Return all errors
        stripUnknown: true, // Remove unknown fields
        convert: true, // Convert types
      });

      if (error) {
        // Format validation errors
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type,
        }));

        logger.warn('Validation failed', {
          source,
          errors,
          endpoint: req.path,
        });

        return responseFormatter.validationError(res, errors, 'Validation failed');
      }

      // Replace request data with validated and sanitized data
      switch (source) {
        case 'body':
          req.body = value;
          break;
        case 'params':
          req.params = value;
          break;
        case 'query':
          req.query = value;
          break;
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        error: error.message,
        stack: error.stack,
      });
      return responseFormatter.serverError(res, 'Validation failed');
    }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate request params
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate request query
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate multiple sources
 */
export const validateMultiple = (schemas) => {
  return async (req, res, next) => {
    try {
      const validationErrors = [];

      // Validate each source
      for (const [source, schema] of Object.entries(schemas)) {
        let data;
        switch (source) {
          case 'body':
            data = req.body;
            break;
          case 'params':
            data = req.params;
            break;
          case 'query':
            data = req.query;
            break;
          case 'headers':
            data = req.headers;
            break;
          default:
            continue;
        }

        const { error, value } = schema.validate(data, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          const errors = error.details.map(detail => ({
            source,
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
          }));
          validationErrors.push(...errors);
        } else {
          // Update request with validated data
          switch (source) {
            case 'body':
              req.body = value;
              break;
            case 'params':
              req.params = value;
              break;
            case 'query':
              req.query = value;
              break;
          }
        }
      }

      if (validationErrors.length > 0) {
        logger.warn('Multiple validation failures', {
          errors: validationErrors,
          endpoint: req.path,
        });

        return responseFormatter.validationError(
          res,
          validationErrors,
          'Validation failed'
        );
      }

      next();
    } catch (error) {
      logger.error('Multiple validation middleware error', {
        error: error.message,
      });
      return responseFormatter.serverError(res, 'Validation failed');
    }
  };
};

/**
 * Custom validation function
 */
export const customValidate = (validatorFn) => {
  return async (req, res, next) => {
    try {
      const result = await validatorFn(req);

      if (result.isValid) {
        next();
      } else {
        logger.warn('Custom validation failed', {
          errors: result.errors,
          endpoint: req.path,
        });

        return responseFormatter.validationError(
          res,
          result.errors,
          result.message || 'Validation failed'
        );
      }
    } catch (error) {
      logger.error('Custom validation error', {
        error: error.message,
      });
      return responseFormatter.serverError(res, 'Validation failed');
    }
  };
};

/**
 * Sanitize request data (remove sensitive fields)
 */
export const sanitize = (fieldsToRemove = []) => {
  return (req, res, next) => {
    try {
      // Remove sensitive fields from body
      if (req.body) {
        fieldsToRemove.forEach(field => {
          delete req.body[field];
        });
      }

      // Remove from query
      if (req.query) {
        fieldsToRemove.forEach(field => {
          delete req.query[field];
        });
      }

      next();
    } catch (error) {
      logger.error('Sanitization error', {
        error: error.message,
      });
      next();
    }
  };
};

/**
 * Validate file upload
 */
export const validateFile = (options = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    fieldName = 'file',
  } = options;

  return (req, res, next) => {
    try {
      const file = req.file || req.files?.[fieldName];

      // Check if file is required
      if (required && !file) {
        return responseFormatter.badRequest(res, `File '${fieldName}' is required`);
      }

      // If no file and not required, continue
      if (!file) {
        return next();
      }

      // Check file size
      if (file.size > maxSize) {
        return responseFormatter.badRequest(
          res,
          `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
        );
      }

      // Check MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return responseFormatter.badRequest(
          res,
          `File type '${file.mimetype}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
        );
      }

      next();
    } catch (error) {
      logger.error('File validation error', {
        error: error.message,
      });
      return responseFormatter.serverError(res, 'File validation failed');
    }
  };
};

export default {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  validateMultiple,
  customValidate,
  sanitize,
  validateFile,
};
