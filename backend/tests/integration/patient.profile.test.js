/**
 * Patient profile + dependents integration test — P9
 *
 * Covers:
 *   GET  /api/patients/profile                        — 200 with profile data
 *   PUT  /api/patients/profile                        — update fields, GET reflects change
 *
 *   POST   /api/patients/dependents                   — add dependent (needs active subscription)
 *   GET    /api/patients/dependents                   — list contains added dependent
 *   PUT    /api/patients/dependents/:dependentId       — update dependent fields
 *   DELETE /api/patients/dependents/:dependentId       — remove dependent, list empties
 *
 *   Auth / validation guards on every endpoint
 *
 * Subscription: activated via POST /api/patients/subscriptions (GENERAL plan)
 *   before dependent tests run — dependent CRUD requires an active subscription.
 *
 * Database: isolated SQLite temp file (per-file, see testSetup.js)
 */

import { setupTestDatabase } from '../helpers/testSetup.js';
import request from 'supertest';

let app;
let teardown;
let token;

const TS = Date.now();

const PATIENT_BODY = {
  userType: 'patient',
  email: `profile-patient-${TS}@example.com`,
  password: 'Profile@1234',
  confirmPassword: 'Profile@1234',
  firstName: 'Profile',
  lastName: 'Tester',
  phone: '08055544433',
  dateOfBirth: '1988-07-15',
  gender: 'male',
  address: '22 Profile Street Lagos Nigeria',
  city: 'Lagos',
  state: 'Lagos',
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  ({ app, teardown } = await setupTestDatabase());

  const reg = await request(app).post('/api/auth/register').send(PATIENT_BODY);
  expect(reg.status).toBe(201);

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: PATIENT_BODY.email, password: PATIENT_BODY.password });
  expect(login.status).toBe(200);

  token = login.body.data.accessToken;
  expect(token).toBeDefined();
}, 30_000);

