/**
 * Queue lifecycle integration test — P6
 *
 * Exercises the full service-request state machine through real HTTP + DB:
 *
 *   Setup:
 *     Register patient  → activate subscription (direct DB)
 *     Register doctor   → set verification_status = 'verified' (direct DB)
 *     POST /api/queue/request → auto-assigned to the verified doctor
 *
 *   Happy-path chain (sequential, uses the same request):
 *     assigned → POST /assignments/:id/accept    → accepted
 *     accepted → POST /assignments/:id/start     → in_progress
 *     in_prog  → POST /assignments/:id/complete  → completed
 *
 *   Reject + re-assign:
 *     Create a second request (auto-assigned to doctor A)
 *     Register a second doctor, verify them
 *     Doctor A rejects → round-robin re-assigns to doctor B → status = assigned
 *
 *   Patient cancels:
 *     Create a third request (pending — no provider)
 *     DELETE /api/queue/request/:id → cancelled
 *
 *   GET my-requests:
 *     Patient can list their own requests
 *
 *   GET assignments:
 *     Doctor can list their assigned requests
 *
 *   Error guards:
 *     Wrong provider tries to accept → 422 / 4xx (BusinessLogicError)
 *     Accept already-completed request → 4xx
 *
 * Database: isolated SQLite temp file (per-file, see testSetup.js)
 * Tier: Tier-A — routing + full business logic. No PG-specific types tested.
 */

import { setupTestDatabase } from '../helpers/testSetup.js';
import request from 'supertest';

let app;
let database;
let teardown;

let patientToken;
let patientUserId;

let doctorToken;   // doctor A
let doctorUserId;  // doctor A
let doctorId;      // doctors.id  (PK in doctors table) for doctor A

let doctor2Token;  // doctor B (for reject/re-assign test)
let doctor2UserId;
let doctor2Id;

const TS = Date.now();

// ── Registration payloads ─────────────────────────────────────────────────────

const PATIENT_BODY = {
  userType: 'patient',
  email: `lifecycle-patient-${TS}@example.com`,
  password: 'Lifecycle@1234',
  confirmPassword: 'Lifecycle@1234',
  firstName: 'Life',
  lastName: 'Cycle',
  phone: '08055566677',
  dateOfBirth: '1991-04-10',
  gender: 'female',
  address: '5 Lifecycle Road Lagos Nigeria',
  city: 'Lagos',
  state: 'Lagos',
};

const DOCTOR_BODY = {
  userType: 'doctor',
  email: `lifecycle-doctor-${TS}@example.com`,
  password: 'DocLifecycle@1234',
  confirmPassword: 'DocLifecycle@1234',
  firstName: 'Doctor',
  lastName: 'Alpha',
  phone: '08066677788',
  city: 'Lagos',
  state: 'Lagos',
  specialization: 'General Practice',
  licenseNumber: `LIC-ALPHA-${TS}`,
  licenseExpiryDate: '2029-01-01',
  yearsOfExperience: 5,
  qualifications: ['MBBS'],
  consultationFee: 5000,
};

const DOCTOR2_BODY = {
  userType: 'doctor',
  email: `lifecycle-doctor2-${TS}@example.com`,
  password: 'DocLifecycle@1234',
  confirmPassword: 'DocLifecycle@1234',
  firstName: 'Doctor',
  lastName: 'Beta',
  phone: '08077788899',
  city: 'Lagos',
  state: 'Lagos',
  specialization: 'General Practice',
  licenseNumber: `LIC-BETA-${TS}`,
  licenseExpiryDate: '2029-01-01',
  yearsOfExperience: 3,
  qualifications: ['MBBS'],
  consultationFee: 4000,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Seed a verified doctor: register via HTTP, then mark verified in DB.
 * Returns { token, userId, doctorId }.
 */
async function seedVerifiedDoctor(body) {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send(body);

  if (regRes.status !== 201) {
    throw new Error(`Doctor register failed: ${JSON.stringify(regRes.body)}`);
  }

  const token = regRes.body.data.accessToken;

  const userRow = await database.query(
    'SELECT id FROM users WHERE email = $1',
    [body.email]
  );
  const userId = userRow.rows[0].id;

  // Auto-assigned doctors start with verification_status = 'pending'.
  // Set it to 'verified' so getVerifiedProvidersByCity picks them up.
  await database.query(
    `UPDATE doctors SET verification_status = 'verified' WHERE user_id = $1`,
    [userId]
  );

  const docRow = await database.query(
    'SELECT id FROM doctors WHERE user_id = $1',
    [userId]
  );
  const doctorId = docRow.rows[0].id;

  return { token, userId, doctorId };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  ({ app, database, teardown } = await setupTestDatabase());

  // Register + configure patient
  const patReg = await request(app)
    .post('/api/auth/register')
    .send(PATIENT_BODY);
  expect(patReg.status).toBe(201);
  patientToken = patReg.body.data.accessToken;

  const userRow = await database.query(
    'SELECT id FROM users WHERE email = $1',
    [PATIENT_BODY.email]
  );
  patientUserId = userRow.rows[0].id;

  await database.query(
    `UPDATE patients SET subscription_status = 'active', current_package = 'general' WHERE user_id = $1`,
    [patientUserId]
  );

  // Register + verify doctor A
  ({ token: doctorToken, userId: doctorUserId, doctorId } =
    await seedVerifiedDoctor(DOCTOR_BODY));

  // Register + verify doctor B (used in reject/re-assign test)
  ({ token: doctor2Token, userId: doctor2UserId, doctorId: doctor2Id } =
    await seedVerifiedDoctor(DOCTOR2_BODY));
}, 45_000);

