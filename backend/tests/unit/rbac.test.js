/**
 * RBAC Middleware — Negative Path Tests
 *
 * Covers:
 *  1. checkRole / requireRole — wrong role returns 403 with no data leakage
 *  2. isAdmin — all non-admin roles are blocked
 *  3. isProvider — patient / admin cannot use provider routes
 *  4. No req.user — returns 401 (not 403, not 500)
 *  5. Response body shape — forbidden responses never include a `data` field
 */

import { jest } from '@jest/globals';

// ── ESM mock setup (must precede any dynamic import) ─────────────────────────

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/database/connection.js', () => ({
  default: {
    query: jest.fn(),
    transaction: jest.fn(),
  },
}));

// ── Module handles (populated in beforeAll) ───────────────────────────────────

let requireRole,
  checkRole,
  isAdmin,
  isDoctor,
  isPharmacy,
  isPatient,
  isHospital,
  isProvider,
  isAdminOrProvider;

beforeAll(async () => {
  const mod = await import('../../src/middleware/rbac.js');
  requireRole = mod.requireRole;
  checkRole = mod.checkRole;
  isAdmin = mod.isAdmin;
  isDoctor = mod.isDoctor;
  isPharmacy = mod.isPharmacy;
  isPatient = mod.isPatient;
  isHospital = mod.isHospital;
  isProvider = mod.isProvider;
  isAdminOrProvider = mod.isAdminOrProvider;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(role) {
  return {
    user: role ? { id: 'user-1', role, email: 'hidden@example.com' } : undefined,
    path: '/api/test',
    originalUrl: '/api/test',
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── checkRole / requireRole ───────────────────────────────────────────────────

describe('checkRole (alias: requireRole)', () => {
  test('calls next() when the user role matches', () => {
    const next = jest.fn();
    checkRole('doctor')(makeReq('doctor'), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('does NOT call next() when role is wrong', () => {
    const next = jest.fn();
    checkRole('doctor')(makeReq('pharmacy'), makeRes(), next);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns HTTP 403 when role does not match', () => {
    const res = makeRes();
    checkRole('doctor')(makeReq('pharmacy'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('403 response body has success:false and errorCode:FORBIDDEN', () => {
    const res = makeRes();
    checkRole('doctor')(makeReq('pharmacy'), res, jest.fn());
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('FORBIDDEN');
  });

  test('403 response body does NOT contain a data field (no data leak)', () => {
    const res = makeRes();
    checkRole('doctor')(makeReq('pharmacy'), res, jest.fn());
    const body = res.json.mock.calls[0][0];
    expect(body).not.toHaveProperty('data');
  });

  test('403 response body does NOT contain user fields (email, userId, role)', () => {
    const res = makeRes();
    checkRole('doctor')(makeReq('pharmacy'), res, jest.fn());
    const body = res.json.mock.calls[0][0];
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('userId');
    expect(body).not.toHaveProperty('role');
  });

  test('returns HTTP 401 when req.user is absent (unauthenticated)', () => {
    const res = makeRes();
    checkRole('doctor')(makeReq(null), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('401 body has no data field', () => {
    const res = makeRes();
    checkRole('doctor')(makeReq(null), res, jest.fn());
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body).not.toHaveProperty('data');
  });

  test('allows access when one of multiple allowed roles matches', () => {
    const next = jest.fn();
    requireRole('doctor', 'pharmacy')(makeReq('pharmacy'), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── isAdmin ───────────────────────────────────────────────────────────────────

describe('isAdmin — admin endpoint protection', () => {
  const NON_ADMIN_ROLES = ['patient', 'doctor', 'pharmacy', 'hospital'];

  test.each(NON_ADMIN_ROLES)(
    '%s user is blocked from admin routes (403)',
    (role) => {
      const res = makeRes();
      const next = jest.fn();
      isAdmin(makeReq(role), res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    }
  );

  test.each(NON_ADMIN_ROLES)(
    '%s user 403 body has no data field',
    (role) => {
      const res = makeRes();
      isAdmin(makeReq(role), res, jest.fn());
      const body = res.json.mock.calls[0][0];
      expect(body).not.toHaveProperty('data');
      expect(body.success).toBe(false);
    }
  );

  test('admin user passes isAdmin guard', () => {
    const next = jest.fn();
    isAdmin(makeReq('admin'), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── isDoctor ──────────────────────────────────────────────────────────────────

describe('isDoctor', () => {
  test('pharmacy user is blocked from doctor routes (403)', () => {
    const res = makeRes();
    isDoctor(makeReq('pharmacy'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('hospital user is blocked from doctor routes (403)', () => {
    const res = makeRes();
    isDoctor(makeReq('hospital'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('patient user is blocked from doctor routes (403)', () => {
    const res = makeRes();
    isDoctor(makeReq('patient'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('doctor user passes isDoctor', () => {
    const next = jest.fn();
    isDoctor(makeReq('doctor'), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── isProvider ────────────────────────────────────────────────────────────────

describe('isProvider', () => {
  const PROVIDER_ROLES = ['doctor', 'pharmacy', 'hospital'];

  test.each(PROVIDER_ROLES)('%s passes isProvider', (role) => {
    const next = jest.fn();
    isProvider(makeReq(role), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('patient is blocked from provider routes (403)', () => {
    const res = makeRes();
    const next = jest.fn();
    isProvider(makeReq('patient'), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('admin is blocked from provider routes (403)', () => {
    const res = makeRes();
    const next = jest.fn();
    isProvider(makeReq('admin'), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── isPatient ─────────────────────────────────────────────────────────────────

describe('isPatient', () => {
  const NON_PATIENT_ROLES = ['doctor', 'pharmacy', 'hospital', 'admin'];

  test.each(NON_PATIENT_ROLES)('%s is blocked from patient routes (403)', (role) => {
    const res = makeRes();
    const next = jest.fn();
    isPatient(makeReq(role), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('patient passes isPatient', () => {
    const next = jest.fn();
    isPatient(makeReq('patient'), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
