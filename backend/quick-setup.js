import database from './src/database/connection.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function quickSetup() {
  try {
    console.log('Connecting to database...');
    await database.connect();
    
    console.log('Connected! Creating tables...');
    
    const schemasDir = path.join(__dirname, 'src/database/schemas');
    const files = await fs.readdir(schemasDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    for (const file of sqlFiles) {
      console.log(`Running ${file}...`);
      const sql = await fs.readFile(path.join(schemasDir, file), 'utf8');
      
      // Split by semicolons and run each statement
      const statements = sql.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          try {
            await database.query(stmt + ';');
          } catch (err) {
            if (!err.message.includes('already exists')) {
              console.error(`Error in ${file}:`, err.message);
            }
          }
        }
      }
      console.log(`✓ ${file} completed`);
    }
    
    console.log('\nDatabase setup complete!');
    console.log('\nRunning seeds...');
    
    // Import and run seed
    const seedModule = await import('./src/database/seed.js');
    const Seeder = seedModule.default;
    const seeder = new Seeder();
    await seeder.run();
    
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

quickSetup();
