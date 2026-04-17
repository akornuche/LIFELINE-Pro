import { defineStore } from 'pinia';
import apiClient from '@/services/api';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    patients: [],
    doctors: [],
    pharmacies: [],
    hospitals: [],
    verifications: [],
    payments: [],
    statistics: {},
    loading: false,
    error: null,
  }),

  getters: {
    totalUsers: (state) => state.users.length,
    totalPatients: (state) => state.patients.length,
    totalDoctors: (state) => state.doctors.length,
    totalPharmacies: (state) => state.pharmacies.length,
    totalHospitals: (state) => state.hospitals.length,
    pendingVerifications: (state) => state.verifications.filter(v => v.status === 'pending').length,
    totalRevenue: (state) => state.statistics.totalRevenue || 0,
  },

  actions: {
    // Users
    async getUsers(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get('/admin/users', { params });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getUser(id) {
      try {
        const response = await apiClient.get(`/admin/users/${id}`);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async updateUser(id, userData) {
      try {
        const response = await apiClient.put(`/admin/users/${id}`, userData);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async deactivateUser(id) {
      try {
        const response = await apiClient.post(`/admin/users/${id}/deactivate`);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async activateUser(id) {
      try {
        const response = await apiClient.post(`/admin/users/${id}/activate`);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Patients
    async getPatients(params = {}) {
      try {
        const response = await apiClient.get('/admin/patients', { params });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Doctors
    async getDoctors(params = {}) {
      try {
        const response = await apiClient.get('/admin/doctors', { params });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Pharmacies
    async getPharmacies(params = {}) {
      try {
        const response = await apiClient.get('/admin/pharmacies', { params });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Hospitals
    async getHospitals(params = {}) {
      try {
        const response = await apiClient.get('/admin/hospitals', { params });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Verifications
    async getVerifications(params = {}) {
      try {
        const response = await apiClient.get('/admin/verifications', { params });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async verifyProvider(id, verificationData) {
      try {
        const response = await apiClient.post(`/admin/verifications/${id}/verify`, verificationData);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async rejectVerification(id, reason, providerType) {
      try {
        const response = await apiClient.post(`/admin/verifications/${id}/reject`, { reason, providerType });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Payments
    async getPayments(params = {}) {
      try {
        const response = await apiClient.get('/admin/payments', { params });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async getPayment(id) {
      try {
        const response = await apiClient.get(`/admin/payments/${id}`);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Statements
    async getStatements(params = {}) {
      try {
        const response = await apiClient.get('/admin/statements', { params });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async downloadStatement(id) {
      try {
        const response = await apiClient.get(`/admin/statements/${id}/download`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `statement-${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Statistics
    async getStatistics(params = {}) {
      try {
        const response = await apiClient.get('/admin/statistics', { params });
        this.statistics = response.data || response;
        return this.statistics;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Settings
    async getSettings() {
      try {
        const response = await apiClient.get('/admin/settings');
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async updateSettings(settings) {
      try {
        const response = await apiClient.put('/admin/settings', settings);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Analytics time-series
    async getTimeSeries(params = {}) {
      try {
        const response = await apiClient.get('/admin/analytics/time-series', { params });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Patient export
    async exportPatient(id) {
      try {
        const response = await apiClient.get(`/admin/patients/${id}/export`);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },
  },
});
