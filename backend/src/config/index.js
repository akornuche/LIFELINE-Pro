import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Server
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || 'localhost',
  },

  // Database
  database: {
    type: process.env.DB_TYPE || (process.env.NODE_ENV === 'production' ? 'postgresql' : 'sqlite'),
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'lifeline_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
    maxPool: parseInt(process.env.DB_MAX_POOL, 10) || 20,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000,
    sqlitePath: process.env.DB_SQLITE_PATH || './data/lifeline.db',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    rateLimitAuthMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 5,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Socket.IO
  socket: {
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT, 10) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL, 10) || 25000,
  },

  // Payment Gateways
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
  },

  flutterwave: {
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
  },

  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    },
    from: process.env.EMAIL_FROM || 'noreply@lifelinepro.com',
  },

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Cron Jobs
  cron: {
    enabled: process.env.ENABLE_CRON_JOBS === 'true',
    statementGeneration: process.env.STATEMENT_GENERATION_CRON || '0 0 1 * *', // 1st day of month
    subscriptionCheck: process.env.SUBSCRIPTION_CHECK_CRON || '0 */6 * * *', // Every 6 hours
  },

  // Admin
  admin: {
    defaultEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@lifelinepro.com',
    defaultPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123!',
  },

  // System
  system: {
    maintenanceMode: process.env.ENABLE_MAINTENANCE_MODE === 'true',
    maxDependents: parseInt(process.env.MAX_DEPENDENTS, 10) || 4,
    sessionCleanupDays: parseInt(process.env.SESSION_CLEANUP_DAYS, 10) || 30,
  },
};

// Validate critical config
const validateConfig = () => {
  const required = [
    'jwt.secret',
    'jwt.refreshSecret',
  ];

  const missing = [];

  if (config.isProduction) {
    // Only require database password for PostgreSQL
    if (config.database.type === 'postgresql' && !config.database.password) {
      missing.push('DB_PASSWORD');
    }
    if (config.jwt.secret === 'your-secret-key') {
      missing.push('JWT_SECRET');
    }
    if (config.jwt.refreshSecret === 'your-refresh-secret') {
      missing.push('JWT_REFRESH_SECRET');
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

validateConfig();

export default config;
