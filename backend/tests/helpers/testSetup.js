/**
 * Integration test setup helper.
 *
 * Provides a single function — setupTestDatabase() — that must be called
 * inside a Jest beforeAll() block. It:
 *   1. Sets all env vars needed for a SQLite test database BEFORE any
 *      src/ modules are imported (env vars affect config/index.js evaluation).
 *   2. Dynamically imports server.js (which creates the Express app without
 *      starting an HTTP server because NODE_ENV=test).
 *   3. Connects to the temp SQLite database.
 *   4. Runs all 18 schema files to create tables.
 *   5. Returns { app, database, teardown }.
 *
 * Each test file that calls setupTestDatabase() gets its own isolated
 * SQLite database (via randomUUID in the filename). This works because
 * Jest ESM runs each test file in its own module registry / VM context.
 *
 * Usage
 * ─────
 *   import { setupTestDatabase } from '../helpers/testSetup.js';
 *   import request from 'supertest';
 *
 *   let app, teardown;
 *
 *   beforeAll(async () => {
 *     ({ app, teardown } = await setupTestDatabase());
 *   }, 30_000);
 *
 *   afterAll(() => teardown());
 *
 *   test('GET /health → 200', async () => {
 *     await request(app).get('/health').expect(200);
 *   });
 */

import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';

/**
 * Bootstraps a fresh in-process SQLite database for one test file.
 * All src/ modules are dynamically imported AFTER env vars are set so that
 * config/index.js picks up the right DB path and JWT secret.
 *
 * @returns {{ app: import('express').Express, database: object, teardown: () => Promise<void> }}
 */
export async function setupTestDatabase() {
  // ── 1. Env vars ────────────────────────────────────────────────────────────
  // These must be set BEFORE any dynamic import of src/ modules, because
  // config/index.js reads process.env at module-evaluation time.

  const tmpDbPath = path.join(os.tmpdir(), `lifeline-test-${randomUUID()}.db`);

  process.env.DB_TYPE = 'sqlite';
  process.env.DB_SQLITE_PATH = tmpDbPath;

  // Predictable JWT secret so tests can decode tokens if needed
  process.env.JWT_SECRET = 'test-integration-secret-do-not-use-in-production';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-production';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';

  // Whitelist loopback addresses to bypass rate limiting (Supertest uses 127.0.0.1)
  process.env.RATE_LIMIT_WHITELIST = '127.0.0.1,::1,::ffff:127.0.0.1';

  // Suppress cron jobs and email in tests
  process.env.ENABLE_CRON_JOBS = 'false';
  process.env.SMTP_HOST = '';

  // ── 2. Dynamic imports (AFTER env vars) ────────────────────────────────────
  // Import app.js (not server.js) — app.js has zero side effects: no database
  // connect, no process.exit, no startServer(). The database singleton is
  // created lazily when connection.js is first imported, using the env vars
  // set above to point at the temp SQLite file.
  const { default: app } = await import('../../src/app.js');
  const { default: database } = await import('../../src/database/connection.js');
  const { default: DatabaseInitializer } = await import('../../src/database/init.js');

  // ── 3. Connect & create schema ─────────────────────────────────────────────
  await database.connect();

  const init = new DatabaseInitializer();
  await init.runSchemas(); // creates all 18 tables + column migrations

  // ── 4. Return app + teardown ───────────────────────────────────────────────
  return {
    app,
    database,
    async teardown() {
      await database.disconnect();
      await fs.unlink(tmpDbPath).catch(() => {}); // remove temp DB file
    },
  };
}
