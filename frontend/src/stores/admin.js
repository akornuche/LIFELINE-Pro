import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
        const { data } = await axios.get(`${API_URL}/admin/users`, { params });
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getUser(id) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/users/${id}`);
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async updateUser(id, userData) {
      try {
        const { data } = await axios.put(`${API_URL}/admin/users/${id}`, userData);
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async deactivateUser(id) {
      try {
        const { data } = await axios.post(`${API_URL}/admin/users/${id}/deactivate`);
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Patients
    async getPatients(params = {}) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/patients`, { params });
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Doctors
    async getDoctors(params = {}) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/doctors`, { params });
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Pharmacies
    async getPharmacies(params = {}) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/pharmacies`, { params });
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Hospitals
    async getHospitals(params = {}) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/hospitals`, { params });
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Verifications
    async getVerifications(params = {}) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/verifications`, { params });
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async verifyProvider(id, verificationData) {
      try {
        const { data } = await axios.post(`${API_URL}/admin/verifications/${id}/verify`, verificationData);
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async rejectVerification(id, reason) {
      try {
        const { data } = await axios.post(`${API_URL}/admin/verifications/${id}/reject`, { reason });
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Payments
    async getPayments(params = {}) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/payments`, { params });
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async getPayment(id) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/payments/${id}`);
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Statements
    async getStatements(params = {}) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/statements`, { params });
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async downloadStatement(id) {
      try {
        const { data } = await axios.get(`${API_URL}/admin/statements/${id}/download`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([data]));
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
        const { data } = await axios.get(`${API_URL}/admin/statistics`, { params });
        this.statistics = data;
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    // Settings
    async getSettings() {
      try {
        const { data } = await axios.get(`${API_URL}/admin/settings`);
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },

    async updateSettings(settings) {
      try {
        const { data } = await axios.put(`${API_URL}/admin/settings`, settings);
        return data;
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      }
    },
  },
});
