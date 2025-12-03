import database from '../database/connection.js';
import logger from '../utils/logger.js';
import { NotFoundError } from '../middleware/errorHandler.js';

/**
 * Pricing Repository
 * Database operations for service pricing and package rates
 */

/**
 * Get pricing by ID
 */
export const findPricingById = async (pricingId) => {
  try {
    const result = await database.query(
      `SELECT * FROM pricing WHERE id = $1`,
      [pricingId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pricing');
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error finding pricing', {
      error: error.message,
      pricingId,
    });
    throw error;
  }
};

/**
 * Get pricing for service type
 */
export const getPricingByServiceType = async (serviceType, packageType = null) => {
  try {
    let query = `SELECT * FROM pricing WHERE service_type = $1`;
    const params = [serviceType];

    if (packageType) {
      query += ` AND package_type = $2`;
      params.push(packageType);
    }

    query += ` ORDER BY package_type`;

    const result = await database.query(query, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting pricing by service type', {
      error: error.message,
      serviceType,
      packageType,
    });
    throw error;
  }
};

/**
 * Get pricing by package type
 */
export const getPricingByPackageType = async (packageType) => {
  try {
    const result = await database.query(
      `SELECT * FROM pricing WHERE package_type = $1 ORDER BY service_type`,
      [packageType]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting pricing by package type', {
      error: error.message,
      packageType,
    });
    throw error;
  }
};

/**
 * Get specific pricing
 */
export const getSpecificPricing = async (serviceType, packageType) => {
  try {
    const result = await database.query(
      `SELECT * FROM pricing WHERE service_type = $1 AND package_type = $2`,
      [serviceType, packageType]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Pricing for ${serviceType} - ${packageType}`);
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error getting specific pricing', {
      error: error.message,
      serviceType,
      packageType,
    });
    throw error;
  }
};

/**
 * Create pricing entry
 */
export const createPricing = async (pricingData) => {
  const {
    serviceType,
    packageType,
    patientPrice,
    providerShare,
    platformFee,
    description = null,
  } = pricingData;

  try {
    const result = await database.query(
      `INSERT INTO pricing (
        service_type, package_type, patient_price,
        provider_share, platform_fee, description
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [serviceType, packageType, patientPrice, providerShare, platformFee, description]
    );

    logger.info('Pricing created', {
      pricingId: result.rows[0].id,
      serviceType,
      packageType,
    });

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new NotFoundError('Pricing already exists for this service and package combination');
    }
    logger.error('Error creating pricing', {
      error: error.message,
      serviceType,
      packageType,
    });
    throw error;
  }
};

/**
 * Update pricing
 */
