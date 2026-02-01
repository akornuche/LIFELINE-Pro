import database from './src/database/connection.js';
import { lifelineIdExists } from './src/models/userRepository.js';

async function testExists() {
  try {
    await database.connect();

    const exists = await lifelineIdExists('LLPAT-00004');
    console.log('lifelineIdExists result for LLPAT-00004:', exists);

    const directQuery = await database.query(
      `SELECT COUNT(*) as count FROM users WHERE lifeline_id = $1`,
      ['LLPAT-00004']
    );
    console.log('Direct query result:', directQuery.rows[0]);

    await database.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testExists();