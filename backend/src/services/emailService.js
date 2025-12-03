import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Service
 * Handles sending emails with templates
 */

let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  return transporter;
}

/**
 * Load email template
 */
async function loadTemplate(templateName) {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    return await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    logger.warn(`Email template ${templateName} not found, using default`);
    return null;
  }
}

/**
 * Replace placeholders in template
 */
function replacePlaceholders(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value);
  }
  return result;
}

/**
 * Send email
 */
export async function sendEmail({ to, subject, template, data, html, text }) {
  try {
    // Skip if email is not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      logger.warn('Email service not configured, skipping email send');
      return { success: false, message: 'Email not configured' };
    }

    const transport = initializeTransporter();

    let emailHtml = html;
    let emailText = text;

    // Load and process template if provided
    if (template) {
      const templateContent = await loadTemplate(template);
      if (templateContent) {
        emailHtml = replacePlaceholders(templateContent, data);
      } else {
        // Fallback to simple HTML
        emailHtml = generateFallbackHtml(subject, data);
      }
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@lifelinepro.com',
      to,
      subject,
      html: emailHtml,
      text: emailText
    };

    const info = await transport.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email', {
      error: error.message,
      to,
      subject
    });
    return { success: false, error: error.message };
  }
}

/**
 * Generate fallback HTML when template is not available
 */
function generateFallbackHtml(subject, data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LifeLine Pro</h1>
        </div>
        <div class="content">
          <h2>${subject}</h2>
          ${Object.entries(data).map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`).join('')}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} LifeLine Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(recipients) {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendEmail(recipient);
    results.push({ ...recipient, result });
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

export default { sendEmail, sendBulkEmails };
