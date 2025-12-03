<template>
  <div class="page-container">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Dependents</h1>
        <p class="text-gray-600 mt-2">Manage your family members</p>
      </div>
      <button
        @click="showAddModal = true"
        :disabled="!patientStore.canAddDependent"
        class="btn btn-primary"
      >
        Add Dependent
      </button>
    </div>

    <!-- Dependent Limit Info -->
    <div class="alert alert-info mb-6">
      <p>
        You can add up to <strong>{{ patientStore.maxDependents }}</strong> dependents with your
        <strong class="capitalize">{{ patientStore.packageType }}</strong> package.
        Current: <strong>{{ patientStore.dependentCount }}</strong>
      </p>
    </div>

    <!-- Dependents List -->
    <div v-if="loading" class="grid md:grid-cols-2 gap-6">
      <SkeletonLoader type="card" v-for="i in 4" :key="i" />
    </div>

    <div v-else-if="!patientStore.dependents.length" class="card">
      <div class="card-body text-center py-12">
        <UsersIcon class="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Dependents Added</h3>
        <p class="text-gray-600 mb-6">Start adding your family members to your plan</p>
        <button
          @click="showAddModal = true"
          :disabled="!patientStore.canAddDependent"
          class="btn btn-primary"
        >
          Add Your First Dependent
        </button>
      </div>
    </div>

    <div v-else class="grid md:grid-cols-2 gap-6">
      <div 
        v-for="(dependent, index) in patientStore.dependents" 
        :key="dependent.id" 
        class="card hover-lift animate-fade-in"
        :class="`stagger-${Math.min(index + 1, 4)}`"
      >
        <div class="card-body">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center">
              <div class="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <span class="text-primary-600 font-semibold text-lg">
                  {{ dependent.first_name[0] }}{{ dependent.last_name[0] }}
                </span>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ dependent.first_name }} {{ dependent.last_name }}
                </h3>
                <p class="text-sm text-gray-600 capitalize">{{ dependent.relationship }}</p>
              </div>
            </div>
            <span class="badge badge-success">Active</span>
          </div>

          <div class="space-y-2 mb-4">
            <div class="flex items-center text-sm text-gray-600">
              <CalendarIcon class="h-4 w-4 mr-2" />
              {{ formatDate(dependent.date_of_birth) }}
            </div>
            <div class="flex items-center text-sm text-gray-600 capitalize">
              <UserIcon class="h-4 w-4 mr-2" />
              {{ dependent.gender }}
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="editDependent(dependent)"
              class="btn btn-secondary btn-sm flex-1"
            >
              Edit
            </button>
            <button
              @click="confirmRemove(dependent)"
              class="btn btn-danger btn-sm flex-1"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dependent Modal (placeholder) -->
    <!-- In production, implement proper modal component -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePatientStore } from '@/stores/patient';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { UsersIcon, CalendarIcon, UserIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const patientStore = usePatientStore();
const { success, error: showError } = useToast();
const { confirm } = useConfirm();

const loading = ref(true);
const showAddModal = ref(false);

onMounted(async () => {
  try {
    await patientStore.fetchDependents();
  } catch (error) {
    console.error('Failed to load dependents:', error);
    showError('Failed to load dependents. Please refresh the page.');
  } finally {
    loading.value = false;
  }
});

const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

const editDependent = (dependent) => {
  // TODO: Implement edit modal
  console.log('Edit dependent:', dependent);
  showError('Edit feature coming soon!');
};

const confirmRemove = async (dependent) => {
  const confirmed = await confirm({
    title: 'Remove Dependent',
    message: `Are you sure you want to remove ${dependent.first_name} ${dependent.last_name} from your plan? This action cannot be undone.`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
    type: 'danger'
  });
  
  if (confirmed) {
    try {
      await patientStore.removeDependent(dependent.id);
      success(`${dependent.first_name} ${dependent.last_name} has been removed successfully.`);
    } catch (error) {
      console.error('Failed to remove dependent:', error);
      showError('Failed to remove dependent. Please try again.');
    }
  }
};
</script>
