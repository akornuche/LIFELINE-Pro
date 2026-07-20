/**
 * Express application factory.
 *
 * Exports the configured Express app with all middleware and routes attached.
 * Has NO server startup or process.exit() side effects — safe to import from
 * both server.js (production) and integration tests.
 *
 * Database connection is NOT opened here.  Callers are responsible for calling
 * database.connect() (and running schemas) before they start accepting requests.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { auditLog } from './middleware/auditLog.js';
import cache from './utils/cacheService.js';
import { trackRequest } from './utils/monitoring.js';
import { createMetricsEndpoint } from './utils/monitoring.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import queueRoutes from './routes/queueRoutes.js';

import logger from './utils/logger.js';

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────

app.get('/ping', (req, res) => {
  const stats = cache.getStats();
  res.json({
    message: 'pong',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    cache: stats,
    database: {
      type: process.env.DB_TYPE || 'sqlite',
      connected: global.database && global.database.isConnected ? 'yes' : 'no',
    },
  });
});

app.use(
  helmet({
    contentSecurityPolicy: false, // CSP is handled by the frontend (Vercel headers)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    xssFilter: false,
    frameguard: false,
  })
);

// ── Cache-Control ─────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  res.removeHeader('Expires');
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────

// CORS_ORIGIN env var can be a comma-separated list for multiple allowed origins
// e.g. "https://lifeline-pro-frontend.vercel.app,http://localhost:3000"
const buildCorsOrigin = () => {
  const raw = process.env.CORS_ORIGIN || process.env.CLIENT_URL || '';
  if (!raw) {
    // Development fallback — allow all localhost ports
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:5173',
    ];
  }
  const origins = raw.split(',').map(o => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
};

app.use(
  cors({
    origin: buildCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key'],
  })
);

// Ensure OPTIONS preflight is handled before any other middleware
app.options('*', cors({
  origin: buildCorsOrigin(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key'],
}));

// ── Body parsing (rawBody captured for Paystack HMAC) ─────────────────────────

app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
  // test env: no morgan output
}

// ── Rate limiting + audit ─────────────────────────────────────────────────────

app.use(trackRequest);
app.use(globalLimiter);
app.use(auditLog({ eventType: 'api.request', eventCategory: 'general' }));

// ── Static files ──────────────────────────────────────────────────────────────

app.use('/uploads', express.static('uploads'));

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ── Monitoring ────────────────────────────────────────────────────────────────

// Metrics endpoint (admin only)
app.get('/metrics', createMetricsEndpoint());

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/queue', queueRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// ── Global error handler (must be last) ──────────────────────────────────────

app.use(errorHandler);

export default app;
