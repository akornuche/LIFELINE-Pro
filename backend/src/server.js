import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { auditLog } from './middleware/auditLog.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Import utilities
import logger from './utils/logger.js';
import database from './database/connection.js';
import { initializeSocketIO } from './services/socketService.js';
import paymentReminderService from './services/paymentReminderService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Test endpoint before middleware
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
  xssFilter: false, // Remove X-XSS-Protection header (deprecated)
  frameguard: false, // Disable X-Frame-Options (using CSP instead)
}));

// Cache control middleware - Use Cache-Control instead of Expires
app.use((req, res, next) => {
  // Remove Expires header if set
  res.removeHeader('Expires');
  
  // Set appropriate Cache-Control based on content type
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Static assets - cache for 1 year
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.startsWith('/api/')) {
    // API responses - no cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  } else {
    // HTML pages - cache for 1 hour with revalidation
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Rate limiting
app.use(globalLimiter);

// Audit logging
// app.use(auditLog); // Temporarily disabled - audit_logs table doesn't exist yet

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Database connection test
const testDatabaseConnection = async () => {
  try {
    // Initialize database connection first
    const pool = await database.connect();
    if (!pool) {
      return false;
    }

    // Use appropriate query based on database type
    const config = await import('./config/index.js');
    const query = config.default.database.type === 'sqlite'
      ? "SELECT datetime('now') as now"
      : 'SELECT NOW()';

    const result = await database.query(query);
    logger.info('Database connection successful', {
      timestamp: result.rows[0].now || result.rows[0].current_time,
      databaseType: config.default.database.type,
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
    });
    return false;
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await database.disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', {
        error: error.message,
      });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
let server;

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();

    if (!dbConnected) {
      logger.warn('Database connection failed. Server will start but database operations will not work.');
      logger.warn('Please ensure your database is properly configured.');
    }

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`LifeLine Pro API Server started`, {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        databaseConnected: dbConnected,
      });

      // Initialize Socket.IO for real-time notifications
      // initializeSocketIO(server);
      // logger.info('Socket.IO initialized for real-time notifications');

      // Start payment reminder service
      // if (process.env.ENABLE_CRON_JOBS === 'true') {
      //   paymentReminderService.initialize();
      //   logger.info('Payment reminder service started');
      // }

      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📝 Health check: http://localhost:${PORT}/health`);
        console.log(`📚 API Base: http://localhost:${PORT}/api\n`);
        if (!dbConnected) {
          console.log(`⚠️  WARNING: Database not connected. Please run: npm run db:setup`);
          console.log(`   Database Type: ${process.env.DB_TYPE || 'sqlite'}\n`);
        }
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error', { error: error.message });
      }
      process.exit(1);
    });

    // Handle unhandled promise rejections
    // process.on('unhandledRejection', (reason, promise) => {
    //   logger.error('Unhandled Rejection', {
    //     reason: reason,
    //     promise: promise,
    //   });
    // });

    // Handle uncaught exceptions
    // process.on('uncaughtException', (error) => {
    //   logger.error('Uncaught Exception', {
    //     error: error.message,
    //     stack: error.stack,
    //   });
    //   process.exit(1);
    // });

    // Graceful shutdown handlers
    // process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    // process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
    });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
