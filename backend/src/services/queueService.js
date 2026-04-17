import * as serviceRequestRepository from '../models/serviceRequestRepository.js';
import * as patientRepository from '../models/patientRepository.js';
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
    consultation: 'doctor',
    prescription: 'doctor',
    drug_dispensing: 'pharmacy',
    minor_surgery: 'hospital',
    major_surgery: 'hospital',
    laboratory_test: 'hospital',
    imaging: 'hospital',
    admission: 'hospital',
    emergency: 'hospital',
  };
  return mapping[serviceType] || 'doctor';
};

/**
 * Create a service request and auto-assign via round-robin
 */
export const createRequest = async (patientId, requestData) => {
  const { serviceType, description, preferredDate, priority } = requestData;

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

  // Attempt auto-assignment via round-robin
  const assigned = await assignProviderRoundRobin(request.id, user.city, providerType);

  if (assigned) {
    logger.info('Service request auto-assigned', {
      requestId: request.id,
      providerId: assigned.provider_id,
      providerType,
    });
    return await serviceRequestRepository.findById(request.id);
  }

  logger.warn('No verified providers available for auto-assignment', {
    requestId: request.id,
    city: user.city,
    providerType,
  });

  return request;
};

/**
 * Round-robin provider assignment
 * Selects the verified provider in the patient's city with the fewest assignments
 */
const assignProviderRoundRobin = async (requestId, city, providerType) => {
  const providers = await serviceRequestRepository.getVerifiedProvidersByCity(city, providerType);

  if (providers.length === 0) {
    return null;
  }

  // First provider has the lowest assignment count (already sorted by query)
  const selectedProvider = providers[0];

  // Assign the provider
  await serviceRequestRepository.updateStatus(requestId, 'assigned', {
    assignedProviderId: selectedProvider.provider_id,
  });

  // Increment their assignment counter
  await serviceRequestRepository.incrementAssignmentCounter(
    selectedProvider.provider_id,
    providerType,
    city
  );

  return selectedProvider;
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

  if (!reassigned) {
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
};
