import database from './src/database/connection.js';
import logger from './src/utils/logger.js';

async function viewDatabase() {
  try {
    console.log('🔍 Connecting to LifeLine Database...\n');
    await database.connect();

    // Get all tables
    console.log('📋 TABLES IN DATABASE:');
    console.log('=' .repeat(50));

    const tablesResult = await database.query(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const tables = tablesResult.rows.map(row => row.name);

    for (const table of tables) {
      console.log(`\n📊 TABLE: ${table.toUpperCase()}`);
      console.log('-'.repeat(30));

      // Get table structure
      const structureResult = await database.query(`PRAGMA table_info(${table})`);
      console.log('COLUMNS:');
      structureResult.rows.forEach(col => {
        console.log(`  - ${col.name} (${col.type}) ${col.pk ? '[PRIMARY KEY]' : ''} ${col.notnull ? '[NOT NULL]' : ''}`);
      });

      // Get row count
      const countResult = await database.query(`SELECT COUNT(*) as count FROM ${table}`);
      const rowCount = countResult.rows[0].count;
      console.log(`\nROWS: ${rowCount}`);

      // Show sample data (first 3 rows)
      if (rowCount > 0) {
        console.log('\nSAMPLE DATA:');
        const sampleResult = await database.query(`SELECT * FROM ${table} LIMIT 3`);
        sampleResult.rows.forEach((row, index) => {
          console.log(`  Row ${index + 1}:`, JSON.stringify(row, null, 2));
        });
      }

      console.log('='.repeat(50));
    }

    await database.disconnect();
    console.log('\n✅ Database view completed!');

  } catch (error) {
    console.error('❌ Error viewing database:', error.message);
    process.exit(1);
  }
}

viewDatabase();