/**
 * Admin routes integration test — P11
 *
 * Covers:
 *   RBAC guards       — patient/doctor tokens → 403 on all admin routes
 *   Auth guards       — no token → 401
 *
 *   GET  /api/admin/statistics                         — 200 with dashboard data
 *   GET  /api/admin/users                              — 200 with paginated user list
 *   GET  /api/admin/users/:id                          — 200 with user details
 *   PUT  /api/admin/users/:id                          — 200 updates status field
 *   POST /api/admin/users/:id/deactivate               — 200 sets status=inactive
 *   POST /api/admin/users/:id/activate                 — 200 sets status=active
 *   GET  /api/admin/patients                           — 200 with patient list
 *   GET  /api/admin/doctors                            — 200 with doctor list
 *   GET  /api/admin/verifications                      — 200 with pending list
 *   POST /api/admin/verifications/:id/verify           — 200 verifies doctor
 *   POST /api/admin/verifications/:id/reject           — 200 rejects pharmacy
 *   GET  /api/admin/settings                           — 200 with settings
 *   PUT  /api/admin/settings                           — 200 saves updated field
 *
 * Setup:
 *   - Admin user inserted directly into DB (no public register endpoint for admin)
 *   - Patient and Doctor registered via HTTP for RBAC tests + list population
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
let doctorDbId; // doctors.id

const TS = Date.now();
const ADMIN_EMAIL = `admin-p11-${TS}@lifelinepro.com`;
const ADMIN_PASS = 'Admin@1234';

const PATIENT_BODY = {
  userType: 'patient',
  email: `patient-p11-${TS}@example.com`,
  password: 'Patient@1234',
  confirmPassword: 'Patient@1234',
  firstName: 'Pat',
  lastName: 'AdminTest',
  phone: '08044433322',
  dateOfBirth: '1992-05-20',
  gender: 'male',
  address: '15 Admin Test Street Lagos',
  city: 'Lagos',
  state: 'Lagos',
};

const DOCTOR_BODY = {
  userType: 'doctor',
  email: `doctor-p11-${TS}@example.com`,
  password: 'Doctor@1234',
  confirmPassword: 'Doctor@1234',
  firstName: 'Doc',
  lastName: 'AdminTest',
  phone: '08055544411',
  city: 'Abuja',
  state: 'FCT',
  specialization: 'Cardiology',
  licenseNumber: `LIC-ADM-${TS}`,
  licenseExpiryDate: '2031-01-01',
  yearsOfExperience: 10,
  qualifications: ['MBBS'],
  consultationFee: 8000,
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  ({ app, database, teardown } = await setupTestDatabase());

  // ── 1. Create admin user directly via DB (no public endpoint) ──────────────
  const hashedPass = await bcrypt.hash(ADMIN_PASS, 10);
  adminUserId = randomUUID();

  await database.query(
    `INSERT INTO users
       (id, lifeline_id, email, password_hash, first_name, last_name, phone,
        role, status, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      adminUserId,
      `LLPRO-ADM-${TS}`,
      ADMIN_EMAIL,
      hashedPass,
      'System',
      'Admin',
      '+2348000000001',
      'admin',
      'active',
      1,
    ]
  );

  // Login as admin
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASS });
  if (adminLogin.status !== 200) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.body)}`);
  }
  adminToken = adminLogin.body.data.accessToken;

  // ── 2. Register patient ────────────────────────────────────────────────────
  const patReg = await request(app).post('/api/auth/register').send(PATIENT_BODY);
  if (patReg.status !== 201) {
    throw new Error(`Patient register failed: ${JSON.stringify(patReg.body)}`);
  }
  patientToken = patReg.body.data.accessToken;

  const patRow = await database.query('SELECT id FROM users WHERE email = $1', [PATIENT_BODY.email]);
  patientUserId = patRow.rows[0].id;

  // ── 3. Register doctor (stays pending — perfect for verify/reject tests) ───
  const docReg = await request(app).post('/api/auth/register').send(DOCTOR_BODY);
  if (docReg.status !== 201) {
    throw new Error(`Doctor register failed: ${JSON.stringify(docReg.body)}`);
  }
  doctorToken = docReg.body.data.accessToken;

  const docUserRow = await database.query('SELECT id FROM users WHERE email = $1', [DOCTOR_BODY.email]);
  doctorUserId = docUserRow.rows[0].id;

  const docRow = await database.query('SELECT id FROM doctors WHERE user_id = $1', [doctorUserId]);
  doctorDbId = docRow.rows[0].id;
}, 30_000);

afterAll(() => teardown());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const adminAuth = () => ({ Authorization: `Bearer ${adminToken}` });
const patAuth   = () => ({ Authorization: `Bearer ${patientToken}` });
const docAuth   = () => ({ Authorization: `Bearer ${doctorToken}` });

// ─────────────────────────────────────────────────────────────────────────────
// 1. RBAC — non-admin tokens → 403
// ─────────────────────────────────────────────────────────────────────────────

describe('RBAC — non-admin cannot access admin routes', () => {
  test('patient token → GET /api/admin/statistics → 403', async () => {
    const res = await request(app).get('/api/admin/statistics').set(patAuth());
    expect(res.status).toBe(403);
  });

  test('doctor token → GET /api/admin/users → 403', async () => {
    const res = await request(app).get('/api/admin/users').set(docAuth());
    expect(res.status).toBe(403);
  });

  test('patient token → GET /api/admin/doctors → 403', async () => {
    const res = await request(app).get('/api/admin/doctors').set(patAuth());
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Auth guards — no token → 401
// ─────────────────────────────────────────────────────────────────────────────

describe('Auth guards — unauthenticated requests', () => {
  test('GET /api/admin/statistics without token → 401', async () => {
    const res = await request(app).get('/api/admin/statistics');
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/users without token → 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  test('PUT /api/admin/settings without token → 401', async () => {
    const res = await request(app).put('/api/admin/settings').send({ platform_name: 'x' });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/admin/statistics
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/statistics', () => {
  test('admin token → 200 with dashboard stats', async () => {
    const res = await request(app).get('/api/admin/statistics').set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('response contains totalUsers, totalPatients, totalProviders', async () => {
    const res = await request(app).get('/api/admin/statistics').set(adminAuth());
    const d = res.body.data;
    expect(d.totalUsers).toBeGreaterThanOrEqual(1);
    expect(d.totalPatients).toBeGreaterThanOrEqual(1);
    expect(d).toHaveProperty('totalProviders');
    expect(d).toHaveProperty('pendingVerifications');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/admin/users
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  test('admin token → 200 with paginated list', async () => {
    const res = await request(app).get('/api/admin/users').set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
  });

  test('filter by role=patient returns patients only', async () => {
    const res = await request(app).get('/api/admin/users?role=patient').set(adminAuth());
    expect(res.status).toBe(200);
    const users = res.body.data.users;
    expect(users.length).toBeGreaterThanOrEqual(1);
    users.forEach((u) => expect(u.role).toBe('patient'));
  });

  test('filter by role=doctor returns doctors only', async () => {
    const res = await request(app).get('/api/admin/users?role=doctor').set(adminAuth());
    expect(res.status).toBe(200);
    const users = res.body.data.users;
    expect(users.length).toBeGreaterThanOrEqual(1);
    users.forEach((u) => expect(u.role).toBe('doctor'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/users/:id', () => {
  test('valid patient ID → 200 with user + profile', async () => {
    const res = await request(app)
      .get(`/api/admin/users/${patientUserId}`)
      .set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(patientUserId);
    expect(res.body.data.role).toBe('patient');
  });

  test('non-existent ID → 404', async () => {
    const res = await request(app)
      .get('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .set(adminAuth());
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PUT /api/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/admin/users/:id', () => {
  test('update email_verified → 200', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${patientUserId}`)
      .set(adminAuth())
      .send({ email_verified: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('no fields to update → 400', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${patientUserId}`)
      .set(adminAuth())
      .send({});
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. POST /api/admin/users/:id/deactivate + activate
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/admin/users/:id/deactivate + activate', () => {
  test('deactivate → 200, status=inactive', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${patientUserId}/deactivate`)
      .set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('inactive');
  });

  test('activate → 200, status=active', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${patientUserId}/activate`)
      .set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET /api/admin/patients
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/patients', () => {
  test('admin token → 200 with patient list', async () => {
    const res = await request(app).get('/api/admin/patients').set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.patients)).toBe(true);
    expect(res.body.data.patients.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. GET /api/admin/doctors
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/doctors', () => {
  test('admin token → 200 with doctor list', async () => {
    const res = await request(app).get('/api/admin/doctors').set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.doctors)).toBe(true);
    expect(res.body.data.doctors.length).toBeGreaterThanOrEqual(1);
  });

  test('filter verified=false returns pending doctors', async () => {
    const res = await request(app).get('/api/admin/doctors?verified=false').set(adminAuth());
    expect(res.status).toBe(200);
    // Our registered doctor has verification_status = 'pending'
    const doctors = res.body.data.doctors;
    expect(doctors.length).toBeGreaterThanOrEqual(1);
    doctors.forEach((d) => expect(d.verification_status).not.toBe('verified'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. GET /api/admin/verifications
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/verifications', () => {
  test('admin token → 200 with pending list including our doctor', async () => {
    const res = await request(app).get('/api/admin/verifications').set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Our doctor is pending — should appear in the list
    const found = res.body.data.some((v) => v.id === doctorDbId);
    expect(found).toBe(true);
  });

  test('filter by provider_type=doctor → only doctors', async () => {
    const res = await request(app)
      .get('/api/admin/verifications?provider_type=doctor')
      .set(adminAuth());
    expect(res.status).toBe(200);
    res.body.data.forEach((v) => expect(v.provider_type).toBe('doctor'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. POST /api/admin/verifications/:id/verify
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/admin/verifications/:id/verify', () => {
  test('missing providerType → 400', async () => {
    const res = await request(app)
      .post(`/api/admin/verifications/${doctorDbId}/verify`)
      .set(adminAuth())
      .send({});
    expect(res.status).toBe(400);
  });

  test('verify doctor → 200, verification_status=verified', async () => {
    const res = await request(app)
      .post(`/api/admin/verifications/${doctorDbId}/verify`)
      .set(adminAuth())
      .send({ providerType: 'doctor' });
    expect(res.status).toBe(200);
    expect(res.body.data.verification_status).toBe('verified');
  });

  test('doctor no longer in pending list after verify', async () => {
    const res = await request(app).get('/api/admin/verifications').set(adminAuth());
    const found = res.body.data.some((v) => v.id === doctorDbId);
    expect(found).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. POST /api/admin/verifications/:id/reject — register second doctor
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/admin/verifications/:id/reject', () => {
  let rejectDoctorDbId;

  beforeAll(async () => {
    // Register a second doctor to reject
    const body = {
      ...DOCTOR_BODY,
      email: `doctor-reject-${TS}@example.com`,
      phone: '08066655544',
      licenseNumber: `LIC-REJ-${TS}`,
    };
    const reg = await request(app).post('/api/auth/register').send(body);
    if (reg.status !== 201) throw new Error(`Second doctor register failed: ${JSON.stringify(reg.body)}`);

    const userRow = await database.query('SELECT id FROM users WHERE email = $1', [body.email]);
    const uid = userRow.rows[0].id;
    const docRow = await database.query('SELECT id FROM doctors WHERE user_id = $1', [uid]);
    rejectDoctorDbId = docRow.rows[0].id;
  });

  test('missing providerType → 400', async () => {
    const res = await request(app)
      .post(`/api/admin/verifications/${rejectDoctorDbId}/reject`)
      .set(adminAuth())
      .send({ reason: 'Insufficient docs' });
    expect(res.status).toBe(400);
  });

  test('reject doctor → 200, verification_status=rejected', async () => {
    const res = await request(app)
      .post(`/api/admin/verifications/${rejectDoctorDbId}/reject`)
      .set(adminAuth())
      .send({ providerType: 'doctor', reason: 'Insufficient documents provided' });
    expect(res.status).toBe(200);
    expect(res.body.data.verification_status).toBe('rejected');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. GET /api/admin/settings + PUT /api/admin/settings
// ─────────────────────────────────────────────────────────────────────────────

describe('GET + PUT /api/admin/settings', () => {
  test('GET settings → 200 with platform_name', async () => {
    const res = await request(app).get('/api/admin/settings').set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('platform_name');
  });

  test('PUT settings → 200, updated field returned', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set(adminAuth())
      .send({ platform_name: 'LIFELINE Pro Test' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.platform_name).toBe('LIFELINE Pro Test');
  });

  test('GET after PUT reflects new platform_name', async () => {
    const res = await request(app).get('/api/admin/settings').set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.platform_name).toBe('LIFELINE Pro Test');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. GET /api/admin/analytics/time-series
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/analytics/time-series', () => {
  test('admin token → 200 with labels array', async () => {
    const res = await request(app)
      .get('/api/admin/analytics/time-series')
      .set(adminAuth());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.labels)).toBe(true);
    expect(res.body.data.labels.length).toBeGreaterThan(0);
  });
});
