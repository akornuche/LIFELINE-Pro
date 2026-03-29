
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function check() {
  const db = await open({
    filename: './data/lifeline.db',
    driver: sqlite3.Database
  });

  const rows = await db.all('SELECT id, current_package, subscription_status, subscription_start_date, subscription_end_date FROM patients');
  console.log(JSON.stringify(rows, null, 2));
  await db.close();
}

check();
