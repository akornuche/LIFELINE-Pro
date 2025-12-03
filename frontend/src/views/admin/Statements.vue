<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Financial Statements</h1>
    <BaseCard class="mb-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><select v-model="filters.provider_type" class="input" @change="loadStatements"><option value="">All Providers</option><option value="doctor">Doctors</option><option value="pharmacy">Pharmacies</option><option value="hospital">Hospitals</option></select><select v-model="filters.period" class="input" @change="loadStatements"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select><BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton></div></BaseCard>
    <BaseCard><BaseTable :columns="columns" :data="statements" :loading="loading" emptyText="No statements found"><template #cell-provider="{ row }"><p class="font-medium">{{ row.provider_name }}</p><p class="text-xs text-gray-500"><span class="badge badge-sm">{{ row.provider_type }}</span></p></template><template #cell-period="{ value }">{{ value }}</template><template #cell-total_revenue="{ value }"><span class="font-semibold text-gray-900">₦{{ formatMoney(value) }}</span></template><template #cell-commission="{ value }"><span class="text-sm text-gray-600">₦{{ formatMoney(value) }}</span></template><template #cell-net_amount="{ value }"><span class="font-semibold text-green-600">₦{{ formatMoney(value) }}</span></template><template #actions="{ row }"><button @click="downloadStatement(row.id)" class="text-blue-600 hover:text-blue-700 text-sm font-medium">Download</button></template></BaseTable><div v-if="pagination.totalPages > 1" class="mt-6"><BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" /></div></BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAdminStore } from '@/stores/admin';
import { BaseCard, BaseButton, BaseTable, BasePagination } from '@/components';

const adminStore = useAdminStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const statements = ref([]);
const filters = ref({ provider_type: '', period: 'monthly' });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'provider', label: 'Provider' }, { key: 'period', label: 'Period' }, { key: 'total_revenue', label: 'Revenue' }, { key: 'commission', label: 'Commission' }, { key: 'net_amount', label: 'Net Amount' }];

onMounted(() => loadStatements());

const loadStatements = async () => {
  loading.value = true;
  try {
    const data = await adminStore.getStatements({ ...filters.value, page: pagination.value.currentPage, limit: pagination.value.perPage });
    statements.value = data.statements || [];
    pagination.value = { currentPage: data.currentPage || 1, totalPages: data.totalPages || 1, total: data.total || 0, perPage: data.perPage || 10 };
  } catch (error) {
    showError('Failed to load statements');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => { pagination.value.currentPage = page; loadStatements(); };
const resetFilters = () => { filters.value = { provider_type: '', period: 'monthly' }; pagination.value.currentPage = 1; loadStatements(); };
const downloadStatement = async (id) => {
  try {
    await adminStore.downloadStatement(id);
    success('Statement downloaded');
  } catch (error) {
    showError('Failed to download statement');
  }
};
const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
</script>
