<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Service Assignments</h1>
      <p class="text-gray-600">Manage service requests assigned to you</p>
    </div>

    <!-- Filter Tabs -->
    <div class="flex space-x-2 mb-6">
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
        <span
          v-if="tab.count > 0"
          class="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-white bg-opacity-20"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <SkeletonLoader type="card" v-for="n in 3" :key="n" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAssignments.length === 0" class="card">
      <div class="card-body text-center py-12">
        <p class="text-gray-500 text-lg">No assignments found</p>
        <p class="text-gray-400 text-sm mt-1">New service requests will appear here when assigned to you</p>
      </div>
    </div>

    <!-- Assignments List -->
    <div v-else class="space-y-4">
      <div
        v-for="assignment in filteredAssignments"
        :key="assignment.id"
        class="card hover:shadow-md transition-shadow"
      >
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="font-semibold text-gray-900 text-lg">
                  {{ formatServiceType(assignment.service_type) }}
                </h3>
                <span :class="statusBadgeClass(assignment.status)">
                  {{ formatStatus(assignment.status) }}
                </span>
                <span v-if="assignment.priority !== 'normal'" :class="priorityBadgeClass(assignment.priority)">
                  {{ assignment.priority }}
                </span>
              </div>

              <div class="space-y-1 text-sm text-gray-600">
                <p><strong>Patient:</strong> {{ assignment.patient_name }}</p>
                <p v-if="assignment.patient_phone"><strong>Phone:</strong> {{ assignment.patient_phone }}</p>
                <p v-if="assignment.description"><strong>Description:</strong> {{ assignment.description }}</p>
                <p v-if="assignment.preferred_date">
                  <strong>Preferred Date:</strong> {{ formatDate(assignment.preferred_date) }}
                </p>
                <p class="text-gray-400">Requested {{ formatDate(assignment.created_at) }}</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col space-y-2 ml-4">
              <!-- Assigned: Accept or Reject -->
              <template v-if="assignment.status === 'assigned'">
                <button
                  @click="acceptAssignment(assignment.id)"
                  class="btn btn-primary btn-sm"
                  :disabled="actionLoading === assignment.id"
                >
                  Accept
                </button>
                <button
                  @click="showRejectModal(assignment.id)"
                  class="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100"
                  :disabled="actionLoading === assignment.id"
                >
                  Reject
                </button>
              </template>

              <!-- Accepted: Start -->
              <template v-if="assignment.status === 'accepted'">
                <button
                  @click="startAssignment(assignment.id)"
                  class="btn btn-primary btn-sm"
                  :disabled="actionLoading === assignment.id"
                >
                  Start
                </button>
              </template>

              <!-- In Progress: Complete -->
              <template v-if="assignment.status === 'in_progress'">
                <button
                  @click="completeAssignment(assignment.id)"
                  class="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                  :disabled="actionLoading === assignment.id"
                >
                  Complete
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">Reject Assignment</h3>
        <div class="form-group">
          <label class="form-label">Reason for rejection</label>
          <textarea
            v-model="rejectReason"
            rows="3"
            class="input"
            placeholder="Provide a reason..."
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3 mt-4">
          <button @click="rejectModalVisible = false" class="btn btn-sm bg-gray-100 text-gray-700">
            Cancel
          </button>
          <button
            @click="confirmReject"
            class="btn btn-sm bg-red-600 text-white hover:bg-red-700"
            :disabled="!rejectReason.trim()"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { queueService } from '@/services';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/SkeletonLoader.vue';

const { success, error: showError } = useToast();

const loading = ref(true);
const actionLoading = ref(null);
const assignments = ref([]);
const activeFilter = ref('pending');
const rejectModalVisible = ref(false);
const rejectTargetId = ref(null);
const rejectReason = ref('');

const filterTabs = computed(() => [
  { value: 'pending', label: 'Pending', count: assignments.value.filter(a => ['assigned'].includes(a.status)).length },
  { value: 'active', label: 'Active', count: assignments.value.filter(a => ['accepted', 'in_progress'].includes(a.status)).length },
  { value: 'completed', label: 'Completed', count: assignments.value.filter(a => a.status === 'completed').length },
  { value: 'all', label: 'All', count: assignments.value.length },
]);

const filteredAssignments = computed(() => {
  if (activeFilter.value === 'all') return assignments.value;
  if (activeFilter.value === 'pending') {
    return assignments.value.filter(a => a.status === 'assigned');
  }
  if (activeFilter.value === 'active') {
    return assignments.value.filter(a => ['accepted', 'in_progress'].includes(a.status));
  }
  return assignments.value.filter(a => a.status === activeFilter.value);
});

const fetchAssignments = async () => {
  loading.value = true;
  try {
    const response = await queueService.getAssignments();
    assignments.value = response.data.data || [];
  } catch (err) {
    showError('Failed to load assignments');
  } finally {
    loading.value = false;
  }
};

const acceptAssignment = async (id) => {
  actionLoading.value = id;
  try {
    await queueService.acceptAssignment(id);
    success('Assignment accepted');
    await fetchAssignments();
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to accept');
  } finally {
    actionLoading.value = null;
  }
};

const showRejectModal = (id) => {
  rejectTargetId.value = id;
  rejectReason.value = '';
  rejectModalVisible.value = true;
};

const confirmReject = async () => {
  actionLoading.value = rejectTargetId.value;
  rejectModalVisible.value = false;
  try {
    const response = await queueService.rejectAssignment(rejectTargetId.value, rejectReason.value);
    success(response.data.message || 'Assignment rejected');
    await fetchAssignments();
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to reject');
  } finally {
    actionLoading.value = null;
  }
};

const startAssignment = async (id) => {
  actionLoading.value = id;
  try {
    await queueService.startAssignment(id);
    success('Service started');
    await fetchAssignments();
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to start');
  } finally {
    actionLoading.value = null;
  }
};

const completeAssignment = async (id) => {
  actionLoading.value = id;
  try {
    await queueService.completeAssignment(id);
    success('Service completed');
    await fetchAssignments();
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to complete');
  } finally {
    actionLoading.value = null;
  }
};

const serviceTypes = {
  consultation: 'Doctor Consultation',
  prescription: 'Prescription',
  drug_dispensing: 'Drug Dispensing',
  minor_surgery: 'Minor Surgery',
  major_surgery: 'Major Surgery',
  laboratory_test: 'Laboratory Test',
  imaging: 'Imaging / X-Ray',
  admission: 'Hospital Admission',
  emergency: 'Emergency',
};

const formatServiceType = (type) => serviceTypes[type] || type;

const formatStatus = (status) => {
  const map = {
    assigned: 'Awaiting Response',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return map[status] || status;
};

const statusBadgeClass = (status) => {
  const classes = {
    assigned: 'badge badge-warning',
    accepted: 'badge badge-primary',
    in_progress: 'badge badge-info',
    completed: 'badge badge-success',
    cancelled: 'badge badge-danger',
    rejected: 'badge badge-danger',
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

onMounted(fetchAssignments);
</script>
