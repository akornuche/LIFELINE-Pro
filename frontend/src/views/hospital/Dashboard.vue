<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Hospital Dashboard</h1>
    <LoadingSpinner v-if="loading" />
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <BaseCard><div class="flex items-center"><div class="flex-shrink-0"><div class="p-3 bg-red-100 rounded-lg"><ScissorsIcon class="h-8 w-8 text-red-600" /></div></div><div class="ml-4"><p class="text-sm font-medium text-gray-500">Total Surgeries</p><p class="text-2xl font-semibold text-gray-900">{{ stats.totalSurgeries }}</p></div></div></BaseCard>
        <BaseCard><div class="flex items-center"><div class="flex-shrink-0"><div class="p-3 bg-blue-100 rounded-lg"><HomeIcon class="h-8 w-8 text-blue-600" /></div></div><div class="ml-4"><p class="text-sm font-medium text-gray-500">Available Beds</p><p class="text-2xl font-semibold text-gray-900">{{ stats.availableBeds }}/{{ stats.totalBeds }}</p></div></div></BaseCard>
        <BaseCard><div class="flex items-center"><div class="flex-shrink-0"><div class="p-3 bg-green-100 rounded-lg"><UserGroupIcon class="h-8 w-8 text-green-600" /></div></div><div class="ml-4"><p class="text-sm font-medium text-gray-500">Active Patients</p><p class="text-2xl font-semibold text-gray-900">{{ stats.activePatients }}</p></div></div></BaseCard>
        <BaseCard><div class="flex items-center"><div class="flex-shrink-0"><div class="p-3 bg-purple-100 rounded-lg"><CurrencyDollarIcon class="h-8 w-8 text-purple-600" /></div></div><div class="ml-4"><p class="text-sm font-medium text-gray-500">Monthly Revenue</p><p class="text-2xl font-semibold text-gray-900">₦{{ formatMoney(stats.monthlyRevenue) }}</p></div></div></BaseCard>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BaseCard title="Recent Surgeries">
          <div v-if="recentSurgeries.length === 0" class="text-center py-8 text-gray-500">No recent surgeries</div>
          <div v-else>
            <BaseTable :columns="surgeryColumns" :data="recentSurgeries" emptyText="No surgeries">
              <template #cell-patient_name="{ row }"><div><p class="font-medium">{{ row.patient_name }}</p><p class="text-xs text-gray-500">{{ row.surgery_type }}</p></div></template>
              <template #cell-surgery_date="{ value }">{{ formatDate(value) }}</template>
              <template #cell-status="{ value }"><span :class="getStatusBadge(value)">{{ value }}</span></template>
            </BaseTable>
          </div>
          <template #footer><router-link to="/hospital/surgeries" class="text-sm text-red-600 hover:text-red-700 font-medium">View all →</router-link></template>
        </BaseCard>

        <BaseCard title="Bed Occupancy">
          <div class="space-y-4">
            <div v-for="ward in bedOccupancy" :key="ward.name" class="flex items-center justify-between">
              <div class="flex items-center flex-1"><span class="text-sm font-medium text-gray-900">{{ ward.name }}</span><div class="ml-4 flex-1 bg-gray-200 rounded-full h-2"><div class="bg-red-600 h-2 rounded-full" :style="{ width: `${(ward.occupied / ward.total) * 100}%` }"></div></div></div>
              <span class="ml-4 text-sm font-semibold text-gray-900">{{ ward.occupied }}/{{ ward.total }}</span>
            </div>
          </div>
          <template #footer><router-link to="/hospital/beds" class="text-sm text-red-600 hover:text-red-700 font-medium">Manage beds →</router-link></template>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseTable, LoadingSpinner } from '@/components';
import { ScissorsIcon, HomeIcon, UserGroupIcon, CurrencyDollarIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const hospitalStore = useHospitalStore();
const loading = ref(true);
const stats = ref({ totalSurgeries: 0, availableBeds: 0, totalBeds: 0, activePatients: 0, monthlyRevenue: 0 });
const recentSurgeries = ref([]);
const bedOccupancy = ref([]);
const surgeryColumns = [{ key: 'patient_name', label: 'Patient' }, { key: 'surgery_date', label: 'Date' }, { key: 'status', label: 'Status' }];

onMounted(async () => {
  const [statsData, surgeriesData] = await Promise.all([hospitalStore.getStatistics(), hospitalStore.getSurgeries({ limit: 5 })]);
  stats.value = statsData;
  recentSurgeries.value = surgeriesData.surgeries || [];
  bedOccupancy.value = statsData.bedOccupancy || [];
  loading.value = false;
});

const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy');
const getStatusBadge = (status) => ({ scheduled: 'badge badge-info', in_progress: 'badge badge-warning', completed: 'badge badge-success', cancelled: 'badge badge-error' }[status] || 'badge');
</script>
