import { defineStore } from 'pinia';
import { pharmacyService } from '@/services';
import { useAuthStore } from '@/stores/auth';

export const usePharmacyStore = defineStore('pharmacy', {
  state: () => ({
    profile: null,
    prescriptions: [],
    payments: [],
    statistics: null,
    loading: false,
    error: null
  }),

  getters: {
    isVerified: (state) => state.profile?.is_verified || false,
    totalRevenue: (state) => state.statistics?.totalRevenue || 0,
    totalPrescriptions: (state) => state.statistics?.totalPrescriptions || 0
  },

  actions: {
    // Profile Management
    async getProfile() {
      this.loading = true;
      this.error = null;
      try {
        const response = await pharmacyService.getProfile();
        this.profile = response.data || response;
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
        const response = await pharmacyService.updateProfile(profileData);
        this.profile = response.data || response;
        const authStore = useAuthStore();
        authStore.patchUser({
          full_name: profileData.pharmacyName || profileData.pharmacy_name || this.profile?.pharmacy_name,
        });
        return this.profile;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update profile';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async uploadLogo(file) {
      this.loading = true;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await pharmacyService.uploadLogo(formData);
        const logoUrl = response.data?.logo_url || response.logo_url;
        if (this.profile) this.profile.logo = logoUrl;
        const authStore = useAuthStore();
        authStore.patchUser({ profile_picture: logoUrl });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to upload logo';
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
        const response = await pharmacyService.getPrescriptions(params);
        this.prescriptions = response.data?.prescriptions || response.data || [];
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load prescriptions';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getPrescription(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await pharmacyService.getPrescription(id);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load prescription';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async dispensePrescription(id, dispensingData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await pharmacyService.dispensePrescription(id, dispensingData);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to dispense prescription';
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
        const response = await pharmacyService.getPayments(params);
        this.payments = response.data?.payments || response.data || [];
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
        const response = await pharmacyService.downloadPaymentStatement(params);
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
        const response = await pharmacyService.getStatistics();
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
        // updateSettings maps to updateProfile on the backend
        const response = await pharmacyService.updateProfile(settings);
        if (this.profile) {
          this.profile = { ...this.profile, ...(response.data || response) };
        }
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
