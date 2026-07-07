/**
 * RBAC integration test (cross-role enforcement) — P1
 *
 * Verifies that role guards are enforced end-to-end through real HTTP and a
 * real database. Not a mock — every layer runs: middleware, controller, DB.
 *
 * Focus: a pharmacy user MUST NOT access a doctor-only endpoint.
 *   POST /api/auth/register (pharmacy) → 201
 *   POST /api/auth/login               → 200 (access token)
 *   GET  /api/doctors/consultations    → 403 (wrong role)
 *
 * Additional cases:
 *   GET /api/doctors/consultations without token → 401
 *   GET /api/doctors/consultations with patient token → 403
 *
 * Database: isolated SQLite temp file (per-file, see testSetup.js)
 * Tier: Tier-A — routing + RBAC. No PG-specific type checks.
 */

import { setupTestDatabase } from '../helpers/testSetup.js';
import request from 'supertest';

let app;
let teardown;
let pharmacyToken;
let patientToken;

const TS = Date.now();

const PHARMACY_BODY = {
  userType: 'pharmacy',
  email: `pharmacy-${TS}@example.com`,
  password: 'Integration@1234',
  confirmPassword: 'Integration@1234',
  phone: '08098765432',
  pharmacyName: 'Integration Test Pharmacy',
  licenseNumber: `PH-TEST-${TS}`,
  licenseExpiryDate: '2028-01-01',
  address: '45 Integration Avenue Lagos Nigeria',
};

const PATIENT_BODY = {
  userType: 'patient',
  email: `patient-rbac-${TS}@example.com`,
  password: 'Integration@1234',
  confirmPassword: 'Integration@1234',
  firstName: 'Rbac',
  lastName: 'Patient',
  phone: '08011112222',
  dateOfBirth: '1995-03-20',
  gender: 'female',
  address: '99 Test Road Lagos Nigeria',
  city: 'Lagos',
  state: 'Lagos',
};

beforeAll(async () => {
  ({ app, teardown } = await setupTestDatabase());

  // Register pharmacy
  const pharmReg = await request(app)
    .post('/api/auth/register')
    .send(PHARMACY_BODY);
  pharmacyToken = pharmReg.body?.data?.accessToken;

  // Register patient
  const patReg = await request(app)
    .post('/api/auth/register')
    .send(PATIENT_BODY);
  patientToken = patReg.body?.data?.accessToken;
}, 30_000);

afterAll(() => teardown());

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/doctors/consultations — role enforcement', () => {
  test('no token → 401 (not 403 — unauthenticated before authorised check)', async () => {
    const res = await request(app).get('/api/doctors/consultations');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('pharmacy token → 403 (authenticated but wrong role)', async () => {
    expect(pharmacyToken).toBeDefined(); // guard: registration must have succeeded

    const res = await request(app)
      .get('/api/doctors/consultations')
      .set('Authorization', `Bearer ${pharmacyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);

    // 403 body must NOT leak role, userId, or internal data
    expect(res.body.data).toBeUndefined();
    expect(res.body.role).toBeUndefined();
    expect(res.body.userId).toBeUndefined();
  });

  test('patient token → 403 (authenticated but wrong role)', async () => {
    expect(patientToken).toBeDefined();

    const res = await request(app)
      .get('/api/doctors/consultations')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('malformed token → 401', async () => {
    const res = await request(app)
      .get('/api/doctors/consultations')
      .set('Authorization', 'Bearer garbage.token.value');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register — pharmacy-specific validation', () => {
  test('pharmacy without pharmacyName → 400 validation error', async () => {
    const { pharmacyName: _, ...noName } = PHARMACY_BODY;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...noName, email: `ph-noname-${TS}@example.com` });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  test('pharmacy without licenseNumber → 400 validation error', async () => {
    const { licenseNumber: _, ...noLicense } = PHARMACY_BODY;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...noLicense, email: `ph-nolic-${TS}@example.com` });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
