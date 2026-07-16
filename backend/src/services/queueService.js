import * as serviceRequestRepository from '../models/serviceRequestRepository.js';
import * as patientRepository from '../models/patientRepository.js';
import * as paymentRepository from '../models/paymentRepository.js';
import database from '../database/connection.js';
import { notifyUser } from './socketService.js';
import { sendEmail } from './emailService.js';
import logger from '../utils/logger.js';
import { BusinessLogicError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Queue Service
 * Handles service request creation, round-robin provider assignment,
 * and request lifecycle management
 */

/**
 * Determine provider type from service type
 */
const getProviderTypeForService = (serviceType) => {
  const mapping = {
    // Doctor-handled
    consultation: 'doctor',
    prescription: 'doctor',
    vaccination: 'doctor',
    specialist_consultation: 'doctor',
    mental_health: 'doctor',
    chronic_disease_management: 'doctor',
    home_visit: 'doctor',
    second_opinion: 'doctor',
    // Pharmacy-handled
    drug_dispensing: 'pharmacy',
    // Hospital-handled
    minor_surgery: 'hospital',
    major_surgery: 'hospital',
    laboratory_test: 'hospital',
    advanced_lab_test: 'hospital',
    imaging: 'hospital',
    advanced_imaging: 'hospital',
    admission: 'hospital',
    emergency: 'hospital',
    antenatal_care: 'hospital',
    maternity_care: 'hospital',
    physiotherapy: 'hospital',
    dental_care: 'hospital',
    ambulance: 'hospital',
  };
  return mapping[serviceType] || 'doctor';
};

/**
 * Send an email notification to an assigned provider.
 * Fire-and-forget — failure is warned but never bubbles up.
 */
const notifyProviderByEmail = (email, firstName, { requestId, serviceType, patientCity, priority }) => {
  if (!email) return;
  sendEmail({
    to: email,
    subject: 'New Service Request — LifeLine Pro',
    template: 'service_request',
    data: {
      providerName: firstName || 'Provider',
      serviceType,
      patientCity: patientCity || '',
      requestId,
      priority: priority || 'normal',
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3003'}/provider/requests`,
    },
  }).catch(err => logger.warn('Service request email failed', { error: err.message, requestId }));
};

/**
 * Create a service request and auto-assign via round-robin
 */
export const createRequest = async (patientId, requestData) => {
  const { serviceType, description, preferredDate, priority, preferredProviderId, preferredProviderType } = requestData;

  // Get patient's city/state from their user record
  const patient = await patientRepository.findById(patientId);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }

  // Get patient's city from the users table
  const { default: database } = await import('../database/connection.js');
  const userResult = await database.query(
    `SELECT city, state FROM users WHERE id = $1`,
    [patient.user_id]
  );
  const user = userResult.rows[0];

  if (!user || !user.city) {
    throw new BusinessLogicError('Your profile must have a city set before requesting services. Please update your profile.');
  }

  const providerType = getProviderTypeForService(serviceType);

  // Create the request
  const request = await serviceRequestRepository.createServiceRequest({
    patientId,
    serviceType,
    providerType,
    city: user.city,
    state: user.state || '',
    description,
    preferredDate,
    priority,
  });

  // Attempt assignment: use preferred provider if specified, otherwise auto-assign via round-robin
  let assigned = null;
  if (preferredProviderId) {
    // Directly assign the chosen provider, bypassing round-robin.
    // Wrap in transaction so the counter increment is atomic with the status update.
    await database.transaction(async () => {
      await serviceRequestRepository.updateStatus(request.id, 'assigned', {
        assignedProviderId: preferredProviderId,
      });
      await serviceRequestRepository.incrementAssignmentCounter(
        preferredProviderId,
        preferredProviderType || providerType,
        user.city
      );
    });
    assigned = { provider_id: preferredProviderId };
    logger.info('Service request directly assigned to preferred provider', {
      requestId: request.id,
      preferredProviderId,
    });
    // Notify the preferred provider (socket + email)
    const providerInfo = await serviceRequestRepository.getProviderUserInfo(
      preferredProviderId,
      preferredProviderType || providerType
    );
    if (providerInfo) {
      notifyUser(providerInfo.userId, 'service_request:new', {
        requestId: request.id,
        serviceType,
        priority,
        patientCity: user.city,
      });
      notifyProviderByEmail(providerInfo.email, providerInfo.firstName, {
        requestId: request.id,
        serviceType,
        patientCity: user.city,
        priority,
      });
    }
  } else {
    assigned = await assignProviderRoundRobin(request.id, user.city, providerType);
    if (assigned) {
      logger.info('Service request auto-assigned', {
        requestId: request.id,
        providerId: assigned.provider_id,
        providerType,
      });
      // assigned.user_id / email / first_name are returned by getVerifiedProvidersByCity
      if (assigned.user_id) {
        notifyUser(assigned.user_id, 'service_request:new', {
          requestId: request.id,
          serviceType,
          priority,
          patientCity: user.city,
        });
        notifyProviderByEmail(assigned.email, assigned.first_name, {
          requestId: request.id,
          serviceType,
          patientCity: user.city,
          priority,
        });
      }
    } else {
      logger.warn('No verified providers available for auto-assignment', {
        requestId: request.id,
        city: user.city,
        providerType,
      });
    }
  }

  return await serviceRequestRepository.findById(request.id);
};

