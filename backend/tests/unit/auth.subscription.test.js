/**
 * Auth Middleware — Patient Subscription Enforcement Tests
 *
 * Covers:
 *  1. Active subscription   → allowed on any authenticated path
 *  2. Inactive subscription → 403 on a locked path
 *  3. Expired subscription  → 403 on a locked path (end_date in the past)
 *  4. No subscription row   → 403 on a locked path
 *  5. Inactive subscription → allowed on every allowlist path
 *  6. Non-patient role      → never blocked by subscription check (doctor shown)
 *
 * NOTE: auth.js calls responseFormatter.forbidden() with a 3rd arg
 * `{ code: 'SUBSCRIPTION_REQUIRED', redirectTo: '...' }`, but
 * responseFormatter.forbidden() only accepts (res, message) — the metadata
 * is silently dropped.  The tests assert the actual current response shape
 * (no `data` or `errors` fields), and flag this with comments where relevant.
 */

import { jest } from '@jest/globals';

// ── ESM mock setup (must precede all dynamic imports) ────────────────────────

const mockDbQuery = jest.fn();

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/database/connection.js', () => ({
  default: { query: mockDbQuery, transaction: jest.fn() },
}));

const mockExtractToken = jest.fn();
const mockVerifyToken = jest.fn();

jest.unstable_mockModule('../../src/utils/jwt.js', () => ({
  default: {
    extractTokenFromHeader: mockExtractToken,
    verifyAccessToken: mockVerifyToken,
  },
}));

// ── Module handle (populated after mocks are registered) ─────────────────────

let authenticate;

beforeAll(async () => {
  const mod = await import('../../src/middleware/auth.js');
  authenticate = mod.authenticate;
});

// ── Shared fixtures ───────────────────────────────────────────────────────────

const PATIENT_USER_ROW = {
  id: 'user-1',
  lifeline_id: 'LL-0001',
  email: 'patient@test.com',
  phone: null,
  role: 'patient',
  email_verified: 1,
  status: 'active',
};

const DOCTOR_USER_ROW = {
  id: 'user-2',
  lifeline_id: 'LL-0002',
  email: 'doctor@test.com',
  phone: null,
  role: 'doctor',
  email_verified: 1,
  status: 'active',
};

const ACTIVE_SUB = { subscription_status: 'active', subscription_end_date: null };

const INACTIVE_SUB = { subscription_status: 'inactive', subscription_end_date: null };