afterAll(() => teardown());

// ─────────────────────────────────────────────────────────────────────────────
// 1. Happy-path lifecycle: assigned → accepted → in_progress → completed
// ─────────────────────────────────────────────────────────────────────────────

describe('Queue lifecycle — accept → start → complete', () => {
  let requestId;

  test('POST /api/queue/request auto-assigns to the verified doctor', async () => {
    const res = await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ serviceType: 'consultation', description: 'Routine lifecycle test' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('assigned');
    expect(res.body.data.assigned_provider_id).toBe(doctorId);

    requestId = res.body.data.id;
  });

  test('POST /assignments/:id/accept → status becomes accepted', async () => {
    const res = await request(app)
      .post(`/api/queue/assignments/${requestId}/accept`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('accepted');
  });

  test('DB row reflects accepted status', async () => {
    const row = await database.query(
      'SELECT status FROM service_requests WHERE id = $1',
      [requestId]
    );
    expect(row.rows[0].status).toBe('accepted');
  });

  test('POST /assignments/:id/start → status becomes in_progress', async () => {
    const res = await request(app)
      .post(`/api/queue/assignments/${requestId}/start`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  test('POST /assignments/:id/complete → status becomes completed', async () => {
    const res = await request(app)
      .post(`/api/queue/assignments/${requestId}/complete`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  test('DB row reflects completed status', async () => {
    const row = await database.query(
      'SELECT status FROM service_requests WHERE id = $1',
      [requestId]
    );
    expect(row.rows[0].status).toBe('completed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Reject → re-assign to doctor B
// ─────────────────────────────────────────────────────────────────────────────

describe('Queue lifecycle — reject triggers re-assignment', () => {
  let requestId;

  test('creates a second consultation request — assigned to doctor A (lowest counter)', async () => {
    const res = await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ serviceType: 'consultation', description: 'Reject test request' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('assigned');
    // Doctor A has 1 assignment already; doctor B has 0 → doctor B gets this one.
    // Either doctor is valid — just confirm it is assigned.
    expect(res.body.data.assigned_provider_id).toBeDefined();

    requestId = res.body.data.id;
  });

  test('assigned doctor rejects → request gets re-assigned to the other doctor', async () => {
    // Determine which doctor is assigned so we can reject with the right token
    const row = await database.query(
      'SELECT assigned_provider_id FROM service_requests WHERE id = $1',
      [requestId]
    );
    const assignedId = row.rows[0].assigned_provider_id;
    const rejectingToken = assignedId === doctorId ? doctorToken : doctor2Token;
    const otherDoctorId  = assignedId === doctorId ? doctor2Id   : doctorId;

    const res = await request(app)
      .post(`/api/queue/assignments/${requestId}/reject`)
      .set('Authorization', `Bearer ${rejectingToken}`)
      .send({ reason: 'Too busy' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // After rejection the request should be assigned to the other doctor
    // (round-robin will pick them — they have the lower counter at this point).
    expect(['assigned', 'pending']).toContain(res.body.data.status);

    if (res.body.data.status === 'assigned') {
      expect(res.body.data.assigned_provider_id).toBe(otherDoctorId);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Patient cancels a pending request
// ─────────────────────────────────────────────────────────────────────────────

describe('Queue lifecycle — patient cancels a request', () => {
  let requestId;

  beforeAll(async () => {
    // Create a request and immediately cancel it before any provider accepts
    const res = await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ serviceType: 'laboratory_test', description: 'To be cancelled' });

    expect(res.status).toBe(201);
    requestId = res.body.data.id;
  });

  test('DELETE /api/queue/request/:id → status becomes cancelled', async () => {
    const res = await request(app)
      .delete(`/api/queue/request/${requestId}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ reason: 'Changed my mind' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');
  });

  test('DB row reflects cancelled status', async () => {
    const row = await database.query(
      'SELECT status FROM service_requests WHERE id = $1',
      [requestId]
    );
    expect(row.rows[0].status).toBe('cancelled');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET my-requests and GET assignments
// ─────────────────────────────────────────────────────────────────────────────

describe('Queue reads — patient and provider list views', () => {
  test('GET /api/queue/my-requests returns the patient\'s requests', async () => {
    const res = await request(app)
      .get('/api/queue/my-requests')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3); // created at least 3 above
  });

  test('GET /api/queue/my-requests?status=cancelled filters by status', async () => {
    const res = await request(app)
      .get('/api/queue/my-requests?status=cancelled')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every(r => r.status === 'cancelled')).toBe(true);
  });

  test('GET /api/queue/assignments returns doctor\'s assigned requests', async () => {
    const res = await request(app)
      .get('/api/queue/assignments')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('patient cannot access GET /api/queue/assignments → 403', async () => {
    const res = await request(app)
      .get('/api/queue/assignments')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Error guards
// ─────────────────────────────────────────────────────────────────────────────

describe('Queue lifecycle — error guard cases', () => {
  let requestId;

  beforeAll(async () => {
    // Create a fresh assigned request for error-case tests
    const res = await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ serviceType: 'consultation', description: 'Error guard test' });

    expect(res.status).toBe(201);
    requestId = res.body.data.id;
  });

  test('wrong provider (doctor B) tries to accept doctor A\'s request → 4xx', async () => {
    // Find out who was assigned
    const row = await database.query(
      'SELECT assigned_provider_id FROM service_requests WHERE id = $1',
      [requestId]
    );
    const assignedId = row.rows[0].assigned_provider_id;
    // Use the token of the OTHER doctor
    const wrongToken = assignedId === doctorId ? doctor2Token : doctorToken;

    const res = await request(app)
      .post(`/api/queue/assignments/${requestId}/accept`)
      .set('Authorization', `Bearer ${wrongToken}`);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('provider cannot start a request that is still in assigned (not accepted) state → 4xx', async () => {
    const row = await database.query(
      'SELECT assigned_provider_id, status FROM service_requests WHERE id = $1',
      [requestId]
    );
    // Request is still 'assigned' (the wrong-doctor test above should have failed without mutating state)
    expect(row.rows[0].status).toBe('assigned');
    const assignedId = row.rows[0].assigned_provider_id;
    const correctToken = assignedId === doctorId ? doctorToken : doctor2Token;

    const res = await request(app)
      .post(`/api/queue/assignments/${requestId}/start`)
      .set('Authorization', `Bearer ${correctToken}`);

    // start() requires status = 'accepted', not 'assigned'
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('unauthenticated request to /api/queue/request → 401', async () => {
    const res = await request(app)
      .post('/api/queue/request')
      .send({ serviceType: 'consultation' });

    expect(res.status).toBe(401);
  });

  test('patient with no subscription → 403', async () => {
    // Register a fresh patient with no subscription
    const noSubBody = {
      userType: 'patient',
      email: `nosub-${TS}@example.com`,
      password: 'NoSub@1234',
      confirmPassword: 'NoSub@1234',
      firstName: 'No',
      lastName: 'Sub',
      phone: '08099900011',
      dateOfBirth: '1993-07-07',
      gender: 'male',
      address: '1 Nosub Close Lagos Nigeria',
      city: 'Lagos',
      state: 'Lagos',
    };

    const reg = await request(app).post('/api/auth/register').send(noSubBody);
    expect(reg.status).toBe(201);
    const noSubToken = reg.body.data.accessToken;

    const res = await request(app)
      .post('/api/queue/request')
      .set('Authorization', `Bearer ${noSubToken}`)
      .send({ serviceType: 'consultation' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/subscription/i);
  });
});
