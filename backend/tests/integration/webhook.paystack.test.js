/**
 * Paystack webhook integration tests — P2
 *
 * Three scenarios:
 *   1. Valid HMAC-SHA512 signature  → 200 (webhook processed or skipped as unknown event)
 *   2. Tampered / wrong signature   → 401 Invalid signature
 *   3. Duplicate delivery           → 200 idempotency skip (same eventId sent twice)
 *
 * Signature computation:
 *   HMAC-SHA512(PAYSTACK_SECRET_KEY, rawBody) → hex digest
 *   Header: x-paystack-signature: <hex>
 *
 * The controller falls through to paymentService.handleWebhook which writes a
 * payment_webhooks row on first delivery and returns { status: 'duplicate' }
 * on retry — both respond 200 to Paystack.
 *
 * Database: isolated SQLite temp file (per-file, see testSetup.js)
 */

import { setupTestDatabase } from '../helpers/testSetup.js';
import request from 'supertest';
import { createHmac } from 'crypto';

const TEST_SECRET = 'test-paystack-secret-key-for-integration';

function sign(body) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return createHmac('sha512', TEST_SECRET).update(raw).digest('hex');
}

// Minimal Paystack charge.success payload
function makePayload(eventId = 'evt-' + Date.now()) {
  return {
    event: 'charge.success',
    data: {
      id: eventId,
      reference: `ref-${eventId}`,
      amount: 150000,
      currency: 'NGN',
      status: 'success',
    },
  };
}

let app;
let teardown;

beforeAll(async () => {
  ({ app, teardown } = await setupTestDatabase());
  process.env.PAYSTACK_SECRET_KEY = TEST_SECRET;
}, 30_000);

afterAll(async () => {
  delete process.env.PAYSTACK_SECRET_KEY;
  await teardown();
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/payments/webhook/paystack — signature verification', () => {
  test('valid HMAC signature is accepted (2xx response)', async () => {
    const payload = makePayload();
    const raw = JSON.stringify(payload);
    const sig = sign(raw);

    const res = await request(app)
      .post('/api/payments/webhook/paystack')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', sig)
      .send(raw);

    // 200 = processed, 201 = created — both indicate the request was not rejected
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  test('tampered body produces 401 (wrong signature)', async () => {
    const payload = makePayload('evt-tamper');
    const raw = JSON.stringify(payload);
    const sig = sign(raw);

    // Tamper the body AFTER signing — simulates a MITM modification
    const tamperedBody = JSON.stringify({ ...payload, data: { ...payload.data, amount: 1 } });

    const res = await request(app)
      .post('/api/payments/webhook/paystack')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', sig)
      .send(tamperedBody);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/signature/i);
  });

  test('missing signature header returns 401', async () => {
    const payload = makePayload('evt-nosig');

    const res = await request(app)
      .post('/api/payments/webhook/paystack')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('wrong signature value returns 401', async () => {
    const payload = makePayload('evt-wrongsig');

    const res = await request(app)
      .post('/api/payments/webhook/paystack')
      .set('x-paystack-signature', 'deadbeef0000000000000000000000000000000000000000')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/payments/webhook/paystack — idempotency', () => {
  test('duplicate delivery with same eventId returns 200 on both deliveries', async () => {
    const payload = makePayload('evt-idempotent-' + Date.now());
    const raw = JSON.stringify(payload);
    const sig = sign(raw);

    // First delivery
    const first = await request(app)
      .post('/api/payments/webhook/paystack')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', sig)
      .send(raw);

    expect([200, 201]).toContain(first.status);
    expect(first.body.success).toBe(true);

    // Second delivery (Paystack retry)
    const second = await request(app)
      .post('/api/payments/webhook/paystack')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', sig)
      .send(raw);

    // Must still return 200 (not error) so Paystack stops retrying
    expect([200, 201]).toContain(second.status);
    expect(second.body.success).toBe(true);
  });
});
