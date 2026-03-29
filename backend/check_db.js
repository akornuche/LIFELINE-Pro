
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function check() {
  const db = await open({
    filename: './data/lifeline.db',
    driver: sqlite3.Database
  });

  const rows = await db.all('SELECT current_package, subscription_start_date, subscription_end_date FROM patients');
  console.log(JSON.stringify(rows, null, 2));
  await db.close();
}

check();
