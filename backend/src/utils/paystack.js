import logger from './logger.js';
import crypto from 'crypto';

/**
 * Paystack Payment Gateway Integration
 * 
 * To enable Paystack, set these environment variables:
 *   PAYSTACK_SECRET_KEY=sk_test_xxx or sk_live_xxx
 *   ENABLE_PAYSTACK=true
 * 
 * When ENABLE_PAYSTACK is not 'true', all methods return mock responses.
 */

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const isEnabled = () => process.env.ENABLE_PAYSTACK === 'true' && !!process.env.PAYSTACK_SECRET_KEY;

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

/**
 * Initialize a transaction
 * @param {Object} params - { email, amount (in kobo), reference, callback_url, metadata }
 * @returns {Object} { authorization_url, access_code, reference }
 */
export const initializeTransaction = async ({ email, amount, reference, callbackUrl, metadata = {} }) => {
  if (!isEnabled()) {
    logger.info('Paystack not enabled — returning mock initialization', { reference });
    return {
      authorization_url: `http://localhost:3000/payment/callback?reference=${reference}`,
      access_code: `mock_${reference}`,
      reference,
    };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        reference,
        callback_url: callbackUrl || process.env.PAYSTACK_CALLBACK_URL,
        metadata,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to initialize Paystack transaction');
    }

    logger.info('Paystack transaction initialized', { reference, email });
    return data.data;
  } catch (error) {
    logger.error('Paystack initialize error', { error: error.message, reference });
    throw error;
  }
};

/**
 * Verify a transaction
 * @param {string} reference - Payment reference
 * @returns {Object} Transaction details
 */
export const verifyTransaction = async (reference) => {
  if (!isEnabled()) {
    logger.info('Paystack not enabled — returning mock verification', { reference });
    return {
      status: 'success',
      reference,
      amount: 0,
      currency: 'NGN',
      paid_at: new Date().toISOString(),
      channel: 'mock',
    };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to verify Paystack transaction');
    }

    logger.info('Paystack transaction verified', { reference, status: data.data.status });
    return data.data;
  } catch (error) {
    logger.error('Paystack verify error', { error: error.message, reference });
    throw error;
  }
};

/**
 * List banks
 * @returns {Array} List of banks
 */
export const listBanks = async () => {
  if (!isEnabled()) {
    return [
      { name: 'Access Bank', code: '044' },
      { name: 'First Bank', code: '011' },
      { name: 'GTBank', code: '058' },
      { name: 'UBA', code: '033' },
      { name: 'Zenith Bank', code: '057' },
    ];
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/bank`, {
      headers: getHeaders(),
    });

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    logger.error('Paystack list banks error', { error: error.message });
    throw error;
  }
};

/**
 * Create a transfer recipient (for payouts to providers)
 * @param {Object} params - { name, account_number, bank_code }
 * @returns {Object} Recipient details
 */
export const createTransferRecipient = async ({ name, accountNumber, bankCode }) => {
  if (!isEnabled()) {
    return {
      recipient_code: `mock_rcp_${Date.now()}`,
      name,
      details: { account_number: accountNumber, bank_code: bankCode },
    };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        type: 'nuban',
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to create transfer recipient');
    }

    return data.data;
  } catch (error) {
    logger.error('Paystack create recipient error', { error: error.message });
    throw error;
  }
};

/**
 * Initiate a transfer (payout)
 * @param {Object} params - { amount, recipientCode, reason }
 * @returns {Object} Transfer details
 */
export const initiateTransfer = async ({ amount, recipientCode, reason }) => {
  if (!isEnabled()) {
    return {
      transfer_code: `mock_trf_${Date.now()}`,
      amount: Math.round(amount * 100),
      status: 'success',
      reason,
    };
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(amount * 100), // kobo
        recipient: recipientCode,
        reason,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to initiate transfer');
    }

    logger.info('Paystack transfer initiated', { recipientCode, amount });
    return data.data;
  } catch (error) {
    logger.error('Paystack transfer error', { error: error.message });
    throw error;
  }
};

export default {
  isEnabled,
  initializeTransaction,
  verifyTransaction,
  listBanks,
  createTransferRecipient,
  initiateTransfer,
  verifyWebhookSignature,
};

/**
 * Verify Paystack webhook signature
 * @param {string|Buffer} rawBody - Raw request body
 * @param {string} signature - x-paystack-signature header value
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!process.env.PAYSTACK_SECRET_KEY) return false;
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}
