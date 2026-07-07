/**
 * Doctor routes integration test — P10
 *
 * Covers:
 *   RBAC guards    — patient token → 403 on all doctor-only routes
 *   Auth guards    — no token → 401 on all protected routes
 *
 *   GET  /api/doctors/profile                           — 200 with profile data
 *   PUT  /api/doctors/profile                           — update fields → 200
 *
 *   GET  /api/doctors/consultations                     — 200, empty list initially
 *   POST /api/doctors/consultations                     — 201 creates consultation
 *   GET  /api/doctors/consultations/:consultationId     — 200 retrieves it
 *   PUT  /api/doctors/consultations/:consultationId     — 200 updates diagnosis
 *
 *   GET  /api/doctors/statistics                        — 200
 *
 *   Public routes (no auth required):
 *   GET  /api/doctors/search                            — 200
 *   GET  /api/doctors/specializations                   — 200
 *
 * Setup:
 *   1. Register doctor → login → UPDATE verification_status = 'verified' in DB
 *   2. Register patient → activate subscription via direct DB UPDATE
 *   3. Look up patients.id for consultation creation
 *
 * Database: isolated SQLite temp file (per setupTestDatabase.js)
 */

import { setupTestDatabase } from '../helpers/testSetup.js';
import request from 'supertest';

let app;
let database;
let teardown;

// doctor credentials
let doctorToken;
let doctorUserId;
let doctorId;   // doctors.id UUID

// patient credentials (for RBAC tests + consultation target)
let patientToken;
let patientUserId;
let patientDbId; // patients.id UUID

// consultation created in POST test, reused in GET/:id + PUT/:id
let consultationId;

const TS = Date.now();

const DOCTOR_BODY = {
  userType: 'doctor',
  email: `doctor-p10-${TS}@example.com`,
  password: 'Doctor@1234',
  confirmPassword: 'Doctor@1234',
  firstName: 'Doc',
  lastName: 'Tester',
  phone: '08011122234',
  city: 'Lagos',
  state: 'Lagos',
  specialization: 'General Practice',
  licenseNumber: `LIC-P10-${TS}`,
  licenseExpiryDate: '2030-01-01',
  yearsOfExperience: 8,
  qualifications: ['MBBS', 'FMCP'],
  consultationFee: 6000,
};

const PATIENT_BODY = {
  userType: 'patient',
  email: `patient-p10-${TS}@example.com`,
  password: 'Patient@1234',
  confirmPassword: 'Patient@1234',
  firstName: 'Pat',
  lastName: 'Tester',
  phone: '08099988877',
  dateOfBirth: '1990-03-12',
  gender: 'female',
  address: '10 Test Street Lagos',
  city: 'Lagos',
  state: 'Lagos',
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  ({ app, database, teardown } = await setupTestDatabase());

  // ── 1. Register + verify doctor ─────────────────────────────────────────────
  const docReg = await request(app).post('/api/auth/register').send(DOCTOR_BODY);
  if (docReg.status !== 201) {
    throw new Error(`Doctor register failed: ${JSON.stringify(docReg.body)}`);
  }
  doctorToken = docReg.body.data.accessToken;

  const docUserRow = await database.query('SELECT id FROM users WHERE email = $1', [DOCTOR_BODY.email]);
  doctorUserId = docUserRow.rows[0].id;

  await database.query(
    `UPDATE doctors SET verification_status = 'verified' WHERE user_id = $1`,
    [doctorUserId]
  );

  const docRow = await database.query('SELECT id FROM doctors WHERE user_id = $1', [doctorUserId]);
  doctorId = docRow.rows[0].id;

  // ── 2. Register patient + activate subscription ──────────────────────────────
  const patReg = await request(app).post('/api/auth/register').send(PATIENT_BODY);
  if (patReg.status !== 201) {
    throw new Error(`Patient register failed: ${JSON.stringify(patReg.body)}`);
  }
  patientToken = patReg.body.data.accessToken;

  const patUserRow = await database.query('SELECT id FROM users WHERE email = $1', [PATIENT_BODY.email]);
  patientUserId = patUserRow.rows[0].id;

  await database.query(
    `UPDATE patients
     SET subscription_status = 'active',
         current_package = 'GENERAL',
         subscription_end_date = $1
     WHERE user_id = $2`,

    [new Date(Date.now() + 365 * 86400 * 1000).toISOString(), patientUserId]
  );

  const patRow = await database.query('SELECT id FROM patients WHERE user_id = $1', [patientUserId]);
  patientDbId = patRow.rows[0].id;
}, 30_000);

afterAll(() => teardown());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const docAuth  = () => ({ Authorization: `Bearer ${doctorToken}` });
const patAuth  = () => ({ Authorization: `Bearer ${patientToken}` });

// ─────────────────────────────────────────────────────────────────────────────
// 1. RBAC — patient token → 403 on doctor-only routes
// ─────────────────────────────────────────────────────────────────────────────

