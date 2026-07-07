/**
 * E2E test server launcher
 *
 * Used by Playwright's webServer config to start the backend in a clean,
 * isolated SQLite mode on port 5002. The DB file is wiped on startup.
 *
 * This script sets all env vars BEFORE importing server.js so that the
 * dynamic imports inside the server pick up the right DB path.
 */

import { unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'e2e-test.db');

// Wipe stale DB from previous run
await unlink(dbPath).catch(() => {});
await unlink(`${dbPath}-wal`).catch(() => {});
await unlink(`${dbPath}-shm`).catch(() => {});

process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.DB_TYPE = 'sqlite';
process.env.DB_SQLITE_PATH = './data/e2e-test.db';
process.env.JWT_SECRET = 'e2e-test-secret-do-not-use-in-production';
process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.ENABLE_CRON_JOBS = 'false';
process.env.SMTP_HOST = '';
process.env.RATE_LIMIT_WHITELIST = '127.0.0.1,::1,::ffff:127.0.0.1';

// Admin credentials for E2E tests
process.env.DEFAULT_ADMIN_EMAIL = 'admin@e2e-test.com';
process.env.DEFAULT_ADMIN_PASSWORD = 'AdminE2e@Test1';

process.env.NODE_ENV = 'e2e';

await import('../src/server.js');

// Seed admin + a pre-verified E2E doctor after the server/DB is initialised.
// Must use dynamic imports so connection.js picks up the e2e env vars (static
// imports are hoisted before process.env assignments).
await new Promise(r => setTimeout(r, 1500));

try {
  const { default: crypto } = await import('crypto');
  const { default: bcrypt } = await import('bcryptjs');
  const { default: db } = await import('../src/database/connection.js');
  const { generateLifelineId } = await import('../src/utils/idGenerator.js');

  // ── Admin ──────────────────────────────────────────────────────────────
  const adminExists = await db.query(
    "SELECT id FROM users WHERE email = 'admin@e2e-test.com'"
  );
  if (adminExists.rows.length === 0) {
    const adminId = crypto.randomUUID();
    const adminHash = await bcrypt.hash('AdminE2e@Test1', 10);
    await db.query(
      `INSERT INTO users (id, lifeline_id, email, password_hash, first_name, last_name, phone,
        role, status, email_verified, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'E2E','Admin','+2348000000099','admin','active',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      [adminId, await generateLifelineId('admin'), 'admin@e2e-test.com', adminHash]
    );
    console.log('[e2e-server] admin seeded: admin@e2e-test.com / AdminE2e@Test1');
  }

  // ── Pre-verified Doctor ────────────────────────────────────────────────
  const doctorExists = await db.query(
    "SELECT id FROM users WHERE email = 'doctor@e2e-test.com'"
  );
  if (doctorExists.rows.length === 0) {
    const docUserId = crypto.randomUUID();
    const docHash = await bcrypt.hash('DoctorE2e@Test1', 10);
    await db.query(
      `INSERT INTO users (id, lifeline_id, email, password_hash, first_name, last_name, phone,
        role, status, email_verified, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'Dr. E2E','Doctor','+2348000000098','doctor','active',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      [docUserId, await generateLifelineId('doctor'), 'doctor@e2e-test.com', docHash]
    );
    // Insert doctor profile (verified)
    const docProfileId = crypto.randomUUID();
    await db.query(
      `INSERT INTO doctors (id, user_id, specialization, license_number, verification_status,
        years_of_experience, consultation_fee, created_at, updated_at)
       VALUES ($1,$2,'General Practice','E2ELIC001','verified',5,5000,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      [docProfileId, docUserId]
    );
    console.log('[e2e-server] doctor seeded: doctor@e2e-test.com / DoctorE2e@Test1');
  }
} catch (err) {
  console.error('[e2e-server] seeding error (non-fatal):', err.message);
}
