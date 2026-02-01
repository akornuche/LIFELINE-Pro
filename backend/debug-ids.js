import database from './src/database/connection.js';

async function debugIds() {
  try {
    await database.connect();

    const result = await database.query(
      `SELECT lifeline_id FROM users WHERE role = 'patient' ORDER BY lifeline_id DESC LIMIT 1`
    );

    console.log('Last patient ID:', result.rows[0].lifeline_id);
    const parts = result.rows[0].lifeline_id.split('-');
    console.log('Parts:', parts);
    console.log('Number part:', parts[1]);
    console.log('Parsed:', parseInt(parts[1], 10));

    await database.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugIds();