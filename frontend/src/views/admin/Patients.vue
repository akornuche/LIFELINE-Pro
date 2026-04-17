<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Patients</h1>
    <BaseCard class="mb-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><BaseInput v-model="filters.search" placeholder="Search patients..." @input="handleSearch" /><select v-model="filters.package" class="input" @change="loadPatients"><option value="">All Packages</option><option value="GENERAL">General</option><option value="BASIC">Basic</option><option value="STANDARD">Standard</option><option value="PREMIUM">Premium</option></select><BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton></div></BaseCard>
    <BaseCard><BaseTable :columns="columns" :data="patients" :loading="loading" emptyText="No patients found"><template #cell-name="{ row }"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">{{ row.name ? String(row.name).charAt(0) : (row.first_name ? String(row.first_name).charAt(0) : (row.last_name ? String(row.last_name).charAt(0) : '?')) }}</div><div><p class="font-medium">{{ row.name || ((row.first_name || '') + ' ' + (row.last_name || '')).trim() || 'Unnamed' }}</p><p class="text-xs text-gray-500">{{ row.email }}</p></div></div></template><template #cell-package="{ value }"><span :class="getPackageBadge(value)">{{ value }}</span></template><template #cell-status="{ value }"><span :class="value === 'active' ? 'badge badge-success' : 'badge badge-error'">{{ value }}</span></template><template #cell-created_at="{ value }">{{ formatDate(value) }}</template><template #actions="{ row }"><button @click="exportPatient(row.id)" class="text-blue-600 hover:text-blue-700 text-sm font-medium">Export</button></template></BaseTable><div v-if="pagination.totalPages > 1" class="mt-6"><BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" /></div></BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAdminStore } from '@/stores/admin';
import { BaseCard, BaseInput, BaseButton, BaseTable, BasePagination } from '@/components';
import { format } from 'date-fns';

const adminStore = useAdminStore();
const { success, error: showError } = useToast();
const loading = ref(false);
const patients = ref([]);
const filters = ref({ search: '', package: '' });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'name', label: 'Patient' }, { key: 'package', label: 'Package' }, { key: 'status', label: 'Status' }, { key: 'created_at', label: 'Joined' }];

onMounted(() => loadPatients());

const loadPatients = async () => {
  loading.value = true;
  try {
    const data = await adminStore.getPatients({ ...filters.value, page: pagination.value.currentPage, limit: pagination.value.perPage });
    patients.value = Array.isArray(data) ? data : (data.patients || []);
    const totalCount = Array.isArray(data) ? data.length : (data.total || 0);
    const perPage = data.limit || 10;
    const totalPages = Math.ceil(totalCount / perPage);
    pagination.value = { currentPage: data.page || 1, totalPages, total: totalCount, perPage };
  } catch (error) {
    // Error handled by interceptor
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => { pagination.value.currentPage = 1; loadPatients(); };
const handlePageChange = (page) => { pagination.value.currentPage = page; loadPatients(); };
const resetFilters = () => { filters.value = { search: '', package: '' }; pagination.value.currentPage = 1; loadPatients(); };
const exportPatient = async (id) => {
  try {
    const data = await adminStore.exportPatient(id);
    // data is the text content (interceptor strips wrapper for blob-like responses)
    const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `patient-${id}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    success('Patient data exported');
  } catch (e) {
    showError('Failed to export patient data');
  }
};
const formatDate = (dateString) => dateString ? format(new Date(dateString), 'MMM d, yyyy') : 'N/A';
const getPackageBadge = (pkg) => ({ GENERAL: 'badge', BASIC: 'badge badge-info', STANDARD: 'badge badge-warning', PREMIUM: 'badge badge-success' }[pkg] || 'badge');
</script>
