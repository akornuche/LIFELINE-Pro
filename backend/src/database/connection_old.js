import pg from 'pg';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

class Database {
  constructor() {
    this.pool = null;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Initialize database connection pool
   */
  async connect() {
    try {
      const poolConfig = {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
        max: config.database.maxPool,
        idleTimeoutMillis: config.database.idleTimeout,
        connectionTimeoutMillis: config.database.connectionTimeout,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      };

      this.pool = new Pool(poolConfig);

      // Handle pool errors
      this.pool.on('error', (err, client) => {
        logger.error('Unexpected error on idle client', {
          error: err.message,
          stack: err.stack,
        });
      });

      // Handle client connection
      this.pool.on('connect', client => {
        logger.debug('New client connected to database pool');
      });

      // Handle client removal
      this.pool.on('remove', client => {
        logger.debug('Client removed from database pool');
      });

      // Test the connection
      await this.healthCheck();

      logger.info('Database connection pool initialized successfully', {
        host: config.database.host,
        database: config.database.name,
        maxPool: config.database.maxPool,
      });

      this.retryCount = 0;
      return this.pool;
    } catch (error) {
      logger.error('Failed to initialize database connection', {
        error: error.message,
        stack: error.stack,
        retryCount: this.retryCount,
      });

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.info(`Retrying database connection in ${this.retryDelay / 1000}s (Attempt ${this.retryCount}/${this.maxRetries})`);
        await this.delay(this.retryDelay);
        return this.connect();
      } else {
        logger.error('Max database connection retries reached. Database will not be available.');
        // Don't throw error, just return null to allow server to start
        return null;
      }
    }
  }

  /**
   * Health check - verify database connection
   */
  async healthCheck() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      client.release();

      logger.debug('Database health check passed', {
        currentTime: result.rows[0].current_time,
      });

      return {
        status: 'healthy',
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version,
      };
    } catch (error) {
      logger.error('Database health check failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(text, params = []) {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        logger.warn('Slow query detected', {
          query: text.substring(0, 100),
          duration: `${duration}ms`,
        });
      }

      return result;
    } catch (error) {
      logger.error('Database query error', {
        error: error.message,
        query: text.substring(0, 100),
        params: params.length > 0 ? 'present' : 'none',
      });
      throw error;
    }
  }

  /**
   * Get a client from the pool (for transactions)
   */
  async getClient() {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger.error('Failed to get database client', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Execute queries within a transaction
   */
  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back', {
        error: error.message,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (!this.pool) {
      logger.warn('No active database pool to disconnect');
      return;
    }

    try {
      logger.info('Closing database connection pool...');

      // Wait for active queries to complete (with timeout)
      const timeout = 10000; // 10 seconds
      const startTime = Date.now();

      while (this.pool.totalCount > this.pool.idleCount) {
        if (Date.now() - startTime > timeout) {
          logger.warn('Database shutdown timeout reached, forcing closure');
          break;
        }
        await this.delay(100);
      }

      await this.pool.end();
      this.pool = null;

      logger.info('Database connection pool closed successfully');
    } catch (error) {
      logger.error('Error during database disconnection', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.pool !== null && this.pool.totalCount > 0;
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const database = new Database();

// Export both the instance and the class
export default database;
export { Database };
