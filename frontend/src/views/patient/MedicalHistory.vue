<template>
  <div class="page-container">
    <div class="mb-8 animate-fade-in">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Medical History</h1>
      <p class="text-gray-600 mt-2">View your complete medical records</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Search and Filter -->
    <div class="mb-6 flex gap-4">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search records..."
          class="input"
        />
      </div>
      <div class="w-48">
        <select v-model="filterStatus" class="input">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <SkeletonLoader type="card" v-for="i in 5" :key="i" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!filteredRecords.length" class="card">
      <div class="card-body text-center py-12">
        <DocumentTextIcon class="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Records Found</h3>
        <p class="text-gray-600">You don't have any {{ activeTab }} records yet</p>
      </div>
    </div>

    <!-- Records List -->
    <div v-else class="space-y-4">
      <div
        v-for="record in filteredRecords"
        :key="record.id"
        class="card hover-lift cursor-pointer"
        @click="viewDetails(record)"
      >
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <component :is="getIcon(record.type)" class="h-6 w-6 text-primary-600" />
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ record.title || getTitle(record) }}
                </h3>
              </div>
              
              <div class="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p class="text-sm text-gray-600 mb-1">Date</p>
                  <p class="text-sm font-medium">{{ formatDate(record.date || record.created_at) }}</p>
                </div>
                <div v-if="record.provider">
                  <p class="text-sm text-gray-600 mb-1">Provider</p>
                  <p class="text-sm font-medium">{{ record.provider }}</p>
                </div>
                <div v-if="record.diagnosis">
                  <p class="text-sm text-gray-600 mb-1">Diagnosis</p>
                  <p class="text-sm font-medium">{{ record.diagnosis }}</p>
                </div>
                <div v-if="record.amount">
                  <p class="text-sm text-gray-600 mb-1">Amount</p>
                  <p class="text-sm font-medium">₦{{ record.amount.toLocaleString() }}</p>
                </div>
              </div>

              <p v-if="record.notes" class="text-sm text-gray-600 mt-3">
                {{ truncate(record.notes, 150) }}
              </p>
            </div>

            <div class="ml-4">
              <span
                class="badge"
                :class="{
                  'badge-success': record.status === 'completed',
                  'badge-warning': record.status === 'pending',
                  'badge-danger': record.status === 'cancelled',
                  'badge-info': record.status === 'dispensed'
                }"
              >
                {{ record.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredRecords.length" class="mt-6 flex justify-center">
      <div class="flex gap-2">
        <button class="btn btn-secondary btn-sm" :disabled="currentPage === 1">
          Previous
        </button>
        <span class="px-4 py-2 text-sm text-gray-700">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button class="btn btn-secondary btn-sm" :disabled="currentPage === totalPages">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePatientStore } from '@/stores/patient';
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  DocumentCheckIcon
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/SkeletonLoader.vue';

const patientStore = usePatientStore();
const { success, error: showError } = useToast();

const loading = ref(true);
const activeTab = ref('all');
const searchQuery = ref('');
const filterStatus = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const tabs = [
  { id: 'all', name: 'All Records' },
  { id: 'consultation', name: 'Consultations' },
  { id: 'prescription', name: 'Prescriptions' },
  { id: 'surgery', name: 'Surgeries' },
  { id: 'lab_test', name: 'Lab Tests' }
];

onMounted(async () => {
  try {
    await patientStore.fetchMedicalHistory();
  } catch (error) {
    console.error('Failed to load medical history:', error);
    showError('Failed to load medical history');
  } finally {
    loading.value = false;
  }
});

const filteredRecords = computed(() => {
  let records = patientStore.medicalHistory || [];

  // Filter by tab
  if (activeTab.value !== 'all') {
    records = records.filter(r => r.type === activeTab.value);
  }

  // Filter by status
  if (filterStatus.value) {
    records = records.filter(r => r.status === filterStatus.value);
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    records = records.filter(r =>
      r.title?.toLowerCase().includes(query) ||
      r.diagnosis?.toLowerCase().includes(query) ||
      r.notes?.toLowerCase().includes(query) ||
      r.provider?.toLowerCase().includes(query)
    );
  }

  return records;
});

const totalPages = computed(() => {
  return Math.ceil(filteredRecords.value.length / itemsPerPage);
});

const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

const truncate = (text, length) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const getIcon = (type) => {
  const icons = {
    consultation: ClipboardDocumentListIcon,
    prescription: DocumentCheckIcon,
    surgery: BeakerIcon,
    lab_test: BeakerIcon
  };
  return icons[type] || DocumentTextIcon;
};

const getTitle = (record) => {
  const titles = {
    consultation: 'Medical Consultation',
    prescription: 'Prescription',
    surgery: 'Surgery',
    lab_test: 'Lab Test'
  };
  return titles[record.type] || 'Medical Record';
};

const viewDetails = (record) => {
  // TODO: Implement detail modal
  console.log('View details:', record);
};
</script>
