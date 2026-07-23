<template>
  <div class="page-container">
    <div class="page-header flex items-center justify-between">
      <div>
        <h1 class="page-title">All Bookings</h1>
        <p class="text-gray-600">Real-time view of all service requests across the platform</p>
      </div>
      <div class="text-xs text-gray-400">
        Auto-refreshes every 15s
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="card-body">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Search -->
          <div class="form-group lg:col-span-2">
            <label class="form-label text-xs">Search (patient, doctor, hospital, pharmacy)</label>
            <input
              v-model="filters.search"
              type="text"
              class="input"
              placeholder="Name, email, or LifeLine ID..."
              @input="debouncedFetch"
            />
          </div>
          <!-- Status -->
          <div class="form-group">
            <label class="form-label text-xs">Status</label>
            <select v-model="filters.status" class="input" @change="fetchBookings()">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <!-- Service Type -->
          <div class="form-group">
            <label class="form-label text-xs">Service Type</label>
            <select v-model="filters.serviceType" class="input" @change="fetchBookings()">
              <option value="">All</option>
              <option value="consultation">Consultation</option>
              <option value="prescription">Prescription</option>
              <option value="laboratory_test">Lab Test</option>
              <option value="drug_dispensing">Drug Dispensing</option>
              <option value="admission">Admission</option>
              <option value="specialist_consultation">Specialist</option>
              <option value="minor_surgery">Minor Surgery</option>
              <option value="major_surgery">Major Surgery</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <!-- Priority -->
          <div class="form-group">
            <label class="form-label text-xs">Priority</label>
            <select v-model="filters.priority" class="input" @change="fetchBookings()">
              <option value="">All</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-gray-900">{{ total }}</p>
        <p class="text-xs text-gray-500">Total Matches</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-yellow-600">{{ statusCounts.pending }}</p>
        <p class="text-xs text-gray-500">Pending</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ statusCounts.active }}</p>
        <p class="text-xs text-gray-500">Active</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-green-600">{{ statusCounts.completed }}</p>
        <p class="text-xs text-gray-500">Completed</p>
      </div>
    </div>

    <!-- Bookings table -->
    <div class="card overflow-hidden">
      <div v-if="loading && bookings.length === 0" class="p-8 text-center">
        <div class="spinner spinner-lg mx-auto mb-4"></div>
        <p class="text-gray-500">Loading bookings...</p>
      </div>

      <div v-else-if="bookings.length === 0" class="p-8 text-center">
        <p class="text-gray-500">No bookings match your filters</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th class="px-4 py-3 text-left">Patient</th>
              <th class="px-4 py-3 text-left">Service</th>
              <th class="px-4 py-3 text-left">Provider</th>
              <th class="px-4 py-3 text-left">Status</th>
              <th class="px-4 py-3 text-left">Priority</th>
              <th class="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="b in bookings" :key="b.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ b.patient_first_name }} {{ b.patient_last_name }}</div>
                <div class="text-xs text-gray-400">{{ b.patient_lifeline_id }}</div>
              </td>
              <td class="px-4 py-3">
                <span class="capitalize">{{ formatServiceType(b.service_type) }}</span>
              </td>
              <td class="px-4 py-3">
                <span v-if="b.provider_name" class="text-gray-900">{{ b.provider_name }}</span>
                <span v-else class="text-gray-400 italic">Unassigned</span>
                <div v-if="b.provider_type" class="text-xs text-gray-400 capitalize">{{ b.provider_type }}</div>
              </td>
              <td class="px-4 py-3">
                <span :class="statusBadgeClass(b.status)">{{ formatStatus(b.status) }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="priorityBadgeClass(b.priority)">{{ b.priority }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                {{ formatDate(b.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-xs text-gray-500">Page {{ currentPage }} of {{ totalPages }} ({{ total }} results)</p>
        <div class="flex gap-2">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="btn btn-sm bg-gray-100 text-gray-600 disabled:opacity-50"
          >Prev</button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="btn btn-sm bg-gray-100 text-gray-600 disabled:opacity-50"
          >Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import apiClient from '@/services/api';
import { useToast } from '@/composables/useToast';

const { error: showError } = useToast();

const loading = ref(true);
const bookings = ref([]);
const total = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);

const filters = reactive({
  search: '',
  status: '',
  serviceType: '',
  priority: '',
});

// Status counts derived from the current filtered total (we track from server metadata)
const statusCounts = reactive({ pending: 0, active: 0, completed: 0 });

let refreshInterval = null;
let debounceTimer = null;

const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchBookings(), 400);
};

const fetchBookings = async ({ silent = false } = {}) => {
  if (!silent) loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: 50,
    };
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.serviceType) params.serviceType = filters.serviceType;
    if (filters.priority) params.priority = filters.priority;

    const response = await apiClient.get('/admin/bookings', { params });
    const data = response.data || response;

    bookings.value = data.bookings || [];
    total.value = data.total || 0;
    currentPage.value = data.page || 1;
    totalPages.value = data.totalPages || 1;

    // Compute status counts from loaded bookings (visible page only — approximate)
    statusCounts.pending = bookings.value.filter(b => b.status === 'pending').length;
    statusCounts.active = bookings.value.filter(b => ['assigned', 'accepted', 'in_progress'].includes(b.status)).length;
    statusCounts.completed = bookings.value.filter(b => b.status === 'completed').length;
  } catch (err) {
    if (!silent) showError('Failed to load bookings');
  } finally {
    if (!silent) loading.value = false;
  }
};

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchBookings();
};

const formatServiceType = (type) => {
  if (!type) return '';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const formatStatus = (status) => {
  const map = {
    pending: 'Pending',
    assigned: 'Assigned',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
    expired: 'Expired',
  };
  return map[status] || status;
};

const statusBadgeClass = (status) => {
  const classes = {
    pending: 'badge badge-warning',
    assigned: 'badge badge-info',
    accepted: 'badge badge-primary',
    in_progress: 'badge badge-primary',
    completed: 'badge badge-success',
    cancelled: 'badge badge-danger',
    rejected: 'badge badge-danger',
    expired: 'badge badge-secondary',
  };
  return classes[status] || 'badge';
};

const priorityBadgeClass = (priority) => {
  const map = {
    normal: 'text-gray-600',
    high: 'text-orange-600 font-semibold',
    emergency: 'text-red-600 font-bold',
  };
  return map[priority] || '';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

onMounted(async () => {
  await fetchBookings();
  // Auto-refresh every 15 seconds
  refreshInterval = window.setInterval(() => fetchBookings({ silent: true }), 15_000);
});

onUnmounted(() => {
  if (refreshInterval) window.clearInterval(refreshInterval);
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>
