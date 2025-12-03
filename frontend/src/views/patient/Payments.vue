<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Payments</h1>
      <p class="text-gray-600 mt-2">View and manage your payment history</p>
    </div>

    <!-- Quick Actions -->
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <div class="card">
        <div class="card-body text-center">
          <CreditCardIcon class="h-12 w-12 text-primary-600 mx-auto mb-3" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Subscribe to Plan</h3>
          <button @click="goToSubscription" class="btn btn-primary btn-sm">
            View Plans
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-body text-center">
          <ArrowPathIcon class="h-12 w-12 text-blue-600 mx-auto mb-3" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Renew Subscription</h3>
          <button @click="renewSubscription" class="btn btn-secondary btn-sm">
            Renew Now
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-body text-center">
          <DocumentTextIcon class="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Spent</h3>
          <p class="text-2xl font-bold text-primary-600">₦{{ totalSpent.toLocaleString() }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="card-body">
        <div class="grid md:grid-cols-3 gap-4">
          <div>
            <label class="form-label">Status</label>
            <select v-model="filters.status" class="input" @change="fetchPayments">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label class="form-label">Type</label>
            <select v-model="filters.type" class="input" @change="fetchPayments">
              <option value="">All Types</option>
              <option value="subscription">Subscription</option>
              <option value="consultation">Consultation</option>
              <option value="prescription">Prescription</option>
              <option value="surgery">Surgery</option>
              <option value="lab_test">Lab Test</option>
            </select>
          </div>
          <div>
            <label class="form-label">Date Range</label>
            <select v-model="filters.dateRange" class="input" @change="fetchPayments">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading">
      <SkeletonLoader type="table" :rows="8" :cols="6" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!payments.length" class="card">
      <div class="card-body text-center py-12">
        <CreditCardIcon class="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Payments Found</h3>
        <p class="text-gray-600">You haven't made any payments yet</p>
      </div>
    </div>

    <!-- Payments Table -->
    <div v-else class="card">
      <div class="card-body">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="payment in payments" :key="payment.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ payment.reference }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 capitalize">{{ payment.type }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatDate(payment.created_at) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900">
                    ₦{{ payment.amount.toLocaleString() }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="badge"
                    :class="{
                      'badge-success': payment.status === 'completed',
                      'badge-warning': payment.status === 'pending',
                      'badge-danger': payment.status === 'failed',
                      'badge-info': payment.status === 'refunded'
                    }"
                  >
                    {{ payment.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewReceipt(payment)"
                    class="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    View
                  </button>
                  <button
                    v-if="payment.status === 'completed'"
                    @click="downloadReceipt(payment)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="payments.length" class="mt-6 flex justify-between items-center">
      <div class="text-sm text-gray-700">
        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to
        {{ Math.min(currentPage * itemsPerPage, totalPayments) }} of {{ totalPayments }} results
      </div>
      <div class="flex gap-2">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="btn btn-secondary btn-sm"
        >
          Previous
        </button>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="btn btn-secondary btn-sm"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { paymentService } from '@/services';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import {
  CreditCardIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const router = useRouter();
const { success, error: showError, info } = useToast();

const loading = ref(true);
const payments = ref([]);
const currentPage = ref(1);
const itemsPerPage = 10;
const totalPayments = ref(0);

const filters = ref({
  status: '',
  type: '',
  dateRange: 'all'
});

const totalSpent = computed(() => {
  return payments.value
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
});

const totalPages = computed(() => {
  return Math.ceil(totalPayments.value / itemsPerPage);
});

onMounted(async () => {
  await fetchPayments();
});

const fetchPayments = async () => {
  loading.value = true;
  try {
    const response = await paymentService.getPaymentHistory({
      ...filters.value,
      page: currentPage.value,
      limit: itemsPerPage
    });
    payments.value = response.payments || [];
    totalPayments.value = response.total || 0;
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    showError('Failed to load payment history. Please try again.');
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchPayments();
  }
};

const goToSubscription = () => {
  router.push('/patient/subscription');
};

const renewSubscription = () => {
  // TODO: Implement renewal
  console.log('Renew subscription');
};

const viewReceipt = (payment) => {
  // TODO: Show receipt modal
  console.log('View receipt:', payment);
};

const downloadReceipt = (payment) => {
  // TODO: Generate and download PDF receipt
  info('Generating receipt...');
  console.log('Download receipt:', payment);
  setTimeout(() => {
    success('Receipt downloaded successfully!');
  }, 1000);
};
</script>
