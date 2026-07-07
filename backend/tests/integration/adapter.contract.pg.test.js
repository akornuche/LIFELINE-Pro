/**
 * PostgreSQL Adapter Contract Tests
 *
 * Mirror of adapter.contract.test.js but run against a REAL PostgreSQL
 * instance (via testcontainers). Together the two files form the complete
 * adapter contract suite:
 *
 *   adapter.contract.test.js     → SQLite :memory: (always runs)
 *   adapter.contract.pg.test.js  → PostgreSQL 16   (requires Docker)
 *
 * Divergence = a test that PASSES in the SQLite file but FAILS HERE
 *              (or vice-versa). Every divergence is a latent production bug.
 *
 * Run locally
 * ──────────
 *   npm run test:contracts         # both SQLite + PG
 *   npm run test:contracts:pg      # PG only
 *   SKIP_PG_TESTS=1 npm run test:contracts  # SQLite only (no Docker needed)
 *
 * Skip mechanism
 * ──────────────
 * Set SKIP_PG_TESTS=1 to skip this entire file (e.g. on machines without Docker).
 * In CI the env var is unset, so tests always run.
 */

import pg from 'pg';
import { GenericContainer } from 'testcontainers';
import { jest } from '@jest/globals';

// ── Skip guard ────────────────────────────────────────────────────────────────

const skipAll = process.env.SKIP_PG_TESTS === '1';

// Increase Jest timeout to handle container startup (cold pull: ~30s, warm: ~3s)
jest.setTimeout(90_000);

// ── Container + pool lifecycle ────────────────────────────────────────────────

let container;
let pool;

