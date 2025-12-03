<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Doctors</h1>
    <BaseCard class="mb-6"><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><BaseInput v-model="filters.search" placeholder="Search doctors..." @input="handleSearch" /><BaseInput v-model="filters.specialization" placeholder="Specialization..." @input="handleSearch" /><select v-model="filters.verified" class="input" @change="loadDoctors"><option value="">All Verification</option><option value="true">Verified</option><option value="false">Unverified</option></select><BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton></div></BaseCard>
    <BaseCard><BaseTable :columns="columns" :data="doctors" :loading="loading" emptyText="No doctors found"><template #cell-name="{ row }"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold">{{ row.name.charAt(0) }}</div><div><p class="font-medium">{{ row.name }}</p><p class="text-xs text-gray-500">{{ row.specialization }}</p></div></div></template><template #cell-license="{ value }"><span class="font-mono text-sm">{{ value }}</span></template><template #cell-verified="{ value }"><span :class="value ? 'badge badge-success' : 'badge badge-warning'">{{ value ? 'Verified' : 'Pending' }}</span></template><template #cell-joined_date="{ value }">{{ formatDate(value) }}</template><template #actions="{ row }"><button v-if="!row.verified" @click="verifyDoctor(row.id)" class="text-green-600 hover:text-green-700 text-sm font-medium">Verify</button></template></BaseTable><div v-if="pagination.totalPages > 1" class="mt-6"><BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" /></div></BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAdminStore } from '@/stores/admin';
import { BaseCard, BaseInput, BaseButton, BaseTable, BasePagination } from '@/components';
import { format } from 'date-fns';

const adminStore = useAdminStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const doctors = ref([]);
const filters = ref({ search: '', specialization: '', verified: '' });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'name', label: 'Doctor' }, { key: 'license', label: 'License' }, { key: 'verified', label: 'Status' }, { key: 'joined_date', label: 'Joined' }];

onMounted(() => loadDoctors());

const loadDoctors = async () => {
  loading.value = true;
  try {
    const data = await adminStore.getDoctors({ ...filters.value, page: pagination.value.currentPage, limit: pagination.value.perPage });
    doctors.value = data.doctors || [];
    pagination.value = { currentPage: data.currentPage || 1, totalPages: data.totalPages || 1, total: data.total || 0, perPage: data.perPage || 10 };
  } catch (error) {
    showError('Failed to load doctors');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => { pagination.value.currentPage = 1; loadDoctors(); };
const handlePageChange = (page) => { pagination.value.currentPage = page; loadDoctors(); };
const resetFilters = () => { filters.value = { search: '', specialization: '', verified: '' }; pagination.value.currentPage = 1; loadDoctors(); };
const verifyDoctor = async (id) => {
  try {
    await adminStore.verifyProvider(id, { provider_type: 'doctor' });
    success('Doctor verified successfully');
    loadDoctors();
  } catch (error) {
    showError('Failed to verify doctor');
  }
};
const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy');
</script>
