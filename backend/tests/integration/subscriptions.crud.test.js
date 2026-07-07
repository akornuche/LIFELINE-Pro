/**
 * Patient Subscriptions CRUD integration test — P8
 *
 * Covers:
 *   GET    /api/patients/subscriptions         — no subscription yet → null/empty
 *   POST   /api/patients/subscriptions         — create GENERAL, BASIC, PREMIUM
 *   GET    /api/patients/subscriptions         — returns created subscription
 *   GET    /api/patients/subscription-status   — hasActiveSubscription flag
 *   PUT    /api/patients/subscriptions         — upgrade plan (packageType change)
 *   PUT    /api/patients/subscriptions         — toggle autoRenew
 *   DELETE /api/patients/subscriptions         — cancel with valid reason
 *   GET    /api/patients/subscriptions (post-cancel) — status is cancelled
 *
 *   Auth guards — 401 on all endpoints without token
 *   Validation — 422 for missing required fields
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
  email: `sub-patient-${TS}@example.com`,
  password: 'Subs@12345',
  confirmPassword: 'Subs@12345',
  firstName: 'Sub',
  lastName: 'Patient',
  phone: '08099988877',
  dateOfBirth: '1990-04-10',
  gender: 'female',
  address: '7 Subscription Avenue Lagos Nigeria',
  city: 'Lagos',
  state: 'Lagos',
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  ({ app, teardown } = await setupTestDatabase());

  const reg = await request(app)
    .post('/api/auth/register')
    .send(PATIENT_BODY);
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
// Helper
// ─────────────────────────────────────────────────────────────────────────────

const GET  = () => request(app).get('/api/patients/subscriptions').set('Authorization', `Bearer ${token}`);
const POST = (body) => request(app).post('/api/patients/subscriptions').set('Authorization', `Bearer ${token}`).send(body);
const PUT  = (body) => request(app).put('/api/patients/subscriptions').set('Authorization', `Bearer ${token}`).send(body);
const DEL  = (body) => request(app).delete('/api/patients/subscriptions').set('Authorization', `Bearer ${token}`).send(body);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Initial state — no subscription yet
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/patients/subscriptions — initial state', () => {
  test('returns 200 with null or empty data when no subscription exists', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Data may be null or an object with no active package
    const sub = res.body.data?.subscription ?? res.body.data;
    const isAbsent = sub === null || sub === undefined || sub?.subscription_status !== 'active';
    expect(isAbsent).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST — create subscription
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/patients/subscriptions — create', () => {
  test('GENERAL plan → 201 with active subscription', async () => {
    const res = await POST({ packageType: 'general', billingCycle: 'monthly' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const sub = res.body.data;
    expect(sub).toBeDefined();
    const pkg = (sub.packageType ?? sub.package_type ?? sub.current_package ?? '').toUpperCase();
    expect(pkg).toBe('GENERAL');
    const status = sub.subscriptionStatus ?? sub.subscription_status ?? sub.status;
    expect(status).toBe('active');
  });

  test('creating again (upsert) → 201 or 200 with BASIC plan', async () => {
    const res = await POST({ packageType: 'basic' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  test('missing packageType → 422 validation error', async () => {
    const res = await POST({ billingCycle: 'monthly' });
    expect(res.status).toBe(422);
  });

  test('invalid packageType → 422 validation error', async () => {
    const res = await POST({ packageType: 'platinum' });
    expect(res.status).toBe(422);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .post('/api/patients/subscriptions')
      .send({ packageType: 'general' });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET — after creation
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/patients/subscriptions — after creation', () => {
  beforeAll(async () => {
    // Ensure a known active subscription exists
    const res = await POST({ packageType: 'general' });
    expect([200, 201]).toContain(res.status);
  });

  test('returns 200 with subscription data', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const sub = res.body.data?.subscription ?? res.body.data;
    expect(sub).not.toBeNull();
  });

  test('subscription has expected fields', async () => {
    const res = await GET();
    const sub = res.body.data?.subscription ?? res.body.data;
    expect(sub).toBeDefined();
    // Accept either camelCase or snake_case field names
    const pkg = sub.packageType ?? sub.package_type ?? sub.current_package;
    const status = sub.subscriptionStatus ?? sub.subscription_status ?? sub.status;
    expect(pkg).toBeDefined();
    expect(status).toBeDefined();
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/patients/subscriptions');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/patients/subscription-status
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/patients/subscription-status', () => {
  test('returns 200 with hasActiveSubscription: true after creating one', async () => {
    const res = await request(app)
      .get('/api/patients/subscription-status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.hasActiveSubscription).toBe(true);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/patients/subscription-status');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PUT — upgrade / update subscription
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/patients/subscriptions — update', () => {
  test('upgrade packageType to PREMIUM → 200', async () => {
    const res = await PUT({ packageType: 'premium' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const sub = res.body.data;
    const pkg = (sub.packageType ?? sub.package_type ?? sub.current_package ?? '').toUpperCase();
    expect(pkg).toBe('PREMIUM');
  });

  test('GET reflects upgraded plan', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const sub = res.body.data?.subscription ?? res.body.data;
    const pkg = (sub.packageType ?? sub.package_type ?? sub.current_package ?? '').toUpperCase();
    expect(pkg).toBe('PREMIUM');
  });

  test('toggle autoRenew to false → 200', async () => {
    const res = await PUT({ autoRenew: false });
    expect(res.status).toBe(200);
    const sub = res.body.data;
    const autoRenew = sub.autoRenew ?? sub.auto_renew;
    // SQLite stores booleans as 0/1 integers; accept falsy
    expect(autoRenew == false).toBe(true);
  });

  test('empty body (no fields) → 422', async () => {
    const res = await PUT({});
    expect(res.status).toBe(422);
  });

  test('invalid packageType → 422', async () => {
    const res = await PUT({ packageType: 'diamond' });
    expect(res.status).toBe(422);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .put('/api/patients/subscriptions')
      .send({ autoRenew: true });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. DELETE — cancel subscription
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/patients/subscriptions — cancel', () => {
  test('missing reason → 422 validation error', async () => {
    const res = await DEL({ cancelImmediately: true });
    expect(res.status).toBe(422);
  });

  test('invalid reason value → 422 validation error', async () => {
    const res = await DEL({ reason: 'changed_mind', cancelImmediately: true });
    expect(res.status).toBe(422);
  });

  test('valid reason → 200 cancels subscription', async () => {
    const res = await DEL({ reason: 'not_using', cancelImmediately: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET after cancel reflects cancelled status', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const sub = res.body.data?.subscription ?? res.body.data;
    if (sub) {
      const status = (sub.subscriptionStatus ?? sub.subscription_status ?? sub.status ?? '').toLowerCase();
      expect(status).toBe('cancelled');
    }
    // null is also acceptable — some implementations clear the row
  });

  test('subscription-status returns hasActiveSubscription: false after cancel', async () => {
    const res = await request(app)
      .get('/api/patients/subscription-status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.hasActiveSubscription).toBe(false);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .delete('/api/patients/subscriptions')
      .send({ reason: 'not_using', cancelImmediately: true });
    expect(res.status).toBe(401);
  });
});
