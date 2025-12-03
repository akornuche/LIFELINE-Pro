import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * SMS Service
 * Handles sending SMS messages via Twilio or other providers
 */

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio({ to, message }) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      throw new Error('Twilio credentials not configured');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const response = await axios.post(
      url,
      new URLSearchParams({
        To: to,
        From: from,
        Body: message
      }),
      {
        auth: {
          username: accountSid,
          password: authToken
        }
      }
    );

    return {
      success: true,
      sid: response.data.sid,
      provider: 'twilio'
    };
  } catch (error) {
    throw new Error(`Twilio SMS failed: ${error.message}`);
  }
}

/**
 * Send SMS via Termii (Nigerian SMS provider)
 */
async function sendViaTermii({ to, message }) {
  try {
    const apiKey = process.env.TERMII_API_KEY;
    const senderId = process.env.TERMII_SENDER_ID || 'LifeLine';

    if (!apiKey) {
      throw new Error('Termii API key not configured');
    }

    const url = 'https://api.ng.termii.com/api/sms/send';
    
    const response = await axios.post(url, {
      to: to.replace('+', ''),
      from: senderId,
      sms: message,
      type: 'plain',
      api_key: apiKey,
      channel: 'generic'
    });

    return {
      success: true,
      messageId: response.data.message_id,
      provider: 'termii'
    };
  } catch (error) {
    throw new Error(`Termii SMS failed: ${error.message}`);
  }
}

/**
 * Send SMS (tries configured providers)
 */
export async function sendSMS({ to, message }) {
  try {
    // Skip if SMS is not configured
    if (!process.env.SMS_PROVIDER) {
      logger.warn('SMS service not configured, skipping SMS send');
      return { success: false, message: 'SMS not configured' };
    }

    // Validate phone number
    if (!to || !to.startsWith('+')) {
      throw new Error('Invalid phone number format. Must start with +');
    }

    // Truncate message if too long
    const maxLength = 160;
    const truncatedMessage = message.length > maxLength 
      ? message.substring(0, maxLength - 3) + '...'
      : message;

    let result;
    const provider = process.env.SMS_PROVIDER?.toLowerCase();

    switch (provider) {
      case 'twilio':
        result = await sendViaTwilio({ to, message: truncatedMessage });
        break;
      case 'termii':
        result = await sendViaTermii({ to, message: truncatedMessage });
        break;
      default:
        throw new Error(`Unknown SMS provider: ${provider}`);
    }

    logger.info('SMS sent successfully', {
      to,
      provider: result.provider,
      messageId: result.sid || result.messageId
    });

    return result;
  } catch (error) {
    logger.error('Failed to send SMS', {
      error: error.message,
      to
    });
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(messages) {
  const results = [];
  
  for (const msg of messages) {
    const result = await sendSMS(msg);
    results.push({ ...msg, result });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

/**
 * Send OTP SMS
 */
export async function sendOTP({ to, code, expiryMinutes = 10 }) {
  const message = `Your LifeLine Pro verification code is: ${code}. Valid for ${expiryMinutes} minutes. Do not share this code.`;
  return await sendSMS({ to, message });
}

export default { sendSMS, sendBulkSMS, sendOTP };
