import database from './src/database/connection.js';

async function fixCorruptedData() {
  try {
    await database.connect();

    console.log('Finding all corrupted lifeline_id records...');
    const corruptedResult = await database.query(
      `SELECT id, lifeline_id, email, role FROM users WHERE lifeline_id LIKE '%[object%'`
    );

    console.log(`Found ${corruptedResult.rows.length} corrupted records`);

    for (const record of corruptedResult.rows) {
      console.log(`Fixing: ${record.email} (${record.role})`);

      // Find the highest valid ID for this role
      const validResult = await database.query(
        `SELECT lifeline_id FROM users
         WHERE role = $1 AND lifeline_id NOT LIKE '%[object%'
         ORDER BY CAST(SUBSTR(lifeline_id, 7) AS INTEGER) DESC LIMIT 1`,
        [record.role]
      );

      let nextId = 1;
      if (validResult.rows.length > 0) {
        const lastId = validResult.rows[0].lifeline_id;
        const lastNumber = parseInt(lastId.split('-')[1], 10);
        nextId = lastNumber + 1;
      }

      // Generate new lifeline_id based on role
      const prefix = record.role === 'patient' ? 'LLPAT' :
                    record.role === 'doctor' ? 'LLDOC' :
                    record.role === 'pharmacy' ? 'LLPHA' :
                    record.role === 'hospital' ? 'LLHOS' : 'LLADM';

      const newLifelineId = `${prefix}-${nextId.toString().padStart(5, '0')}`;

      await database.query(
        `UPDATE users SET lifeline_id = $1 WHERE id = $2`,
        [newLifelineId, record.id]
      );

      console.log(`  → Fixed to: ${newLifelineId}`);
    }

    console.log('\nVerifying all lifeline_ids are now valid...');
    const allResult = await database.query(
      `SELECT lifeline_id, role FROM users ORDER BY role, lifeline_id`
    );

    console.log('All lifeline_ids:');
    allResult.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.lifeline_id}`);
    });

    await database.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixCorruptedData();