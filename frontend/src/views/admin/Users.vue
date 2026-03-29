<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">User Management</h1>
    <BaseCard class="mb-6"><div class="grid grid-cols-1 md:grid-cols-5 gap-4"><BaseInput v-model="filters.search" placeholder="Search users..." @input="handleSearch" /><select v-model="filters.role" class="input" @change="loadUsers"><option value="">All Roles</option><option value="patient">Patient</option><option value="doctor">Doctor</option><option value="pharmacy">Pharmacy</option><option value="hospital">Hospital</option><option value="admin">Admin</option></select><select v-model="filters.status" class="input" @change="loadUsers"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select><select v-model="pagination.perPage" class="input" @change="handlePerPageChange"><option :value="10">10 per page</option><option :value="25">25 per page</option><option :value="50">50 per page</option><option :value="100">100 per page</option></select><BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton></div></BaseCard>
    <BaseCard><BaseTable :columns="columns" :data="users" :loading="loading" emptyText="No users found"><template #cell-name="{ row }"><div class="flex items-center gap-3"><div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">{{ row.name ? String(row.name).charAt(0) : (row.first_name ? String(row.first_name).charAt(0) : (row.last_name ? String(row.last_name).charAt(0) : '?')) }}</div><div><p class="font-medium">{{ row.name || ((row.first_name || '') + ' ' + (row.last_name || '')).trim() || 'Unnamed' }}</p><p class="text-xs text-gray-500">{{ row.email }}</p></div></div></template><template #cell-role="{ value }"><span class="badge badge-info">{{ value }}</span></template><template #cell-status="{ value }"><span :class="value === 'active' ? 'badge badge-success' : 'badge badge-error'">{{ value }}</span></template><template #cell-created_at="{ value }">{{ formatDate(value) }}</template><template #actions="{ row }"><button @click="viewUser(row.id)" class="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3">View</button><button v-if="row.status === 'active'" @click="deactivateUser(row.id)" class="text-red-600 hover:text-red-700 text-sm font-medium">Deactivate</button><button v-else-if="row.status === 'inactive'" @click="activateUser(row.id)" class="text-green-600 hover:text-green-700 text-sm font-medium">Activate</button></template></BaseTable><div v-if="pagination.totalPages > 1" class="mt-6"><BasePagination :current-page="pagination.currentPage" :total-pages="pagination.totalPages" :total="pagination.total" :per-page="pagination.perPage" @page-change="handlePageChange" /></div></BaseCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useAdminStore } from '@/stores/admin';
import { BaseCard, BaseInput, BaseButton, BaseTable, BasePagination } from '@/components';
import { format } from 'date-fns';

const router = useRouter();
const adminStore = useAdminStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const users = ref([]);
const filters = ref({ search: '', role: '', status: '' });
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0, perPage: 10 });
const columns = [{ key: 'name', label: 'User' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }, { key: 'created_at', label: 'Joined' }];

onMounted(() => loadUsers());

const loadUsers = async () => {
  loading.value = true;
  try {
    const data = await adminStore.getUsers({ ...filters.value, page: pagination.value.currentPage, limit: pagination.value.perPage });
    users.value = Array.isArray(data) ? data : (data.users || []);
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

const handleSearch = () => { pagination.value.currentPage = 1; loadUsers(); };
const handlePageChange = (page) => { pagination.value.currentPage = page; loadUsers(); };
const handlePerPageChange = () => { pagination.value.currentPage = 1; loadUsers(); };
const resetFilters = () => { filters.value = { search: '', role: '', status: '' }; pagination.value.currentPage = 1; pagination.value.perPage = 10; loadUsers(); };
const viewUser = (id) => router.push({ name: 'admin-user-detail', params: { id } });
const deactivateUser = async (id) => {
  if (!confirm('Are you sure you want to deactivate this user?')) return;
  try {
    await adminStore.deactivateUser(id);
    success('User deactivated');
    loadUsers();
  } catch (error) {
    showError('Failed to deactivate user');
  }
};
const activateUser = async (id) => {
  try {
    await adminStore.activateUser(id);
    success('User activated');
    loadUsers();
  } catch (error) {
    showError('Failed to activate user');
  }
};
const formatDate = (dateString) => dateString ? format(new Date(dateString), 'MMM d, yyyy') : 'N/A';
</script>
