<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-8 animate-fade-in">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Consultations</h1>
      <BaseButton @click="$router.push('/doctor/consultations/new')">
        <PlusIcon class="h-5 w-5 mr-2" />
        New Consultation
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BaseInput
          v-model="filters.search"
          placeholder="Search patient..."
          @input="handleSearch"
        />
        <select v-model="filters.status" class="input" @change="loadConsultations">
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <BaseInput
          v-model="filters.date"
          type="date"
          @change="loadConsultations"
        />
        <BaseButton variant="outline" @click="resetFilters" fullWidth>
          Reset Filters
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Consultations Table -->
    <BaseCard>
      <BaseTable
        :columns="columns"
        :data="consultations"
        :loading="loading"
        emptyText="No consultations found"
      >
        <template #cell-patient_name="{ row }">
          <div class="flex items-center">
            <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              {{ row.patient_name.charAt(0) }}
            </div>
            <span class="ml-3 font-medium">{{ row.patient_name }}</span>
          </div>
        </template>

        <template #cell-consultation_date="{ value }">
          {{ formatDate(value) }}
        </template>

        <template #cell-status="{ value }">
          <span :class="getStatusBadge(value)">{{ value }}</span>
        </template>

        <template #cell-fee="{ value }">
          ₦{{ formatMoney(value) }}
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              @click="viewDetails(row.id)"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View
            </button>
            <button
              v-if="row.status === 'scheduled'"
              @click="startConsultation(row.id)"
              class="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Start
            </button>
          </div>
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
import { useDoctorStore } from '@/stores/doctor';
import { useToast } from '@/composables/useToast';
import { BaseCard, BaseInput, BaseButton, BaseTable, BasePagination } from '@/components';
import { PlusIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const router = useRouter();
const doctorStore = useDoctorStore();
const { success, error: showError } = useToast();

const loading = ref(false);
const consultations = ref([]);
const filters = ref({
  search: '',
  status: '',
  date: ''
});

const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  perPage: 10
});

const columns = [
  { key: 'patient_name', label: 'Patient', sortable: true },
  { key: 'consultation_type', label: 'Type', sortable: true },
  { key: 'consultation_date', label: 'Date & Time', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'fee', label: 'Fee', sortable: true, align: 'right' }
];

onMounted(() => {
  loadConsultations();
});

const loadConsultations = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.perPage,
      ...filters.value
    };
    
    const data = await doctorStore.getConsultations(params);
    consultations.value = data.consultations || [];
    pagination.value = {
      currentPage: data.currentPage || 1,
      totalPages: data.totalPages || 1,
      total: data.total || 0,
      perPage: data.perPage || 10
    };
  } catch (error) {
    showError('Failed to load consultations');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  loadConsultations();
};

const handlePageChange = (page) => {
  pagination.value.currentPage = page;
  loadConsultations();
};

const resetFilters = () => {
  filters.value = {
    search: '',
    status: '',
    date: ''
  };
  pagination.value.currentPage = 1;
  success('Filters reset');
  loadConsultations();
};

const viewDetails = (id) => {
  router.push(`/doctor/consultations/${id}`);
};

const startConsultation = async (id) => {
  try {
    await doctorStore.startConsultation(id);
    success('Consultation started');
    router.push(`/doctor/consultations/${id}`);
  } catch (error) {
    showError('Failed to start consultation');
  }
};

const formatDate = (dateString) => {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a');
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount);
};

const getStatusBadge = (status) => {
  const badges = {
    scheduled: 'badge badge-info',
    in_progress: 'badge badge-warning',
    completed: 'badge badge-success',
    cancelled: 'badge badge-error'
  };
  return badges[status] || 'badge';
};
</script>
