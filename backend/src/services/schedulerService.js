import cron from 'node-cron';
import logger from '../utils/logger.js';

/**
 * Scheduler Service
 * Manages all scheduled cron jobs for the application
 */
class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Initialize all scheduled jobs
   */
  initialize() {
    logger.info('Initializing Scheduler Service...');

    // Monthly statement generation on the 1st of each month at midnight
    const monthlyStatementJob = cron.schedule('0 0 1 * *', () => {
      this.generateMonthlyStatements();
    });
    this.jobs.push(monthlyStatementJob);

    // Stale request reassignment every 6 hours
    const staleReassignJob = cron.schedule('0 */6 * * *', () => {
      this.reassignStaleRequests();
    });
    this.jobs.push(staleReassignJob);

    // Monthly assignment counter reset on the 1st of each month at 1 AM
    const counterResetJob = cron.schedule('0 1 1 * *', () => {
      this.resetAssignmentCounters();
    });
    this.jobs.push(counterResetJob);

    logger.info('Scheduler Service initialized with 3 jobs');
  }

  /**
   * Generate monthly statements for all providers with activity
   */
  async generateMonthlyStatements() {
    try {
      const { default: paymentService } = await import('./paymentService.js');
      await paymentService.generateAllMonthlyStatements();
      logger.info('Monthly statements generated successfully');
    } catch (error) {
      logger.error('Error generating monthly statements', { error: error.message });
    }
  }

  /**
   * Reassign stale requests (stuck >24h in assigned status)
   */
  async reassignStaleRequests() {
    try {
      const { default: queueService } = await import('./queueService.js');
      await queueService.reassignStaleRequests();
      logger.info('Stale request reassignment completed');
    } catch (error) {
      logger.error('Error reassigning stale requests', { error: error.message });
    }
  }

  /**
   * Reset provider assignment counters monthly
   */
  async resetAssignmentCounters() {
    try {
      const { default: database } = await import('../database/connection.js');
      const result = await database.query(
        `DELETE FROM provider_assignment_counters WHERE id IN (
          SELECT pac.id FROM provider_assignment_counters pac
          WHERE pac.last_assigned_at < NOW() - INTERVAL '30 days'
        )`
      );
      logger.info('Assignment counters reset for inactive providers', { affected: result.rowCount || 0 });
    } catch (error) {
      logger.error('Error resetting assignment counters', { error: error.message });
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    this.jobs.forEach(job => job.stop());
    logger.info('Scheduler Service stopped');
  }
}

// Export singleton instance
const schedulerService = new SchedulerService();
export default schedulerService;