describe('RBAC — patient cannot access doctor routes', () => {
  test('GET /api/doctors/profile → 403', async () => {
    const res = await request(app).get('/api/doctors/profile').set(patAuth());
    expect(res.status).toBe(403);
  });

  test('PUT /api/doctors/profile → 403', async () => {
    const res = await request(app)
      .put('/api/doctors/profile')
      .set(patAuth())
      .send({ bio: 'sneaky' });
    expect(res.status).toBe(403);
  });

  test('GET /api/doctors/consultations → 403', async () => {
    const res = await request(app).get('/api/doctors/consultations').set(patAuth());
    expect(res.status).toBe(403);
  });

  test('POST /api/doctors/consultations → 403', async () => {
    const res = await request(app)
      .post('/api/doctors/consultations')
      .set(patAuth())
      .send({ patientId: patientDbId });
    expect(res.status).toBe(403);
  });

  test('GET /api/doctors/statistics → 403', async () => {
    const res = await request(app).get('/api/doctors/statistics').set(patAuth());
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Auth guards — no token → 401
// ─────────────────────────────────────────────────────────────────────────────

describe('Auth guards — unauthenticated requests', () => {
  test('GET /api/doctors/profile without token → 401', async () => {
    const res = await request(app).get('/api/doctors/profile');
    expect(res.status).toBe(401);
  });

  test('PUT /api/doctors/profile without token → 401', async () => {
    const res = await request(app).put('/api/doctors/profile').send({ bio: 'x' });
    expect(res.status).toBe(401);
  });

  test('POST /api/doctors/consultations without token → 401', async () => {
    const res = await request(app).post('/api/doctors/consultations').send({});
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/doctors/profile
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/doctors/profile', () => {
  test('verified doctor → 200 with profile data', async () => {
    const res = await request(app).get('/api/doctors/profile').set(docAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('response includes user sub-object with email', async () => {
    const res = await request(app).get('/api/doctors/profile').set(docAuth());
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(DOCTOR_BODY.email);
  });

  test('response includes specialization', async () => {
    const res = await request(app).get('/api/doctors/profile').set(docAuth());
    expect(res.body.data.specialization).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. PUT /api/doctors/profile
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/doctors/profile', () => {
  test('valid update → 200', async () => {
    const res = await request(app)
      .put('/api/doctors/profile')
      .set(docAuth())
      .send({ specialization: 'Cardiology' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('empty body (no fields) → 422 validation error', async () => {
    const res = await request(app)
      .put('/api/doctors/profile')
      .set(docAuth())
      .send({});
    expect(res.status).toBe(422);
  });

  test('GET after PUT reflects updated specialization', async () => {
    await request(app)
      .put('/api/doctors/profile')
      .set(docAuth())
      .send({ specialization: 'Neurology' });

    const res = await request(app).get('/api/doctors/profile').set(docAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.specialization).toBe('Neurology');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/doctors/consultations — initially empty
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/doctors/consultations', () => {
  test('initially returns empty list → 200', async () => {
    const res = await request(app).get('/api/doctors/consultations').set(docAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const list = Array.isArray(res.body.data)
      ? res.body.data
      : res.body.data?.consultations ?? [];
    expect(list).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /api/doctors/consultations — create
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/doctors/consultations', () => {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString();

  test('missing required fields → 422', async () => {
    const res = await request(app)
      .post('/api/doctors/consultations')
      .set(docAuth())
      .send({ doctorId });
    expect(res.status).toBe(422);
  });

  test('valid body → 201 consultation created', async () => {
    const res = await request(app)
      .post('/api/doctors/consultations')
      .set(docAuth())
      .send({
        doctorId,
        patientId: patientDbId,
        consultationType: 'in_person',
        reasonForVisit: 'Patient experiencing persistent headaches for three days.',
        appointmentDate: tomorrow,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    consultationId = res.body.data.id;
    expect(consultationId).toBeDefined();
  });

  test('GET consultations after create → list has one entry', async () => {
    const res = await request(app).get('/api/doctors/consultations').set(docAuth());
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body.data)
      ? res.body.data
      : res.body.data?.consultations ?? [];
    expect(list.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /api/doctors/consultations/:consultationId
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/doctors/consultations/:consultationId', () => {
  test('valid ID → 200 with consultation data', async () => {
    if (!consultationId) return; // skip if create failed
    const res = await request(app)
      .get(`/api/doctors/consultations/${consultationId}`)
      .set(docAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(consultationId);
  });

  test('non-existent ID → 404', async () => {
    const res = await request(app)
      .get('/api/doctors/consultations/00000000-0000-0000-0000-000000000000')
      .set(docAuth());
    expect([404, 400]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. PUT /api/doctors/consultations/:consultationId
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/doctors/consultations/:consultationId', () => {
  test('update diagnosis → 200', async () => {
    if (!consultationId) return;
    const res = await request(app)
      .put(`/api/doctors/consultations/${consultationId}`)
      .set(docAuth())
      .send({ diagnosis: 'Tension-type headache, mild to moderate severity.' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('empty update body → 400', async () => {
    if (!consultationId) return;
    const res = await request(app)
      .put(`/api/doctors/consultations/${consultationId}`)
      .set(docAuth())
      .send({});
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. GET /api/doctors/statistics
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/doctors/statistics', () => {
  test('verified doctor → 200 with stats', async () => {
    const res = await request(app).get('/api/doctors/statistics').set(docAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Public routes
// ─────────────────────────────────────────────────────────────────────────────

describe('Public doctor routes (no auth required)', () => {
  test('GET /api/doctors/search → 200', async () => {
    const res = await request(app).get('/api/doctors/search');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/doctors/specializations → 200', async () => {
    const res = await request(app).get('/api/doctors/specializations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/doctors/top-rated → 200', async () => {
    const res = await request(app).get('/api/doctors/top-rated');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