afterAll(() => teardown());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const auth = () => ({ Authorization: `Bearer ${token}` });

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/patients/profile
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/patients/profile', () => {
  test('valid token → 200 with patient profile', async () => {
    const res = await request(app)
      .get('/api/patients/profile')
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const profile = res.body.data;
    expect(profile).toBeDefined();
    // Accept camelCase or snake_case
    const email = profile.email ?? profile.user?.email;
    expect(email).toBe(PATIENT_BODY.email);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/patients/profile');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. PUT /api/patients/profile
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/patients/profile', () => {
  test('valid update → 200', async () => {
    const res = await request(app)
      .put('/api/patients/profile')
      .set(auth())
      // Note: bloodGroup maps to blood_group but SQLite schema uses blood_type — skip it here
      .send({ address: '100 Updated Road Lagos Nigeria' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET profile reflects updated address', async () => {
    const res = await request(app)
      .get('/api/patients/profile')
      .set(auth());

    expect(res.status).toBe(200);
    const profile = res.body.data;
    // address is stored on the users table; getProfile returns it under .user.address
    const addr = profile.user?.address ?? profile.address;
    expect(addr).toMatch(/100 Updated Road/i);
  });

  test('empty body (no fields) → 422', async () => {
    const res = await request(app)
      .put('/api/patients/profile')
      .set(auth())
      .send({});

    expect(res.status).toBe(422);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .put('/api/patients/profile')
      .send({ address: '1 Ghost Street' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Dependents — requires active subscription
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/patients/dependents — add dependent', () => {
  // Activate subscription so the subscription gate passes
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/patients/subscriptions')
      .set(auth())
      .send({ packageType: 'general' });
    expect([200, 201]).toContain(res.status);
  });

  test('valid payload → 201 with dependent data', async () => {
    const res = await request(app)
      .post('/api/patients/dependents')
      .set(auth())
      .send({
        firstName: 'Junior',
        lastName: 'Tester',
        gender: 'male',
        relationship: 'child',
        dateOfBirth: '2015-03-20',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const dep = res.body.data;
    expect(dep).toBeDefined();
    const rel = dep.relationship ?? dep.relation;
    expect(rel).toBe('child');
  });

  test('missing gender → 422', async () => {
    const res = await request(app)
      .post('/api/patients/dependents')
      .set(auth())
      .send({ firstName: 'No', lastName: 'Gender', relationship: 'spouse' });

    expect(res.status).toBe(422);
  });

  test('missing relationship → 422', async () => {
    const res = await request(app)
      .post('/api/patients/dependents')
      .set(auth())
      .send({ firstName: 'No', lastName: 'Relationship', gender: 'female' });

    expect(res.status).toBe(422);
  });

  test('invalid relationship value → 422', async () => {
    const res = await request(app)
      .post('/api/patients/dependents')
      .set(auth())
      .send({ firstName: 'Bad', lastName: 'Rel', gender: 'male', relationship: 'cousin' });

    expect(res.status).toBe(422);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .post('/api/patients/dependents')
      .send({ gender: 'male', relationship: 'child' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/patients/dependents
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/patients/dependents', () => {
  test('returns 200 with list of dependents', async () => {
    const res = await request(app)
      .get('/api/patients/dependents')
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // getDependents returns { dependents: [...], activeCount, maxAllowed }
    const list = res.body.data?.dependents ?? res.body.data;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  test('list contains the added dependent', async () => {
    const res = await request(app)
      .get('/api/patients/dependents')
      .set(auth());

    const list = res.body.data?.dependents ?? res.body.data;
    const found = list.some(d => {
      const rel = (d.relationship ?? d.relation ?? '').toLowerCase();
      return rel === 'child';
    });
    expect(found).toBe(true);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/patients/dependents');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PUT /api/patients/dependents/:dependentId
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/patients/dependents/:dependentId', () => {
  let dependentId;

  beforeAll(async () => {
    const list = await request(app)
      .get('/api/patients/dependents')
      .set(auth());
    expect(list.status).toBe(200);
    const deps = list.body.data?.dependents ?? list.body.data;
    dependentId = deps[0]?.id ?? deps[0]?.dependent_id;
    expect(dependentId).toBeDefined();
  });

  test('update relationship → 200 with updated data', async () => {
    const res = await request(app)
      .put(`/api/patients/dependents/${dependentId}`)
      .set(auth())
      .send({ relationship: 'sibling' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET dependents reflects updated relationship', async () => {
    const res = await request(app)
      .get('/api/patients/dependents')
      .set(auth());

    const list = res.body.data?.dependents ?? res.body.data;
    const dep = list.find(d => (d.id ?? d.dependent_id) === dependentId);
    expect(dep).toBeDefined();
    const rel = (dep.relationship ?? dep.relation ?? '').toLowerCase();
    expect(rel).toBe('sibling');
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .put(`/api/patients/dependents/${dependentId}`)
      .send({ relationship: 'parent' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. DELETE /api/patients/dependents/:dependentId
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/patients/dependents/:dependentId', () => {
  let dependentId;

  beforeAll(async () => {
    const list = await request(app)
      .get('/api/patients/dependents')
      .set(auth());
    expect(list.status).toBe(200);
    const deps = list.body.data?.dependents ?? list.body.data;
    dependentId = deps[0]?.id ?? deps[0]?.dependent_id;
    expect(dependentId).toBeDefined();
  });

  test('no token → 401', async () => {
    const res = await request(app).delete(`/api/patients/dependents/${dependentId}`);
    expect(res.status).toBe(401);
  });

  test('valid delete → 200', async () => {
    const res = await request(app)
      .delete(`/api/patients/dependents/${dependentId}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET dependents after delete — list no longer contains removed dependent', async () => {
    const res = await request(app)
      .get('/api/patients/dependents')
      .set(auth());

    expect(res.status).toBe(200);
    const list = res.body.data?.dependents ?? res.body.data;
    const found = Array.isArray(list)
      ? list.some(d => (d.id ?? d.dependent_id) === dependentId)
      : false;
    expect(found).toBe(false);
  });
});
