import { defineStore } from 'pinia';
import { doctorService } from '@/services/api';

export const useDoctorStore = defineStore('doctor', {
  state: () => ({
    profile: null,
    consultations: [],
    prescriptions: [],
    payments: [],
    statistics: null,
    loading: false,
    error: null
  }),

  getters: {
    isVerified: (state) => state.profile?.is_verified || false,
    licenseVerified: (state) => state.profile?.license_verified || false,
    totalEarnings: (state) => state.statistics?.totalEarnings || 0,
    totalPatients: (state) => state.statistics?.totalPatients || 0
  },

  actions: {
    // Profile Management
    async getProfile() {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.getProfile();
        this.profile = response.data.doctor;
        return this.profile;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load profile';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateProfile(profileData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.updateProfile(profileData);
        this.profile = response.data.doctor;
        return this.profile;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update profile';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async uploadProfilePhoto(file) {
      this.loading = true;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append('profile_photo', file);
        const response = await doctorService.uploadProfilePhoto(formData);
        this.profile.profile_photo = response.data.profile_photo;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to upload photo';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Consultations
    async getConsultations(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.getConsultations(params);
        this.consultations = response.data.consultations;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load consultations';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getConsultation(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.getConsultation(id);
        return response.data.consultation;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load consultation';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createConsultation(consultationData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.createConsultation(consultationData);
        return response.data.consultation;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create consultation';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async startConsultation(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.startConsultation(id);
        return response.data.consultation;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to start consultation';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async completeConsultation(id, consultationData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.completeConsultation(id, consultationData);
        return response.data.consultation;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to complete consultation';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async cancelConsultation(id, reason) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.cancelConsultation(id, { reason });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to cancel consultation';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Prescriptions
    async getPrescriptions(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.getPrescriptions(params);
        this.prescriptions = response.data.prescriptions;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load prescriptions';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createPrescription(prescriptionData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.createPrescription(prescriptionData);
        return response.data.prescription;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create prescription';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async downloadPrescription(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.downloadPrescription(id);
        // Handle file download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `prescription_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to download prescription';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Payments
    async getPayments(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.getPayments(params);
        this.payments = response.data.payments;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load payments';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async downloadPaymentStatement(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.downloadPaymentStatement(params);
        // Handle file download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `statement_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to download statement';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Statistics
    async getStatistics() {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.getStatistics();
        this.statistics = response.data;
        return this.statistics;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load statistics';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Settings
    async updateSettings(settings) {
      this.loading = true;
      this.error = null;
      try {
        const response = await doctorService.updateSettings(settings);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update settings';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearError() {
      this.error = null;
    }
  }
});
