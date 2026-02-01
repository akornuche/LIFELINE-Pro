/**
 * Database Migration Script
 * Adds missing columns to patients table and creates all missing tables
 */

import database from './src/database/connection.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting database migration...\n');

const runMigration = async () => {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await database.connect();
    console.log('Connected!\n');

    // ============= UPDATE EXISTING PATIENTS TABLE =============
    console.log('Updating patients table with missing columns...');
    
    // Check if columns exist before adding them
    const patientsTableInfo = await database.query('PRAGMA table_info(patients)', []);
    const existingColumns = patientsTableInfo.rows.map(col => col.name);
    
    const columnsToAdd = [
      { name: 'current_package', sql: 'ALTER TABLE patients ADD COLUMN current_package VARCHAR(50)' },
      { name: 'subscription_status', sql: 'ALTER TABLE patients ADD COLUMN subscription_status VARCHAR(20) DEFAULT \'inactive\'' },
      { name: 'subscription_start_date', sql: 'ALTER TABLE patients ADD COLUMN subscription_start_date DATE' },
      { name: 'subscription_end_date', sql: 'ALTER TABLE patients ADD COLUMN subscription_end_date DATE' },
      { name: 'auto_renew', sql: 'ALTER TABLE patients ADD COLUMN auto_renew BOOLEAN DEFAULT 0' }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        try {
          await database.query(column.sql, []);
          console.log(`  ✓ Added column: ${column.name}`);
        } catch (error) {
          console.log(`  ⚠ Column ${column.name} error: ${error.message}`);
        }
      } else {
        console.log(`  ⤷ Column ${column.name} already exists`);
      }
    }

    // Create index on subscription_status if it doesn't exist
    try {
      await database.query('CREATE INDEX IF NOT EXISTS idx_patients_subscription ON patients(subscription_status)', []);
      console.log('  ✓ Created index on subscription_status\n');
    } catch (error) {
      console.log(`  ⚠ Index creation skipped: ${error.message}\n`);
    }

    // ============= CREATE NEW TABLES =============
    console.log('Creating new tables...');

    const schemasDir = path.join(__dirname, 'src', 'database', 'schemas');
    const schemaFiles = [
      '07_dependents.sql',
      '08_consultations.sql',
      '09_prescriptions.sql',
      '10_surgeries.sql',
      '11_lab_tests.sql',
      '12_payment_records.sql',
      '13_payment_webhooks.sql',
      '14_monthly_statements.sql',
      '15_patient_payments.sql'
    ];

    for (const file of schemaFiles) {
      const filePath = path.join(schemasDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`\nProcessing ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => {
            // Remove comment-only lines
            const lines = s.split('\n').filter(line => {
              const trimmed = line.trim();
              return trimmed.length > 0 && !trimmed.startsWith('--');
            });
            return lines.length > 0;
          })
          .map(s => {
            // Remove comment lines from statements
            return s.split('\n')
              .filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 0 && !trimmed.startsWith('--');
              })
              .join('\n')
              .trim();
          });

        for (const statement of statements) {
          try {
            console.log(`    Executing: ${statement.substring(0, 60)}...`);
            await database.query(statement + ';', []);
            if (statement.toLowerCase().includes('create table')) {
              const tableName = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i)?.[1];
              console.log(`  ✓ Created table: ${tableName}`);
            } else if (statement.toLowerCase().includes('create index')) {
              const indexName = statement.match(/CREATE INDEX.*?(\w+)\s+ON/i)?.[1];
              console.log(`  ✓ Created index: ${indexName}`);
            }
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`  ⤷ Object already exists (skipped)`);
            } else {
              console.error(`  ✗ Error:`, error.message);
              console.error(`     Statement was: ${statement.substring(0, 100)}`);
            }
          }
        }
      } else {
        console.log(`  ⚠ Schema file not found: ${file}`);
      }
    }

    // ============= VERIFY TABLES =============
    console.log('\n\nVerifying database structure...');
    const tables = await database.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `, []);

    console.log('\nExisting tables:');
    for (const table of tables.rows) {
      const count = await database.query(`SELECT COUNT(*) as count FROM ${table.name}`, []);
      console.log(`  - ${table.name} (${count.rows[0].count} rows)`);
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

runMigration();