// subscription_status is 'active' but the date has already passed
const EXPIRED_SUB = {
  subscription_status: 'active',
  subscription_end_date: new Date(Date.now() - 86_400_000).toISOString(), // yesterday
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(url = '/api/queue/request') {
  return {
    headers: { authorization: 'Bearer fake-token' },
    originalUrl: url,
    method: 'GET',
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  mockDbQuery.mockReset();
  // Default: valid token → user-1
  mockExtractToken.mockReturnValue('fake-token');
  mockVerifyToken.mockReturnValue({ userId: 'user-1' });
});

// ── Subscription enforcement ──────────────────────────────────────────────────

describe('Patient subscription enforcement', () => {
  test('active subscription allows access to a locked path', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [PATIENT_USER_ROW] }) // user lookup
      .mockResolvedValueOnce({ rows: [ACTIVE_SUB] });      // subscription lookup

    const next = jest.fn();
    await authenticate(makeReq('/api/doctors/search'), makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('active subscription sets req.user.hasActiveSubscription = true', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [PATIENT_USER_ROW] })
      .mockResolvedValueOnce({ rows: [ACTIVE_SUB] });

    const req = makeReq('/api/doctors/search');
    await authenticate(req, makeRes(), jest.fn());

    expect(req.user.hasActiveSubscription).toBe(true);
  });

  test('inactive subscription returns 403 on a locked path', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [PATIENT_USER_ROW] })
      .mockResolvedValueOnce({ rows: [INACTIVE_SUB] });

    const res = makeRes();
    const next = jest.fn();
    await authenticate(makeReq('/api/doctors/search'), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('inactive subscription 403 body has success:false and errorCode:FORBIDDEN', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [PATIENT_USER_ROW] })
      .mockResolvedValueOnce({ rows: [INACTIVE_SUB] });

    const res = makeRes();
    await authenticate(makeReq('/api/queue/request'), res, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('FORBIDDEN');
    expect(body.message).toMatch(/subscription/i);
  });

  test('inactive subscription 403 body has no data field', async () => {
    // NOTE: auth.js passes { code: 'SUBSCRIPTION_REQUIRED', redirectTo: ... } as
    // a 3rd arg to responseFormatter.forbidden(), but forbidden() only accepts
    // (res, message) — the metadata is silently dropped, so `data` is absent.
    mockDbQuery
      .mockResolvedValueOnce({ rows: [PATIENT_USER_ROW] })
      .mockResolvedValueOnce({ rows: [INACTIVE_SUB] });

    const res = makeRes();
    await authenticate(makeReq('/api/queue/request'), res, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(body).not.toHaveProperty('data');
    expect(body).not.toHaveProperty('errors');
  });

  test('expired subscription (past end_date) returns 403 on locked path', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [PATIENT_USER_ROW] })
      .mockResolvedValueOnce({ rows: [EXPIRED_SUB] });

    const res = makeRes();
    const next = jest.fn();
    await authenticate(makeReq('/api/queue/request'), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('no subscription row returns 403 on locked path', async () => {
    mockDbQuery
      .mockResolvedValueOnce({ rows: [PATIENT_USER_ROW] })
      .mockResolvedValueOnce({ rows: [] }); // no subscription record

    const res = makeRes();
    const next = jest.fn();
    await authenticate(makeReq('/api/queue/request'), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── Allowlist paths bypass the subscription block ─────────────────────────────

describe('Subscription allowlist paths', () => {
  const ALLOWLIST = [
    '/api/patients/subscriptions',
    '/api/patients/profile',
    '/api/auth/me',
    '/api/auth/profile',
    '/api/auth/logout',
    '/api/payments/initialize',
    '/api/payments/verify',
    '/api/payments/webhook',
  ];

  test.each(ALLOWLIST)(
    'inactive patient is allowed through on %s',
    async (url) => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [PATIENT_USER_ROW] })
        .mockResolvedValueOnce({ rows: [INACTIVE_SUB] });

      const next = jest.fn();
      await authenticate(makeReq(url), makeRes(), next);

      expect(next).toHaveBeenCalledTimes(1);
    }
  );

  test.each(ALLOWLIST)(
    'expired patient is allowed through on %s',
    async (url) => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [PATIENT_USER_ROW] })
        .mockResolvedValueOnce({ rows: [EXPIRED_SUB] });

      const next = jest.fn();
      await authenticate(makeReq(url), makeRes(), next);

      expect(next).toHaveBeenCalledTimes(1);
    }
  );
});

// ── Non-patient roles skip subscription check entirely ────────────────────────

describe('Non-patient roles — no subscription gating', () => {
  test('doctor with no sub row is allowed on any path', async () => {
    mockVerifyToken.mockReturnValue({ userId: 'user-2' });
    mockDbQuery
      .mockResolvedValueOnce({ rows: [DOCTOR_USER_ROW] });
    // No second query — doctors skip subscription lookup

    const next = jest.fn();
    await authenticate(makeReq('/api/doctors/consultations'), makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockDbQuery).toHaveBeenCalledTimes(1); // only the user lookup
  });

  test('doctor req.user.hasActiveSubscription is true (default)', async () => {
    mockVerifyToken.mockReturnValue({ userId: 'user-2' });
    mockDbQuery.mockResolvedValueOnce({ rows: [DOCTOR_USER_ROW] });

    const req = makeReq('/api/doctors/profile');
    await authenticate(req, makeRes(), jest.fn());

    expect(req.user.hasActiveSubscription).toBe(true);
  });
});

// ── Auth failures unrelated to subscription ───────────────────────────────────

describe('Auth failure paths', () => {
  test('missing Authorization header returns 401', async () => {
    const req = { headers: {}, originalUrl: '/api/test', method: 'GET' };
    mockExtractToken.mockReturnValue(null);

    const res = makeRes();
    await authenticate(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body).not.toHaveProperty('data');
  });

  test('deactivated user account returns 403', async () => {
    mockDbQuery.mockResolvedValueOnce({
      rows: [{ ...PATIENT_USER_ROW, status: 'deactivated' }],
    });

    const res = makeRes();
    const next = jest.fn();
    await authenticate(makeReq('/api/patients/subscriptions'), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('user not found in DB returns 401', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [] });

    const res = makeRes();
    const next = jest.fn();
    await authenticate(makeReq('/api/auth/me'), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
