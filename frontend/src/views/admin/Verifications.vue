<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Verifications</h1>
    <BaseCard class="mb-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><select v-model="filters.provider_type" class="input" @change="loadVerifications"><option value="">All Providers</option><option value="doctor">Doctors</option><option value="pharmacy">Pharmacies</option><option value="hospital">Hospitals</option></select><select v-model="filters.status" class="input" @change="loadVerifications"><option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton></div></BaseCard>
    <BaseCard><BaseTable :columns="columns" :data="verifications" :loading="loading" emptyText="No verifications found"><template #cell-provider="{ row }"><div><p class="font-medium">{{ row.provider_name }}</p><p class="text-xs text-gray-500"><span class="badge badge-sm">{{ row.provider_type }}</span></p></div></template><template #cell-license="{ value }"><span class="font-mono text-sm">{{ value }}</span></template><template #cell-submitted_date="{ value }">{{ formatDate(value) }}</template><template #cell-status="{ value }"><span :class="getStatusBadge(value)">{{ value }}</span></template><template #actions="{ row }"><button v-if="row.status === 'pending'" @click="approveVerification(row.id)" class="text-green-600 hover:text-green-700 text-sm font-medium mr-3">Approve</button><button v-if="row.status === 'pending'" @click="rejectVerification(row.id)" class="text-red-600 hover:text-red-700 text-sm font-medium">Reject</button></template></BaseTable><div v-if="pagination.totalPages > 1" class="mt-6"><BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" /></div></BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAdminStore } from '@/stores/admin';
import { BaseCard, BaseButton, BaseTable, BasePagination } from '@/components';
import { format } from 'date-fns';

const adminStore = useAdminStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const verifications = ref([]);
const filters = ref({ provider_type: '', status: '' });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'provider', label: 'Provider' }, { key: 'license', label: 'License' }, { key: 'submitted_date', label: 'Submitted' }, { key: 'status', label: 'Status' }];

onMounted(() => loadVerifications());

const loadVerifications = async () => {
  loading.value = true;
  try {
    const data = await adminStore.getVerifications({ ...filters.value, page: pagination.value.currentPage, limit: pagination.value.perPage });
    verifications.value = data.verifications || [];
    pagination.value = { currentPage: data.currentPage || 1, totalPages: data.totalPages || 1, total: data.total || 0, perPage: data.perPage || 10 };
  } catch (error) {
    showError('Failed to load verifications');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => { pagination.value.currentPage = page; loadVerifications(); };
const resetFilters = () => { filters.value = { provider_type: '', status: '' }; pagination.value.currentPage = 1; loadVerifications(); };
const approveVerification = async (id) => {
  try {
    await adminStore.verifyProvider(id, { status: 'approved' });
    success('Verification approved');
    loadVerifications();
  } catch (error) {
    showError('Failed to approve verification');
  }
};
const rejectVerification = async (id) => {
  const reason = prompt('Reason for rejection:');
  if (!reason) return;
  try {
    await adminStore.rejectVerification(id, reason);
    success('Verification rejected');
    loadVerifications();
  } catch (error) {
    showError('Failed to reject verification');
  }
};
const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy');
const getStatusBadge = (status) => ({ pending: 'badge badge-warning', approved: 'badge badge-success', rejected: 'badge badge-error' }[status] || 'badge');
</script>
