import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from './connection.js';
import logger from '../utils/logger.js';
import { generateLifelineId } from '../utils/idGenerator.js';

dotenv.config();

/**
 * Admin user seeding script
 * Creates default admin user for system access
 */
class AdminSeeder {
  constructor() {
    this.adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@lifelinepro.com';
    this.adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    if (!this.adminPassword) {
      throw new Error('FATAL: DEFAULT_ADMIN_PASSWORD must be set in environment variables for security');
    }
    this.adminFirstName = 'System';
    this.adminLastName = 'Administrator';
  }

  /**
   * Check if admin user already exists
   */
  async adminExists() {
    const query = 'SELECT id FROM users WHERE email = $1 AND role = $2';
    const result = await db.query(query, [this.adminEmail, 'admin']);
    return result.rows.length > 0;
  }

  /**
   * Create admin user
   */
  async createAdmin() {
    try {
      // Generate unique LifeLine ID
      const lifeLineId = generateLifelineId('admin');

      // Hash password
      const hashedPassword = await bcrypt.hash(this.adminPassword, 10);

      // Insert admin user
      const userQuery = `
        INSERT INTO users (
          id,
          lifeline_id,
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          role,
          status,
          email_verified,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const userId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
      const userValues = [
        userId,
        lifeLineId,
        this.adminEmail,
        hashedPassword,
        this.adminFirstName,
        this.adminLastName,
        '+2348000000000', // Placeholder phone
        'admin',
        'active',
        1, // Email already verified (SQLite uses 1 for true)
      ];

      await db.query(userQuery, userValues);

      logger.info('=================================');
      logger.info('ADMIN USER CREATED SUCCESSFULLY');
      logger.info('=================================');
      logger.info(`LifeLine ID: ${lifeLineId}`);
      logger.info(`Email: ${this.adminEmail}`);
      logger.info(`Name: ${this.adminFirstName} ${this.adminLastName}`);
      logger.info(`Role: admin`);
      logger.info('');
      logger.info('Login Credentials:');
      logger.info(`Email: ${this.adminEmail}`);
      logger.info(`Password: ${this.adminPassword}`);
      logger.info('');
      logger.info('⚠️  IMPORTANT: Change the admin password immediately after first login!');
      logger.info('=================================');

      return { id: userId, email: this.adminEmail, role: 'admin' };
    } catch (error) {
      logger.error('Error creating admin:', error);
      throw error;
    }
  }

  /**
   * Create additional admin users (optional)
   */
  async createAdditionalAdmins() {
    const additionalAdmins = [
      {
        email: 'support@lifelinepro.com',
        firstName: 'Support',
        lastName: 'Team',
        phone: '+2348000000001',
      },
      {
        email: 'billing@lifelinepro.com',
        firstName: 'Billing',
        lastName: 'Administrator',
        phone: '+2348000000002',
      },
    ];

    try {
      for (const admin of additionalAdmins) {
        // Check if already exists
        const checkQuery = 'SELECT id FROM users WHERE email = $1';
        const checkResult = await db.query(checkQuery, [admin.email]);

        if (checkResult.rows.length > 0) {
          logger.info(`Admin ${admin.email} already exists - skipping`);
          continue;
        }

        const lifeLineId = generateLifelineId('admin');
        const hashedPassword = await bcrypt.hash('Admin@123!ChangeThis', 10);

        const userQuery = `
          INSERT INTO users (
            id,
            lifeline_id,
            email,
            password_hash,
            first_name,
            last_name,
            phone,
            role,
            status,
            email_verified,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

        const userId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
        const userValues = [
          userId,
          lifeLineId,
          admin.email,
          hashedPassword,
          admin.firstName,
          admin.lastName,
          admin.phone,
          'admin',
          'active',
          1,
        ];

        await db.query(userQuery, userValues);
        logger.info(`✓ Created admin: ${admin.email}`);
      }

      logger.info('Additional admin users created successfully');
    } catch (error) {
      logger.error('Error creating additional admins:', error);
      throw error;
    }
  }

  /**
   * Seed admin users
   */
  async seed() {
    try {
      // Connect to database first
      await db.connect();

      logger.info('=================================');
      logger.info('ADMIN SEEDING STARTING');
      logger.info('=================================');

      // Check if main admin exists
      const exists = await this.adminExists();
      if (exists) {
        logger.warn('Admin user already exists!');
        logger.info(`Email: ${this.adminEmail}`);
        logger.info('Skipping admin creation...');
        logger.info('');
        logger.info('To reset admin password:');
        logger.info('1. Login to database');
        logger.info(`2. Run: UPDATE users SET password_hash = '$2a$10$...' WHERE email = '${this.adminEmail}'`);
        return;
      }

      // Create main admin
      await this.createAdmin();

      // Optionally create additional admins
      if (process.argv.includes('--additional')) {
        await this.createAdditionalAdmins();
      }

      logger.info('');
      logger.info('Admin seeding completed successfully');
    } catch (error) {
      logger.error('Admin seeding failed:', error);
      throw error;
    }
  }
}

// Run seeding if called directly
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule || process.argv[1]?.includes('seedAdmin.js')) {
  logger.info('=== STARTING ADMIN SEEDING ===');
  const seeder = new AdminSeeder();
  seeder
    .seed()
    .then(() => {
      logger.info('=== ADMIN SETUP COMPLETED ===');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Admin setup failed:', error);
      process.exit(1);
    });
}

export default AdminSeeder;
