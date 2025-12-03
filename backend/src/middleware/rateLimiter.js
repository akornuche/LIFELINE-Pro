import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import responseFormatter from '../utils/response.js';

/**
 * Rate Limiting Middleware
 * Protects API from abuse with different limits for different routes
 */

/**
 * Default rate limit handler
 */
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    user: req.user ? { id: req.user.id, role: req.user.role } : undefined,
    endpoint: req.path,
  });

  return res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    retryAfter: req.rateLimit?.resetTime
      ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      : 60,
  });
};

/**
 * Skip rate limiting for certain conditions
 */
const skipRateLimiting = (req) => {
  // Skip for health checks
  if (req.path === '/health' || req.path === '/api/health') {
    return true;
  }

  // Skip for whitelisted IPs (can be configured via environment)
  const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
  if (whitelistedIPs.includes(req.ip)) {
    return true;
  }

  return false;
};

/**
 * Get user identifier for rate limiting
 */
const keyGenerator = (req) => {
  // Use user ID if authenticated
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  // Otherwise use IP address
  return `ip:${req.ip}`;
};

/**
 * Create store - using memory store (production should use Redis)
 */
const createStore = () => {
  // Using default memory store for development
  // For production, configure Redis and use rate-limit-redis package
  return undefined;
};

/**
 * Global API rate limiter
 * 100 requests per 15 minutes per user/IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP/user to 100 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimiting,
  keyGenerator,
  store: createStore(),
});

/**
 * Strict rate limiter for authentication routes
 * 5 login attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `auth:${req.ip}`, // Always use IP for auth
  store: createStore(),
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `register:${req.ip}`,
  store: createStore(),
});

/**
 * Password reset rate limiter
 * 3 reset requests per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `reset:${req.ip}`,
  store: createStore(),
});

/**
 * Payment operation rate limiter
 * 10 payment operations per hour per user
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `payment:${req.user?.id || req.ip}`,
  store: createStore(),
});

/**
 * Provider approval rate limiter
 * 30 approvals per hour per provider
 */
export const providerApprovalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `approval:${req.user?.id || req.ip}`,
  store: createStore(),
});

/**
 * File upload rate limiter
 * 20 uploads per hour per user
 */
export const fileUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `upload:${req.user?.id || req.ip}`,
  store: createStore(),
});

/**
 * Search/Query rate limiter
 * 60 searches per minute per user
 */
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
  store: createStore(),
});

/**
 * Webhook rate limiter (for external services)
 * 100 requests per minute per IP
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `webhook:${req.ip}`,
  store: createStore(),
});

/**
 * OTP/Verification code rate limiter
 * 5 OTP requests per 15 minutes per user
 */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `otp:${req.body?.email || req.body?.phone || req.ip}`,
  store: createStore(),
});

/**
 * Admin operations rate limiter
 * 200 requests per 15 minutes for admin users
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => `admin:${req.user?.id || req.ip}`,
  skip: (req) => {
    // Only apply to admin users
    return req.user?.role !== 'admin';
  },
  store: createStore(),
});

/**
 * Custom rate limiter factory
 */
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests',
    keyPrefix = 'custom',
    skipSuccessfulRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      logger.warn('Custom rate limit exceeded', {
        prefix: keyPrefix,
        ip: req.ip,
        user: req.user ? { id: req.user.id } : undefined,
      });
      return res.status(429).json({
        success: false,
        message,
      });
    },
    keyGenerator: (req) => `${keyPrefix}:${req.user?.id || req.ip}`,
    skip: skipRateLimiting,
    store: createStore(),
  });
};

/**
 * Dynamic rate limiter based on user role
 */
export const dynamicRateLimiter = (limits = {}) => {
  return (req, res, next) => {
    const role = req.user?.role || 'guest';
    const limit = limits[role] || limits.default || 100;

    const limiter = createRateLimiter({
      max: limit,
      keyPrefix: `dynamic:${role}`,
    });

    return limiter(req, res, next);
  };
};

/**
 * Log rate limit metrics
 */
export const logRateLimitMetrics = (req, res, next) => {
  if (req.rateLimit) {
    logger.debug('Rate limit status', {
      endpoint: req.path,
      user: req.user ? { id: req.user.id, role: req.user.role } : undefined,
      ip: req.ip,
      limit: req.rateLimit.limit,
      current: req.rateLimit.current,
      remaining: req.rateLimit.remaining,
      resetTime: req.rateLimit.resetTime,
    });
  }
  next();
};

export default {
  globalRateLimiter,
  authRateLimiter,
  registrationRateLimiter,
  passwordResetRateLimiter,
  paymentRateLimiter,
  providerApprovalRateLimiter,
  fileUploadRateLimiter,
  searchRateLimiter,
  webhookRateLimiter,
  otpRateLimiter,
  adminRateLimiter,
  createRateLimiter,
  dynamicRateLimiter,
  logRateLimitMetrics,
};

// Export aliases for backward compatibility
export const authLimiter = authRateLimiter;
export const strictAuthLimiter = authRateLimiter;
export const paymentLimiter = paymentRateLimiter;
export const globalLimiter = globalRateLimiter;
