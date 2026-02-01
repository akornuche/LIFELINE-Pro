import database from './src/database/connection.js';

async function fixRemaining() {
  try {
    await database.connect();

    const result = await database.query(
      `SELECT id, lifeline_id FROM users WHERE lifeline_id = '[object Object]'`
    );

    console.log('Remaining corrupted:', result.rows);

    if (result.rows.length > 0) {
      await database.query(
        `UPDATE users SET lifeline_id = 'LLPAT-00005' WHERE id = $1`,
        [result.rows[0].id]
      );
      console.log('Fixed remaining corrupted record');
    }

    await database.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixRemaining();