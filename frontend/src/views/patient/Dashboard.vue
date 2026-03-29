<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Welcome back, {{ authStore.user?.first_name }}!</h1>
      <p class="text-gray-600 mt-2">Here's what's happening with your health today</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <div class="dashboard-grid">
        <SkeletonLoader type="card" v-for="i in 3" :key="i" />
      </div>
      <SkeletonLoader type="card" />
      <SkeletonLoader type="table" :rows="5" />
    </div>

    <!-- Content -->
    <div v-else class="animate-fade-in">
      <!-- Subscription Warning Reminder -->
      <div v-if="patientStore.hasActiveSubscription && patientStore.daysRemaining <= 30" class="mb-8 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg shadow-sm animate-pulse">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <ClockIcon class="h-6 w-6 text-orange-600 mr-3" />
            <div>
              <p class="text-orange-800 font-bold">Subscription Expiring Soon!</p>
              <p class="text-orange-700 text-sm">Your {{ patientStore.packageType }} plan expires in <span class="font-black">{{ patientStore.daysRemaining }} days</span>. Renew now to avoid service interruption.</p>
            </div>
          </div>
          <RouterLink to="/patient/subscription" class="btn btn-sm bg-orange-600 hover:bg-orange-700 text-white border-none">
            Renew Now
          </RouterLink>
        </div>
      </div>
    <!-- Quick Stats -->
    <div class="dashboard-grid mb-8">
      <div class="stat-card">
        <div class="stat-card-content">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Current Package</p>
              <p class="stat-value text-2xl capitalize">{{ patientStore.packageType || 'None' }}</p>
            </div>
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <CreditCardIcon class="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-content">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Dependents</p>
              <p class="stat-value text-2xl">{{ patientStore.dependentCount }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UsersIcon class="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-content">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Status</p>
              <p class="stat-value text-2xl">
                <span :class="patientStore.hasActiveSubscription ? 'text-green-600' : 'text-red-600'">
                  {{ patientStore.hasActiveSubscription ? 'Active' : 'Inactive' }}
                </span>
              </p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon class="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card mb-8">
      <div class="card-header">
        <h2 class="text-xl font-semibold">Quick Actions</h2>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RouterLink
            to="/patient/find-doctor"
            class="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-900">Find Doctor</span>
          </RouterLink>

          <RouterLink
            to="/patient/find-pharmacy"
            class="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-900">Find Pharmacy</span>
          </RouterLink>

          <RouterLink
            to="/patient/find-hospital"
            class="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-900">Find Hospital</span>
          </RouterLink>

          <RouterLink
            to="/patient/subscription"
            class="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
              <CreditCardIcon class="w-6 h-6 text-yellow-600" />
            </div>
            <span class="text-sm font-medium text-gray-900">Manage Plan</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-xl font-semibold">Recent Activity</h2>
      </div>
      <div class="card-body">
        <div v-if="!medicalHistory.length" class="text-center py-8 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="font-medium">No recent activity</p>
          <p class="text-sm mt-1">Your medical history will appear here</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="item in medicalHistory.slice(0, 5)"
            :key="item.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center">
              <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <DocumentTextIcon class="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ item.type }}</p>
                <p class="text-sm text-gray-500">{{ formatDate(item.date) }}</p>
              </div>
            </div>
            <span class="badge badge-success">Completed</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usePatientStore } from '@/stores/patient';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import {
  CreditCardIcon,
  UsersIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const authStore = useAuthStore();
const patientStore = usePatientStore();
const { error: showError } = useToast();

const loading = ref(true);
const medicalHistory = ref([]);

onMounted(async () => {
  try {
    await Promise.all([
      patientStore.fetchProfile(),
      patientStore.fetchSubscription(),
      patientStore.fetchDependents(),
      loadRecentActivity()
    ]);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    showError('Failed to load dashboard. Please refresh the page.');
  } finally {
    loading.value = false;
  }
});

const loadRecentActivity = async () => {
  try {
    await patientStore.fetchMedicalHistory({ limit: 5 });
    // The store already assigns to its own medicalHistory state
    // Use the store's data or build from the various history arrays
    const history = patientStore.medicalHistory;
    if (Array.isArray(history)) {
      medicalHistory.value = history;
    } else if (history && typeof history === 'object') {
      // Flatten the different history types into a single array
      medicalHistory.value = [
        ...(history.consultations || []).map(c => ({ ...c, type: 'Consultation' })),
        ...(history.prescriptions || []).map(p => ({ ...p, type: 'Prescription' })),
        ...(history.surgeries || []).map(s => ({ ...s, type: 'Surgery' })),
        ...(history.labTests || []).map(l => ({ ...l, type: 'Lab Test' }))
      ].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
       .slice(0, 5);
    }
  } catch (error) {
    console.error('Failed to load recent activity:', error);
  }
};

const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};
</script>
