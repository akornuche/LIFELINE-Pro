<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Pharmacy Dashboard</h1>
    
    <LoadingSpinner v-if="loading" />
    
    <div v-else>
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <BaseCard>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="p-3 bg-green-100 rounded-lg">
                <DocumentTextIcon class="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Prescriptions</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.totalPrescriptions }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon class="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Pending</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.pendingPrescriptions }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="p-3 bg-blue-100 rounded-lg">
                <CheckCircleIcon class="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Dispensed Today</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.dispensedToday }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="p-3 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon class="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Revenue (Month)</p>
              <p class="text-2xl font-semibold text-gray-900">₦{{ formatMoney(stats.monthlyRevenue) }}</p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Recent Prescriptions -->
      <BaseCard title="Recent Prescriptions">
        <div v-if="recentPrescriptions.length === 0" class="text-center py-8 text-gray-500">
          No recent prescriptions
        </div>
        <div v-else>
          <BaseTable
            :columns="columns"
            :data="recentPrescriptions"
            emptyText="No prescriptions found"
          >
            <template #cell-patient_name="{ row }">
              <div>
                <p class="font-medium">{{ row.patient_name }}</p>
                <p class="text-xs text-gray-500">{{ row.patient_id }}</p>
              </div>
            </template>

            <template #cell-doctor_name="{ value }">
              <span class="text-sm">{{ value }}</span>
            </template>

            <template #cell-created_at="{ value }">
              {{ formatDate(value) }}
            </template>

            <template #cell-status="{ value }">
              <span :class="getStatusBadge(value)">{{ value }}</span>
            </template>

            <template #actions="{ row }">
              <button
                @click="viewPrescription(row.id)"
                class="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                View
              </button>
            </template>
          </BaseTable>
        </div>
        
        <template #footer>
          <router-link to="/pharmacy/prescriptions" class="text-sm text-green-600 hover:text-green-700 font-medium">
            View all prescriptions →
          </router-link>
        </template>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePharmacyStore } from '@/stores/pharmacy';
import { BaseCard, BaseTable, LoadingSpinner } from '@/components';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const router = useRouter();
const pharmacyStore = usePharmacyStore();

const loading = ref(true);
const stats = ref({
  totalPrescriptions: 0,
  pendingPrescriptions: 0,
  dispensedToday: 0,
  monthlyRevenue: 0
});
const recentPrescriptions = ref([]);

const columns = [
  { key: 'patient_name', label: 'Patient' },
  { key: 'doctor_name', label: 'Doctor' },
  { key: 'created_at', label: 'Date' },
  { key: 'status', label: 'Status' }
];

onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadRecentPrescriptions()
  ]);
  loading.value = false;
});

const loadStats = async () => {
  try {
    const data = await pharmacyStore.getStatistics();
    stats.value = data;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

const loadRecentPrescriptions = async () => {
  try {
    const data = await pharmacyStore.getPrescriptions({ limit: 10 });
    recentPrescriptions.value = data.prescriptions || [];
  } catch (error) {
    console.error('Error loading prescriptions:', error);
  }
};

const viewPrescription = (id) => {
  router.push(`/pharmacy/prescriptions/${id}`);
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount);
};

const formatDate = (dateString) => {
  return format(new Date(dateString), 'MMM d, yyyy');
};

const getStatusBadge = (status) => {
  const badges = {
    pending: 'badge badge-warning',
    dispensed: 'badge badge-success',
    cancelled: 'badge badge-error'
  };
  return badges[status] || 'badge';
};
</script>
