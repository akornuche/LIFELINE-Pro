import database from './src/database/connection.js';
import logger from './src/utils/logger.js';

async function testDB() {
  try {
    logger.info('Testing database connection...');
    await database.connect();
    logger.info('Database connected successfully');

    const result = await database.query("SELECT datetime('now') as now");
    logger.info('Query result:', result.rows[0]);

    await database.disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Database test failed:', error.message);
  }
}

testDB();