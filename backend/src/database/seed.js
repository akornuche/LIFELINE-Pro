import database from './connection.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

class Seeder {
  constructor() {
    this.data = {
      users: [],
      patients: [],
      doctors: [],
      pharmacies: [],
      hospitals: [],
      pricing: [],
    };
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Seed pricing table
   */
  async seedPricingTable() {
    logger.info('Seeding pricing table...');

    const pricingData = [
      // Consultations
      { service_type: 'consultation', service_name: 'General Practitioner Consultation', service_category: 'Primary Care', unit_cost: 3000, applies_to_basic: true, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'consultation', service_name: 'Specialist Consultation', service_category: 'Secondary Care', unit_cost: 5000, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'consultation', service_name: 'Consultant Consultation', service_category: 'Tertiary Care', unit_cost: 8000, applies_to_basic: false, applies_to_medium: false, applies_to_advanced: true },

      // Drugs
      { service_type: 'drug_dispensing', service_name: 'Paracetamol 500mg', service_category: 'Essential', unit_cost: 50, applies_to_basic: true, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'drug_dispensing', service_name: 'Antimalarial (Coartem)', service_category: 'Essential', unit_cost: 800, applies_to_basic: true, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'drug_dispensing', service_name: 'Amoxicillin 500mg', service_category: 'Essential', unit_cost: 150, applies_to_basic: true, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'drug_dispensing', service_name: 'Blood Pressure Medication', service_category: 'Chronic Disease', unit_cost: 2500, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'drug_dispensing', service_name: 'Diabetes Medication', service_category: 'Chronic Disease', unit_cost: 3000, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },

      // Minor Surgeries
      { service_type: 'minor_surgery', service_name: 'Appendectomy', service_category: 'General Surgery', unit_cost: 150000, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'minor_surgery', service_name: 'Wound Suturing', service_category: 'Emergency', unit_cost: 15000, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'minor_surgery', service_name: 'Cyst Removal', service_category: 'General Surgery', unit_cost: 50000, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },

      // Major Surgeries
      { service_type: 'major_surgery', service_name: 'Cardiac Surgery', service_category: 'Cardiology', unit_cost: 2000000, applies_to_basic: false, applies_to_medium: false, applies_to_advanced: true },
      { service_type: 'major_surgery', service_name: 'Orthopedic Surgery', service_category: 'Orthopedics', unit_cost: 500000, applies_to_basic: false, applies_to_medium: false, applies_to_advanced: true },
      { service_type: 'major_surgery', service_name: 'Neurosurgery', service_category: 'Neurology', unit_cost: 1500000, applies_to_basic: false, applies_to_medium: false, applies_to_advanced: true },

      // Lab Tests
      { service_type: 'laboratory_test', service_name: 'Complete Blood Count', service_category: 'Basic', unit_cost: 3000, applies_to_basic: true, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'laboratory_test', service_name: 'Malaria Test', service_category: 'Basic', unit_cost: 1500, applies_to_basic: true, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'laboratory_test', service_name: 'Lipid Profile', service_category: 'Advanced', unit_cost: 8000, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },

      // Imaging
      { service_type: 'imaging', service_name: 'X-Ray', service_category: 'Basic Imaging', unit_cost: 5000, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'imaging', service_name: 'Ultrasound', service_category: 'Basic Imaging', unit_cost: 8000, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'imaging', service_name: 'CT Scan', service_category: 'Advanced Imaging', unit_cost: 50000, applies_to_basic: false, applies_to_medium: false, applies_to_advanced: true },
      { service_type: 'imaging', service_name: 'MRI Scan', service_category: 'Advanced Imaging', unit_cost: 80000, applies_to_basic: false, applies_to_medium: false, applies_to_advanced: true },

      // Admissions
      { service_type: 'admission', service_name: 'General Ward (per day)', service_category: 'Inpatient', unit_cost: 10000, applies_to_basic: false, applies_to_medium: true, applies_to_advanced: true },
      { service_type: 'admission', service_name: 'Private Ward (per day)', service_category: 'Inpatient', unit_cost: 25000, applies_to_basic: false, applies_to_medium: false, applies_to_advanced: true },
    ];

    for (const item of pricingData) {
      await database.query(
        `INSERT INTO pricing_table (service_type, service_name, service_category, unit_cost, applies_to_basic, applies_to_medium, applies_to_advanced)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (service_type, service_name) DO NOTHING`,
        [item.service_type, item.service_name, item.service_category, item.unit_cost, item.applies_to_basic, item.applies_to_medium, item.applies_to_advanced]
      );
    }

    logger.info(`Seeded ${pricingData.length} pricing items`);
  }

  /**
   * Seed admin user
   */
  async seedAdmin() {
    logger.info('Seeding admin user...');

    const adminPassword = await this.hashPassword('Admin@123!');
    const adminId = uuidv4();

    await database.query(
      `INSERT INTO users (id, lifeline_id, email, phone, password_hash, role, email_verified, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING`,
      [adminId, 'LLADM-00001', 'admin@lifelinepro.com', '+2348000000000', adminPassword, 'admin', 1, 'active']
    );

    logger.info('Admin user created: admin@lifelinepro.com / Admin@123!');
  }

  /**
   * Seed test patients
   */
  async seedPatients() {
    logger.info('Seeding test patients...');

    const patients = [
      {
        lifeline_id: 'LLPAT-00001',
        email: 'patient.basic@test.com',
        phone: '+2348100000001',
        first_name: 'John',
        last_name: 'Doe',
        package_type: 'BASIC',
      },
      {
        lifeline_id: 'LLPAT-00002',
        email: 'patient.medium@test.com',
        phone: '+2348100000002',
        first_name: 'Jane',
        last_name: 'Smith',
        package_type: 'MEDIUM',
      },
      {
        lifeline_id: 'LLPAT-00003',
        email: 'patient.advanced@test.com',
        phone: '+2348100000003',
        first_name: 'Michael',
        last_name: 'Johnson',
        package_type: 'ADVANCED',
      },
    ];

    const password = await this.hashPassword('Patient@123');

    for (const patient of patients) {
      const userId = uuidv4();

      try {
        // Insert user
        try {
          await database.query(
            `INSERT INTO users (id, lifeline_id, email, phone, password_hash, role, email_verified, status, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [userId, patient.lifeline_id, patient.email, patient.phone, password, 'patient', 1, 'active', patient.first_name, patient.last_name]
          );
        } catch (err) {
          if (!err.message.includes('UNIQUE')) throw err;
          // Get existing user ID if it failed
          const existing = await database.query('SELECT id FROM users WHERE email = $1', [patient.email]);
          if (existing.rows.length > 0) {
            const existingId = existing.rows[0].id;
            // Try to insert profile for existing user
            try {
              await database.query(
                `INSERT INTO patients (id, user_id, lifeline_id, subscription_status)
                   VALUES ($1, $2, $3, $4)`,
                [uuidv4(), existingId, patient.lifeline_id, 'inactive']
              );
            } catch (profileErr) {
              if (!profileErr.message.includes('UNIQUE')) throw profileErr;
            }
            continue; // Skip the new userId path
          }
        }

        // Insert patient profile for new user
        await database.query(
          `INSERT INTO patients (id, user_id, lifeline_id, subscription_status)
           VALUES ($1, $2, $3, $4)`,
          [uuidv4(), userId, patient.lifeline_id, 'inactive']
        );
      } catch (err) {
        // Ignore if already exists
        if (!err.message.includes('UNIQUE')) {
          throw err;
        }
      }
    }

    logger.info(`Seeded ${patients.length} test patients (users and profiles)`);
  }

  /**
   * Seed test doctors
   */
  async seedDoctors() {
    logger.info('Seeding test doctors...');

    const doctors = [
      {
        lifeline_id: 'LLDOC-00001',
        email: 'doctor.gp@test.com',
        phone: '+2348200000001',
        first_name: 'Dr. Sarah',
        last_name: 'Williams',
        specialty: 'General Practice',
        license_number: 'MD-NGR-12345',
      },
      {
        lifeline_id: 'LLDOC-00002',
        email: 'doctor.cardio@test.com',
        phone: '+2348200000002',
        first_name: 'Dr. David',
        last_name: 'Brown',
        specialty: 'Cardiology',
        license_number: 'MD-NGR-12346',
      },
    ];

    const password = await this.hashPassword('Doctor@123');

    for (const doctor of doctors) {
      const userId = uuidv4();

      try {
        // Insert user
        try {
          await database.query(
            `INSERT INTO users (id, lifeline_id, email, phone, password_hash, role, email_verified, status, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [userId, doctor.lifeline_id, doctor.email, doctor.phone, password, 'doctor', 1, 'active', doctor.first_name, doctor.last_name]
          );
        } catch (err) {
          if (!err.message.includes('UNIQUE')) throw err;
          const existing = await database.query('SELECT id FROM users WHERE email = $1', [doctor.email]);
          if (existing.rows.length > 0) {
            const existingId = existing.rows[0].id;
            try {
              await database.query(
                `INSERT INTO doctors (id, user_id, specialization, license_number, verification_status, consultation_fee)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                [uuidv4(), existingId, doctor.specialty, doctor.license_number, 'verified', 5000]
              );
            } catch (profileErr) {
              if (!profileErr.message.includes('UNIQUE')) throw profileErr;
            }
            continue;
          }
        }

        // Insert doctor profile
        await database.query(
          `INSERT INTO doctors (id, user_id, specialization, license_number, verification_status, consultation_fee)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), userId, doctor.specialty, doctor.license_number, 'verified', 5000]
        );
      } catch (err) {
        // Ignore if already exists
        if (!err.message.includes('UNIQUE')) {
          throw err;
        }
      }
    }

    logger.info(`Seeded ${doctors.length} test doctors (users and profiles)`);
  }

  /**
   * Seed test pharmacies
   */
  async seedPharmacies() {
    logger.info('Seeding test pharmacies...');

    const pharmacies = [
      {
        lifeline_id: 'LLPHA-00001',
        email: 'pharmacy.central@test.com',
        phone: '+2348300000001',
        pharmacy_name: 'Central Pharmacy',
        license_number: 'PHA-NGR-12345',
      },
    ];

    const password = await this.hashPassword('Pharmacy@123');

    for (const pharmacy of pharmacies) {
      const userId = uuidv4();

      try {
        // Insert user
        try {
          await database.query(
            `INSERT INTO users (id, lifeline_id, email, phone, password_hash, role, email_verified, status, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [userId, pharmacy.lifeline_id, pharmacy.email, pharmacy.phone, password, 'pharmacy', 1, 'active', pharmacy.pharmacy_name, '']
          );
        } catch (err) {
          if (!err.message.includes('UNIQUE')) throw err;
          const existing = await database.query('SELECT id FROM users WHERE email = $1', [pharmacy.email]);
          if (existing.rows.length > 0) {
            const existingId = existing.rows[0].id;
            try {
              await database.query(
                `INSERT INTO pharmacies (id, user_id, pharmacy_name, license_number, address, verification_status)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                [uuidv4(), existingId, pharmacy.pharmacy_name, pharmacy.license_number, '456 Pharmacy Rd', 'verified']
              );
            } catch (profileErr) {
              if (!profileErr.message.includes('UNIQUE')) throw profileErr;
            }
            continue;
          }
        }

        // Insert pharmacy profile
        await database.query(
          `INSERT INTO pharmacies (id, user_id, pharmacy_name, license_number, address, verification_status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), userId, pharmacy.pharmacy_name, pharmacy.license_number, '456 Pharmacy Rd', 'verified']
        );
      } catch (err) {
        // Ignore if already exists
        if (!err.message.includes('UNIQUE')) {
          throw err;
        }
      }
    }

    logger.info(`Seeded ${pharmacies.length} test pharmacies (users and profiles)`);
  }

  /**
   * Seed test hospitals
   */
  async seedHospitals() {
    logger.info('Seeding test hospitals...');

    const hospitals = [
      {
        lifeline_id: 'LLHOS-00001',
        email: 'hospital.general@test.com',
        phone: '+2348400000001',
        hospital_name: 'General Hospital Lagos',
        license_number: 'HOS-NGR-12345',
      },
    ];

    const password = await this.hashPassword('Hospital@123');

    for (const hospital of hospitals) {
      const userId = uuidv4();

      try {
        // Insert user
        try {
          await database.query(
            `INSERT INTO users (id, lifeline_id, email, phone, password_hash, role, email_verified, status, first_name, last_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [userId, hospital.lifeline_id, hospital.email, hospital.phone, password, 'hospital', 1, 'active', hospital.hospital_name, '']
          );
        } catch (err) {
          if (!err.message.includes('UNIQUE')) throw err;
          const existing = await database.query('SELECT id FROM users WHERE email = $1', [hospital.email]);
          if (existing.rows.length > 0) {
            const existingId = existing.rows[0].id;
            try {
              await database.query(
                `INSERT INTO hospitals (id, user_id, hospital_name, license_number, address, verification_status)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                [uuidv4(), existingId, hospital.hospital_name, hospital.license_number, '789 Hospital Ave', 'verified']
              );
            } catch (profileErr) {
              if (!profileErr.message.includes('UNIQUE')) throw profileErr;
            }
            continue;
          }
        }

        // Insert hospital profile
        await database.query(
          `INSERT INTO hospitals (id, user_id, hospital_name, license_number, address, verification_status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), userId, hospital.hospital_name, hospital.license_number, '789 Hospital Ave', 'verified']
        );
      } catch (err) {
        // Ignore if already exists
        if (!err.message.includes('UNIQUE')) {
          throw err;
        }
      }
    }

    logger.info(`Seeded ${hospitals.length} test hospitals (users and profiles)`);
  }

  /**
   * Seed test payments
   */
  async seedPayments() {
    logger.info('Seeding test payments...');
    
    // Get a patient
    const patientResult = await database.query("SELECT id FROM patients LIMIT 1");
    if (patientResult.rows.length === 0) return;
    const patientId = patientResult.rows[0].id;

    const payments = [
      { amount: 5000, method: 'card', type: 'subscription', ref: 'PAY-' + Date.now() + '-1', status: 'success', desc: 'Monthly Subscription' },
      { amount: 3000, method: 'transfer', type: 'consultation', ref: 'PAY-' + Date.now() + '-2', status: 'success', desc: 'GP Consultation Fee' }
    ];

    for (const p of payments) {
      await database.query(
        `INSERT INTO payment_records (id, patient_id, amount, payment_method, payment_type, payment_reference, status, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (payment_reference) DO NOTHING`,
        [uuidv4(), patientId, p.amount, p.method, p.type, p.ref, p.status, p.desc]
      );
    }
  }

  /**
   * Seed test statements
   */
  async seedStatements() {
    logger.info('Seeding test statements...');
    
    const patientResult = await database.query("SELECT id FROM patients LIMIT 1");
    if (patientResult.rows.length === 0) return;
    const patientId = patientResult.rows[0].id;

    await database.query(
      `INSERT INTO monthly_statements (id, patient_id, statement_date, billing_period_start, billing_period_end, total_amount, balance, status)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, $3, $4, $5)`,
      [uuidv4(), patientId, 8000, 0, 'paid']
    );
  }

  /**
   * Run all seeds
   */
  async run() {
    try {
      logger.info('Starting database seeding...');

      // Ensure database is connected
      if (!database.isConnected()) {
        await database.connect();
      }

      // Run seeds in order
      await this.seedPricingTable();
      await this.seedAdmin();
      await this.seedPatients();
      await this.seedDoctors();
      await this.seedPharmacies();
      await this.seedHospitals();
      await this.seedPayments();
      await this.seedStatements();

      logger.info('Database seeding completed successfully!');
      logger.info('\n=== Test Accounts ===');
      logger.info('Admin: admin@lifelinepro.com / Admin@123!');
      logger.info('Patient (Basic): patient.basic@test.com / Patient@123');
      logger.info('Patient (Medium): patient.medium@test.com / Patient@123');
      logger.info('Patient (Advanced): patient.advanced@test.com / Patient@123');
      logger.info('Doctor (GP): doctor.gp@test.com / Doctor@123');
      logger.info('Doctor (Cardio): doctor.cardio@test.com / Doctor@123');
      logger.info('Pharmacy: pharmacy.central@test.com / Pharmacy@123');
      logger.info('Hospital: hospital.general@test.com / Hospital@123');
    } catch (error) {
      logger.error('Seeding failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

// CLI execution
const runCLI = async () => {
  logger.info('=== STARTING DATABASE SEEDING ===');
  const seeder = new Seeder();

  try {
    await seeder.run();
    await database.disconnect();
    logger.info('=== SEEDING COMPLETE ===');
    process.exit(0);
  } catch (error) {
    logger.error('Seed CLI error', {
      error: error.message,
      stack: error.stack,
    });
    await database.disconnect();
    process.exit(1);
  }
};

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule || process.argv[1]?.includes('seed.js')) {
  runCLI();
}

export default Seeder;
