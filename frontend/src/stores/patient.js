import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { patientService } from '@/services';
import { useAuthStore } from '@/stores/auth';
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

  const maxDependents = computed(() => {
    if (!subscription.value) return 0;
    const pkg = subscription.value.package_type?.toLowerCase();
    const limits = {
      general: 4,
      basic: 4,
      standard: 4,
      premium: 6
    };
    return limits[pkg] || 0;
  });

  const daysRemaining = computed(() => {
    if (!subscription.value?.end_date) return 0;
    const end = new Date(subscription.value.end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  const canRenew = computed(() => {
    // Can renew if no active subscription OR within 30 days of expiry
    return !hasActiveSubscription.value || daysRemaining.value <= 30;
  });

  const canAddDependent = computed(() => {
    return dependentCount.value < maxDependents.value;
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
      
      // Update auth store for layout consistency
      const authStore = useAuthStore();
      authStore.patchUser({
        full_name: data.full_name || data.fullName || (data.first_name && `${data.first_name} ${data.last_name || ''}`),
        phone: data.phone || profile.value?.phone
      });
      
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

  async function uploadProfilePhoto(file) {
    loading.value = true;
    error.value = null;

    try {
      const formData = new FormData();
      formData.append('profile_photo', file);
      const response = await patientService.uploadProfilePhoto(formData);
      const photoUrl = response.data?.profile_photo || response.data?.photo_url || response.data;
      if (profile.value) profile.value.profile_photo = photoUrl;
      
      // Sync photo to sidebar
      const authStore = useAuthStore();
      authStore.patchUser({ profile_picture: photoUrl });
      
      toast.success('Profile photo updated');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to upload photo';
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
      // Backend returns { dependents, activeCount, maxAllowed } under response.data
      const payload = response.data;
      if (payload && Array.isArray(payload.dependents)) {
        dependents.value = payload.dependents;
      } else if (Array.isArray(payload)) {
        dependents.value = payload;
      } else {
        dependents.value = [];
      }
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch dependents';
      dependents.value = [];
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
      toast.success('Dependent added successfully');
      // Re-fetch to get up-to-date list from server
      await fetchDependents();
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
      toast.success('Dependent updated successfully');
      // Re-fetch to get up-to-date list from server
      await fetchDependents();
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
      toast.success('Dependent removed successfully');
      // Re-fetch to get up-to-date list from server
      await fetchDependents();
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
      const data = response.data;
      // Backend returns { consultations, prescriptions, surgeries, labTests, dependentHistory }
      // Flatten into a single array with a `type` field for easy filtering
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        medicalHistory.value = [
          ...(data.consultations || []).map(r => ({ ...r, type: 'consultation' })),
          ...(data.prescriptions || []).map(r => ({ ...r, type: 'prescription' })),
          ...(data.surgeries || []).map(r => ({ ...r, type: 'surgery' })),
          ...(data.labTests || []).map(r => ({ ...r, type: 'lab_test' }))
        ].sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
      } else if (Array.isArray(data)) {
        medicalHistory.value = data;
      } else {
        medicalHistory.value = [];
      }
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
    maxDependents,
    canAddDependent,
    daysRemaining,
    canRenew,
    // Actions
    fetchProfile,
    updateProfile,
    uploadProfilePhoto,
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
