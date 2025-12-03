import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { patientService } from '@/services';
import { toast } from 'vue3-toastify';

export const usePatientStore = defineStore('patient', () => {
  // State
  const profile = ref(null);
  const subscription = ref(null);
  const dependents = ref([]);
  const medicalHistory = ref({
    consultations: [],
    prescriptions: [],
    surgeries: [],
    labTests: []
  });
  const usageStats = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const hasActiveSubscription = computed(() => {
    return subscription.value?.status === 'active';
  });

  const packageType = computed(() => subscription.value?.package_type);

  const dependentCount = computed(() => dependents.value?.length || 0);

  const canAddDependent = computed(() => {
    if (!subscription.value) return false;
    const limits = {
      basic: 2,
      medium: 4,
      advanced: 6
    };
    const maxDependents = limits[subscription.value.package_type] || 0;
    return dependentCount.value < maxDependents;
  });

  // Actions
  async function fetchProfile() {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.getProfile();
      profile.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch profile';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.updateProfile(data);
      profile.value = { ...profile.value, ...response.data };
      toast.success('Profile updated successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Profile update failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSubscription() {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.getSubscription();
      subscription.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch subscription';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createSubscription(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.createSubscription(data);
      subscription.value = response.data;
      toast.success('Subscription created successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Subscription creation failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateSubscription(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.updateSubscription(data);
      subscription.value = response.data;
      toast.success('Subscription updated successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Subscription update failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function cancelSubscription() {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.cancelSubscription();
      subscription.value = null;
      toast.success('Subscription cancelled successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Subscription cancellation failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchDependents() {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.getDependents();
      dependents.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch dependents';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addDependent(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.addDependent(data);
      dependents.value.push(response.data);
      toast.success('Dependent added successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to add dependent';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateDependent(id, data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.updateDependent(id, data);
      const index = dependents.value.findIndex(d => d.id === id);
      if (index !== -1) {
        dependents.value[index] = response.data;
      }
      toast.success('Dependent updated successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update dependent';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function removeDependent(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.removeDependent(id);
      dependents.value = dependents.value.filter(d => d.id !== id);
      toast.success('Dependent removed successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to remove dependent';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMedicalHistory(params = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.getMedicalHistory(params);
      medicalHistory.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch medical history';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUsageStatistics() {
    loading.value = true;
    error.value = null;

    try {
      const response = await patientService.getUsageStatistics();
      usageStats.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch usage statistics';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    profile.value = null;
    subscription.value = null;
    dependents.value = [];
    medicalHistory.value = {
      consultations: [],
      prescriptions: [],
      surgeries: [],
      labTests: []
    };
    usageStats.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    profile,
    subscription,
    dependents,
    medicalHistory,
    usageStats,
    loading,
    error,
    // Getters
    hasActiveSubscription,
    packageType,
    dependentCount,
    canAddDependent,
    // Actions
    fetchProfile,
    updateProfile,
    fetchSubscription,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    fetchDependents,
    addDependent,
    updateDependent,
    removeDependent,
    fetchMedicalHistory,
    fetchUsageStatistics,
    reset
  };
});