/**
 * Round-robin provider assignment — wrapped in a transaction.
 *
 * SQLite: BEGIN IMMEDIATE acquires a write lock before the SELECT, so concurrent
 * calls block until the first finishes — no two requests can read the same counters
 * and select the same provider simultaneously.
 *
 * PostgreSQL (future): For true serialization, upgrade the query in
 * getVerifiedProvidersByCity to use SELECT ... FOR UPDATE within the same
 * pg client passed from the transaction callback.
 */
const assignProviderRoundRobin = async (requestId, city, providerType) => {
  return await database.transaction(async () => {
    const providers = await serviceRequestRepository.getVerifiedProvidersByCity(city, providerType);

    if (providers.length === 0) {
      return null;
    }

    // Find the first provider with assignments below the max concurrent limit
    // Max concurrent assignments per provider (configurable, default 10)
    const maxConcurrentAssignments = parseInt(process.env.MAX_CONCURRENT_ASSIGNMENTS) || 10;

    let selectedProvider = null;
    for (const provider of providers) {
      // Get current pending/assigned requests for this provider
      const currentCount = await serviceRequestRepository.getProviderActiveRequests(
        provider.provider_id,
        providerType
      );

      if (currentCount < maxConcurrentAssignments) {
        selectedProvider = provider;
        break;
      }
    }

    if (!selectedProvider) {
      logger.warn('No available providers with capacity for assignment', {
        requestId,
        city,
        providerType,
        maxConcurrent: maxConcurrentAssignments,
      });
      return null;
    }

    await serviceRequestRepository.updateStatus(requestId, 'assigned', {
      assignedProviderId: selectedProvider.provider_id,
    });

    await serviceRequestRepository.incrementAssignmentCounter(
      selectedProvider.provider_id,
      providerType,
      city
    );

    return selectedProvider;
  });
};

/**
 * Provider accepts a service request
 */
export const acceptRequest = async (requestId, providerId) => {
  const request = await serviceRequestRepository.findById(requestId);
  if (!request) {
    throw new NotFoundError('Service request not found');
  }

  if (request.assigned_provider_id !== providerId) {
    throw new BusinessLogicError('This request is not assigned to you');
  }

  if (request.status !== 'assigned') {
    throw new BusinessLogicError(`Cannot accept a request with status: ${request.status}`);
  }

  return await serviceRequestRepository.updateStatus(requestId, 'accepted');
};

/**
 * Provider rejects a service request — re-assigns to next provider
 */
export const rejectRequest = async (requestId, providerId, reason) => {
  const request = await serviceRequestRepository.findById(requestId);
  if (!request) {
    throw new NotFoundError('Service request not found');
  }

  if (request.assigned_provider_id !== providerId) {
    throw new BusinessLogicError('This request is not assigned to you');
  }

  if (request.status !== 'assigned') {
    throw new BusinessLogicError(`Cannot reject a request with status: ${request.status}`);
  }

  // Mark as pending and try to reassign to next provider
  await serviceRequestRepository.updateStatus(requestId, 'pending', {
    assignedProviderId: null,
    rejectionReason: reason,
  });

  // Try to reassign (excluding the rejecting provider — they already have incremented counter)
  const reassigned = await assignProviderRoundRobin(requestId, request.city, request.provider_type);

  if (reassigned) {
    if (reassigned.user_id) {
      notifyUser(reassigned.user_id, 'service_request:new', {
        requestId,
        serviceType: request.service_type,
        priority: request.priority,
        patientCity: request.city,
      });
      notifyProviderByEmail(reassigned.email, reassigned.first_name, {
        requestId,
        serviceType: request.service_type,
        patientCity: request.city,
        priority: request.priority,
      });
    }
  } else {
    logger.warn('No alternative provider available after rejection', { requestId });
  }

  return await serviceRequestRepository.findById(requestId);
};

/**
 * Mark a request as in-progress
 */
export const startRequest = async (requestId, providerId) => {
  const request = await serviceRequestRepository.findById(requestId);
  if (!request) {
    throw new NotFoundError('Service request not found');
  }

  if (request.assigned_provider_id !== providerId) {
    throw new BusinessLogicError('This request is not assigned to you');
  }

  if (request.status !== 'accepted') {
    throw new BusinessLogicError(`Cannot start a request with status: ${request.status}`);
  }

  return await serviceRequestRepository.updateStatus(requestId, 'in_progress');
};

/**
 * Complete a service request
 * Creates a payment record with the provider's charge (fee) when completed
 */
