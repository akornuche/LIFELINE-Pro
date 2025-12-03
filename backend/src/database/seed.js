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

      // Insert user only (skip patient table for now)
      await database.query(
        `INSERT INTO users (id, lifeline_id, email, phone, password_hash, role, email_verified, status, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        [userId, patient.lifeline_id, patient.email, patient.phone, password, 'patient', 1, 'active', patient.first_name, patient.last_name]
      );
    }

    logger.info(`Seeded ${patients.length} test patients (users only)`);
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

      // Insert user only (skip doctor table for now)
      await database.query(
        `INSERT INTO users (id, lifeline_id, email, phone, password_hash, role, email_verified, status, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        [userId, doctor.lifeline_id, doctor.email, doctor.phone, password, 'doctor', 1, 'active', doctor.first_name, doctor.last_name]
      );
    }

    logger.info(`Seeded ${doctors.length} test doctors (users only)`);
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

      // Insert user only (skip pharmacy table for now)
      await database.query(
        `INSERT INTO users (id, lifeline_id, email, phone, password_hash, role, email_verified, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING`,
        [userId, pharmacy.lifeline_id, pharmacy.email, pharmacy.phone, password, 'pharmacy', 1, 'active']
      );
    }

    logger.info(`Seeded ${pharmacies.length} test pharmacies (users only)`);
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

      // Insert user only (skip hospital table for now)
      await database.query(
        `INSERT INTO users (id, lifeline_id, email, phone, password_hash, role, email_verified, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING`,
        [userId, hospital.lifeline_id, hospital.email, hospital.phone, password, 'hospital', 1, 'active']
      );
    }

    logger.info(`Seeded ${hospitals.length} test hospitals (users only)`);
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
  const seeder = new Seeder();

  try {
    await seeder.run();
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Seed CLI error', {
      error: error.message,
    });
    await database.disconnect();
    process.exit(1);
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI();
}

export default Seeder;
