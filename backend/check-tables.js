import database from './src/database/connection.js';

async function checkTables() {
  try {
    await database.connect();
    const result = await database.query('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('Tables in database:', result.rows.map(r => r.name));
    await database.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTables();