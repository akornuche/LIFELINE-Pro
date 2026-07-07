/**
 * Auth flow integration test — P1
 *
 * Tests the full happy path through real HTTP, real database:
 *   POST /api/auth/register    → 201  (patient created)
 *   POST /api/auth/login       → 200  (access token issued)
 *   GET  /api/patients/profile → 200  (profile returned with correct data)
 *
 * Database: SQLite :memory: (per-file isolated, see tests/helpers/testSetup.js)
 * Tier: Tier-A — validates routing, auth, and registration logic.
 *        Does NOT validate PG-specific type behaviour (run test:postgres for that).
 */

import { setupTestDatabase } from '../helpers/testSetup.js';
import request from 'supertest';

let app;
let teardown;
let accessToken;

const TEST_EMAIL = `patient-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Integration@1234';

const PATIENT_BODY = {
  userType: 'patient',
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  confirmPassword: TEST_PASSWORD,
  firstName: 'Integration',
  lastName: 'Tester',
  phone: '08012345678',
  dateOfBirth: '1990-06-15',
  gender: 'male',
  address: '12 Integration Close Lagos Nigeria',
  city: 'Lagos',
  state: 'Lagos',
};

beforeAll(async () => {
  ({ app, teardown } = await setupTestDatabase());
}, 30_000);

afterAll(() => teardown());

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register (patient)', () => {
  test('returns 201 and an access token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(PATIENT_BODY)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.accessToken.length).toBeGreaterThan(20);
  });

  test('duplicate registration returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(PATIENT_BODY);

    // Email already registered — business logic rejects it
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('valid credentials return 200 and an access token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.accessToken).toBe('string');

    // Store token for subsequent tests
    accessToken = res.body.data.accessToken;
  });

  test('wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPass@99' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('unknown email returns 401 or 422', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: TEST_PASSWORD });

    // Unknown user → auth failure (401) or schema reject (422 if schema
    // validates known-user existence). Either is an expected rejection.
    expect([401, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/patients/profile', () => {
  test('valid token returns 200 with correct profile data', async () => {
    const res = await request(app)
      .get('/api/patients/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    // Round-trip check: the profile reflects what was registered
    const profile = res.body.data;
    // email is stored lowercased; first/last name may be on nested user object
    const userEmail =
      profile.email ?? profile.user?.email ?? profile.userEmail;
    expect(userEmail?.toLowerCase()).toBe(TEST_EMAIL.toLowerCase());
  });

  test('missing token returns 401', async () => {
    const res = await request(app).get('/api/patients/profile');
    expect(res.status).toBe(401);
  });

  test('malformed token returns 401', async () => {
    const res = await request(app)
      .get('/api/patients/profile')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
