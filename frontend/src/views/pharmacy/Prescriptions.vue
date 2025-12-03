<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Prescriptions</h1>

    <BaseCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseInput v-model="filters.search" placeholder="Search patient or drug..." @input="handleSearch" />
        <select v-model="filters.status" class="input" @change="loadPrescriptions">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="dispensed">Dispensed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <BaseButton variant="outline" @click="resetFilters" fullWidth>
          Reset Filters
        </BaseButton>
      </div>
    </BaseCard>

    <BaseCard>
      <BaseTable :columns="columns" :data="prescriptions" :loading="loading" emptyText="No prescriptions found">
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
          <button @click="viewDetails(row.id)" class="text-green-600 hover:text-green-700 text-sm font-medium">
            View
          </button>
        </template>
      </BaseTable>

      <div v-if="pagination.totalPages > 1" class="mt-6">
        <BasePagination
          :current-page="pagination.currentPage"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :per-page="pagination.perPage"
          @page-change="handlePageChange"
        />
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { usePharmacyStore } from '@/stores/pharmacy';
import { BaseCard, BaseInput, BaseButton, BaseTable, BasePagination } from '@/components';
import { format } from 'date-fns';

const router = useRouter();
const pharmacyStore = usePharmacyStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const prescriptions = ref([]);
const filters = ref({ search: '', status: '' });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [
  { key: 'patient_name', label: 'Patient' },
  { key: 'doctor_name', label: 'Doctor' },
  { key: 'created_at', label: 'Date' },
  { key: 'status', label: 'Status' }
];

onMounted(() => loadPrescriptions());

const loadPrescriptions = async () => {
  loading.value = true;
  try {
    const data = await pharmacyStore.getPrescriptions({ ...filters.value, page: pagination.value.currentPage, limit: pagination.value.perPage });
    prescriptions.value = data.prescriptions || [];
    pagination.value = { currentPage: data.currentPage || 1, totalPages: data.totalPages || 1, total: data.total || 0, perPage: data.perPage || 10 };
  } catch (error) {
    showError('Failed to load prescriptions');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => { pagination.value.currentPage = 1; loadPrescriptions(); };
const handlePageChange = (page) => { pagination.value.currentPage = page; loadPrescriptions(); };
const resetFilters = () => { filters.value = { search: '', status: '' }; pagination.value.currentPage = 1; loadPrescriptions(); };
const viewDetails = (id) => router.push(`/pharmacy/prescriptions/${id}`);
const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy');
const getStatusBadge = (status) => ({ pending: 'badge badge-warning', dispensed: 'badge badge-success', cancelled: 'badge badge-error' }[status] || 'badge');
</script>
