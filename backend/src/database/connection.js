import pg from 'pg';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Base Database Adapter
class DatabaseAdapter {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  async query(sql, params = []) {
    throw new Error('query() must be implemented by subclass');
  }

  async healthCheck() {
    throw new Error('healthCheck() must be implemented by subclass');
  }

  async transaction(callback) {
    throw new Error('transaction() must be implemented by subclass');
  }
}

// PostgreSQL Adapter
class PostgreSQLAdapter extends DatabaseAdapter {
  constructor() {
    super();
    this.pool = null;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
  }

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

      logger.info('PostgreSQL connection pool initialized successfully', {
        host: config.database.host,
        database: config.database.name,
        maxPool: config.database.maxPool,
      });

      this.retryCount = 0;
      this.isConnected = true;
      return this.pool;
    } catch (error) {
      logger.error('Failed to initialize PostgreSQL connection', {
        error: error.message,
        stack: error.stack,
        retryCount: this.retryCount,
      });

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.info(`Retrying PostgreSQL connection in ${this.retryDelay / 1000}s (Attempt ${this.retryCount}/${this.maxRetries})`);
        await this.delay(this.retryDelay);
        return this.connect();
      } else {
        logger.error('Max PostgreSQL connection retries reached. Database will not be available.');
        return null;
      }
    }
  }

  async disconnect() {
    if (!this.pool) {
      logger.warn('No active PostgreSQL pool to disconnect');
      return;
    }

    try {
      logger.info('Closing PostgreSQL connection pool...');

      // Wait for active queries to complete (with timeout)
      const timeout = 10000;
      const startTime = Date.now();

      while (this.pool.totalCount > this.pool.idleCount) {
        if (Date.now() - startTime > timeout) {
          logger.warn('PostgreSQL shutdown timeout reached, forcing closure');
          break;
        }
        await this.delay(100);
      }

      await this.pool.end();
      this.pool = null;
      this.isConnected = false;

      logger.info('PostgreSQL connection pool closed successfully');
    } catch (error) {
      logger.error('Error during PostgreSQL disconnection', {
        error: error.message,
      });
      throw error;
    }
  }

  async query(text, params = []) {
    if (!this.pool) {
      throw new Error('PostgreSQL not connected');
    }
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        logger.warn('Slow PostgreSQL query detected', {
          query: text.substring(0, 100),
          duration: `${duration}ms`,
        });
      }

      return result;
    } catch (error) {
      logger.error('PostgreSQL query error', {
        error: error.message,
        query: text.substring(0, 100),
        params: params.length > 0 ? 'present' : 'none',
      });
      throw error;
    }
  }

  async healthCheck() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      client.release();

      logger.debug('PostgreSQL health check passed', {
        currentTime: result.rows[0].current_time,
      });

      return {
        status: 'healthy',
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version,
      };
    } catch (error) {
      logger.error('PostgreSQL health check failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('PostgreSQL transaction rolled back', {
        error: error.message,
      });
      throw error;
    } finally {
      client.release();
    }
  }

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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// SQLite Adapter
class SQLiteAdapter extends DatabaseAdapter {
  constructor() {
    super();
    this.dbPath = path.resolve(__dirname, '../../', config.database.sqlitePath);
  }

  async connect() {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database,
      });

      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON;');

      // Test the connection
      await this.healthCheck();

      logger.info('SQLite database initialized successfully', {
        path: this.dbPath,
      });

      this.isConnected = true;
      return this.db;
    } catch (error) {
      logger.error('Failed to initialize SQLite connection', {
        error: error.message,
        path: this.dbPath,
      });
      throw error;
    }
  }

  async disconnect() {
    if (!this.db) {
      logger.warn('No active SQLite database to disconnect');
      return;
    }

    try {
      logger.info('Closing SQLite database connection...');
      await this.db.close();
      this.db = null;
      this.isConnected = false;
      logger.info('SQLite database connection closed successfully');
    } catch (error) {
      logger.error('Error during SQLite disconnection', {
        error: error.message,
      });
      throw error;
    }
  }

  async query(text, params = []) {
    if (!this.db) {
      throw new Error('SQLite not connected');
    }
    const start = Date.now();
    try {
      // Convert PostgreSQL placeholders ($1, $2, etc.) to SQLite placeholders (?)
      let sqliteQuery = text;
      if (params.length > 0) {
        // Replace $1, $2, $3, etc. with ?
        for (let i = params.length; i >= 1; i--) {
          sqliteQuery = sqliteQuery.replace(new RegExp(`\\$${i}\\b`, 'g'), '?');
        }
      }

      // For SELECT queries, use get() or all()
      if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
        const result = await this.db.all(sqliteQuery, params);
        const duration = Date.now() - start;

        if (duration > 1000) {
          logger.warn('Slow SQLite query detected', {
            query: sqliteQuery.substring(0, 100),
            duration: `${duration}ms`,
          });
        }

        // Return PostgreSQL-compatible format
        return {
          rows: result,
          rowCount: result.length,
        };
      } else {
        // For INSERT, UPDATE, DELETE
        const result = await this.db.run(sqliteQuery, params);
        const duration = Date.now() - start;

        if (duration > 1000) {
          logger.warn('Slow SQLite query detected', {
            query: sqliteQuery.substring(0, 100),
            duration: `${duration}ms`,
          });
        }

        // Return PostgreSQL-compatible format
        return {
          rows: [],
          rowCount: result.changes || 0,
          lastID: result.lastID,
        };
      }
    } catch (error) {
      logger.error('SQLite query error', {
        error: error.message,
        query: text.substring(0, 100),
        params: params.length > 0 ? 'present' : 'none',
      });
      throw error;
    }
  }

  async healthCheck() {
    try {
      const result = await this.db.all('SELECT datetime(\'now\') as current_time, sqlite_version() as version');
      logger.debug('SQLite health check passed', {
        currentTime: result[0].current_time,
      });

      return {
        status: 'healthy',
        currentTime: result[0].current_time,
        version: result[0].version,
      };
    } catch (error) {
      logger.error('SQLite health check failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async transaction(callback) {
    try {
      await this.db.exec('BEGIN TRANSACTION');
      const result = await callback(this.db);
      await this.db.exec('COMMIT');
      return result;
    } catch (error) {
      await this.db.exec('ROLLBACK');
      logger.error('SQLite transaction rolled back', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Main Database Class
class Database {
  constructor() {
    this.adapter = null;
    this.initializeAdapter();
  }

  initializeAdapter() {
    if (config.database.type === 'sqlite') {
      this.adapter = new SQLiteAdapter();
    } else {
      this.adapter = new PostgreSQLAdapter();
    }
  }

  async connect() {
    return this.adapter.connect();
  }

  async disconnect() {
    return this.adapter.disconnect();
  }

  async query(text, params = []) {
    return this.adapter.query(text, params);
  }

  async healthCheck() {
    return this.adapter.healthCheck();
  }

  async transaction(callback) {
    return this.adapter.transaction(callback);
  }

  getPoolStats() {
    if (this.adapter.getPoolStats) {
      return this.adapter.getPoolStats();
    }
    return null;
  }

  isConnected() {
    return this.adapter.isConnected;
  }
}

// Create singleton instance
const database = new Database();

// Export both the instance and the class
export default database;
export { Database };