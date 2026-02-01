import database from './src/database/connection.js';

async function checkId() {
  try {
    await database.connect();

    const result = await database.query(
      `SELECT lifeline_id FROM users WHERE lifeline_id = 'LLPAT-00004'`
    );

    console.log('LLPAT-00004 exists:', result.rows.length > 0);
    if (result.rows.length > 0) {
      console.log('Existing record:', result.rows[0]);
    }

    await database.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkId();