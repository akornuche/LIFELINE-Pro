<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Payments</h1>
      <BaseButton @click="downloadStatement" variant="outline">
        <DocumentArrowDownIcon class="h-5 w-5 mr-2" />Download Statement
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <BaseCard><div><p class="text-sm font-medium text-gray-500">Total Revenue</p><p class="text-2xl font-semibold text-gray-900 mt-1">₦{{ formatMoney(stats.totalRevenue) }}</p></div></BaseCard>
      <BaseCard><div><p class="text-sm font-medium text-gray-500">This Month</p><p class="text-2xl font-semibold text-gray-900 mt-1">₦{{ formatMoney(stats.monthlyRevenue) }}</p></div></BaseCard>
      <BaseCard><div><p class="text-sm font-medium text-gray-500">Total Transactions</p><p class="text-2xl font-semibold text-gray-900 mt-1">{{ stats.totalTransactions }}</p></div></BaseCard>
    </div>

    <BaseCard>
      <BaseTable :columns="columns" :data="payments" :loading="loading" emptyText="No payments found">
        <template #cell-reference="{ value }"><code class="text-xs bg-gray-100 px-2 py-1 rounded">{{ value }}</code></template>
        <template #cell-amount="{ value }">₦{{ formatMoney(value) }}</template>
        <template #cell-created_at="{ value }">{{ formatDate(value) }}</template>
        <template #cell-status="{ value }"><span :class="getStatusBadge(value)">{{ value }}</span></template>
      </BaseTable>
      <div v-if="pagination.totalPages > 1" class="mt-6">
        <BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" />
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { usePharmacyStore } from '@/stores/pharmacy';
import { BaseCard, BaseButton, BaseTable, BasePagination } from '@/components';
import { DocumentArrowDownIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const pharmacyStore = usePharmacyStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const payments = ref([]);
const stats = ref({ totalRevenue: 0, monthlyRevenue: 0, totalTransactions: 0 });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'reference', label: 'Reference' }, { key: 'patient_name', label: 'Patient' }, { key: 'amount', label: 'Amount', align: 'right' }, { key: 'created_at', label: 'Date' }, { key: 'status', label: 'Status' }];

onMounted(async () => {
  const data = await pharmacyStore.getStatistics();
  stats.value = data;
  loadPayments();
});

const loadPayments = async () => {
  loading.value = true;
  try {
    const data = await pharmacyStore.getPayments({ page: pagination.value.currentPage, limit: pagination.value.perPage });
    payments.value = data.payments || [];
    pagination.value = { currentPage: data.currentPage || 1, totalPages: data.totalPages || 1, total: data.total || 0, perPage: data.perPage || 10 };
  } catch (error) {
    showError('Failed to load payments');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => { pagination.value.currentPage = page; loadPayments(); };
const downloadStatement = async () => { try { await pharmacyStore.downloadPaymentStatement(); success('Statement downloaded'); } catch (error) { showError('Failed to download'); } };
const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy');
const getStatusBadge = (status) => ({ completed: 'badge badge-success', pending: 'badge badge-warning', failed: 'badge badge-error' }[status] || 'badge');
</script>
