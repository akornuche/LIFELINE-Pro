<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Payment History</h1>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"><div class="stat-card"><CurrencyDollarIcon class="h-8 w-8 text-green-600 mb-2" /><p class="text-2xl font-bold text-gray-900">₦{{ formatMoney(stats.totalRevenue) }}</p><p class="text-sm text-gray-500">Total Revenue</p></div><div class="stat-card"><CurrencyDollarIcon class="h-8 w-8 text-blue-600 mb-2" /><p class="text-2xl font-bold text-gray-900">₦{{ formatMoney(stats.monthlyRevenue) }}</p><p class="text-sm text-gray-500">This Month</p></div><div class="stat-card"><DocumentTextIcon class="h-8 w-8 text-purple-600 mb-2" /><p class="text-2xl font-bold text-gray-900">{{ stats.totalTransactions }}</p><p class="text-sm text-gray-500">Transactions</p></div><div class="stat-card"><BaseButton variant="primary" fullWidth @click="downloadStatement">Download Statement</BaseButton></div></div>
    <BaseCard><BaseTable :columns="columns" :data="payments" :loading="loading" emptyText="No payments found"><template #cell-reference="{ value }"><span class="font-mono text-sm">{{ value }}</span></template><template #cell-patient_name="{ row }"><p class="font-medium">{{ row.patient_name }}</p><p class="text-xs text-gray-500">{{ row.service_type }}</p></template><template #cell-amount="{ value }"><span class="font-semibold text-gray-900">₦{{ formatMoney(value) }}</span></template><template #cell-date="{ value }">{{ formatDate(value) }}</template><template #cell-status="{ value }"><span :class="getStatusBadge(value)">{{ value }}</span></template></BaseTable><div v-if="pagination.totalPages > 1" class="mt-6"><BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" /></div></BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseButton, BaseTable, BasePagination } from '@/components';
import { CurrencyDollarIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const hospitalStore = useHospitalStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const payments = ref([]);
const stats = ref({ totalRevenue: 0, monthlyRevenue: 0, totalTransactions: 0 });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'reference', label: 'Reference' }, { key: 'patient_name', label: 'Patient' }, { key: 'amount', label: 'Amount' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }];

onMounted(() => loadPayments());

const loadPayments = async () => {
  loading.value = true;
  try {
    const data = await hospitalStore.getPayments({ page: pagination.value.currentPage, limit: pagination.value.perPage });
    payments.value = data.payments || [];
    stats.value = data.stats || stats.value;
    pagination.value = { currentPage: data.currentPage || 1, totalPages: data.totalPages || 1, total: data.total || 0, perPage: data.perPage || 10 };
  } catch (error) {
    showError('Failed to load payments');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => { pagination.value.currentPage = page; loadPayments(); };
const downloadStatement = () => info('Statement download feature coming soon');
const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy');
const getStatusBadge = (status) => ({ completed: 'badge badge-success', pending: 'badge badge-warning', failed: 'badge badge-error' }[status] || 'badge');
</script>
