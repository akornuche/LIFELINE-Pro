import apiClient from './api';

/**
 * Authentication Service
 */
export const authService = {
  // Register new user
  register(data) {
    return apiClient.post('/auth/register', data);
  },

  // Login user
  login(credentials) {
    return apiClient.post('/auth/login', credentials);
  },

  // Refresh access token
  refreshToken(refreshToken) {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  // Logout user
  logout() {
    return apiClient.post('/auth/logout');
  },

  // Request password reset
  forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword(data) {
    return apiClient.post('/auth/reset-password', data);
  },

  // Change password
  changePassword(data) {
    return apiClient.post('/auth/change-password', data);
  },

  // Verify email
  verifyEmail(token) {
    return apiClient.get(`/auth/verify-email/${token}`);
  },

  // Resend verification email
  resendVerification() {
    return apiClient.post('/auth/resend-verification');
  },

  // Get current user
  getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  // Update profile
  updateProfile(data) {
    return apiClient.put('/auth/profile', data);
  },

  // Deactivate account
  deactivateAccount() {
    return apiClient.post('/auth/deactivate');
  }
};

/**
 * Patient Service
 */
export const patientService = {
  // Get patient profile
  getProfile() {
    return apiClient.get('/patients/profile');
  },

  // Update patient profile
  updateProfile(data) {
    return apiClient.put('/patients/profile', data);
  },

  // Subscription management
  createSubscription(data) {
    return apiClient.post('/patients/subscriptions', data);
  },

  getSubscription() {
    return apiClient.get('/patients/subscriptions');
  },

  updateSubscription(data) {
    return apiClient.put('/patients/subscriptions', data);
  },

  cancelSubscription() {
    return apiClient.delete('/patients/subscriptions');
  },

  // Dependent management
  addDependent(data) {
    return apiClient.post('/patients/dependents', data);
  },

  getDependents() {
    return apiClient.get('/patients/dependents');
  },

  updateDependent(id, data) {
    return apiClient.put(`/patients/dependents/${id}`, data);
  },

  removeDependent(id) {
    return apiClient.delete(`/patients/dependents/${id}`);
  },

  // Medical history
  getMedicalHistory(params) {
    return apiClient.get('/patients/medical-history', { params });
  },

  getUsageStatistics() {
    return apiClient.get('/patients/usage-statistics');
  },

  // Search (admin only)
  searchPatients(params) {
    return apiClient.get('/patients/search', { params });
  },

  getPatientById(id) {
    return apiClient.get(`/patients/${id}`);
  }
};

/**
 * Doctor Service
 */
export const doctorService = {
  // Profile management
  getProfile() {
    return apiClient.get('/doctors/profile');
  },

  updateProfile(data) {
    return apiClient.put('/doctors/profile', data);
  },

  updateLicense(data) {
    return apiClient.put('/doctors/license', data);
  },

  // Consultations
  getConsultations(params) {
    return apiClient.get('/doctors/consultations', { params });
  },

  createConsultation(data) {
    return apiClient.post('/doctors/consultations', data);
  },

  updateConsultation(id, data) {
    return apiClient.put(`/doctors/consultations/${id}`, data);
  },

  // Prescriptions
  createPrescription(data) {
    return apiClient.post('/doctors/prescriptions', data);
  },

  // Statistics
  getStatistics() {
    return apiClient.get('/doctors/statistics');
  },

  // Search
  searchDoctors(params) {
    return apiClient.get('/doctors/search', { params });
  },

  getDoctorsBySpecialization(specialization) {
    return apiClient.get(`/doctors/specialization/${specialization}`);
  },

  getTopRatedDoctors(params) {
    return apiClient.get('/doctors/top-rated', { params });
  },

  getDoctorById(id) {
    return apiClient.get(`/doctors/${id}`);
  },

  // Verification (admin)
  updateVerification(id, data) {
    return apiClient.put(`/doctors/${id}/verification`, data);
  },

  // Rating (patient)
  rateDoctor(id, data) {
    return apiClient.post(`/doctors/${id}/rating`, data);
  }
};

/**
 * Pharmacy Service
 */
export const pharmacyService = {
  // Profile management
  getProfile() {
    return apiClient.get('/pharmacies/profile');
  },

  updateProfile(data) {
    return apiClient.put('/pharmacies/profile', data);
  },

  updateLicense(data) {
    return apiClient.put('/pharmacies/license', data);
  },

  // Prescriptions
  getPrescriptions(params) {
    return apiClient.get('/pharmacies/prescriptions', { params });
  },

  dispensePrescription(id, data) {
    return apiClient.post(`/pharmacies/prescriptions/${id}/dispense`, data);
  },

  verifyPrescription(id) {
    return apiClient.get(`/pharmacies/prescriptions/${id}/verify`);
  },

  checkEligibility(id) {
    return apiClient.get(`/pharmacies/prescriptions/${id}/eligibility`);
  },

  // Statistics
  getStatistics() {
    return apiClient.get('/pharmacies/statistics');
  },

  // Search
  searchPharmacies(params) {
    return apiClient.get('/pharmacies/search', { params });
  },

  findByLocation(params) {
    return apiClient.get('/pharmacies/location', { params });
  },

  getPharmaciesWithDelivery(params) {
    return apiClient.get('/pharmacies/with-delivery', { params });
  },

  getTopRatedPharmacies(params) {
    return apiClient.get('/pharmacies/top-rated', { params });
  },

  getPharmacyById(id) {
    return apiClient.get(`/pharmacies/${id}`);
  },

  // Verification (admin)
  updateVerification(id, data) {
    return apiClient.put(`/pharmacies/${id}/verification`, data);
  },

  // Rating (patient)
  ratePharmacy(id, data) {
    return apiClient.post(`/pharmacies/${id}/rating`, data);
  }
};

/**
 * Hospital Service
 */
export const hospitalService = {
  // Profile management
  getProfile() {
    return apiClient.get('/hospitals/profile');
  },

  updateProfile(data) {
    return apiClient.put('/hospitals/profile', data);
  },

  updateBedAvailability(data) {
    return apiClient.put('/hospitals/beds', data);
  },

  updateLicense(data) {
    return apiClient.put('/hospitals/license', data);
  },

  // Surgeries
  getSurgeries(params) {
    return apiClient.get('/hospitals/surgeries', { params });
  },

  scheduleSurgery(data) {
    return apiClient.post('/hospitals/surgeries', data);
  },

  updateSurgery(id, data) {
    return apiClient.put(`/hospitals/surgeries/${id}`, data);
  },

  completeSurgery(id, data) {
    return apiClient.post(`/hospitals/surgeries/${id}/complete`, data);
  },

  // Statistics
  getStatistics() {
    return apiClient.get('/hospitals/statistics');
  },

  // Search
  searchHospitals(params) {
    return apiClient.get('/hospitals/search', { params });
  },

  findByLocation(params) {
    return apiClient.get('/hospitals/location', { params });
  },

  getHospitalsWithEmergency(params) {
    return apiClient.get('/hospitals/with-emergency', { params });
  },

  getHospitalsWithAvailableBeds(params) {
    return apiClient.get('/hospitals/with-available-beds', { params });
  },

  getTopRatedHospitals(params) {
    return apiClient.get('/hospitals/top-rated', { params });
  },

  getHospitalById(id) {
    return apiClient.get(`/hospitals/${id}`);
  },

  // Verification (admin)
  updateVerification(id, data) {
    return apiClient.put(`/hospitals/${id}/verification`, data);
  },

  // Rating (patient)
  rateHospital(id, data) {
    return apiClient.post(`/hospitals/${id}/rating`, data);
  }
};

/**
 * Payment Service
 */
export const paymentService = {
  // Initialize payment
  initializePayment(data) {
    return apiClient.post('/payments/initialize', data);
  },

  // Verify payment
  verifyPayment(reference) {
    return apiClient.get(`/payments/verify/${reference}`);
  },

  // Payment history
  getPaymentHistory(params) {
    return apiClient.get('/payments/history', { params });
  },

  // Provider payments
  getProviderPayments(params) {
    return apiClient.get('/payments/provider', { params });
  },

  // Statements
  generateStatement(data) {
    return apiClient.post('/payments/statements/generate', data);
  },

  getStatements(params) {
    return apiClient.get('/payments/statements', { params });
  },

  getStatementById(id) {
    return apiClient.get(`/payments/statements/${id}`);
  },

  getPendingStatements(params) {
    return apiClient.get('/payments/statements/pending', { params });
  },

  approveStatement(id) {
    return apiClient.post(`/payments/statements/${id}/approve`);
  },

  rejectStatement(id, data) {
    return apiClient.post(`/payments/statements/${id}/reject`, data);
  },

  // Admin analytics
  calculateRevenue(params) {
    return apiClient.get('/payments/revenue', { params });
  },

  getPaymentAnalytics(params) {
    return apiClient.get('/payments/analytics', { params });
  },

  getOverduePayments(params) {
    return apiClient.get('/payments/overdue', { params });
  },

  // Refund
  processRefund(id, data) {
    return apiClient.post(`/payments/${id}/refund`, data);
  }
};