export const completeRequest = async (requestId, providerId, consultationId = null) => {
  const request = await serviceRequestRepository.findById(requestId);
  if (!request) {
    throw new NotFoundError('Service request not found');
  }

  if (request.assigned_provider_id !== providerId) {
    throw new BusinessLogicError('This request is not assigned to you');
  }

  if (!['accepted', 'in_progress'].includes(request.status)) {
    throw new BusinessLogicError(`Cannot complete a request with status: ${request.status}`);
  }

  // Get the patient's subscription info for pricing
  const patient = await patientRepository.findById(request.patient_id);
  if (!patient) {
    throw new NotFoundError('Patient');
  }

  // Determine the charge based on the service type and patient's package
  // This uses the pricing table - patients don't pay, but providers get compensated
  const { default: pricingRepository } = await import('../models/pricingRepository.js');
  
  let providerShare = 0;
  let platformFee = 0;
  let pricingDescription = `${request.service_type} service`;

  try {
    const pricing = await pricingRepository.getSpecificPricing(request.service_type, patient.current_package);
    providerShare = pricing.provider_share;
    platformFee = pricing.platform_fee;
    pricingDescription = pricing.description || pricingDescription;
  } catch (pricingErr) {
    // If pricing not configured for this service/package combo, log warning
    // but still complete the request — admin can reconcile manually
    logger.warn('No pricing configured for service — payment record will have zero amount', {
      serviceType: request.service_type,
      packageType: patient.current_package,
      error: pricingErr.message,
    });
  }

  // Create a payment record for this completed service
  const paymentReference = `SVC_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
  
  await paymentRepository.createPayment({
    patientId: request.patient_id,
    providerId: request.assigned_provider_id,
    providerType: request.provider_type,
    amount: providerShare,
    paymentMethod: 'subscription',
    paymentType: request.service_type,
    paymentReference,
    description: `${request.service_type} service for ${patient.lifeline_id} - ${pricingDescription}`,
    status: 'completed',
    metadata: {
      serviceRequestId: request.id,
      consultationId,
      patientPackage: patient.current_package,
      platformFee,
      providerShare,
    },
  });

  logger.info('Service completed and payment record created', {
    requestId: request.id,
    paymentReference,
    providerId: request.assigned_provider_id,
    patientId: request.patient_id,
    amount: providerShare,
  });

  return await serviceRequestRepository.updateStatus(requestId, 'completed', { consultationId });
};

/**
 * Patient cancels a service request
 */
export const cancelRequest = async (requestId, patientId, reason) => {
  const request = await serviceRequestRepository.findById(requestId);
  if (!request) {
    throw new NotFoundError('Service request not found');
  }

  if (request.patient_id !== patientId) {
    throw new BusinessLogicError('This request does not belong to you');
  }

  if (['completed', 'cancelled'].includes(request.status)) {
    throw new BusinessLogicError(`Cannot cancel a request with status: ${request.status}`);
  }

  return await serviceRequestRepository.updateStatus(requestId, 'cancelled', {
    cancellationReason: reason,
  });
};

/**
 * Get patient's service requests
 */
export const getPatientRequests = async (patientId, status = null) => {
  return await serviceRequestRepository.findByPatientId(patientId, status);
};

/**
 * Get provider's assigned service requests
 */
export const getProviderRequests = async (providerId, providerType, status = null) => {
  return await serviceRequestRepository.findByProviderId(providerId, providerType, status);
};

/**
 * Get queue statistics (admin)
 */
export const getQueueStats = async () => {
  return await serviceRequestRepository.getQueueStats();
};

/**
 * Reassign stale requests (requests stuck in 'assigned' status for >24 hours)
 * Should be called periodically by cron job
 */
export const reassignStaleRequests = async () => {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const staleRequests = await serviceRequestRepository.findStaleAssignedRequests(cutoff);
    logger.info(`Found ${staleRequests.length} stale requests to reassign`);

    for (const request of staleRequests) {
      try {
        logger.info('Reassigning stale request', { requestId: request.id, assignedAt: request.assigned_at });

        // Mark as pending
        await serviceRequestRepository.updateStatus(request.id, 'pending', {
          assignedProviderId: null,
        });

        // Try to reassign to another provider
        const reassigned = await assignProviderRoundRobin(request.id, request.city, request.provider_type);

        if (reassigned) {
          logger.info('Stale request reassigned', {
            requestId: request.id,
            newProviderId: reassigned.provider_id,
          });
        } else {
          logger.warn('No providers available for stale request reassignment', {
            requestId: request.id,
            city: request.city,
            providerType: request.provider_type,
          });
        }
      } catch (err) {
        logger.error('Failed to reassign stale request', {
          requestId: request.id,
          error: err.message,
        });
      }
    }

    logger.info('Stale request reassignment completed');
  } catch (error) {
    logger.error('Error reassigning stale requests', { error: error.message });
  }
};

export default {
  createRequest,
  acceptRequest,
  rejectRequest,
  startRequest,
  completeRequest,
  cancelRequest,
  getPatientRequests,
  getProviderRequests,
  getQueueStats,
  reassignStaleRequests,
};
