import database from './src/database/connection.js';

async function checkPatient() {
  try {
    await database.connect();
    
    const userId = '23782a3b-5f35-41de-b66f-e9f3c1d01188';
    
    // Test the exact query used by findByUserId
    const result = await database.query(
      `SELECT p.*, u.lifeline_id, u.first_name, u.last_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );
    console.log('findByUserId result:', JSON.stringify(result.rows, null, 2));
    
    await database.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPatient();
