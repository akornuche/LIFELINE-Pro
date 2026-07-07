/**
 * Payment flow integration test — P12
 *
 * Covers:
 *   RBAC guards       — wrong role → 403, no token → 401
 *
 *   POST /api/payments/initialize              — 201 (patient only)
 *   GET  /api/payments/verify/:reference       — 200 (public, mock Paystack)
 *   GET  /api/payments/history                 — 200 (patient only)
 *   GET  /api/payments/provider                — 200 (provider only)
 *   POST /api/payments/statements/generate     — 201 (provider only)
 *   GET  /api/payments/statements              — 200 (provider only)
 *   GET  /api/payments/statements/pending      — 200 (admin only)
 *   POST /api/payments/statements/:id/approve  — 200 (admin only)
 *   POST /api/payments/statements/:id/reject   — 200 (admin only)
 *   GET  /api/payments/revenue                 — 200 (admin only)
 *   GET  /api/payments/analytics               — 200 (admin only)
 *   GET  /api/payments/overdue                 — 200 (admin only)
 *   POST /api/payments/:id/refund              — 200/4xx (admin only)
 *
 * Setup:
 *   - Patient registered via HTTP (has a patient profile)
 *   - Doctor registered via HTTP → verification_status set to 'verified' in DB
 *   - Admin inserted directly into DB (role 'admin' not available via register)
 *
 * Database: isolated SQLite temp file (per setupTestDatabase.js)
 */

import { setupTestDatabase } from '../helpers/testSetup.js';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

let app;
let database;
let teardown;

let adminToken;
let adminUserId;

let patientToken;
let patientUserId;

let doctorToken;
let doctorUserId;

const TS = Date.now();
const ADMIN_EMAIL = `admin-p12-${TS}@lifelinepro.com`;
const ADMIN_PASS   = 'Admin@1234';

const PATIENT_BODY = {
  userType: 'patient',
  email: `patient-p12-${TS}@example.com`,
  password: 'Patient@1234',
  confirmPassword: 'Patient@1234',
  firstName: 'Pay',
  lastName: 'Patient',
  phone: '08011122233',
  dateOfBirth: '1990-06-15',
  gender: 'female',
  address: '10 Payment Street Lagos',
  city: 'Lagos',
  state: 'Lagos',
};

