
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function fix() {
  const db = await open({
    filename: './data/lifeline.db',
    driver: sqlite3.Database
  });

  // Update all patients who have a subscription to have an end date 365 days from their start date
  // or simply 365 days from today if start_date is null but they have a package
  
  // Actually, let's just make it 365 days from today for all active ones to be safe
  const now = new Date();
  const yearFromNow = new Date();
  yearFromNow.setDate(yearFromNow.getDate() + 365);
  
  const endTimestamp = yearFromNow.getTime();

  const result = await db.run(`
    UPDATE patients 
    SET subscription_end_date = ? 
    WHERE current_package IS NOT NULL AND subscription_status = 'active'
  `, [endTimestamp]);

  console.log(`Updated ${result.changes} records.`);
  await db.close();
}

fix();
