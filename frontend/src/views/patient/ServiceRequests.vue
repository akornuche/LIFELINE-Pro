<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Service Requests</h1>
      <p class="text-gray-600">Request healthcare services and track your appointments</p>
    </div>

    <!-- New Request Form -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="text-lg font-semibold">Request a Service</h2>
      </div>
      <div class="card-body">
        <form @submit.prevent="submitRequest" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Service Type</label>
              <select v-model="newRequest.serviceType" required class="input">
                <option value="">Select a service</option>
                <option v-for="svc in serviceTypes" :key="svc.value" :value="svc.value">
                  {{ svc.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select v-model="newRequest.priority" class="input">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Preferred Date (optional)</label>
              <input
                v-model="newRequest.preferredDate"
                type="datetime-local"
                class="input"
                :min="minDateTime"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="newRequest.description"
              rows="3"
              class="input"
              placeholder="Describe your symptoms or what you need..."
            ></textarea>
          </div>
          <button
            type="submit"
            :disabled="submitting || !newRequest.serviceType"
            class="btn btn-primary"
          >
            <span v-if="!submitting">Submit Request</span>
            <span v-else class="flex items-center">
              <span class="spinner spinner-sm mr-2"></span>
              Submitting...
            </span>
          </button>
        </form>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex space-x-2 mb-4">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        @click="activeFilter = tab.value"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          activeFilter === tab.value
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Requests List -->
    <div v-if="loading" class="space-y-4">
      <SkeletonLoader type="card" v-for="n in 3" :key="n" />
    </div>

    <div v-else-if="filteredRequests.length === 0" class="card">
      <div class="card-body text-center py-12">
        <p class="text-gray-500">No service requests found</p>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="request in filteredRequests"
        :key="request.id"
        class="card hover:shadow-md transition-shadow"
      >
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center space-x-3">
                <h3 class="font-semibold text-gray-900">{{ formatServiceType(request.service_type) }}</h3>
                <span :class="statusBadgeClass(request.status)">
                  {{ formatStatus(request.status) }}
                </span>
                <span v-if="request.priority !== 'normal'" :class="priorityBadgeClass(request.priority)">
                  {{ request.priority }}
                </span>
              </div>
              <p v-if="request.description" class="text-sm text-gray-600 mt-1">{{ request.description }}</p>
              <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>{{ formatDate(request.created_at) }}</span>
                <span v-if="request.provider_name">
                  Assigned to: <strong>{{ request.provider_name }}</strong>
                </span>
                <span v-if="request.preferred_date">
                  Preferred: {{ formatDate(request.preferred_date) }}
                </span>
              </div>
            </div>
            <button
              v-if="['pending', 'assigned'].includes(request.status)"
              @click="cancelRequest(request.id)"
              class="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { queueService } from '@/services';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/SkeletonLoader.vue';

const { success, error: showError } = useToast();

const loading = ref(true);
const submitting = ref(false);
const requests = ref([]);
const activeFilter = ref('all');

const serviceTypes = [
  { value: 'consultation', label: 'Doctor Consultation' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'drug_dispensing', label: 'Drug Dispensing (Pharmacy)' },
  { value: 'minor_surgery', label: 'Minor Surgery' },
  { value: 'major_surgery', label: 'Major Surgery' },
  { value: 'laboratory_test', label: 'Laboratory Test' },
  { value: 'imaging', label: 'Imaging / X-Ray' },
  { value: 'admission', label: 'Hospital Admission' },
  { value: 'emergency', label: 'Emergency' },
];

const filterTabs = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const newRequest = reactive({
  serviceType: '',
  priority: 'normal',
  preferredDate: '',
  description: '',
});

const minDateTime = computed(() => {
  return new Date().toISOString().slice(0, 16);
});

const filteredRequests = computed(() => {
  if (activeFilter.value === 'all') return requests.value;
  if (activeFilter.value === 'active') {
    return requests.value.filter(r => ['pending', 'assigned', 'accepted', 'in_progress'].includes(r.status));
  }
  return requests.value.filter(r => r.status === activeFilter.value);
});

const fetchRequests = async () => {
  loading.value = true;
  try {
    const response = await queueService.getMyRequests();
    requests.value = response.data.data || [];
  } catch (err) {
    showError('Failed to load service requests');
  } finally {
    loading.value = false;
  }
};

const submitRequest = async () => {
  submitting.value = true;
  try {
    const response = await queueService.createRequest({
      serviceType: newRequest.serviceType,
      priority: newRequest.priority,
      preferredDate: newRequest.preferredDate || null,
      description: newRequest.description || null,
    });
    success(response.data.message || 'Service request submitted');
    newRequest.serviceType = '';
    newRequest.priority = 'normal';
    newRequest.preferredDate = '';
    newRequest.description = '';
    await fetchRequests();
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to submit request');
  } finally {
    submitting.value = false;
  }
};

const cancelRequest = async (id) => {
  if (!confirm('Are you sure you want to cancel this request?')) return;
  try {
    await queueService.cancelRequest(id, 'Cancelled by patient');
    success('Request cancelled');
    await fetchRequests();
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to cancel request');
  }
};

const formatServiceType = (type) => {
  const found = serviceTypes.find(s => s.value === type);
  return found ? found.label : type;
};

const formatStatus = (status) => {
  const map = {
    pending: 'Pending',
    assigned: 'Provider Assigned',
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
  const classes = {
    high: 'badge bg-orange-100 text-orange-700',
    emergency: 'badge bg-red-100 text-red-700',
  };
  return classes[priority] || 'badge';
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

onMounted(fetchRequests);
</script>
