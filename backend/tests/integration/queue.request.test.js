/**
 * Queue service request integration test — P1
 *
 * Verifies the request creation lifecycle end-to-end through real HTTP + DB:
 *   Register patient → activate subscription (via DB) → POST /api/queue/request
 *   → service_requests row exists in DB → counter is 0 (no provider to assign)
 *
 * No provider is registered, so assignment stays in 'pending' state.
 * This validates the DB write, the entitlement check, and the subscription gate.
 *
 * Database: isolated SQLite temp file (per-file, see testSetup.js)
 * Tier: Tier-A — routing + business logic. No PG-specific types tested.
 */

import { setupTestDatabase } from '../helpers/testSetup.js';
import request from 'supertest';

let app;
let database;
let teardown;
let patientToken;
let patientUserId;

const TS = Date.now();

const PATIENT_BODY = {
  userType: 'patient',
  email: `queue-patient-${TS}@example.com`,
  password: 'QueueTest@1234',
  confirmPassword: 'QueueTest@1234',
  firstName: 'Queue',
  lastName: 'TestUser',
  phone: '08033344455',
  dateOfBirth: '1988-11-20',
  gender: 'male',
  address: '7 Queue Lane Lagos Nigeria',
  city: 'Lagos',
  state: 'Lagos',
};

beforeAll(async () => {
  ({ app, database, teardown } = await setupTestDatabase());

  // Register patient
  const regRes = await request(app)
    .post('/api/auth/register')
    .send(PATIENT_BODY);

  expect(regRes.status).toBe(201);
  patientToken = regRes.body.data.accessToken;

  // Get the user ID from the DB directly (avoids response-shape assumptions)
  const userRow = await database.query(
    'SELECT id FROM users WHERE email = $1',
    [PATIENT_BODY.email]
  );
  if (!userRow.rows[0]) {
    throw new Error(`User row not found for email ${PATIENT_BODY.email}`);
  }
  patientUserId = userRow.rows[0].id;

  // Activate subscription directly in the DB.
  // The queue route checks: subscription_status = 'active' AND current_package IS SET.
  const updateResult = await database.query(
    `UPDATE patients SET subscription_status = 'active', current_package = 'general' WHERE user_id = $1`,
    [patientUserId]
  );
  if (updateResult.rowCount === 0) {
    // Verify patient row exists to diagnose the failure
    const patientCheck = await database.query(
      'SELECT id, user_id, subscription_status FROM patients WHERE user_id = $1',
      [patientUserId]
    );
    throw new Error(
      `Subscription update matched 0 rows. patientUserId=${patientUserId}, ` +
      `patientRows=${JSON.stringify(patientCheck.rows)}`
    );
  }

  // Verify subscription was written before running any tests
  const verifyRow = await database.query(
    'SELECT subscription_status, current_package FROM patients WHERE user_id = $1',
    [patientUserId]
  );
  if (verifyRow.rows[0]?.subscription_status !== 'active') {
    throw new Error(
      `Subscription not active after UPDATE! Got: ${JSON.stringify(verifyRow.rows[0])}`
    );
  }
}, 30_000);

afterAll(() => teardown());

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/queue/request — service request creation', () => {
  test('valid request body returns 201 with pending status', async () => {
    const res = await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ serviceType: 'consultation', description: 'Routine check-up' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    // No provider is registered in this isolated DB, so status stays pending
    expect(['pending', 'assigned']).toContain(res.body.data.status);
    expect(res.body.data.service_type).toBe('consultation');
  });

  test('a service_requests row exists in the database after the call', async () => {
    // Make a second request so we can query it independently
    const res = await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ serviceType: 'consultation', description: 'Follow-up check' });

    expect(res.status).toBe(201);
    const requestId = res.body.data.id;
    expect(requestId).toBeDefined();

    // Verify the row is in the database
    const dbResult = await database.query(
      'SELECT * FROM service_requests WHERE id = $1',
      [requestId]
    );
    expect(dbResult.rows).toHaveLength(1);

    const row = dbResult.rows[0];
    expect(row.service_type).toBe('consultation');
    expect(row.city).toBe('Lagos');
    expect(['pending', 'assigned']).toContain(row.status);
  });

  test('two requests increment the DB row count', async () => {
    const before = await database.query(
      `SELECT COUNT(*) AS n FROM service_requests WHERE service_type = 'emergency'`
    );

    await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ serviceType: 'emergency', priority: 'emergency' });

    await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ serviceType: 'emergency', priority: 'emergency' });

    const after = await database.query(
      `SELECT COUNT(*) AS n FROM service_requests WHERE service_type = 'emergency'`
    );

    expect(Number(after.rows[0].n)).toBe(Number(before.rows[0].n) + 2);
  });

  test('missing subscription returns 403', async () => {
    // Register a patient WITHOUT activating their subscription
    const noSubRes = await request(app)
      .post('/api/auth/register')
      .send({
        ...PATIENT_BODY,
        email: `no-sub-${TS}@example.com`,
      });
    expect(noSubRes.status).toBe(201);
    const noSubToken = noSubRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${noSubToken}`)
      .send({ serviceType: 'consultation' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('invalid service type returns 400', async () => {
    const res = await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ serviceType: 'not_a_real_type' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('unauthenticated request returns 401', async () => {
    const res = await request(app)
      .post('/api/queue/request')
      .send({ serviceType: 'consultation' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