export const updatePricing = async (pricingId, updateData) => {
  const { patientPrice, providerShare, platformFee, description } = updateData;

  try {
    const result = await database.query(
      `UPDATE pricing
       SET patient_price = COALESCE($1, patient_price),
           provider_share = COALESCE($2, provider_share),
           platform_fee = COALESCE($3, platform_fee),
           description = COALESCE($4, description),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [patientPrice, providerShare, platformFee, description, pricingId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pricing');
    }

    logger.info('Pricing updated', { pricingId });

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error updating pricing', {
      error: error.message,
      pricingId,
    });
    throw error;
  }
};

/**
 * Delete pricing
 */
export const deletePricing = async (pricingId) => {
  try {
    const result = await database.query(
      `DELETE FROM pricing WHERE id = $1 RETURNING id`,
      [pricingId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pricing');
    }

    logger.info('Pricing deleted', { pricingId });

    return { id: pricingId, deleted: true };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error deleting pricing', {
      error: error.message,
      pricingId,
    });
    throw error;
  }
};

/**
 * Get all pricing entries
 */
export const getAllPricing = async (options = {}) => {
  const { limit = 100, offset = 0 } = options;

  try {
    const result = await database.query(
      `SELECT * FROM pricing
       ORDER BY service_type, package_type
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting all pricing', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get pricing breakdown for consultation
 */
export const getConsultationPricing = async (packageType) => {
  try {
    const result = await database.query(
      `SELECT * FROM pricing
       WHERE service_type = 'consultation' AND package_type = $1`,
      [packageType]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Consultation pricing for ${packageType} package`);
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error getting consultation pricing', {
      error: error.message,
      packageType,
    });
    throw error;
  }
};

/**
 * Get pricing breakdown for prescription
 */
export const getPrescriptionPricing = async (packageType) => {
  try {
    const result = await database.query(
      `SELECT * FROM pricing
       WHERE service_type = 'prescription' AND package_type = $1`,
      [packageType]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Prescription pricing for ${packageType} package`);
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error getting prescription pricing', {
      error: error.message,
      packageType,
    });
    throw error;
  }
};

/**
 * Get pricing breakdown for surgery
 */
export const getSurgeryPricing = async (packageType) => {
  try {
    const result = await database.query(
      `SELECT * FROM pricing
       WHERE service_type = 'surgery' AND package_type = $1`,
      [packageType]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Surgery pricing for ${packageType} package`);
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error getting surgery pricing', {
      error: error.message,
      packageType,
    });
    throw error;
  }
};

/**
 * Get pricing breakdown for lab test
 */
export const getLabTestPricing = async (packageType) => {
  try {
    const result = await database.query(
      `SELECT * FROM pricing
       WHERE service_type = 'lab_test' AND package_type = $1`,
      [packageType]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`Lab test pricing for ${packageType} package`);
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error getting lab test pricing', {
      error: error.message,
      packageType,
    });
    throw error;
  }
};

/**
 * Calculate payment breakdown
 */
export const calculatePaymentBreakdown = async (serviceType, packageType, baseAmount = null) => {
  try {
    const pricing = await getSpecificPricing(serviceType, packageType);

    const patientPrice = baseAmount || pricing.patient_price;
    const providerShare = pricing.provider_share;
    const platformFee = pricing.platform_fee;

    return {
      serviceType,
      packageType,
      patientPrice: parseFloat(patientPrice),
      providerShare: parseFloat(providerShare),
      platformFee: parseFloat(platformFee),
      total: parseFloat(patientPrice),
    };
  } catch (error) {
    logger.error('Error calculating payment breakdown', {
      error: error.message,
      serviceType,
      packageType,
    });
    throw error;
  }
};

/**
 * Get package comparison
 */
export const getPackageComparison = async (serviceType) => {
  try {
    const result = await database.query(
      `SELECT 
        package_type,
        patient_price,
        provider_share,
        platform_fee,
        description
       FROM pricing
       WHERE service_type = $1
       ORDER BY 
         CASE package_type
           WHEN 'basic' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'advanced' THEN 3
         END`,
      [serviceType]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting package comparison', {
      error: error.message,
      serviceType,
    });
    throw error;
  }
};

/**
 * Get all service types
 */
export const getAllServiceTypes = async () => {
  try {
    const result = await database.query(
      `SELECT DISTINCT service_type FROM pricing ORDER BY service_type`
    );

    return result.rows.map((row) => row.service_type);
  } catch (error) {
    logger.error('Error getting all service types', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get pricing statistics
 */
export const getPricingStatistics = async () => {
  try {
    const result = await database.query(
      `SELECT 
        COUNT(*) as total_pricing_entries,
        COUNT(DISTINCT service_type) as service_types_count,
        COUNT(DISTINCT package_type) as package_types_count,
        AVG(patient_price) as avg_patient_price,
        AVG(provider_share) as avg_provider_share,
        AVG(platform_fee) as avg_platform_fee,
        MIN(patient_price) as min_patient_price,
        MAX(patient_price) as max_patient_price
       FROM pricing`
    );

    const stats = result.rows[0];

    return {
      totalPricingEntries: parseInt(stats.total_pricing_entries, 10),
      serviceTypesCount: parseInt(stats.service_types_count, 10),
      packageTypesCount: parseInt(stats.package_types_count, 10),
      avgPatientPrice: parseFloat(stats.avg_patient_price || 0),
      avgProviderShare: parseFloat(stats.avg_provider_share || 0),
      avgPlatformFee: parseFloat(stats.avg_platform_fee || 0),
      minPatientPrice: parseFloat(stats.min_patient_price || 0),
      maxPatientPrice: parseFloat(stats.max_patient_price || 0),
    };
  } catch (error) {
    logger.error('Error getting pricing statistics', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Bulk update pricing for service type
 */
export const bulkUpdateServicePricing = async (serviceType, updateData) => {
  const { patientPriceMultiplier = 1, providerShareMultiplier = 1, platformFeeMultiplier = 1 } = updateData;

  try {
    const result = await database.query(
      `UPDATE pricing
       SET patient_price = patient_price * $1,
           provider_share = provider_share * $2,
           platform_fee = platform_fee * $3,
           updated_at = NOW()
       WHERE service_type = $4
       RETURNING id`,
      [patientPriceMultiplier, providerShareMultiplier, platformFeeMultiplier, serviceType]
    );

    logger.info('Bulk pricing update', {
      serviceType,
      updatedCount: result.rows.length,
    });

    return {
      updated: result.rows.length,
      pricingIds: result.rows.map((r) => r.id),
    };
  } catch (error) {
    logger.error('Error bulk updating pricing', {
      error: error.message,
      serviceType,
    });
    throw error;
  }
};

/**
 * Validate pricing consistency
 */
export const validatePricingConsistency = async (pricingId) => {
  try {
    const pricing = await findPricingById(pricingId);

    const total = parseFloat(pricing.provider_share) + parseFloat(pricing.platform_fee);
    const expectedTotal = parseFloat(pricing.patient_price);

    const isConsistent = Math.abs(total - expectedTotal) < 0.01; // Allow for rounding errors

    return {
      isConsistent,
      patientPrice: parseFloat(pricing.patient_price),
      providerShare: parseFloat(pricing.provider_share),
      platformFee: parseFloat(pricing.platform_fee),
      calculatedTotal: total,
      difference: total - expectedTotal,
    };
  } catch (error) {
    logger.error('Error validating pricing consistency', {
      error: error.message,
      pricingId,
    });
    throw error;
  }
};

/**
 * Get pricing for patient package
 */
export const getPatientPackagePricing = async (patientId) => {
  try {
    // Get patient's active subscription package
    const patientResult = await database.query(
      `SELECT ps.package_type
       FROM patient_subscriptions ps
       WHERE ps.patient_id = $1 AND ps.is_active = true
       ORDER BY ps.start_date DESC
       LIMIT 1`,
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      throw new NotFoundError('Active subscription not found for patient');
    }

    const packageType = patientResult.rows[0].package_type;

    // Get all pricing for this package
    const pricing = await getPricingByPackageType(packageType);

    return {
      packageType,
      pricing,
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Error getting patient package pricing', {
      error: error.message,
      patientId,
    });
    throw error;
  }
};

export default {
  findPricingById,
  getPricingByServiceType,
  getPricingByPackageType,
  getSpecificPricing,
  createPricing,
  updatePricing,
  deletePricing,
  getAllPricing,
  
  // Service-specific pricing
  getConsultationPricing,
  getPrescriptionPricing,
  getSurgeryPricing,
  getLabTestPricing,
  
  // Calculations
  calculatePaymentBreakdown,
  getPackageComparison,
  
  // Utilities
  getAllServiceTypes,
  getPricingStatistics,
  bulkUpdateServicePricing,
  validatePricingConsistency,
  getPatientPackagePricing,
};
