/**
 * EntitlementChecker unit tests
 *
 * Covers the service-entitlement logic for each plan tier.
 * No database, no HTTP — pure business-logic unit test.
 *
 * Bug regression (P6 side-finding):
 *   PRESCRIPTION and DRUG_DISPENSING were both routed to checkDrugEntitlement,
 *   which checked entitlements.drugDispensing.allowed. On the GENERAL plan
 *   drugDispensing.allowed = false even though prescriptions.allowed = true,
 *   so POST /api/queue/request with serviceType='prescription' wrongly returned 403.
 *   Fixed by splitting into separate switch cases and adding checkPrescriptionEntitlement.
 */

let entitlementChecker;

beforeAll(async () => {
  const mod = await import('../../src/utils/entitlementChecker.js');
  entitlementChecker = mod.default;
});

// ── GENERAL plan ──────────────────────────────────────────────────────────────

describe('GENERAL plan entitlements', () => {
  test('consultation → entitled', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'consultation');
    expect(result.entitled).toBe(true);
  });

  test('prescription → entitled (bug regression: was incorrectly blocked)', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'prescription');
    expect(result.entitled).toBe(true);
    expect(result.reason).toMatch(/prescription/i);
  });

  test('drug_dispensing → NOT entitled (pharmacy access requires Basic+ plan)', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'drug_dispensing');
    expect(result.entitled).toBe(false);
    expect(result.reason).toMatch(/drug dispensing/i);
  });

  test('laboratory_test → entitled', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'laboratory_test');
    expect(result.entitled).toBe(true);
  });

  test('emergency → entitled', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'emergency');
    expect(result.entitled).toBe(true);
  });

  test('vaccination → entitled (available to all plans)', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'vaccination');
    expect(result.entitled).toBe(true);
  });

  test('minor_surgery → NOT entitled', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'minor_surgery');
    expect(result.entitled).toBe(false);
  });

  test('major_surgery → NOT entitled', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'major_surgery');
    expect(result.entitled).toBe(false);
  });

  test('specialist_consultation → NOT entitled', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'specialist_consultation');
    expect(result.entitled).toBe(false);
  });

  test('imaging → NOT entitled', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'imaging');
    expect(result.entitled).toBe(false);
  });

  test('admission → NOT entitled', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'admission');
    expect(result.entitled).toBe(false);
  });
});

// ── BASIC plan ────────────────────────────────────────────────────────────────

describe('BASIC plan entitlements', () => {
  test('consultation → entitled', () => {
    expect(entitlementChecker.isServiceEntitled('BASIC', 'consultation').entitled).toBe(true);
  });

  test('prescription → entitled', () => {
    const result = entitlementChecker.isServiceEntitled('BASIC', 'prescription');
    expect(result.entitled).toBe(true);
  });

  test('drug_dispensing → entitled (BASIC has pharmacy access)', () => {
    const result = entitlementChecker.isServiceEntitled('BASIC', 'drug_dispensing');
    expect(result.entitled).toBe(true);
  });

  test('admission → entitled', () => {
    expect(entitlementChecker.isServiceEntitled('BASIC', 'admission').entitled).toBe(true);
  });

  test('minor_surgery → NOT entitled', () => {
    expect(entitlementChecker.isServiceEntitled('BASIC', 'minor_surgery').entitled).toBe(false);
  });

  test('specialist_consultation → NOT entitled', () => {
    expect(entitlementChecker.isServiceEntitled('BASIC', 'specialist_consultation').entitled).toBe(false);
  });
});

// ── STANDARD plan ─────────────────────────────────────────────────────────────

describe('STANDARD plan entitlements', () => {
  test('specialist_consultation → entitled', () => {
    expect(entitlementChecker.isServiceEntitled('STANDARD', 'specialist_consultation').entitled).toBe(true);
  });

  test('minor_surgery → entitled', () => {
    expect(entitlementChecker.isServiceEntitled('STANDARD', 'minor_surgery').entitled).toBe(true);
  });

  test('prescription → entitled', () => {
    expect(entitlementChecker.isServiceEntitled('STANDARD', 'prescription').entitled).toBe(true);
  });

  test('major_surgery → NOT entitled (requires PREMIUM)', () => {
    expect(entitlementChecker.isServiceEntitled('STANDARD', 'major_surgery').entitled).toBe(false);
  });
});

// ── PREMIUM plan ──────────────────────────────────────────────────────────────

describe('PREMIUM plan entitlements', () => {
  test('major_surgery → entitled', () => {
    expect(entitlementChecker.isServiceEntitled('PREMIUM', 'major_surgery').entitled).toBe(true);
  });

  test('prescription → entitled', () => {
    expect(entitlementChecker.isServiceEntitled('PREMIUM', 'prescription').entitled).toBe(true);
  });

  test('drug_dispensing → entitled', () => {
    expect(entitlementChecker.isServiceEntitled('PREMIUM', 'drug_dispensing').entitled).toBe(true);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  test('unknown package type → not entitled with reason', () => {
    const result = entitlementChecker.isServiceEntitled('NONEXISTENT', 'consultation');
    expect(result.entitled).toBe(false);
    expect(result.reason).toBeDefined();
  });

  test('unknown service type → not entitled with reason', () => {
    const result = entitlementChecker.isServiceEntitled('GENERAL', 'unknown_service');
    expect(result.entitled).toBe(false);
    expect(result.reason).toMatch(/unknown service type/i);
  });
});
