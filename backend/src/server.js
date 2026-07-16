import 'dotenv/config';

// Import the configured Express app (middleware + routes, no side effects)
import app from './app.js';
import { trackRequest, createMetricsEndpoint } from './utils/monitoring.js';

// Import utilities for server startup
import logger from './utils/logger.js';
import database from './database/connection.js';
import DatabaseInitializer from './database/init.js';
import { initializeSocketIO } from './services/socketService.js';
import paymentReminderService from './services/paymentReminderService.js';
import schedulerService from './services/schedulerService.js';

const PORT = process.env.PORT || 5000;

// ── Helpers ───────────────────────────────────────────────────────────────────

const testDatabaseConnection = async () => {
  try {
    const pool = await database.connect();
    if (!pool) return false;

    const config = await import('./config/index.js');
    const query =
      config.default.database.type === 'sqlite'
        ? "SELECT datetime('now') as now"
        : 'SELECT NOW()';

    const result = await database.query(query);
    logger.info('Database connection successful', {
      timestamp: result.rows[0].now || result.rows[0].current_time,
      databaseType: config.default.database.type,
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    return false;
  }
};

let server;

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await database.disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// ── Server startup ────────────────────────────────────────────────────────────

const startServer = async () => {
  try {
    const init = new DatabaseInitializer();
    await init.initialize();

    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.warn('Database connection failed. Server will start but database operations will not work.');
    }

    server = app.listen(PORT, () => {
      logger.info('LifeLine Pro API Server started', {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        databaseConnected: dbConnected,
      });

      initializeSocketIO(server);
      logger.info('Socket.IO initialized for real-time notifications');

      if (process.env.ENABLE_CRON_JOBS === 'true') {
        paymentReminderService.initialize();
        logger.info('Payment reminder service started');
        
        schedulerService.initialize();
        logger.info('Scheduler service started');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📝 Health check: http://localhost:${PORT}/health`);
        console.log(`📚 API Base: http://localhost:${PORT}/api\n`);
        if (!dbConnected) {
          console.log('⚠️  WARNING: Database not connected. Please run: npm run db:setup');
          console.log(`   Database Type: ${process.env.DB_TYPE || 'sqlite'}\n`);
        }
      }
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error', { error: error.message });
      }
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Only auto-start when this file is the direct entry point (node src/server.js).
// Jest workers that import app.js directly never trigger startServer().
if (process.env.NODE_ENV !== 'test' && !process.env.LIFELINE_SKIP_SERVER_START) {
  startServer();
}

export default app;

