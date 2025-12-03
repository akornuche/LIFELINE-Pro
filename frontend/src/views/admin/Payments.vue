<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Payments</h1>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"><div class="stat-card"><CurrencyDollarIcon class="h-8 w-8 text-green-600 mb-2" /><p class="text-2xl font-bold text-gray-900">₦{{ formatMoney(stats.totalRevenue) }}</p><p class="text-sm text-gray-500">Total Revenue</p></div><div class="stat-card"><DocumentTextIcon class="h-8 w-8 text-blue-600 mb-2" /><p class="text-2xl font-bold text-gray-900">{{ stats.totalTransactions }}</p><p class="text-sm text-gray-500">Transactions</p></div><div class="stat-card"><CheckCircleIcon class="h-8 w-8 text-green-600 mb-2" /><p class="text-2xl font-bold text-gray-900">{{ stats.successRate }}%</p><p class="text-sm text-gray-500">Success Rate</p></div><div class="stat-card"><ClockIcon class="h-8 w-8 text-orange-600 mb-2" /><p class="text-2xl font-bold text-gray-900">{{ stats.pendingPayments }}</p><p class="text-sm text-gray-500">Pending</p></div></div>
    <BaseCard class="mb-6"><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><BaseInput v-model="filters.search" placeholder="Search reference..." @input="handleSearch" /><select v-model="filters.type" class="input" @change="loadPayments"><option value="">All Types</option><option value="consultation">Consultation</option><option value="prescription">Prescription</option><option value="surgery">Surgery</option><option value="subscription">Subscription</option></select><select v-model="filters.status" class="input" @change="loadPayments"><option value="">All Status</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option></select><BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton></div></BaseCard>
    <BaseCard><BaseTable :columns="columns" :data="payments" :loading="loading" emptyText="No payments found"><template #cell-reference="{ value }"><span class="font-mono text-sm">{{ value }}</span></template><template #cell-payer="{ row }"><p class="font-medium">{{ row.payer_name }}</p><p class="text-xs text-gray-500">{{ row.payer_email }}</p></template><template #cell-type="{ value }"><span class="badge badge-info">{{ value }}</span></template><template #cell-amount="{ value }"><span class="font-semibold text-gray-900">₦{{ formatMoney(value) }}</span></template><template #cell-date="{ value }">{{ formatDate(value) }}</template><template #cell-status="{ value }"><span :class="getStatusBadge(value)">{{ value }}</span></template><template #actions="{ row }"><button @click="viewPaymentDetails(row.id)" class="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button></template></BaseTable><div v-if="pagination.totalPages > 1" class="mt-6"><BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" /></div></BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAdminStore } from '@/stores/admin';
import { BaseCard, BaseInput, BaseButton, BaseTable, BasePagination } from '@/components';
import { CurrencyDollarIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const adminStore = useAdminStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const payments = ref([]);
const stats = ref({ totalRevenue: 0, totalTransactions: 0, successRate: 0, pendingPayments: 0 });
const filters = ref({ search: '', type: '', status: '' });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'reference', label: 'Reference' }, { key: 'payer', label: 'Payer' }, { key: 'type', label: 'Type' }, { key: 'amount', label: 'Amount' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }];

onMounted(() => loadPayments());

const loadPayments = async () => {
  loading.value = true;
  try {
    const data = await adminStore.getPayments({ ...filters.value, page: pagination.value.currentPage, limit: pagination.value.perPage });
    payments.value = data.payments || [];
    stats.value = data.stats || stats.value;
    pagination.value = { currentPage: data.currentPage || 1, totalPages: data.totalPages || 1, total: data.total || 0, perPage: data.perPage || 10 };
  } catch (error) {
    showError('Failed to load payments');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => { pagination.value.currentPage = 1; loadPayments(); };
const handlePageChange = (page) => { pagination.value.currentPage = page; loadPayments(); };
const resetFilters = () => { filters.value = { search: '', type: '', status: '' }; pagination.value.currentPage = 1; loadPayments(); };
const viewPaymentDetails = (id) => info('Payment details view coming soon');
const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy h:mm a');
const getStatusBadge = (status) => ({ completed: 'badge badge-success', pending: 'badge badge-warning', failed: 'badge badge-error' }[status] || 'badge');
</script>