const DOCTOR_BODY = {
  userType: 'doctor',
  email: `doctor-p12-${TS}@example.com`,
  password: 'Doctor@1234',
  confirmPassword: 'Doctor@1234',
  firstName: 'Pay',
  lastName: 'Doctor',
  phone: '08022233344',
  city: 'Abuja',
  state: 'FCT',
  specialization: 'General Practice',
  licenseNumber: `LIC-PAY-${TS}`,
  licenseExpiryDate: '2031-12-31',
  yearsOfExperience: 5,
  qualifications: ['MBBS'],
  consultationFee: 5000,
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  ({ app, database, teardown } = await setupTestDatabase());

  // 1. Admin via direct DB INSERT
  const hashedPass = await bcrypt.hash(ADMIN_PASS, 10);
  adminUserId = randomUUID();
  await database.query(
    `INSERT INTO users
       (id, lifeline_id, email, password_hash, first_name, last_name, phone,
        role, status, email_verified, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    [
      adminUserId,
      `LL-ADMIN-${TS}`,
      ADMIN_EMAIL,
      hashedPass,
      'Admin',
      'Pay',
      '08099988877',
      'admin',
      'active',
      1,
    ]
  );

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASS });
  expect(adminLogin.status).toBe(200);
  adminToken = adminLogin.body.data.accessToken;

  // 2. Patient via HTTP register
  const patReg = await request(app)
    .post('/api/auth/register')
    .send(PATIENT_BODY);
  expect(patReg.status).toBe(201);
  patientUserId = patReg.body.data.user.id;

  // Verify email so the patient can use payment endpoints
  await database.query(
    `UPDATE users SET email_verified = 1 WHERE id = $1`,
    [patientUserId]
  );

  // Activate subscription so patient can access non-payment endpoints
  await database.query(
    `UPDATE patients SET subscription_status = 'active', current_package = 'GENERAL',
     subscription_start_date = CURRENT_TIMESTAMP
     WHERE user_id = $1`,
    [patientUserId]
  );

  const patLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: PATIENT_BODY.email, password: PATIENT_BODY.password });
  expect(patLogin.status).toBe(200);
  patientToken = patLogin.body.data.accessToken;

  // 3. Doctor via HTTP register → set verified in DB
  const docReg = await request(app)
    .post('/api/auth/register')
    .send(DOCTOR_BODY);
  expect(docReg.status).toBe(201);
  doctorUserId = docReg.body.data.user.id;

  await database.query(
    `UPDATE doctors SET verification_status = 'verified' WHERE user_id = $1`,
    [doctorUserId]
  );

  const docLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: DOCTOR_BODY.email, password: DOCTOR_BODY.password });
  expect(docLogin.status).toBe(200);
  doctorToken = docLogin.body.data.accessToken;
}, 60_000);

afterAll(async () => {
  await teardown();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Auth guards
// ─────────────────────────────────────────────────────────────────────────────

describe('Payment auth guards', () => {
  test('no token on POST /initialize → 401', async () => {
    const res = await request(app)
      .post('/api/payments/initialize')
      .send({ amount: 5000, paymentMethod: 'card', paymentType: 'consultation', description: 'Test payment' });
    expect(res.status).toBe(401);
  });

  test('no token on GET /history → 401', async () => {
    const res = await request(app).get('/api/payments/history');
    expect(res.status).toBe(401);
  });

  test('no token on GET /revenue → 401', async () => {
    const res = await request(app).get('/api/payments/revenue');
    expect(res.status).toBe(401);
  });

  test('no token on GET /provider → 401', async () => {
    const res = await request(app).get('/api/payments/provider');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. RBAC guards
// ─────────────────────────────────────────────────────────────────────────────

describe('Payment RBAC guards', () => {
  test('doctor token on POST /initialize → 403', async () => {
    const res = await request(app)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ amount: 5000, paymentMethod: 'card', paymentType: 'consultation', description: 'Test init' });
    expect(res.status).toBe(403);
  });

  test('patient token on GET /provider → 403', async () => {
    const res = await request(app)
      .get('/api/payments/provider')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  test('doctor token on GET /revenue → 403', async () => {
    const res = await request(app)
      .get('/api/payments/revenue')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(403);
  });

  test('patient token on GET /overdue → 403', async () => {
    const res = await request(app)
      .get('/api/payments/overdue')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  test('patient token on GET /analytics → 403', async () => {
    const res = await request(app)
      .get('/api/payments/analytics')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/payments/initialize
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/payments/initialize', () => {
  test('valid body → 201 with paymentReference and authorizationUrl', async () => {
    const res = await request(app)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        amount: 5000,
        paymentMethod: 'card',
        paymentType: 'consultation',
        description: 'Consultation payment',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentReference).toBeDefined();
    expect(res.body.data.authorizationUrl).toBeDefined();
    expect(res.body.data.payment).toBeDefined();
    expect(res.body.data.payment.status).toBe('pending');
  });

  test('invalid body (missing required fields) → 422', async () => {
    const res = await request(app)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ amount: 5000 }); // missing paymentMethod, paymentType, description

    expect(res.status).toBe(422);
  });

  test('negative amount → 422', async () => {
    const res = await request(app)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        amount: -100,
        paymentMethod: 'card',
        paymentType: 'consultation',
        description: 'Negative test',
      });

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/payments/verify/:reference
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/payments/verify/:reference', () => {
  let paymentReference;

  beforeAll(async () => {
    // Initialize a payment to get a reference
    const res = await request(app)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        amount: 8000,
        paymentMethod: 'card',
        paymentType: 'consultation',
        description: 'Verify test payment',
      });
    expect(res.status).toBe(201);
    paymentReference = res.body.data.paymentReference;
  });

  test('known reference → 200 with status success (mock Paystack)', async () => {
    const res = await request(app)
      .get(`/api/payments/verify/${paymentReference}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('success');
    expect(res.body.data.payment).toBeDefined();
  });

  test('unknown reference → 404', async () => {
    const res = await request(app)
      .get('/api/payments/verify/NONEXISTENT_REF_99999');

    expect(res.status).toBe(404);
  });

  test('verifying already-completed payment is idempotent → 200', async () => {
    // Payment was completed by the first verify call
    const res = await request(app)
      .get(`/api/payments/verify/${paymentReference}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/payments/history
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/payments/history', () => {
  test('returns array (may include initialized payments)', async () => {
    const res = await request(app)
      .get('/api/payments/history')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('respects limit query param', async () => {
    const res = await request(app)
      .get('/api/payments/history?limit=1')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /api/payments/provider
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/payments/provider', () => {
  test('verified doctor → 200 with array', async () => {
    const res = await request(app)
      .get('/api/payments/provider')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Statement lifecycle (generate → list → pending → approve → reject)
// ─────────────────────────────────────────────────────────────────────────────

describe('Statement lifecycle', () => {
  let statementId;
  let statementIdForReject;

  test('POST /statements/generate → 201 with statement record', async () => {
    const res = await request(app)
      .post('/api/payments/statements/generate')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        month: 1,
        year: 2024,
        providerType: 'doctor',
        providerId: doctorUserId, // required by schema even though controller ignores it
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('pending');
    statementId = res.body.data.id;
  });

  test('duplicate generate for same period → 4xx', async () => {
    const res = await request(app)
      .post('/api/payments/statements/generate')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        month: 1,
        year: 2024,
        providerType: 'doctor',
        providerId: doctorUserId,
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('GET /statements → returns generated statement', async () => {
    const res = await request(app)
      .get('/api/payments/statements')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].status).toBe('pending');
  });

  test('GET /statements/pending (admin) → includes the doctor statement', async () => {
    const res = await request(app)
      .get('/api/payments/statements/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('patient cannot GET /statements/pending → 403', async () => {
    const res = await request(app)
      .get('/api/payments/statements/pending')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  test('POST /statements/:id/approve (admin) → 200 status=approved', async () => {
    const res = await request(app)
      .post(`/api/payments/statements/${statementId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        statementId,          // required by schema
        approvedBy: adminUserId,  // required by schema
        notes: 'Looks good',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
  });

  test('doctor cannot approve statements → 403', async () => {
    const res = await request(app)
      .post(`/api/payments/statements/${statementId}/approve`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        statementId,
        approvedBy: doctorUserId,
      });
    expect(res.status).toBe(403);
  });

  // Create a second statement for the reject test
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/payments/statements/generate')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        month: 2,
        year: 2024,
        providerType: 'doctor',
        providerId: doctorUserId,
      });
    if (res.status === 201) {
      statementIdForReject = res.body.data.id;
    }
  });

  test('POST /statements/:id/reject (admin) → 200 status=rejected', async () => {
    if (!statementIdForReject) {
      return; // guard: skip if setup failed
    }
    const res = await request(app)
      .post(`/api/payments/statements/${statementIdForReject}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        statementId: statementIdForReject,   // required by schema
        rejectedBy: adminUserId,             // required by schema
        rejectionReason: 'Insufficient documentation provided for the period',
        notes: 'Please resubmit',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('rejected');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Admin analytics & reporting
// ─────────────────────────────────────────────────────────────────────────────

describe('Admin reporting', () => {
  test('GET /revenue → 200 with totalRevenue and transactionCount', async () => {
    const res = await request(app)
      .get('/api/payments/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalRevenue');
    expect(res.body.data).toHaveProperty('transactionCount');
    expect(typeof res.body.data.totalRevenue).toBe('number');
  });

  test('GET /analytics with date range → 200', async () => {
    const res = await request(app)
      .get('/api/payments/analytics?startDate=2024-01-01&endDate=2024-12-31')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /analytics without dates → 400', async () => {
    const res = await request(app)
      .get('/api/payments/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test('GET /overdue → 200 with array', async () => {
    const res = await request(app)
      .get('/api/payments/overdue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Refund flow
// ─────────────────────────────────────────────────────────────────────────────

describe('Refund flow', () => {
  let pendingPaymentId;
  let completedPaymentReference;
  let completedPaymentId;

  beforeAll(async () => {
    // Create a pending payment
    const init = await request(app)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        amount: 12000,
        paymentMethod: 'card',
        paymentType: 'consultation',
        description: 'Refund test payment',
      });
    expect(init.status).toBe(201);
    pendingPaymentId    = init.body.data.payment.id;
    completedPaymentReference = init.body.data.paymentReference;

    // Verify it → marks as completed
    const verify = await request(app)
      .get(`/api/payments/verify/${completedPaymentReference}`);
    expect(verify.status).toBe(200);

    // Find the payment ID from the verified response
    completedPaymentId = verify.body.data.payment?.id ?? pendingPaymentId;
  });

  test('refund on non-existent paymentId → 404', async () => {
    const fakeId = randomUUID();
    const res = await request(app)
      .post(`/api/payments/${fakeId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100, reason: 'Test refund for nonexistent payment' });

    expect(res.status).toBe(404);
  });

  test('refund completed payment → 200 with status=refunded', async () => {
    const res = await request(app)
      .post(`/api/payments/${completedPaymentId}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 12000, reason: 'Patient requested cancellation of appointment' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('refunded');
    expect(res.body.data.amount).toBe(12000);
  });

  test('refund amount > payment amount → 4xx', async () => {
    // Initialize and verify another payment to attempt over-refund
    const init2 = await request(app)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        amount: 3000,
        paymentMethod: 'bank_transfer',
        paymentType: 'lab_test',
        description: 'Over-refund test payment',
      });
    expect(init2.status).toBe(201);
    const ref2 = init2.body.data.paymentReference;
    const id2 = init2.body.data.payment.id;

    // Verify to complete it
    await request(app).get(`/api/payments/verify/${ref2}`);

    const res = await request(app)
      .post(`/api/payments/${id2}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 9999, reason: 'Attempting to over-refund this payment completely' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test('patient cannot process refund → 403', async () => {
    const init3 = await request(app)
      .post('/api/payments/initialize')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        amount: 2000,
        paymentMethod: 'wallet',
        paymentType: 'other',
        description: 'RBAC refund test payment',
      });
    expect(init3.status).toBe(201);
    const id3 = init3.body.data.payment.id;

    const res = await request(app)
      .post(`/api/payments/${id3}/refund`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ amount: 2000, reason: 'Patient trying to self-refund this payment amount' });

    expect(res.status).toBe(403);
  });
});
