/**
 * Auth session integration test — P7
 *
 * Covers the stateful token lifecycle through real HTTP + DB:
 *
 *   Token refresh
 *     POST /api/auth/refresh  valid refreshToken   → 200 + new accessToken
 *     POST /api/auth/refresh  invalid token string → 401
 *     POST /api/auth/refresh  missing body field   → 422 (Joi validation)
 *
 *   Logout + blacklisting
 *     POST /api/auth/logout   → 200
 *     blacklisted accessToken  on GET /api/auth/me → 401
 *     blacklisted refreshToken on POST /api/auth/refresh → 401
 *
 *   GET /api/auth/me
 *     valid token  → 200 + user object with id/email/role
 *     no token     → 401
 *
 *   PUT /api/auth/profile
 *     valid update → 200 + updated fields reflected
 *     empty body   → 422 (min-1-field Joi rule)
 *
 *   POST /api/auth/change-password
 *     correct currentPassword → 200
 *     wrong currentPassword   → 401 / 400
 *     mismatched confirmPassword → 422
 *
 * Database: isolated SQLite temp file (per-file, see testSetup.js)
 * Blacklist: in-memory Set inside jwt.js singleton — shared within this
 *   process/module registry, so logout effects are visible to subsequent
 *   supertest requests in the same file.
 */

import { setupTestDatabase } from '../helpers/testSetup.js';
import request from 'supertest';

let app;
let teardown;

let accessToken;
let refreshToken;

const TS = Date.now();

const PATIENT_BODY = {
  userType: 'patient',
  email: `session-patient-${TS}@example.com`,
  password: 'Session@1234',
  confirmPassword: 'Session@1234',
  firstName: 'Session',
  lastName: 'Tester',
  phone: '08044455566',
  dateOfBirth: '1993-09-25',
  gender: 'male',
  address: '3 Session Road Lagos Nigeria',
  city: 'Lagos',
  state: 'Lagos',
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  ({ app, teardown } = await setupTestDatabase());

  // Register
  const reg = await request(app)
    .post('/api/auth/register')
    .send(PATIENT_BODY);
  expect(reg.status).toBe(201);

  // Login to obtain both tokens
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: PATIENT_BODY.email, password: PATIENT_BODY.password });
  expect(login.status).toBe(200);

  accessToken  = login.body.data.accessToken;
  refreshToken = login.body.data.refreshToken;

  expect(accessToken).toBeDefined();
  expect(refreshToken).toBeDefined();
}, 30_000);

afterAll(() => teardown());

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  test('valid token → 200 with user object', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(PATIENT_BODY.email);
    expect(res.body.data.user.role).toBe('patient');
    expect(res.body.data.user.id).toBeDefined();
    // Passwords must never be returned
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('malformed Bearer token → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  test('valid refreshToken → 200 with new accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.accessToken.split('.').length).toBe(3); // valid JWT structure
  });

  test('new accessToken from refresh works on authenticated routes', async () => {
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    const newToken = refreshRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(PATIENT_BODY.email);
  });

  test('invalid refreshToken string → 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'not.a.valid.jwt.string' });

    expect(res.status).toBe(401);
  });

  test('missing refreshToken field → 422 validation error', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PUT /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/auth/profile', () => {
  test('valid update → 200 with updated fields reflected', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Updated', lastName: 'Name' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // GET /me should now return the updated name
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.body.data.user.first_name ?? me.body.data.user.firstName).toMatch(/updated/i);
  });

  test('empty body (no fields) → 422', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .send({ firstName: 'Ghost' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/change-password', () => {
  const NEW_PASSWORD = 'NewSession@5678';

  test('correct currentPassword → 200', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: PATIENT_BODY.password,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('old password no longer works after change', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: PATIENT_BODY.email, password: PATIENT_BODY.password });

    expect(res.status).toBe(401);
  });

  test('new password works for login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: PATIENT_BODY.email, password: NEW_PASSWORD });

    expect(res.status).toBe(200);
    // Update token for remaining tests
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test('wrong currentPassword → 4xx', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'WrongPassword@999',
        newPassword: 'AnotherNew@1234',
        confirmPassword: 'AnotherNew@1234',
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('confirmPassword mismatch → 422 validation error', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: NEW_PASSWORD,
        newPassword: 'Match@1234',
        confirmPassword: 'Different@1234',
      });

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /api/auth/logout + blacklist enforcement
//    (run last — invalidates the tokens for the rest of the session)
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout — token blacklisting', () => {
  let tokenToBlacklist;
  let refreshToBlacklist;

  beforeAll(async () => {
    // Login fresh so we have known tokens to blacklist
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: PATIENT_BODY.email, password: 'NewSession@5678' });

    expect(login.status).toBe(200);
    tokenToBlacklist   = login.body.data.accessToken;
    refreshToBlacklist = login.body.data.refreshToken;
  });

  test('logout with valid Bearer + refreshToken → 200', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenToBlacklist}`)
      .send({ refreshToken: refreshToBlacklist });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('blacklisted accessToken on GET /api/auth/me → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenToBlacklist}`);

    expect(res.status).toBe(401);
  });

  test('blacklisted refreshToken on POST /api/auth/refresh → 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshToBlacklist });

    expect(res.status).toBe(401);
  });

  test('logout without refreshToken body still succeeds (graceful)', async () => {
    // Log in again to get a fresh access token
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: PATIENT_BODY.email, password: 'NewSession@5678' });
    expect(login.status).toBe(200);
    const freshToken = login.body.data.accessToken;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${freshToken}`)
      .send({}); // no refreshToken in body

    expect(res.status).toBe(200);
  });
});
