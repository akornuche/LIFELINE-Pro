/**
 * Monitoring & APM Instrumentation
 *
 * Features:
 *   - Request performance tracking
 *   - Database query timing
 *   - Error tracking with context
 *   - Health status monitoring
 *   - Custom metrics (optional)
 */

// ── Metrics Store (in-memory, for production use Redis or external metrics) ────────────────

const metrics = {
  requests: { total: 0, errors: 0, byMethod: {}, byEndpoint: {} },
  database: { queries: 0, slowQueries: 0, totalDuration: 0 },
  errors: [],
  uptime: Date.now(),
};

// ── Request Tracking Middleware ──────────────────────────────────────────────────────────

/**
 * Track incoming requests
 */
export const trackRequest = (req, res, next) => {
  const startTime = Date.now();
  const method = req.method;
  const path = req.path;

  // Track request
  metrics.requests.total++;

  if (!metrics.requests.byMethod[method]) {
    metrics.requests.byMethod[method] = 0;
  }
  metrics.requests.byMethod[method]++;

  if (!metrics.requests.byEndpoint[path]) {
    metrics.requests.byEndpoint[path] = { total: 0, errors: 0, totalDuration: 0 };
  }
  metrics.requests.byEndpoint[path].total++;

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.requests.byEndpoint[path].totalDuration += duration;

    // Track errors
    if (res.statusCode >= 400) {
      metrics.requests.errors++;
      metrics.requests.byEndpoint[path].errors++;
    }
  });

  next();
};

// ── Database Query Tracking ──────────────────────────────────────────────────────────────

/**
 * Track database query duration
 */
export const trackDatabaseQuery = (duration, sql) => {
  metrics.database.queries++;

  if (duration > 1000) {
    metrics.database.slowQueries++;
    // Log slow queries (handled in connection.js, but tracked here for metrics)
  }

  metrics.database.totalDuration += duration;
};

// ── Error Tracking ───────────────────────────────────────────────────────────────────────

/**
 * Track errors with context
 */
export const trackError = (err, req, extra = {}) => {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    message: err.message,
    name: err.name,
    stack: err.stack?.split('\n').slice(0, 10).join('\n'),
    path: req?.path,
    method: req?.method,
    ip: req?.ip,
    userId: req?.user?.id,
    extra,
  };

  metrics.errors.push(errorEntry);

  // Keep only last 100 errors
  if (metrics.errors.length > 100) {
    metrics.errors.shift();
  }
};

// ── Health Status ────────────────────────────────────────────────────────────────────────

/**
 * Get monitoring health status
 */
export const getHealthStatus = () => {
  const uptime = Math.floor((Date.now() - metrics.uptime) / 1000);

  return {
    status: metrics.errors.length === 0 ? 'healthy' : 'warning',
    uptime,
    timestamp: new Date().toISOString(),
    metrics: {
      requests: {
        total: metrics.requests.total,
        errors: metrics.requests.errors,
        errorRate: metrics.requests.total > 0
          ? ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2)
          : 0,
        byMethod: metrics.requests.byMethod,
        byEndpoint: Object.entries(metrics.requests.byEndpoint)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 10)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
      },
      database: {
        queries: metrics.database.queries,
        slowQueries: metrics.database.slowQueries,
        avgDuration: metrics.database.queries > 0
          ? (metrics.database.totalDuration / metrics.database.queries).toFixed(2)
          : 0,
      },
      errors: metrics.errors.slice(-10).reverse(),
    },
  };
};

// ── Export Metrics ───────────────────────────────────────────────────────────────────────

/**
 * Get raw metrics for external monitoring
 */
export const getRawMetrics = () => ({ ...metrics });

/**
 * Reset metrics (useful for testing)
 */
export const resetMetrics = () => {
  Object.assign(metrics, {
    requests: { total: 0, errors: 0, byMethod: {}, byEndpoint: {} },
    database: { queries: 0, slowQueries: 0, totalDuration: 0 },
    errors: [],
    uptime: Date.now(),
  });
};

// ── Request Metrics Endpoint ─────────────────────────────────────────────────────────────

/**
 * Create metrics endpoint handler
 */
export const createMetricsEndpoint = () => {
  return (req, res) => {
    const status = getHealthStatus();
    res.json(status);
  };
};

// ── Log metrics periodically ─────────────────────────────────────────────────────────────

/**
 * Log metrics to logger
 */
export const logMetrics = (logger) => {
  const status = getHealthStatus();
  logger.info('Request metrics', {
    totalRequests: status.metrics.requests.total,
    errorRate: status.metrics.requests.errorRate,
    databaseQueries: status.metrics.database.queries,
    slowQueries: status.metrics.database.slowQueries,
  });
};

// ── Prometheus-style metrics (optional) ───────────────────────────────────────────────────

/**
 * Get metrics in Prometheus format
 */
export const getPrometheusMetrics = () => {
  const lines = [];
  const status = getHealthStatus();

  lines.push('# HELP lifeline_requests_total Total number of requests');
  lines.push(`# TYPE lifeline_requests_total counter`);
  lines.push(`lifeline_requests_total ${status.metrics.requests.total}`);

  lines.push('# HELP lifeline_requests_errors_total Number of error responses');
  lines.push(`# TYPE lifeline_requests_errors_total counter`);
  lines.push(`lifeline_requests_errors_total ${status.metrics.requests.errors}`);

  lines.push('# HELP lifeline_requests_error_rate Error rate percentage');
  lines.push(`# TYPE lifeline_requests_error_rate gauge`);
  lines.push(`lifeline_requests_error_rate ${parseFloat(status.metrics.requests.errorRate)}`);

  lines.push('# HELP lifeline_database_queries_total Total database queries');
  lines.push(`# TYPE lifeline_database_queries_total counter`);
  lines.push(`lifeline_database_queries_total ${status.metrics.database.queries}`);

  lines.push('# HELP lifeline_database_slow_queries_total Slow queries (>1s)');
  lines.push(`# TYPE lifeline_database_slow_queries_total counter`);
  lines.push(`lifeline_database_slow_queries_total ${status.metrics.database.slowQueries}`);

  lines.push('# HELP lifeline_uptime_seconds Server uptime in seconds');
  lines.push(`# TYPE lifeline_uptime_seconds counter`);
  lines.push(`lifeline_uptime_seconds ${status.uptime}`);

  return lines.join('\n');
};

export default {
  trackRequest,
  trackDatabaseQuery,
  trackError,
  getHealthStatus,
  getRawMetrics,
  resetMetrics,
  createMetricsEndpoint,
  logMetrics,
  getPrometheusMetrics,
};
