<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-8"><h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Surgeries</h1><BaseButton @click="$router.push('/hospital/surgeries/new')"><PlusIcon class="h-5 w-5 mr-2" />New Surgery</BaseButton></div>
    <BaseCard class="mb-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><BaseInput v-model="filters.search" placeholder="Search patient..." @input="handleSearch" /><select v-model="filters.status" class="input" @change="loadSurgeries"><option value="">All Status</option><option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton></div></BaseCard>
    <BaseCard><BaseTable :columns="columns" :data="surgeries" :loading="loading" emptyText="No surgeries found"><template #cell-patient_name="{ row }"><div><p class="font-medium">{{ row.patient_name }}</p><p class="text-xs text-gray-500">{{ row.surgery_type }}</p></div></template><template #cell-surgery_date="{ value }">{{ formatDate(value) }}</template><template #cell-surgeon_name="{ value }">{{ value }}</template><template #cell-status="{ value }"><span :class="getStatusBadge(value)">{{ value }}</span></template><template #actions="{ row }"><button @click="$router.push(`/hospital/surgeries/${row.id}`)" class="text-red-600 hover:text-red-700 text-sm font-medium">View</button></template></BaseTable><div v-if="pagination.totalPages > 1" class="mt-6"><BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" /></div></BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseInput, BaseButton, BaseTable, BasePagination } from '@/components';
import { PlusIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const hospitalStore = useHospitalStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const surgeries = ref([]);
const filters = ref({ search: '', status: '' });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'patient_name', label: 'Patient' }, { key: 'surgeon_name', label: 'Surgeon' }, { key: 'surgery_date', label: 'Date' }, { key: 'status', label: 'Status' }];

onMounted(() => loadSurgeries());

const loadSurgeries = async () => {
  loading.value = true;
  try {
    const data = await hospitalStore.getSurgeries({ ...filters.value, page: pagination.value.currentPage, limit: pagination.value.perPage });
    surgeries.value = data.surgeries || [];
    pagination.value = { currentPage: data.currentPage || 1, totalPages: data.totalPages || 1, total: data.total || 0, perPage: data.perPage || 10 };
  } catch (error) {
    showError('Failed to load surgeries');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => { pagination.value.currentPage = 1; loadSurgeries(); };
const handlePageChange = (page) => { pagination.value.currentPage = page; loadSurgeries(); };
const resetFilters = () => { filters.value = { search: '', status: '' }; pagination.value.currentPage = 1; loadSurgeries(); };
const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy h:mm a');
const getStatusBadge = (status) => ({ scheduled: 'badge badge-info', in_progress: 'badge badge-warning', completed: 'badge badge-success', cancelled: 'badge badge-error' }[status] || 'badge');
</script>
