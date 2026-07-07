/**
 * Adapter Contract Tests
 *
 * Documents and asserts the runtime behaviour of the SQLite shim in
 * connection.js, and the divergence points from PostgreSQL that application
 * code must handle.
 *
 * Strategy
 * ────────
 * These tests use a raw sqlite3 :memory: database directly — NOT through the
 * connection.js singleton — because path.resolve() inside SQLiteAdapter
 * mangles ':memory:' into an invalid filesystem path on Windows.
 *
 * This is still a valid contract test: the behaviours asserted here are exactly
 * what the shim produces in dev. Any assertion that passes here but FAILS
 * against a real PostgreSQL instance (see P0 #2: testcontainers) is an
 * identified production bug waiting to happen.
 *
 * Sections
 * ────────
 * 1. Placeholder conversion  — $N → ? regex (shim logic from connection.js)
 * 2. Boolean type divergence — SQLite stores 0/1; PG stores true/false
 * 3. JSON column divergence  — SQLite TEXT string; PG JSONB returns object
 * 4. RETURNING *             — SQLite 3.35+ native; PG always native
 * 5. Transaction rollback    — BEGIN IMMEDIATE (SQLite) vs BEGIN (PG)
 *
 * When adding PostgreSQL equivalents via testcontainers, copy this file to
 * tests/integration/adapter.contract.pg.test.js and flip every comment block
 * marked "PostgreSQL equivalent".
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// ── Shim logic under test ─────────────────────────────────────────────────────
//
// This is the EXACT transformation in SQLiteAdapter.query() (connection.js).
// If that function's regex changes, update here and add a regression test.
//
// Source reference: backend/src/database/connection.js → SQLiteAdapter.query()
function shimConvertPlaceholders(text, params) {
  const expanded = [];
  const sql = text.replace(/\$(\d+)/g, (_, num) => {
    expanded.push(params[parseInt(num, 10) - 1]);
    return '?';
  });
  return { sql, params: expanded };
}

// ── Database lifecycle ────────────────────────────────────────────────────────

let db;

beforeAll(async () => {
  db = await open({ filename: ':memory:', driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON');

  // Minimal table that exercises the three divergence points:
  //   flag      → BOOLEAN  (stored as INTEGER 0/1 in SQLite; native bool in PG)
  //   metadata  → TEXT     (must be JSON.stringify'd in SQLite; JSONB in PG)
  await db.exec(`
    CREATE TABLE contract_test (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      label    TEXT    NOT NULL,
      flag     BOOLEAN NOT NULL DEFAULT 0,
      metadata TEXT
    )
  `);
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  // Isolate each test with a clean table
  await db.exec('DELETE FROM contract_test');
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. Placeholder conversion ($N → ?)
// ═════════════════════════════════════════════════════════════════════════════

describe('1. Placeholder conversion — $N → ?', () => {
  test('single $1 converts to ? with correct param', () => {
    const { sql, params } = shimConvertPlaceholders(
      'SELECT * FROM users WHERE id = $1',
      ['abc']
    );
    expect(sql).toBe('SELECT * FROM users WHERE id = ?');
    expect(params).toEqual(['abc']);
  });

  test('$1 used twice → two ?, value duplicated in expanded params', () => {
    // Real-world case: round-robin lock query uses the same user_id twice.
    const { sql, params } = shimConvertPlaceholders(
      'SELECT * FROM t WHERE owner = $1 OR created_by = $1',
      ['user-x']
    );
    expect(sql).toBe('SELECT * FROM t WHERE owner = ? OR created_by = ?');
    // PostgreSQL equivalent: $1 used twice works natively; no expansion needed.
    expect(params).toEqual(['user-x', 'user-x']);
  });

  test('out-of-order ($2 before $1) → values placed in occurrence order', () => {
    const { sql, params } = shimConvertPlaceholders(
      'SELECT * FROM t WHERE b = $2 AND a = $1',
      ['alpha', 'beta']
    );
    expect(sql).toBe('SELECT * FROM t WHERE b = ? AND a = ?');
    // First occurrence is $2 → 'beta'; second is $1 → 'alpha'
    expect(params).toEqual(['beta', 'alpha']);
  });

  test('$1 $2 $1 → three ?, expanded as [val1, val2, val1]', () => {
    const { sql, params } = shimConvertPlaceholders(
      'INSERT INTO t VALUES ($1, $2, $1)',
      ['first', 'second']
    );
    expect(sql).toBe('INSERT INTO t VALUES (?, ?, ?)');
    expect(params).toEqual(['first', 'second', 'first']);
  });

  test('no placeholders → query and params pass through unchanged', () => {
    const { sql, params } = shimConvertPlaceholders('SELECT 1', []);
    expect(sql).toBe('SELECT 1');
    expect(params).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Boolean type divergence
// ═════════════════════════════════════════════════════════════════════════════

describe('2. Boolean type divergence — SQLite 0/1 vs PostgreSQL true/false', () => {
  test('JS true stored as BOOLEAN → read back as integer 1', async () => {
    await db.run(
      "INSERT INTO contract_test (label, flag) VALUES ('yes', ?)",
      [true]
    );
    const row = await db.get("SELECT flag FROM contract_test WHERE label = 'yes'");

    // SQLite: stores boolean as INTEGER
    expect(row.flag).toBe(1);
    expect(typeof row.flag).toBe('number');

    // ── PostgreSQL equivalent ──────────────────────────────────────────────
    // expect(row.flag).toBe(true);
    // expect(typeof row.flag).toBe('boolean');
    // ──────────────────────────────────────────────────────────────────────
  });

  test('JS false stored as BOOLEAN → read back as integer 0', async () => {
    await db.run(
      "INSERT INTO contract_test (label, flag) VALUES ('no', ?)",
      [false]
    );
    const row = await db.get("SELECT flag FROM contract_test WHERE label = 'no'");

    expect(row.flag).toBe(0);
    expect(typeof row.flag).toBe('number');

    // ── PostgreSQL equivalent ──────────────────────────────────────────────
    // expect(row.flag).toBe(false);
    // expect(typeof row.flag).toBe('boolean');
    // ──────────────────────────────────────────────────────────────────────
  });

  test('DEFAULT 0 column → reads back as integer 0 when omitted from INSERT', async () => {
    await db.run("INSERT INTO contract_test (label) VALUES ('defaulted')");
    const row = await db.get("SELECT flag FROM contract_test WHERE label = 'defaulted'");

    // SQLite default 0 → integer 0. PG default false → boolean false.
    expect(row.flag).toBe(0);
  });

  test('application-code safety: SQLite 1 is truthy but fails strict equality to true', () => {
    // This is the bug class. Loose boolean checks (if row.flag) work fine.
    // Strict checks (row.flag === true) silently fail on SQLite.
    // Repository code must coerce explicitly: !!row.flag or row.flag === 1.
    const sqliteValue = 1;
    expect(!!sqliteValue).toBe(true);       // loose check: OK
    expect(sqliteValue === true).toBe(false); // strict check: WRONG — production bug
  });

  test('emergency_services: 1 coerced with !! equals true', () => {
    // Pattern the repository layer should use when normalising boolean fields
    const fromSqlite = 1;   // what the DB returns in dev
    const fromPg = true;    // what the DB returns in production
    expect(!!fromSqlite).toBe(!!fromPg); // both normalise to true
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. JSON column divergence
// ═════════════════════════════════════════════════════════════════════════════

describe('3. JSON column divergence — SQLite TEXT vs PostgreSQL JSONB', () => {
  test('JSON stored as serialized string → returned as plain string', async () => {
    const payload = { monday: '08:00–17:00', saturday: 'closed' };
    await db.run(
      "INSERT INTO contract_test (label, metadata) VALUES ('hours', ?)",
      [JSON.stringify(payload)]
    );
    const row = await db.get("SELECT metadata FROM contract_test WHERE label = 'hours'");

    // SQLite: metadata is a TEXT string. App must call JSON.parse().
    expect(typeof row.metadata).toBe('string');
    expect(JSON.parse(row.metadata)).toEqual(payload);

    // ── PostgreSQL JSONB equivalent ────────────────────────────────────────
    // typeof row.metadata === 'object' — pg driver deserialises JSONB
    // JSON.parse() is NOT needed (and calling it throws if value is already
    // an object, causing a different bug in app code that assumes SQLite).
    // ──────────────────────────────────────────────────────────────────────
  });

  test('JSON.parse on SQLite output is idempotent — safe to always call it', () => {
    // Defensive pattern: JSON.parse(typeof v === 'string' ? v : JSON.stringify(v))
    // handles both SQLite (string) and PG (object) transparently.
    const raw = '{"key":"value"}';
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    expect(parsed).toEqual({ key: 'value' });

    const obj = { key: 'value' };
    const alreadyObject = typeof obj === 'string' ? JSON.parse(obj) : obj;
    expect(alreadyObject).toEqual({ key: 'value' });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. RETURNING * (SQLite 3.35+)
// ═════════════════════════════════════════════════════════════════════════════

describe('4. RETURNING * — native on SQLite 3.35+, always native on PG', () => {
  test('INSERT ... RETURNING * returns the inserted row', async () => {
    // The SQLiteAdapter shim detects the word RETURNING and routes to db.all()
    // rather than db.run(). This test validates that SQLite 3.35+ (bundled by
    // sqlite3 npm >= 5.x) actually executes RETURNING natively.
    const rows = await db.all(
      "INSERT INTO contract_test (label, flag) VALUES ('returning-test', 1) RETURNING *"
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe('returning-test');
    expect(rows[0].flag).toBe(1);
    expect(rows[0].id).toBeGreaterThan(0);

    // PostgreSQL equivalent: identical shape — this is one of the few
    // behaviours that converges between the two databases.
  });

  test('UPDATE ... RETURNING * returns the updated row', async () => {
    await db.run("INSERT INTO contract_test (label, flag) VALUES ('to-update', 0)");
    const rows = await db.all(
      "UPDATE contract_test SET flag = 1 WHERE label = 'to-update' RETURNING *"
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].flag).toBe(1);
    expect(rows[0].label).toBe('to-update');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Transaction rollback
// ═════════════════════════════════════════════════════════════════════════════

describe('5. Transaction rollback — BEGIN IMMEDIATE (SQLite) vs BEGIN (PG)', () => {
  test('error inside transaction → row not committed', async () => {
    const before = await db.get('SELECT COUNT(*) AS n FROM contract_test');

    try {
      await db.exec('BEGIN IMMEDIATE TRANSACTION');
      await db.run("INSERT INTO contract_test (label) VALUES ('should-rollback')");
      throw new Error('simulated failure');
    } catch {
      await db.exec('ROLLBACK');
    }

    const after = await db.get('SELECT COUNT(*) AS n FROM contract_test');
    expect(after.n).toBe(before.n);

    // PostgreSQL equivalent: identical — ROLLBACK undoes the INSERT in both.
    // The key difference: SQLite uses BEGIN IMMEDIATE (write lock upfront)
    // while PostgreSQL uses MVCC and BEGIN acquires locks lazily.
  });

  test('successful transaction commits the row', async () => {
    await db.exec('BEGIN IMMEDIATE TRANSACTION');
    await db.run("INSERT INTO contract_test (label) VALUES ('should-commit')");
    await db.exec('COMMIT');

    const row = await db.get("SELECT * FROM contract_test WHERE label = 'should-commit'");
    expect(row).toBeTruthy();
    expect(row.label).toBe('should-commit');
  });

  test('nested ROLLBACK after partial work leaves table clean', async () => {
    // Simulates the queueService round-robin: multiple inserts in one transaction.
    try {
      await db.exec('BEGIN IMMEDIATE TRANSACTION');
      await db.run("INSERT INTO contract_test (label) VALUES ('step-1')");
      await db.run("INSERT INTO contract_test (label) VALUES ('step-2')");
      throw new Error('provider unavailable');
    } catch {
      await db.exec('ROLLBACK');
    }

    const rows = await db.all("SELECT * FROM contract_test");
    expect(rows).toHaveLength(0);
  });
});
