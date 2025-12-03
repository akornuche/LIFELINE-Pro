import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import db from './index.js';
import logger from '../utils/logger.js';
import { generateLifeLineId } from '../utils/lifeLineId.js';

dotenv.config();

/**
 * Admin user seeding script
 * Creates default admin user for system access
 */
class AdminSeeder {
  constructor() {
    this.adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@lifelinepro.com';
    this.adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123!ChangeThis';
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
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Generate unique LifeLine ID
      const lifeLineId = generateLifeLineId();

      // Hash password
      const hashedPassword = await bcrypt.hash(this.adminPassword, 10);

      // Insert admin user
      const userQuery = `
        INSERT INTO users (
          lifeline_id,
          email,
          password_hash,
          first_name,
          last_name,
          phone_number,
          role,
          status,
          email_verified,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id, lifeline_id, email, first_name, last_name, role
      `;

      const userValues = [
        lifeLineId,
        this.adminEmail,
        hashedPassword,
        this.adminFirstName,
        this.adminLastName,
        '+2348000000000', // Placeholder phone
        'admin',
        'active',
        true, // Email already verified
      ];

      const result = await client.query(userQuery, userValues);
      const admin = result.rows[0];

      await client.query('COMMIT');

      logger.info('=================================');
      logger.info('ADMIN USER CREATED SUCCESSFULLY');
      logger.info('=================================');
      logger.info(`LifeLine ID: ${admin.lifeline_id}`);
      logger.info(`Email: ${admin.email}`);
      logger.info(`Name: ${admin.first_name} ${admin.last_name}`);
      logger.info(`Role: ${admin.role}`);
      logger.info('');
      logger.info('Login Credentials:');
      logger.info(`Email: ${this.adminEmail}`);
      logger.info(`Password: ${this.adminPassword}`);
      logger.info('');
      logger.info('⚠️  IMPORTANT: Change the admin password immediately after first login!');
      logger.info('=================================');

      return admin;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
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

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      for (const admin of additionalAdmins) {
        // Check if already exists
        const checkQuery = 'SELECT id FROM users WHERE email = $1';
        const checkResult = await client.query(checkQuery, [admin.email]);

        if (checkResult.rows.length > 0) {
          logger.info(`Admin ${admin.email} already exists - skipping`);
          continue;
        }

        const lifeLineId = generateLifeLineId();
        const hashedPassword = await bcrypt.hash('Admin@123!ChangeThis', 10);

        const userQuery = `
          INSERT INTO users (
            lifeline_id,
            email,
            password_hash,
            first_name,
            last_name,
            phone_number,
            role,
            status,
            email_verified,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING email
        `;

        const userValues = [
          lifeLineId,
          admin.email,
          hashedPassword,
          admin.firstName,
          admin.lastName,
          admin.phone,
          'admin',
          'active',
          true,
        ];

        await client.query(userQuery, userValues);
        logger.info(`✓ Created admin: ${admin.email}`);
      }

      await client.query('COMMIT');
      logger.info('Additional admin users created successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Seed admin users
   */
  async seed() {
    try {
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
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new AdminSeeder();
  seeder
    .seed()
    .then(() => {
      logger.info('Admin setup completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Admin setup failed:', error);
      process.exit(1);
    });
}

export default AdminSeeder;
