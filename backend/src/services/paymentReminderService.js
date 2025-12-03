import cron from 'node-cron';
import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { sendEmail } from '../services/emailService.js';
import { sendSMS } from '../services/smsService.js';

/**
 * Payment Reminder Service
 * Sends automated reminders for upcoming subscription renewals and overdue payments
 */
class PaymentReminderService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Initialize all reminder jobs
   */
  initialize() {
    logger.info('Initializing Payment Reminder Service...');

    // Check for upcoming renewals daily at 9 AM
    const upcomingRenewalsJob = cron.schedule('0 9 * * *', () => {
      this.sendUpcomingRenewalReminders();
    });
    this.jobs.push(upcomingRenewalsJob);

    // Check for overdue payments daily at 10 AM
    const overduePaymentsJob = cron.schedule('0 10 * * *', () => {
      this.sendOverduePaymentReminders();
    });
    this.jobs.push(overduePaymentsJob);

    // Send grace period warnings (day before expiry) at 6 PM
    const gracePeriodJob = cron.schedule('0 18 * * *', () => {
      this.sendGracePeriodWarnings();
    });
    this.jobs.push(gracePeriodJob);

    logger.info('Payment Reminder Service initialized with 3 jobs');
  }

  /**
   * Send reminders for subscriptions expiring in 7, 3, and 1 days
   */
  async sendUpcomingRenewalReminders() {
    try {
      logger.info('Checking for upcoming subscription renewals...');

      const reminderDays = [7, 3, 1];
      
      for (const days of reminderDays) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        
        const query = `
          SELECT 
            p.id as patient_id,
            p.first_name,
            p.last_name,
            p.package_type,
            p.subscription_end_date,
            p.next_billing_date,
            u.email,
            u.phone,
            u.lifeline_id
          FROM patients p
          JOIN users u ON p.user_id = u.id
          WHERE p.subscription_status = 'active'
          AND DATE(p.subscription_end_date) = DATE($1)
          AND u.is_active = true
        `;

        const result = await database.query(query, [targetDate]);
        const patients = result.rows;

        logger.info(`Found ${patients.length} patients with subscriptions expiring in ${days} days`);

        for (const patient of patients) {
          await this.sendRenewalReminder(patient, days);
        }
      }

      logger.info('Upcoming renewal reminders sent successfully');
    } catch (error) {
      logger.error('Error sending upcoming renewal reminders', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Send reminders for overdue subscription payments
   */
  async sendOverduePaymentReminders() {
    try {
      logger.info('Checking for overdue subscription payments...');

      const query = `
        SELECT 
          p.id as patient_id,
          p.first_name,
          p.last_name,
          p.package_type,
          p.subscription_end_date,
          p.subscription_status,
          u.email,
          u.phone,
          u.lifeline_id,
          EXTRACT(DAY FROM (CURRENT_DATE - p.subscription_end_date)) as days_overdue
        FROM patients p
        JOIN users u ON p.user_id = u.id
        WHERE p.subscription_status IN ('expired', 'pending')
        AND p.subscription_end_date < CURRENT_DATE
        AND u.is_active = true
        ORDER BY p.subscription_end_date ASC
      `;

      const result = await database.query(query);
      const overduePatients = result.rows;

      logger.info(`Found ${overduePatients.length} patients with overdue payments`);

      for (const patient of overduePatients) {
        await this.sendOverdueReminder(patient);
      }

      logger.info('Overdue payment reminders sent successfully');
    } catch (error) {
      logger.error('Error sending overdue payment reminders', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Send final warnings for subscriptions expiring tomorrow
   */
  async sendGracePeriodWarnings() {
    try {
      logger.info('Checking for subscriptions in grace period...');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const query = `
        SELECT 
          p.id as patient_id,
          p.first_name,
          p.last_name,
          p.package_type,
          p.subscription_end_date,
          u.email,
          u.phone,
          u.lifeline_id
        FROM patients p
        JOIN users u ON p.user_id = u.id
        WHERE p.subscription_status = 'active'
        AND DATE(p.subscription_end_date) = DATE($1)
        AND u.is_active = true
      `;

      const result = await database.query(query, [tomorrow]);
      const patients = result.rows;

      logger.info(`Found ${patients.length} patients in grace period`);

      for (const patient of patients) {
        await this.sendGracePeriodWarning(patient);
      }

      logger.info('Grace period warnings sent successfully');
    } catch (error) {
      logger.error('Error sending grace period warnings', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Send individual renewal reminder
   */
  async sendRenewalReminder(patient, daysUntilExpiry) {
    try {
      const packagePrices = {
        BASIC: 1500,
        MEDIUM: 5000,
        ADVANCED: 15000
      };

      const amount = packagePrices[patient.package_type];
      const expiryDate = new Date(patient.subscription_end_date).toLocaleDateString('en-NG');

      // Email notification
      await sendEmail({
        to: patient.email,
        subject: `Subscription Renewal Reminder - ${daysUntilExpiry} Days Left`,
        template: 'renewal-reminder',
        data: {
          firstName: patient.first_name,
          lastName: patient.last_name,
          lifelineId: patient.lifeline_id,
          packageType: patient.package_type,
          expiryDate: expiryDate,
          daysRemaining: daysUntilExpiry,
          amount: amount.toLocaleString('en-NG'),
          renewalLink: `${process.env.FRONTEND_URL}/patient/subscription/renew`
        }
      });

      // SMS notification
      const smsMessage = `Dear ${patient.first_name}, your LifeLine ${patient.package_type} subscription expires in ${daysUntilExpiry} days. Renew now for ₦${amount.toLocaleString('en-NG')}. Visit ${process.env.FRONTEND_URL}`;
      
      await sendSMS({
        to: patient.phone,
        message: smsMessage
      });

      // Log notification
      await this.logNotification({
        patientId: patient.patient_id,
        type: 'renewal_reminder',
        channel: 'email_sms',
        daysUntilExpiry,
        status: 'sent'
      });

      logger.info(`Renewal reminder sent to ${patient.lifeline_id} (${daysUntilExpiry} days)`);
    } catch (error) {
      logger.error(`Failed to send renewal reminder to ${patient.lifeline_id}`, {
        error: error.message,
        patientId: patient.patient_id
      });
    }
  }

  /**
   * Send individual overdue payment reminder
   */
  async sendOverdueReminder(patient) {
    try {
      const packagePrices = {
        BASIC: 1500,
        MEDIUM: 5000,
        ADVANCED: 15000
      };

      const amount = packagePrices[patient.package_type];
      const daysOverdue = patient.days_overdue;

      // Email notification
      await sendEmail({
        to: patient.email,
        subject: `URGENT: Overdue Subscription Payment - ${daysOverdue} Days`,
        template: 'overdue-payment',
        data: {
          firstName: patient.first_name,
          lastName: patient.last_name,
          lifelineId: patient.lifeline_id,
          packageType: patient.package_type,
          daysOverdue: daysOverdue,
          amount: amount.toLocaleString('en-NG'),
          paymentLink: `${process.env.FRONTEND_URL}/patient/subscription/pay`
        }
      });

      // SMS notification
      const smsMessage = `URGENT: Your LifeLine ${patient.package_type} subscription is ${daysOverdue} days overdue. Pay ₦${amount.toLocaleString('en-NG')} now to restore coverage. ${process.env.FRONTEND_URL}`;
      
      await sendSMS({
        to: patient.phone,
        message: smsMessage
      });

      // Log notification
      await this.logNotification({
        patientId: patient.patient_id,
        type: 'overdue_payment',
        channel: 'email_sms',
        daysOverdue,
        status: 'sent'
      });

      logger.info(`Overdue reminder sent to ${patient.lifeline_id} (${daysOverdue} days overdue)`);
    } catch (error) {
      logger.error(`Failed to send overdue reminder to ${patient.lifeline_id}`, {
        error: error.message,
        patientId: patient.patient_id
      });
    }
  }

  /**
   * Send grace period warning
   */
  async sendGracePeriodWarning(patient) {
    try {
      const packagePrices = {
        BASIC: 1500,
        MEDIUM: 5000,
        ADVANCED: 15000
      };

      const amount = packagePrices[patient.package_type];

      // Email notification
      await sendEmail({
        to: patient.email,
        subject: 'FINAL NOTICE: Subscription Expires Tomorrow',
        template: 'grace-period-warning',
        data: {
          firstName: patient.first_name,
          lastName: patient.last_name,
          lifelineId: patient.lifeline_id,
          packageType: patient.package_type,
          amount: amount.toLocaleString('en-NG'),
          paymentLink: `${process.env.FRONTEND_URL}/patient/subscription/pay`
        }
      });

      // SMS notification
      const smsMessage = `FINAL NOTICE: Your LifeLine ${patient.package_type} subscription expires TOMORROW! Pay ₦${amount.toLocaleString('en-NG')} now. ${process.env.FRONTEND_URL}`;
      
      await sendSMS({
        to: patient.phone,
        message: smsMessage
      });

      // Log notification
      await this.logNotification({
        patientId: patient.patient_id,
        type: 'grace_period_warning',
        channel: 'email_sms',
        status: 'sent'
      });

      logger.info(`Grace period warning sent to ${patient.lifeline_id}`);
    } catch (error) {
      logger.error(`Failed to send grace period warning to ${patient.lifeline_id}`, {
        error: error.message,
        patientId: patient.patient_id
      });
    }
  }

  /**
   * Log notification to database
   */
  async logNotification(data) {
    try {
      const query = `
        INSERT INTO notification_logs (
          user_id,
          notification_type,
          channel,
          status,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `;

      await database.query(query, [
        data.patientId,
        data.type,
        data.channel,
        data.status,
        JSON.stringify({
          daysUntilExpiry: data.daysUntilExpiry,
          daysOverdue: data.daysOverdue
        })
      ]);
    } catch (error) {
      logger.error('Failed to log notification', {
        error: error.message,
        data
      });
    }
  }

  /**
   * Stop all reminder jobs
   */
  stopAll() {
    this.jobs.forEach(job => job.stop());
    logger.info('Payment Reminder Service stopped');
  }
}

// Export singleton instance
const paymentReminderService = new PaymentReminderService();
export default paymentReminderService;
