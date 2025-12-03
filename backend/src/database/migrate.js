import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import database from './connection.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationManager {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.schemasDir = path.join(__dirname, '../../database/schemas');
  }

  /**
   * Initialize migrations table
   */
  async initMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await database.query(query);
      logger.info('Migrations table initialized');
    } catch (error) {
      logger.error('Failed to initialize migrations table', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get list of executed migrations
   */
  async getExecutedMigrations() {
    try {
      const result = await database.query(
        'SELECT name FROM migrations ORDER BY id ASC'
      );
      return result.rows.map(row => row.name);
    } catch (error) {
      logger.error('Failed to fetch executed migrations', {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get pending migrations from schemas directory
   */
  async getPendingMigrations() {
    try {
      // Check if schemas directory exists
      try {
        await fs.access(this.schemasDir);
      } catch {
        logger.warn('Schemas directory not found, creating it...');
        await fs.mkdir(this.schemasDir, { recursive: true });
        return [];
      }

      const files = await fs.readdir(this.schemasDir);
      const sqlFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      const executedMigrations = await this.getExecutedMigrations();
      const pendingMigrations = sqlFiles.filter(
        file => !executedMigrations.includes(file)
      );

      return pendingMigrations;
    } catch (error) {
      logger.error('Failed to get pending migrations', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Execute a single migration file
   */
  async executeMigration(filename) {
    const filePath = path.join(this.schemasDir, filename);

    try {
      logger.info(`Executing migration: ${filename}`);

      // Read the SQL file
      const sql = await fs.readFile(filePath, 'utf8');

      // Execute within a transaction
      await database.transaction(async client => {
        // Execute the migration SQL
        await client.query(sql);

        // Record the migration
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [filename]
        );
      });

      logger.info(`Migration completed: ${filename}`);
      return true;
    } catch (error) {
      logger.error(`Migration failed: ${filename}`, {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate() {
    try {
      logger.info('Starting database migrations...');

      // Ensure database is connected
      if (!database.isConnected()) {
        await database.connect();
      }

      // Initialize migrations table
      await this.initMigrationsTable();

      // Get pending migrations
      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

      // Execute each migration
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration process failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Rollback last migration (use with caution)
   */
  async rollback() {
    try {
      logger.warn('Attempting to rollback last migration...');

      const result = await database.query(
        'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
      );

      if (result.rows.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }

      const lastMigration = result.rows[0].name;
      logger.warn(`Rolling back migration: ${lastMigration}`);

      // Note: This is a simple implementation
      // In production, you should have dedicated rollback scripts
      await database.query(
        'DELETE FROM migrations WHERE name = $1',
        [lastMigration]
      );

      logger.warn('Migration rollback completed');
      logger.warn('Note: Schema changes were NOT automatically reverted');
      logger.warn('You may need to manually revert database changes');
    } catch (error) {
      logger.error('Rollback failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async status() {
    try {
      await this.initMigrationsTable();

      const executedMigrations = await this.getExecutedMigrations();
      const pendingMigrations = await this.getPendingMigrations();

      return {
        executed: executedMigrations,
        pending: pendingMigrations,
        total: executedMigrations.length + pendingMigrations.length,
      };
    } catch (error) {
      logger.error('Failed to get migration status', {
        error: error.message,
      });
      throw error;
    }
  }
}

// CLI execution
const runCLI = async () => {
  const command = process.argv[2] || 'migrate';
  const migrationManager = new MigrationManager();

  try {
    // Connect to database
    await database.connect();

    switch (command) {
      case 'migrate':
        await migrationManager.migrate();
        break;

      case 'rollback':
        await migrationManager.rollback();
        break;

      case 'status':
        const status = await migrationManager.status();
        console.log('\n=== Migration Status ===');
        console.log(`Executed: ${status.executed.length}`);
        console.log(`Pending: ${status.pending.length}`);
        console.log(`Total: ${status.total}`);

        if (status.executed.length > 0) {
          console.log('\nExecuted Migrations:');
          status.executed.forEach(m => console.log(`  ✓ ${m}`));
        }

        if (status.pending.length > 0) {
          console.log('\nPending Migrations:');
          status.pending.forEach(m => console.log(`  ○ ${m}`));
        }
        break;

      default:
        console.log('Unknown command. Available commands: migrate, rollback, status');
        process.exit(1);
    }

    // Disconnect
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Migration CLI error', {
      error: error.message,
      stack: error.stack,
    });
    await database.disconnect();
    process.exit(1);
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI();
}

export default MigrationManager;
export { MigrationManager };
