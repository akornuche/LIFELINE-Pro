import database from './src/database/connection.js';
import logger from './src/utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

async function createTables() {
  try {
    console.log('Connecting to database...');
    await database.connect();
    console.log('Connected successfully');

    const schemaDir = './src/database/schemas';
    const schemaFiles = [
      '01_users.sql',
      '02_patients.sql',
      '03_doctors.sql',
      '04_pharmacies.sql',
      '05_hospitals.sql',
      '06_pricing.sql'
    ];

    for (const file of schemaFiles) {
      const filePath = path.join(schemaDir, file);
      console.log(`Reading schema file: ${file}`);

      try {
        const sql = await fs.readFile(filePath, 'utf8');
        console.log(`Executing schema: ${file}`);

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        for (const statement of statements) {
          if (statement.trim()) {
            console.log('Executing:', statement.trim().substring(0, 50) + '...');
            await database.query(statement.trim() + ';');
          }
        }

        console.log(`✓ ${file} completed`);
      } catch (error) {
        console.error(`Error with ${file}:`, error.message);
      }
    }

    console.log('All schemas executed');
    await database.disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

createTables();