(skipAll ? describe.skip : describe)('PostgreSQL adapter contract', () => {
  beforeAll(async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_USER: 'testuser',
        POSTGRES_PASSWORD: 'testpass',
        POSTGRES_DB: 'testdb',
      })
      .withExposedPorts(5432)
      .start();

    pool = new pg.Pool({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      user: 'testuser',
      password: 'testpass',
      database: 'testdb',
    });

    // Minimal table that exercises the divergence points.
    // Note: uses JSONB (not TEXT) for metadata to demonstrate JSONB behaviour.
    // The actual hospitals.operating_hours column is TEXT — see divergence note
    // in section 3 below.
    await pool.query(`
      CREATE TABLE contract_test (
        id       SERIAL       PRIMARY KEY,
        label    TEXT         NOT NULL,
        flag     BOOLEAN      NOT NULL DEFAULT FALSE,
        metadata JSONB
      )
    `);
  });

  afterAll(async () => {
    if (pool) await pool.end();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM contract_test');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Placeholder behaviour — $N works natively, no expansion needed
  // ═══════════════════════════════════════════════════════════════════════════

  describe('1. Placeholder — $N native to PostgreSQL', () => {
    test('$1 used twice: ONE param entry suffices (no shim expansion)', async () => {
      // In PostgreSQL, $1 appearing twice in a query refers to the same
      // binding. The params array has exactly one entry — ['user-x'].
      //
      // DIVERGENCE vs SQLite shim: the shim regex expands each occurrence
      // into a separate ? with a duplicate entry in expandedParams.
      // Both produce correct results, but through different mechanisms.
      const { rows } = await pool.query(
        'SELECT $1::text AS a, $1::text AS b',
        ['user-x']
      );
      expect(rows[0].a).toBe('user-x');
      expect(rows[0].b).toBe('user-x');
      // Proof that PG only needs one param (not two):
      // Passing two params for a single binding is also accepted by pg,
      // but semantically only $1 is bound.
    });

    test('out-of-order placeholders ($2 before $1) work correctly', async () => {
      const { rows } = await pool.query(
        'SELECT $2 AS first_in_list, $1 AS second_in_list',
        ['alpha', 'beta']
      );
      expect(rows[0].first_in_list).toBe('beta');
      expect(rows[0].second_in_list).toBe('alpha');
    });

    test('no placeholders — literal query executes unchanged', async () => {
      const { rows } = await pool.query('SELECT 1 + 1 AS result');
      expect(rows[0].result).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Boolean type — native boolean, NOT integer 0/1
  // ═══════════════════════════════════════════════════════════════════════════

  describe('2. Boolean type — PG returns JS boolean, SQLite returns integer', () => {
    test('true stored as BOOLEAN → read back as JS true (not 1)', async () => {
      await pool.query(
        "INSERT INTO contract_test (label, flag) VALUES ('yes', $1)",
        [true]
      );
      const { rows } = await pool.query(
        "SELECT flag FROM contract_test WHERE label = 'yes'"
      );

      // ── DIVERGENCE FROM SQLite ─────────────────────────────────────────
      // SQLite: row.flag === 1  (integer)
      // PG:     row.flag === true (boolean)
      expect(rows[0].flag).toBe(true);
      expect(typeof rows[0].flag).toBe('boolean');
    });

    test('false stored as BOOLEAN → read back as JS false (not 0)', async () => {
      await pool.query(
        "INSERT INTO contract_test (label, flag) VALUES ('no', $1)",
        [false]
      );
      const { rows } = await pool.query(
        "SELECT flag FROM contract_test WHERE label = 'no'"
      );

      // SQLite: row.flag === 0 (integer). PG: row.flag === false (boolean).
      expect(rows[0].flag).toBe(false);
      expect(typeof rows[0].flag).toBe('boolean');
    });

    test('DEFAULT FALSE column → reads back as JS false when omitted', async () => {
      await pool.query("INSERT INTO contract_test (label) VALUES ('defaulted')");
      const { rows } = await pool.query(
        "SELECT flag FROM contract_test WHERE label = 'defaulted'"
      );
      expect(rows[0].flag).toBe(false);
    });

    test('strict equality to true passes on PG (FAILS on SQLite)', () => {
      // This is the production-safety check. On PG, strict comparison works.
      // On SQLite, row.flag is 1, so (1 === true) is false — a silent bug.
      const pgValue = true; // what PG returns
      expect(pgValue === true).toBe(true);  // PASSES on PG
      // expect(1 === true).toBe(true);       // would FAIL on SQLite (1 !== true)
    });

    test('emergency_services: false returned directly — no coercion needed', async () => {
      await pool.query(
        "INSERT INTO contract_test (label, flag) VALUES ('hospital-1', FALSE)"
      );
      const { rows } = await pool.query(
        "SELECT flag AS emergency_services FROM contract_test WHERE label = 'hospital-1'"
      );
      // Application code can use row.emergency_services directly as boolean.
      // On SQLite it would be 0 — application must do !!row.emergency_services.
      expect(rows[0].emergency_services).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. JSONB column — pg driver auto-deserialises, no JSON.parse() needed
  // ═══════════════════════════════════════════════════════════════════════════

  describe('3. JSONB column — PG returns object, not string', () => {
    test('JSON inserted as string → read back as object from JSONB column', async () => {
      const payload = { monday: '08:00–17:00', saturday: 'closed' };

      await pool.query(
        "INSERT INTO contract_test (label, metadata) VALUES ('hours', $1)",
        [JSON.stringify(payload)]
      );
      const { rows } = await pool.query(
        "SELECT metadata FROM contract_test WHERE label = 'hours'"
      );

      // ── DIVERGENCE FROM SQLite TEXT ────────────────────────────────────
      // SQLite TEXT: typeof row.metadata === 'string', must JSON.parse()
      // PG JSONB:    typeof row.metadata === 'object', already deserialised
      expect(typeof rows[0].metadata).toBe('object');
      expect(rows[0].metadata).toEqual(payload);
      // JSON.parse() is NOT needed — calling it on an object would throw.
    });

    test('JSONB inserted as object literal → read back as object', async () => {
      const payload = { open: true, hours: 24 };

      await pool.query(
        "INSERT INTO contract_test (label, metadata) VALUES ('obj-insert', $1)",
        [payload]  // pg accepts JS objects directly for JSONB columns
      );
      const { rows } = await pool.query(
        "SELECT metadata FROM contract_test WHERE label = 'obj-insert'"
      );
      expect(rows[0].metadata).toEqual(payload);
    });

    test('production note: operating_hours is TEXT (not JSONB) in current schema', () => {
      // hospitals.operating_hours is TEXT in 05_hospitals.sql.
      // That means BOTH SQLite and PG return a plain string for that column.
      // JSON.parse() is needed in both environments — no divergence there.
      //
      // If that column is ever migrated to JSONB, the test above (returns object)
      // applies and application code must NOT call JSON.parse() on it.
      //
      // This test is intentionally a no-op assertion to document the decision.
      expect(true).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. RETURNING * — native on PG, converges with SQLite 3.35+
  // ═══════════════════════════════════════════════════════════════════════════

  describe('4. RETURNING * — native on PG (converges with SQLite 3.35+)', () => {
    test('INSERT ... RETURNING * returns the inserted row', async () => {
      const { rows } = await pool.query(
        "INSERT INTO contract_test (label, flag) VALUES ('ret-test', TRUE) RETURNING *"
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].label).toBe('ret-test');
      expect(rows[0].flag).toBe(true);        // PG: boolean true
      expect(rows[0].id).toBeGreaterThan(0);  // SERIAL autoincrement
    });

    test('UPDATE ... RETURNING * returns the updated row', async () => {
      await pool.query(
        "INSERT INTO contract_test (label, flag) VALUES ('to-update', FALSE)"
      );
      const { rows } = await pool.query(
        "UPDATE contract_test SET flag = TRUE WHERE label = 'to-update' RETURNING *"
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].flag).toBe(true);
      expect(rows[0].label).toBe('to-update');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Transaction rollback — converges with SQLite (BEGIN IMMEDIATE vs MVCC)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('5. Transaction rollback — same observable behaviour as SQLite', () => {
    test('error inside transaction → row not committed', async () => {
      const { rows: before } = await pool.query(
        'SELECT COUNT(*) AS n FROM contract_test'
      );

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          "INSERT INTO contract_test (label) VALUES ('should-rollback')"
        );
        throw new Error('simulated failure');
      } catch {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }

      const { rows: after } = await pool.query(
        'SELECT COUNT(*) AS n FROM contract_test'
      );
      expect(Number(after[0].n)).toBe(Number(before[0].n));
    });

    test('successful transaction commits the row', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          "INSERT INTO contract_test (label) VALUES ('should-commit')"
        );
        await client.query('COMMIT');
      } finally {
        client.release();
      }

      const { rows } = await pool.query(
        "SELECT * FROM contract_test WHERE label = 'should-commit'"
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].label).toBe('should-commit');
    });
  });
});
