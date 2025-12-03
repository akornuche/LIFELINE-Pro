<template>
  <div class="page-container">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Payments</h1>
      <BaseButton @click="downloadStatement" variant="outline">
        <DocumentArrowDownIcon class="h-5 w-5 mr-2" />
        Download Statement
      </BaseButton>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <BaseCard>
        <div>
          <p class="text-sm font-medium text-gray-500">Total Earnings</p>
          <p class="text-2xl font-semibold text-gray-900 mt-1">₦{{ formatMoney(stats.totalEarnings) }}</p>
        </div>
      </BaseCard>
      <BaseCard>
        <div>
          <p class="text-sm font-medium text-gray-500">This Month</p>
          <p class="text-2xl font-semibold text-gray-900 mt-1">₦{{ formatMoney(stats.monthlyEarnings) }}</p>
        </div>
      </BaseCard>
      <BaseCard>
        <div>
          <p class="text-sm font-medium text-gray-500">Pending</p>
          <p class="text-2xl font-semibold text-yellow-600 mt-1">₦{{ formatMoney(stats.pendingPayments) }}</p>
        </div>
      </BaseCard>
      <BaseCard>
        <div>
          <p class="text-sm font-medium text-gray-500">Total Consultations</p>
          <p class="text-2xl font-semibold text-gray-900 mt-1">{{ stats.totalConsultations }}</p>
        </div>
      </BaseCard>
    </div>

    <!-- Filters -->
    <BaseCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BaseInput v-model="filters.search" placeholder="Search patient or reference..." @input="handleSearch" />
        <select v-model="filters.status" class="input" @change="loadPayments">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <BaseInput v-model="filters.from_date" type="date" @change="loadPayments" />
        <BaseInput v-model="filters.to_date" type="date" @change="loadPayments" />
      </div>
    </BaseCard>

    <!-- Payments Table -->
    <BaseCard>
      <BaseTable
        :columns="columns"
        :data="payments"
        :loading="loading"
        emptyText="No payments found"
      >
        <template #cell-patient_name="{ row }">
          <div>
            <p class="font-medium">{{ row.patient_name }}</p>
            <p class="text-xs text-gray-500">{{ row.consultation_type }}</p>
          </div>
        </template>

        <template #cell-reference="{ value }">
          <code class="text-xs bg-gray-100 px-2 py-1 rounded">{{ value }}</code>
        </template>

        <template #cell-amount="{ value }">
          ₦{{ formatMoney(value) }}
        </template>

        <template #cell-created_at="{ value }">
          {{ formatDate(value) }}
        </template>

        <template #cell-status="{ value }">
          <span :class="getStatusBadge(value)">{{ value }}</span>
        </template>

        <template #actions="{ row }">
          <button
            @click="viewPayment(row)"
            class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Details
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

    <!-- Payment Details Modal -->
    <BaseModal :is-open="showModal" @close="showModal = false" title="Payment Details">
      <div v-if="selectedPayment" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Reference</p>
            <p class="font-medium">{{ selectedPayment.reference }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Amount</p>
            <p class="font-medium">₦{{ formatMoney(selectedPayment.amount) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Patient</p>
            <p class="font-medium">{{ selectedPayment.patient_name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Status</p>
            <span :class="getStatusBadge(selectedPayment.status)">{{ selectedPayment.status }}</span>
          </div>
          <div>
            <p class="text-sm text-gray-500">Date</p>
            <p class="font-medium">{{ formatDate(selectedPayment.created_at) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Payment Method</p>
            <p class="font-medium">{{ selectedPayment.payment_method }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showModal = false">
          Close
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
import { DocumentArrowDownIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const doctorStore = useDoctorStore();
const { success, error: showError } = useToast();

const loading = ref(false);
const payments = ref([]);
const showModal = ref(false);
const selectedPayment = ref(null);

const stats = ref({
  totalEarnings: 0,
  monthlyEarnings: 0,
  pendingPayments: 0,
  totalConsultations: 0
});

const filters = ref({
  search: '',
  status: '',
  from_date: '',
  to_date: ''
});

const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  perPage: 10
});

const columns = [
  { key: 'reference', label: 'Reference', sortable: true },
  { key: 'patient_name', label: 'Patient', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
  { key: 'created_at', label: 'Date', sortable: true },
  { key: 'status', label: 'Status', sortable: true }
];

onMounted(() => {
  loadStats();
  loadPayments();
});

const loadStats = async () => {
  try {
    const data = await doctorStore.getStatistics();
    stats.value = {
      totalEarnings: data.totalEarnings || 0,
      monthlyEarnings: data.monthlyEarnings || 0,
      pendingPayments: data.pendingPayments || 0,
      totalConsultations: data.totalConsultations || 0
    };
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

const loadPayments = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.perPage,
      ...filters.value
    };
    
    const data = await doctorStore.getPayments(params);
    payments.value = data.payments || [];
    pagination.value = {
      currentPage: data.currentPage || 1,
      totalPages: data.totalPages || 1,
      total: data.total || 0,
      perPage: data.perPage || 10
    };
  } catch (error) {
    showError('Failed to load payments');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.currentPage = 1;
  loadPayments();
};

const handlePageChange = (page) => {
  pagination.value.currentPage = page;
  loadPayments();
};

const viewPayment = (payment) => {
  selectedPayment.value = payment;
  showModal.value = true;
};

const downloadStatement = async () => {
  try {
    await doctorStore.downloadPaymentStatement(filters.value);
    success('Statement downloaded successfully');
  } catch (error) {
    showError('Failed to download statement');
  }
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount);
};

const formatDate = (dateString) => {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a');
};

const getStatusBadge = (status) => {
  const badges = {
    completed: 'badge badge-success',
    pending: 'badge badge-warning',
    failed: 'badge badge-error'
  };
  return badges[status] || 'badge';
};
</script>
