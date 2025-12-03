<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Prescriptions</h1>

    <!-- Filters -->
    <BaseCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseInput
          v-model="filters.search"
          placeholder="Search patient or drug..."
          @input="handleSearch"
        />
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

    <!-- Prescriptions Table -->
    <BaseCard>
      <BaseTable
        :columns="columns"
        :data="prescriptions"
        :loading="loading"
        emptyText="No prescriptions found"
      >
        <template #cell-patient_name="{ row }">
          <div class="flex items-center">
            <div class="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
              {{ row.patient_name.charAt(0) }}
            </div>
            <div class="ml-3">
              <p class="font-medium">{{ row.patient_name }}</p>
              <p class="text-xs text-gray-500">{{ row.patient_id }}</p>
            </div>
          </div>
        </template>

        <template #cell-drugs="{ row }">
          <div class="text-sm">
            <p v-for="(drug, index) in row.drugs?.slice(0, 2)" :key="index" class="text-gray-900">
              {{ drug.drug_name }}
            </p>
            <p v-if="row.drugs?.length > 2" class="text-gray-500 text-xs">
              +{{ row.drugs.length - 2 }} more
            </p>
          </div>
        </template>

        <template #cell-created_at="{ value }">
          {{ formatDate(value) }}
        </template>

        <template #cell-status="{ value }">
          <span :class="getStatusBadge(value)">{{ value }}</span>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              @click="viewPrescription(row)"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View
            </button>
            <button
              @click="downloadPrescription(row.id)"
              class="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Download
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

    <!-- View Prescription Modal -->
    <BaseModal :is-open="showModal" @close="showModal = false" title="Prescription Details" size="lg">
      <div v-if="selectedPrescription" class="space-y-4">
        <div>
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Patient Information</h4>
          <p class="text-sm"><span class="font-medium">Name:</span> {{ selectedPrescription.patient_name }}</p>
          <p class="text-sm"><span class="font-medium">ID:</span> {{ selectedPrescription.patient_id }}</p>
        </div>

        <div>
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Prescribed Drugs</h4>
          <div class="space-y-3">
            <div
              v-for="(drug, index) in selectedPrescription.drugs"
              :key="index"
              class="p-3 bg-gray-50 rounded-lg"
            >
              <p class="font-medium text-gray-900">{{ drug.drug_name }}</p>
              <p class="text-sm text-gray-600 mt-1">Dosage: {{ drug.dosage }}</p>
              <p class="text-sm text-gray-600">Frequency: {{ drug.frequency }}</p>
              <p class="text-sm text-gray-600">Duration: {{ drug.duration }}</p>
              <p v-if="drug.instructions" class="text-sm text-gray-500 mt-2">{{ drug.instructions }}</p>
            </div>
          </div>
        </div>

        <div v-if="selectedPrescription.notes">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Additional Notes</h4>
          <p class="text-sm text-gray-600">{{ selectedPrescription.notes }}</p>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showModal = false">
          Close
        </BaseButton>
        <BaseButton @click="downloadPrescription(selectedPrescription.id)">
          Download PDF
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDoctorStore } from '@/stores/doctor';
import { useToast } from '@/composables/useToast';
import { BaseCard, BaseInput, BaseButton, BaseTable, BasePagination, BaseModal } from '@/components';
import { format } from 'date-fns';

const doctorStore = useDoctorStore();
const { success, error: showError } = useToast();

const loading = ref(false);
const prescriptions = ref([]);
const showModal = ref(false);
const selectedPrescription = ref(null);

const filters = ref({
  search: '',
  status: ''
});

const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  perPage: 10
});

const columns = [
  { key: 'patient_name', label: 'Patient', sortable: true },
  { key: 'drugs', label: 'Drugs', wrap: true },
  { key: 'created_at', label: 'Date Issued', sortable: true },
  { key: 'status', label: 'Status', sortable: true }
];

onMounted(() => {
  loadPrescriptions();
});

const loadPrescriptions = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.perPage,
      ...filters.value
    };
    
    const data = await doctorStore.getPrescriptions(params);
    prescriptions.value = data.prescriptions || [];
    pagination.value = {
      currentPage: data.currentPage || 1,
      totalPages: data.totalPages || 1,
      total: data.total || 0,
      perPage: data.perPage || 10
    };
  } catch (error) {
    showError('Failed to load prescriptions');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  loadPrescriptions();
};

const handlePageChange = (page) => {
  pagination.value.currentPage = page;
  loadPrescriptions();
};

const resetFilters = () => {
  filters.value = {
    search: '',
    status: ''
  };
  pagination.value.currentPage = 1;
  success('Filters reset');
  loadPrescriptions();
};

const viewPrescription = (prescription) => {
  selectedPrescription.value = prescription;
  showModal.value = true;
};

const downloadPrescription = async (id) => {
  try {
    await doctorStore.downloadPrescription(id);
    success('Prescription downloaded');
  } catch (error) {
    showError('Failed to download prescription');
  }
};

const formatDate = (dateString) => {
  return format(new Date(dateString), 'MMM d, yyyy');
};

const getStatusBadge = (status) => {
  const badges = {
    pending: 'badge badge-warning',
    dispensed: 'badge badge-success',
    cancelled: 'badge badge-error'
  };
  return badges[status] || 'badge';
};
</script>
