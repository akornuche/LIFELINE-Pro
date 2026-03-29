import database from './src/database/connection.js';

async function test() {
  try {
    await database.connect();
    const users = await database.query('SELECT count(*) as count FROM users');
    const patients = await database.query('SELECT count(*) as count FROM patients');
    const doctors = await database.query('SELECT count(*) as count FROM doctors');
    const pharmacies = await database.query('SELECT count(*) as count FROM pharmacies');
    
    console.log('--- DATABASE STATS ---');
    console.log('Users:', users.rows[0].count);
    console.log('Patients:', patients.rows[0].count);
    console.log('Doctors:', doctors.rows[0].count);
    console.log('Pharmacies:', pharmacies.rows[0].count);
    
    const sample = await database.query('SELECT * FROM users LIMIT 1');
    console.log('Sample User:', sample.rows[0]);
    
  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    process.exit(0);
  }
}

test();
