/**
 * PostgreSQL boolean round-trip tests — P3
 *
 * Verifies that BOOLEAN columns in the real PostgreSQL schema store and
 * return native JS booleans (true/false), NOT integers (1/0).
 *
 * This is a PG-only test (SKIP_PG_TESTS=1 skips it). It runs via
 * testcontainers so it requires Docker. It does NOT use supertest/app — it
 * talks directly to the DB via pg.Pool so we can control the schema exactly.
 *
 * Divergence baseline:
 *   SQLite: BOOLEAN columns return integer 0 or 1
 *   PostgreSQL: BOOLEAN columns return JS boolean false or true
 *
 * Columns tested (all declared BOOLEAN in the *.sql schema files):
 *   patients.auto_renew
 *   pharmacies.open_24_hours
 *   pharmacies.delivery_available
 *   hospitals.emergency_services
 *   consultations.referral_needed
 *   dependents.is_active
 *
 * Run locally (requires Docker):
 *   SKIP_PG_TESTS=0 npx jest --testPathPattern=pg.boolean --runInBand
 */

import pg from 'pg';
import { GenericContainer } from 'testcontainers';
import { jest } from '@jest/globals';

// Skip when explicitly opted out OR when Docker is unavailable (detected at runtime).
const skipAll = process.env.SKIP_PG_TESTS === '1';

jest.setTimeout(120_000);

let container;
let pool;
// Set to true in beforeAll only when Docker + PG start successfully.
let pgReady = false;

// Soft-skip helper: passes (no assertions) when Docker is unavailable,
// so the suite stays green locally without Docker running.
function pgTest(name, fn) {
  test(name, async () => {
    if (!pgReady) {
      console.log(`  [PG skip — Docker not available]: ${name}`);
      return;
    }
    await fn();
  });
}

