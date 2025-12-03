import database from '../database/connection.js';
import logger from './logger.js';

/**
 * LifeLine ID Generator
 * Generates unique IDs for different user types:
 * - LLPAT-XXXXX: Patients
 * - LLDEP-XXXXX: Dependents
 * - LLDOC-XXXXX: Doctors
 * - LLPHA-XXXXX: Pharmacies
 * - LLHOS-XXXXX: Hospitals
 * - LLADM-XXXXX: Admins
 */

class IDGenerator {
  constructor() {
    this.prefixes = {
      patient: 'LLPAT',
      dependent: 'LLDEP',
      doctor: 'LLDOC',
      pharmacy: 'LLPHA',
      hospital: 'LLHOS',
      admin: 'LLADM',
    };
  }

  /**
   * Generate a LifeLine ID for a specific type
   */
  async generate(type) {
    const prefix = this.prefixes[type];
    if (!prefix) {
      throw new Error(`Invalid ID type: ${type}`);
    }

    try {
      // Get the next sequence number
      const sequenceNumber = await this.getNextSequence(prefix);

      // Format with leading zeros (5 digits)
      const paddedNumber = sequenceNumber.toString().padStart(5, '0');

      // Combine prefix and number
      const lifelineId = `${prefix}-${paddedNumber}`;

      return lifelineId;
    } catch (error) {
      logger.error('Failed to generate LifeLine ID', {
        type,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get next sequence number for a prefix
   */
  async getNextSequence(prefix) {
    try {
      // Query the appropriate table based on prefix
      let query;
      let tableName;

      switch (prefix) {
        case 'LLPAT':
          tableName = 'users';
          query = `SELECT lifeline_id FROM users WHERE role = 'patient' ORDER BY lifeline_id DESC LIMIT 1`;
          break;
        case 'LLDEP':
          tableName = 'dependents';
          query = `SELECT lifeline_id FROM dependents ORDER BY lifeline_id DESC LIMIT 1`;
          break;
        case 'LLDOC':
          tableName = 'users';
          query = `SELECT lifeline_id FROM users WHERE role = 'doctor' ORDER BY lifeline_id DESC LIMIT 1`;
          break;
        case 'LLPHA':
          tableName = 'users';
          query = `SELECT lifeline_id FROM users WHERE role = 'pharmacy' ORDER BY lifeline_id DESC LIMIT 1`;
          break;
        case 'LLHOS':
          tableName = 'users';
          query = `SELECT lifeline_id FROM users WHERE role = 'hospital' ORDER BY lifeline_id DESC LIMIT 1`;
          break;
        case 'LLADM':
          tableName = 'users';
          query = `SELECT lifeline_id FROM users WHERE role = 'admin' ORDER BY lifeline_id DESC LIMIT 1`;
          break;
        default:
          return 1;
      }

      const result = await database.query(query);

      if (result.rows.length === 0) {
        // First ID for this type
        return 1;
      }

      // Extract number from last ID
      const lastId = result.rows[0].lifeline_id;
      const lastNumber = parseInt(lastId.split('-')[1], 10);

      // Return next number
      return lastNumber + 1;
    } catch (error) {
      logger.error('Failed to get next sequence', {
        prefix,
        error: error.message,
      });
      // If error, generate random number to avoid collision
      return Math.floor(Math.random() * 90000) + 10000;
    }
  }

  /**
   * Validate LifeLine ID format
   */
  validate(lifelineId) {
    if (!lifelineId || typeof lifelineId !== 'string') {
      return false;
    }

    // Check format: PREFIX-NNNNN
    const pattern = /^(LLPAT|LLDEP|LLDOC|LLPHA|LLHOS|LLADM)-\d{5}$/;
    return pattern.test(lifelineId);
  }

  /**
   * Extract type from LifeLine ID
   */
  extractType(lifelineId) {
    if (!this.validate(lifelineId)) {
      return null;
    }

    const prefix = lifelineId.split('-')[0];
    const typeMap = {
      LLPAT: 'patient',
      LLDEP: 'dependent',
      LLDOC: 'doctor',
      LLPHA: 'pharmacy',
      LLHOS: 'hospital',
      LLADM: 'admin',
    };

    return typeMap[prefix] || null;
  }

  /**
   * Extract number from LifeLine ID
   */
  extractNumber(lifelineId) {
    if (!this.validate(lifelineId)) {
      return null;
    }

    const number = lifelineId.split('-')[1];
    return parseInt(number, 10);
  }

  /**
   * Check if LifeLine ID exists
   */
  async exists(lifelineId) {
    try {
      if (!this.validate(lifelineId)) {
        return false;
      }

      const type = this.extractType(lifelineId);

      let query;
      if (type === 'dependent') {
        query = 'SELECT COUNT(*) FROM dependents WHERE lifeline_id = $1';
      } else {
        query = 'SELECT COUNT(*) FROM users WHERE lifeline_id = $1';
      }

      const result = await database.query(query, [lifelineId]);
      return parseInt(result.rows[0].count, 10) > 0;
    } catch (error) {
      logger.error('Failed to check LifeLine ID existence', {
        lifelineId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Generate multiple IDs (bulk generation)
   */
  async generateBulk(type, count) {
    const ids = [];
    for (let i = 0; i < count; i++) {
      const id = await this.generate(type);
      ids.push(id);
    }
    return ids;
  }

  /**
   * Get formatted display name
   */
  getDisplayName(lifelineId) {
    if (!this.validate(lifelineId)) {
      return lifelineId;
    }

    const type = this.extractType(lifelineId);
    const number = this.extractNumber(lifelineId);

    const typeNames = {
      patient: 'Patient',
      dependent: 'Dependent',
      doctor: 'Doctor',
      pharmacy: 'Pharmacy',
      hospital: 'Hospital',
      admin: 'Admin',
    };

    return `${typeNames[type]} #${number}`;
  }
}

// Export singleton instance
const idGenerator = new IDGenerator();
export default idGenerator;
export { IDGenerator };

// Export convenience functions
export const generateLifelineId = (type) => idGenerator.generate(type);
export const validateLifelineId = (id) => idGenerator.validate(id);
export const lifelineIdExists = (id) => idGenerator.exists(id);
