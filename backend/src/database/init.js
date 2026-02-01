import config from '../config/index.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

console.log('INIT.JS STARTED');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database initialization script
 * Creates database if not exists and runs all migrations
 */
class DatabaseInitializer {
  constructor() {
    this.dbType = config.database.type;
    this.dbName = config.database.name;
    this.sqlitePath = config.database.sqlitePath;
  }

  /**
   * Check if database exists (PostgreSQL only)
   */
  async databaseExists() {
    if (this.dbType === 'sqlite') {
      // For SQLite, check if file exists
      try {
        const dbPath = path.resolve(__dirname, '../../', this.sqlitePath);
        await fs.access(dbPath);
        return true;
      } catch {
        return false;
      }
    }

    // PostgreSQL logic would go here if needed
    return true;
  }

  /**
   * Create database (PostgreSQL only)
   */
  async createDatabase() {
    if (this.dbType === 'sqlite') {
      // SQLite database is created automatically when connecting
      return;
    }

    // PostgreSQL logic would go here
    logger.info(`Database ${this.dbName} creation not implemented for ${this.dbType}`);
  }

  /**
   * Run all SQL schema files in order
   */
  async runSchemas() {
    const client = this.dbType === 'sqlite' ? null : null; // We'll use the database instance directly
    try {
      logger.info('Running database schemas...');

      const schemaDir = path.join(__dirname, 'schemas');
      const schemaFiles = [
        '01_users.sql',
        '02_patients.sql',
        '03_doctors.sql',
        '04_pharmacies.sql',
        '05_hospitals.sql',
      ];

      // Import database dynamically to avoid circular dependency
      const { default: database } = await import('./connection.js');

      // Ensure database is connected
      if (!database.isConnected()) {
        await database.connect();
      }

      for (const file of schemaFiles) {
        const filePath = path.join(schemaDir, file);
        try {
          const sql = await fs.readFile(filePath, 'utf8');
          logger.info(`Running schema: ${file}`);

          if (this.dbType === 'sqlite') {
            // For SQLite, split multiple statements and execute them one by one
            // Remove comments and empty lines first
            const cleanedSql = sql
              .split('\n')
              .filter(line => !line.trim().startsWith('--'))
              .join('\n');
            
            const statements = cleanedSql.split(';').filter(stmt => {
              const trimmed = stmt.trim();
              return trimmed.length > 0 && !trimmed.startsWith('--');
            });
            
            for (const statement of statements) {
              const trimmed = statement.trim();
              if (trimmed) {
                await database.query(trimmed + ';');
              }
            }
          } else {
            // PostgreSQL
            await database.query(sql);
          }

          logger.info(`✓ ${file} completed`);
        } catch (error) {
          if (error.code === 'ENOENT') {
            logger.warn(`Schema file not found: ${file} - skipping`);
          } else if (error.message?.includes('already exists') || error.message?.includes('duplicate') || error.code === '42P07') {
            logger.info(`Table from ${file} already exists - skipping`);
          } else {
            logger.error(`Error running schema ${file}:`, error.message);
            throw error;
          }
        }
      }

      logger.info('All schemas executed successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create indexes for performance
   */
  async createIndexes() {
    try {
      logger.info('Creating database indexes...');

      // Import database dynamically to avoid circular dependency
      const { default: database } = await import('./connection.js');

      // Ensure database is connected
      if (!database.isConnected()) {
        await database.connect();
      }

      let indexes = [];

      if (this.dbType === 'sqlite') {
        indexes = [
          // User indexes
          'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
          'CREATE INDEX IF NOT EXISTS idx_users_lifeline_id ON users(lifeline_id)',
          'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
          'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',

          // Patient indexes
          'CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_patients_lifeline_id ON patients(lifeline_id)',

          // Doctor indexes
          'CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization)',
          'CREATE INDEX IF NOT EXISTS idx_doctors_verification_status ON doctors(verification_status)',

          // Pharmacy indexes
          'CREATE INDEX IF NOT EXISTS idx_pharmacies_user_id ON pharmacies(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_pharmacies_verification_status ON pharmacies(verification_status)',

          // Hospital indexes
          'CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON hospitals(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_hospitals_verification_status ON hospitals(verification_status)',

          // Subscription indexes
          'CREATE INDEX IF NOT EXISTS idx_subscriptions_patient_id ON patient_subscriptions(patient_id)',
          'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON patient_subscriptions(status)',
          'CREATE INDEX IF NOT EXISTS idx_subscriptions_package_type ON patient_subscriptions(package_type)',

          // Consultation indexes
          'CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id)',
          'CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id)',
          'CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date)',

          // Prescription indexes
          'CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON prescriptions(consultation_id)',
          'CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id)',
          'CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status)',

          // Payment indexes
          'CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payment_records(patient_id)',
          'CREATE INDEX IF NOT EXISTS idx_payments_reference ON payment_records(payment_reference)',
          'CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_records(status)',
          'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payment_records(created_at)',

          // Statement indexes
          'CREATE INDEX IF NOT EXISTS idx_statements_provider_id ON monthly_statements(provider_id)',
          'CREATE INDEX IF NOT EXISTS idx_statements_status ON monthly_statements(statement_status)',
          'CREATE INDEX IF NOT EXISTS idx_statements_period ON monthly_statements(statement_month, statement_year)',

          // Audit log indexes
          'CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)',
          'CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at)',
        ];
      } else {
        // PostgreSQL indexes
        indexes = [
          // User indexes
          'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
          'CREATE INDEX IF NOT EXISTS idx_users_lifeline_id ON users(lifeline_id)',
          'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
          'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',

          // Patient indexes
          'CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_patients_lifeline_id ON patients(lifeline_id)',

          // Doctor indexes
          'CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization)',
          'CREATE INDEX IF NOT EXISTS idx_doctors_verification_status ON doctors(verification_status)',

          // Pharmacy indexes
          'CREATE INDEX IF NOT EXISTS idx_pharmacies_user_id ON pharmacies(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_pharmacies_verification_status ON pharmacies(verification_status)',

          // Hospital indexes
          'CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON hospitals(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_hospitals_verification_status ON hospitals(verification_status)',

          // Subscription indexes
          'CREATE INDEX IF NOT EXISTS idx_subscriptions_patient_id ON patient_subscriptions(patient_id)',
          'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON patient_subscriptions(status)',
          'CREATE INDEX IF NOT EXISTS idx_subscriptions_package_type ON patient_subscriptions(package_type)',

          // Consultation indexes
          'CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id)',
          'CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id)',
          'CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date)',

          // Prescription indexes
          'CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON prescriptions(consultation_id)',
          'CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id)',
          'CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status)',

          // Payment indexes
          'CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payment_records(patient_id)',
          'CREATE INDEX IF NOT EXISTS idx_payments_reference ON payment_records(payment_reference)',
          'CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_records(status)',
          'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payment_records(created_at)',

          // Statement indexes
          'CREATE INDEX IF NOT EXISTS idx_statements_provider_id ON monthly_statements(provider_id)',
          'CREATE INDEX IF NOT EXISTS idx_statements_status ON monthly_statements(statement_status)',
          'CREATE INDEX IF NOT EXISTS idx_statements_period ON monthly_statements(statement_month, statement_year)',

          // Audit log indexes
          'CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)',
          'CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at)',
        ];
      }

      for (const indexSQL of indexes) {
        try {
          await database.query(indexSQL);
        } catch (error) {
          if (error.message?.includes('already exists') || error.message?.includes('duplicate') || error.code === '42P07') {
            // Ignore "already exists" errors
            continue;
          }
          logger.error(`Error creating index:`, error.message);
        }
      }

      logger.info('Indexes created successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      // Import database dynamically to avoid circular dependency
      const { default: database } = await import('./connection.js');

      // Connect first
      await database.connect();

      if (this.dbType === 'sqlite') {
        const result = await database.query('SELECT datetime(\'now\') as current_time');
        logger.info('SQLite database connection test successful');
        return true;
      } else {
        const result = await database.query('SELECT NOW()');
        logger.info('PostgreSQL database connection test successful');
        return true;
      }
    } catch (error) {
      logger.error('Database connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Initialize database
   */
  async initialize() {
    try {
      console.log('Starting database initialization...');
      logger.info('=================================');
      logger.info('DATABASE INITIALIZATION STARTING');
      logger.info(`Database Type: ${this.dbType.toUpperCase()}`);
      logger.info('=================================');

      // Step 1: Check and create database
      console.log('Step 1: Checking database existence...');
      const exists = await this.databaseExists();
      console.log('Database exists:', exists);
      if (!exists) {
        await this.createDatabase();
      } else {
        logger.info(`${this.dbType === 'sqlite' ? 'SQLite file' : 'Database'} already exists`);
      }

      // Step 2: Test connection
      console.log('Step 2: Testing connection...');
      const connected = await this.testConnection();
      console.log('Connection test result:', connected);
      if (!connected) {
        throw new Error('Failed to connect to database');
      }

      // Step 3: Run schemas
      console.log('Step 3: Running schemas...');
      await this.runSchemas();

      // Step 4: Create indexes
      console.log('Step 4: Creating indexes...');
      await this.createIndexes();

      logger.info('=================================');
      logger.info('DATABASE INITIALIZED SUCCESSFULLY');
      logger.info('=================================');
      logger.info('');
      logger.info('Next steps:');
      logger.info('1. Run: npm run seed           - Seed initial data');
      logger.info('2. Run: npm run seed:admin     - Create admin user');
      logger.info('3. Run: npm run dev            - Start development server');
      logger.info('');

      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }
}

// Run initialization if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` ||
                     process.argv[1]?.endsWith('init.js');

if (isMainModule) {
  const initializer = new DatabaseInitializer();
  initializer
    .initialize()
    .then(() => {
      logger.info('Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database setup failed:', error);
      process.exit(1);
    });
}

export default DatabaseInitializer;