(skipAll ? describe.skip : describe)('PostgreSQL BOOLEAN round-trip divergence', () => {
  beforeAll(async () => {
    try {
      container = await new GenericContainer('postgres:16-alpine')
        .withEnvironment({
          POSTGRES_USER: 'pgtest',
          POSTGRES_PASSWORD: 'pgpass',
          POSTGRES_DB: 'pgtest',
        })
        .withExposedPorts(5432)
        .start();

      pool = new pg.Pool({
        host: container.getHost(),
        port: container.getMappedPort(5432),
        user: 'pgtest',
        password: 'pgpass',
        database: 'pgtest',
      });

      // Create minimal tables that mirror the real schema's BOOLEAN columns.
      await pool.query(`
        CREATE TABLE bool_test (
          id                   SERIAL  PRIMARY KEY,
          auto_renew           BOOLEAN DEFAULT FALSE,
          open_24_hours        BOOLEAN DEFAULT FALSE,
          delivery_available   BOOLEAN DEFAULT FALSE,
          emergency_services   BOOLEAN DEFAULT FALSE,
          referral_needed      BOOLEAN DEFAULT FALSE,
          is_active            BOOLEAN DEFAULT TRUE
        )
      `);

      pgReady = true;
    } catch (e) {
      if (/container runtime|docker/i.test(e.message)) {
        console.warn(
          '\n⚠  Docker not available — PG boolean round-trip tests soft-skipped.\n' +
          '   Start Docker Desktop or set SKIP_PG_TESTS=1 to suppress this warning.\n'
        );
      } else {
        throw e; // unexpected error — propagate to fail the suite
      }
    }
  });

  afterAll(async () => {
    if (pool) await pool.end().catch(() => {});
    if (container) await container.stop().catch(() => {});
  });

  // ── Type verification ──────────────────────────────────────────────────────

  describe('true values', () => {
    pgTest('auto_renew = TRUE reads back as JS boolean true (not integer 1)', async () => {
      const { rows } = await pool.query(
        'INSERT INTO bool_test (auto_renew) VALUES ($1) RETURNING auto_renew',
        [true]
      );
      expect(rows[0].auto_renew).toBe(true);
      expect(typeof rows[0].auto_renew).toBe('boolean');
    });

    pgTest('open_24_hours = TRUE reads back as JS boolean true', async () => {
      const { rows } = await pool.query(
        'INSERT INTO bool_test (open_24_hours) VALUES ($1) RETURNING open_24_hours',
        [true]
      );
      expect(rows[0].open_24_hours).toBe(true);
    });

    pgTest('delivery_available = TRUE reads back as JS boolean true', async () => {
      const { rows } = await pool.query(
        'INSERT INTO bool_test (delivery_available) VALUES ($1) RETURNING delivery_available',
        [true]
      );
      expect(rows[0].delivery_available).toBe(true);
    });

    pgTest('emergency_services = TRUE reads back as JS boolean true', async () => {
      const { rows } = await pool.query(
        'INSERT INTO bool_test (emergency_services) VALUES ($1) RETURNING emergency_services',
        [true]
      );
      expect(rows[0].emergency_services).toBe(true);
    });

    pgTest('referral_needed = TRUE reads back as JS boolean true', async () => {
      const { rows } = await pool.query(
        'INSERT INTO bool_test (referral_needed) VALUES ($1) RETURNING referral_needed',
        [true]
      );
      expect(rows[0].referral_needed).toBe(true);
    });

    pgTest('is_active DEFAULT TRUE reads back as JS boolean true', async () => {
      const { rows } = await pool.query(
        'INSERT INTO bool_test DEFAULT VALUES RETURNING is_active'
      );
      expect(rows[0].is_active).toBe(true);
    });
  });

  describe('false values', () => {
    pgTest('auto_renew = FALSE reads back as JS boolean false (not integer 0)', async () => {
      const { rows } = await pool.query(
        'INSERT INTO bool_test (auto_renew) VALUES ($1) RETURNING auto_renew',
        [false]
      );
      expect(rows[0].auto_renew).toBe(false);
      expect(typeof rows[0].auto_renew).toBe('boolean');
    });

    pgTest('DEFAULT FALSE columns read back as JS boolean false', async () => {
      const { rows } = await pool.query(
        'INSERT INTO bool_test DEFAULT VALUES RETURNING auto_renew, open_24_hours, delivery_available, emergency_services, referral_needed'
      );
      const row = rows[0];
      expect(row.auto_renew).toBe(false);
      expect(row.open_24_hours).toBe(false);
      expect(row.delivery_available).toBe(false);
      expect(row.emergency_services).toBe(false);
      expect(row.referral_needed).toBe(false);
    });
  });

  describe('divergence from SQLite (documentation tests)', () => {
    pgTest('PG boolean true !== SQLite integer 1 — strict equality differs', async () => {
      const { rows } = await pool.query(
        'INSERT INTO bool_test (auto_renew) VALUES (TRUE) RETURNING auto_renew'
      );
      const pgValue = rows[0].auto_renew;

      // PG: strict equality to true passes
      expect(pgValue === true).toBe(true);

      // SQLite returns 1 — this is the documented difference:
      // In SQLite: (1 === true) → false
      // In PG:     (true === true) → true
      const sqliteEquivalent = 1;
      expect(sqliteEquivalent === pgValue).toBe(false);  // 1 !== true
    });

    pgTest('safe coercion pattern !! works for both adapters', async () => {
      // !!1 === true   (SQLite safe)
      // !!true === true (PG safe)
      const { rows } = await pool.query(
        'INSERT INTO bool_test (auto_renew) VALUES (TRUE) RETURNING auto_renew'
      );
      expect(!!rows[0].auto_renew).toBe(true);

      const { rows: rows2 } = await pool.query(
        'INSERT INTO bool_test (auto_renew) VALUES (FALSE) RETURNING auto_renew'
      );
      expect(!!rows2[0].auto_renew).toBe(false);
    });

    pgTest('UPDATE RETURNING preserves boolean type', async () => {
      const insert = await pool.query(
        'INSERT INTO bool_test (auto_renew) VALUES (FALSE) RETURNING id'
      );
      const id = insert.rows[0].id;

      const { rows } = await pool.query(
        'UPDATE bool_test SET auto_renew = TRUE WHERE id = $1 RETURNING auto_renew',
        [id]
      );
      expect(rows[0].auto_renew).toBe(true);
      expect(typeof rows[0].auto_renew).toBe('boolean');
    });
  });
});
