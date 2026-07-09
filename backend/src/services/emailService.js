import { BrevoClient } from '@getbrevo/brevo';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Service — powered by Brevo SDK
 *
 * Required env vars:
 *   BREVO_API_KEY      — Brevo API key (xkeysib-...)
 *   SMTP_FROM_EMAIL    — verified sender address in Brevo (e.g. noreply@lifelinepro.com)
 *   SMTP_FROM_NAME     — display name (default: LifeLine Pro)
 */

// ── Brevo client (lazy-initialised) ──────────────────────────────────────────

let brevoClient = null;

function getClient() {
  if (brevoClient) return brevoClient;

  if (!process.env.BREVO_API_KEY) {
    logger.warn('BREVO_API_KEY not set — emails will be skipped');
    return null;
  }

  brevoClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  logger.info('Brevo email client initialised');
  return brevoClient;
}

// ── Template helpers ──────────────────────────────────────────────────────────

async function loadTemplate(templateName) {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    return await fs.readFile(templatePath, 'utf-8');
  } catch {
    logger.warn(`Email template '${templateName}' not found — using fallback`);
    return null;
  }
}

function replacePlaceholders(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value ?? ''));
  }
  return result;
}

function generateFallbackHtml(subject, data) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:#2563eb;color:white;padding:20px;text-align:center}
.content{padding:20px;background:#f9fafb}
.footer{padding:20px;text-align:center;font-size:12px;color:#666}</style>
</head><body><div class="container">
<div class="header"><h1>LifeLine Pro</h1></div>
<div class="content"><h2>${subject}</h2>
${Object.entries(data).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}
</div>
<div class="footer"><p>&copy; ${new Date().getFullYear()} LifeLine Pro. All rights reserved.</p></div>
</div></body></html>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a single transactional email via Brevo.
 *
 * @param {object} opts
 * @param {string}  opts.to        Recipient email address
 * @param {string}  opts.subject   Email subject line
 * @param {string}  [opts.template] Template filename (without .html)
 * @param {object}  [opts.data]    Variables injected into the template {{key}}
 * @param {string}  [opts.html]    Raw HTML (used when no template given)
 * @param {string}  [opts.text]    Plain-text fallback
 */
export async function sendEmail({ to, subject, template, data = {}, html, text }) {
  const client = getClient();

  if (!client) {
    logger.warn('Email skipped — Brevo not configured', { to, subject });
    return { success: false, message: 'Email not configured' };
  }

  try {
    let emailHtml = html;

    if (template) {
      const templateContent = await loadTemplate(template);
      // Always inject {{year}} automatically
      const enrichedData = { year: new Date().getFullYear(), ...data };
      emailHtml = templateContent
        ? replacePlaceholders(templateContent, enrichedData)
        : generateFallbackHtml(subject, enrichedData);
    }

    const fromName  = process.env.SMTP_FROM_NAME  || 'LifeLine Pro';
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@lifelinepro.com';

    const result = await client.transactionalEmails.sendTransacEmail({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: emailHtml,
      textContent: text,
    });

    logger.info('Email sent via Brevo', {
      to,
      subject,
      messageId: result.data?.messageId,
    });

    return { success: true, messageId: result.data?.messageId };
  } catch (error) {
    logger.error('Brevo email send failed', {
      error: error.message,
      to,
      subject,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Send multiple emails sequentially.
 * Brevo free plan: 300 emails/day, ~3/sec burst — 200ms gap is safe.
 */
export async function sendBulkEmails(recipients) {
  const results = [];
  for (const recipient of recipients) {
    const result = await sendEmail(recipient);
    results.push({ ...recipient, result });
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

export default { sendEmail, sendBulkEmails };
