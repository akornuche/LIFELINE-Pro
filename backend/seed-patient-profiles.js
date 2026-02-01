import database from './src/database/connection.js';
import logger from './src/utils/logger.js';

async function seedPatientProfiles() {
  try {
    console.log('Connecting to database...');
    await database.connect();
    
    console.log('Creating patient profiles...');
    
    // Get the user IDs for our test patients
    const users = await database.query(
      `SELECT id, lifeline_id, first_name, last_name, email FROM users WHERE role = 'patient'`
    );
    
    console.log(`Found ${users.rows.length} patient users`);
    
    for (const user of users.rows) {
      // Check if patient profile exists
      const existing = await database.query(
        `SELECT id FROM patients WHERE user_id = $1`,
        [user.id]
      );
      
      if (existing.rows.length === 0) {
        // Create patient profile
        await database.query(
          `INSERT INTO patients (
            id,
            user_id,
            lifeline_id,
            blood_type,
            emergency_contact_name,
            emergency_contact_phone,
            emergency_contact_relationship
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            user.id + '-patient',
            user.id,
            user.lifeline_id,
            'O+',
            'Emergency Contact',
            '+2348000000000',
            'Family'
          ]
        );
        console.log(`✓ Created patient profile for ${user.email}`);
      } else {
        console.log(`- Patient profile already exists for ${user.email}`);
      }
    }
    
    console.log('\n✅ Patient profiles created successfully!');
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedPatientProfiles();
