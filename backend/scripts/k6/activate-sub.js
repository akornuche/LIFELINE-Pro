// Activates the k6 load-test patient's subscription in the dev SQLite DB
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');

const [, , userId] = process.argv;
if (!userId) { console.error('Usage: node activate-sub.js <userId>'); process.exit(1); }

const db = new sqlite3.Database(dbPath);
db.run(
  `UPDATE patients
   SET subscription_status = 'active',
       current_package     = 'general',
       subscription_start_date = date('now'),
       subscription_end_date   = date('now', '+1 year')
   WHERE user_id = ?`,
  [userId],
  function (err) {
    if (err) { console.error('Error:', err.message); db.close(); process.exit(1); }
    console.log(`Subscription activated (rows updated: ${this.changes})`);
    db.close();
  }
);
