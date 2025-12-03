<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Hospitals</h1>
    <BaseCard class="mb-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><BaseInput v-model="filters.search" placeholder="Search hospitals..." @input="handleSearch" /><select v-model="filters.verified" class="input" @change="loadHospitals"><option value="">All Verification</option><option value="true">Verified</option><option value="false">Unverified</option></select><BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton></div></BaseCard>
    <BaseCard><BaseTable :columns="columns" :data="hospitals" :loading="loading" emptyText="No hospitals found"><template #cell-name="{ row }"><div><p class="font-medium">{{ row.name }}</p><p class="text-xs text-gray-500">{{ row.hospital_type }} - {{ row.total_beds }} beds</p></div></template><template #cell-license="{ value }"><span class="font-mono text-sm">{{ value }}</span></template><template #cell-emergency="{ value }"><span :class="value ? 'badge badge-success' : 'badge'">{{ value ? 'Yes' : 'No' }}</span></template><template #cell-verified="{ value }"><span :class="value ? 'badge badge-success' : 'badge badge-warning'">{{ value ? 'Verified' : 'Pending' }}</span></template><template #actions="{ row }"><button v-if="!row.verified" @click="verifyHospital(row.id)" class="text-green-600 hover:text-green-700 text-sm font-medium">Verify</button></template></BaseTable><div v-if="pagination.totalPages > 1" class="mt-6"><BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" /></div></BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAdminStore } from '@/stores/admin';
import { BaseCard, BaseInput, BaseButton, BaseTable, BasePagination } from '@/components';

const adminStore = useAdminStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const hospitals = ref([]);
const filters = ref({ search: '', verified: '' });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'name', label: 'Hospital' }, { key: 'license', label: 'License' }, { key: 'emergency', label: 'Emergency' }, { key: 'verified', label: 'Status' }];

onMounted(() => loadHospitals());

const loadHospitals = async () => {
  loading.value = true;
  try {
    const data = await adminStore.getHospitals({ ...filters.value, page: pagination.value.currentPage, limit: pagination.value.perPage });
    hospitals.value = data.hospitals || [];
    pagination.value = { currentPage: data.currentPage || 1, totalPages: data.totalPages || 1, total: data.total || 0, perPage: data.perPage || 10 };
  } catch (error) {
    showError('Failed to load hospitals');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => { pagination.value.currentPage = 1; loadHospitals(); };
const handlePageChange = (page) => { pagination.value.currentPage = page; loadHospitals(); };
const resetFilters = () => { filters.value = { search: '', verified: '' }; pagination.value.currentPage = 1; loadHospitals(); };
const verifyHospital = async (id) => {
  try {
    await adminStore.verifyProvider(id, { provider_type: 'hospital' });
    success('Hospital verified successfully');
    loadHospitals();
  } catch (error) {
    showError('Failed to verify hospital');
  }
};
</script>
