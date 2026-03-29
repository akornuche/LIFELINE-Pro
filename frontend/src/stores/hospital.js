import { defineStore } from 'pinia';
import { hospitalService } from '@/services';
import { useAuthStore } from '@/stores/auth';

export const useHospitalStore = defineStore('hospital', {
  state: () => ({
    profile: null,
    surgeries: [],
    beds: [],
    payments: [],
    statistics: null,
    loading: false,
    error: null
  }),

  getters: {
    isVerified: (state) => state.profile?.is_verified || false,
    totalRevenue: (state) => state.statistics?.totalRevenue || 0,
    totalSurgeries: (state) => state.statistics?.totalSurgeries || 0,
    availableBeds: (state) => state.beds.filter(b => b.status === 'available').length
  },

  actions: {
    async getProfile() {
      this.loading = true;
      try {
        const response = await hospitalService.getProfile();
        this.profile = response.data;
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
      try {
        const response = await hospitalService.updateProfile(profileData);
        this.profile = response.data || response;
        const authStore = useAuthStore();
        authStore.patchUser({
          full_name: profileData.hospitalName || profileData.hospital_name || this.profile?.hospital_name,
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
      try {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await hospitalService.uploadLogo(formData);
        const logoUrl = response.data?.logo_url || response.data?.logo;
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

    async getSurgeries(params = {}) {
      this.loading = true;
      try {
        const response = await hospitalService.getSurgeries(params);
        this.surgeries = response.data?.surgeries || response.data || [];
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load surgeries';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getSurgery(id) {
      this.loading = true;
      try {
        const response = await hospitalService.getSurgery(id);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load surgery';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createSurgery(surgeryData) {
      this.loading = true;
      try {
        const response = await hospitalService.createSurgery(surgeryData);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create surgery';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateSurgery(id, surgeryData) {
      this.loading = true;
      try {
        const response = await hospitalService.updateSurgery(id, surgeryData);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update surgery';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getBeds(params = {}) {
      this.loading = true;
      try {
        const response = await hospitalService.getBeds(params);
        this.beds = response.data?.beds || response.data || [];
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load beds';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateBed(id, bedData) {
      this.loading = true;
      try {
        const response = await hospitalService.updateBed(id, bedData);
        const updatedBed = response.data;
        const index = this.beds.findIndex(b => b.id === id);
        if (index !== -1) this.beds[index] = updatedBed;
        return updatedBed;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update bed';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getPayments(params = {}) {
      this.loading = true;
      try {
        const response = await hospitalService.getPayments(params);
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
      try {
        const response = await hospitalService.downloadPaymentStatement(params);
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

    async getStatistics() {
      this.loading = true;
      try {
        const response = await hospitalService.getStatistics();
        this.statistics = response.data;
        return this.statistics;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load statistics';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(settings) {
      this.loading = true;
      try {
        const response = await hospitalService.updateSettings(settings);
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
