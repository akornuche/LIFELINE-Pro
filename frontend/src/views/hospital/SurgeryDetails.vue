<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8"><div class="flex items-center"><button @click="$router.back()" aria-label="Go back" class="mr-4 text-gray-600 hover:text-gray-900"><ArrowLeftIcon class="h-6 w-6" /></button><h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Surgery Details</h1></div><span :class="getStatusBadge(surgery.status)" v-if="surgery.status">{{ surgery.status }}</span></div>
    <LoadingSpinner v-if="loading" />
    <div v-else-if="surgery.id" class="grid grid-cols-1 lg:grid-cols-3 gap-8"><div class="lg:col-span-2 space-y-6"><BaseCard title="Surgery Information"><div class="grid grid-cols-2 gap-4"><div><p class="text-sm text-gray-500">Type</p><p class="font-medium">{{ surgery.surgery_type }}</p></div><div><p class="text-sm text-gray-500">Date & Time</p><p class="font-medium">{{ formatDate(surgery.surgery_date) }}</p></div><div><p class="text-sm text-gray-500">Surgeon</p><p class="font-medium">{{ surgery.surgeon_name }}</p></div><div><p class="text-sm text-gray-500">Duration</p><p class="font-medium">{{ surgery.estimated_duration }} hours</p></div><div><p class="text-sm text-gray-500">Anesthesia</p><p class="font-medium">{{ surgery.anesthesia_type }}</p></div><div><p class="text-sm text-gray-500">Cost</p><p class="font-medium">₦{{ formatMoney(surgery.estimated_cost) }}</p></div></div><div v-if="surgery.pre_op_notes" class="mt-4"><h4 class="text-sm font-semibold text-gray-700 mb-2">Pre-Op Notes</h4><p class="text-gray-900">{{ surgery.pre_op_notes }}</p></div><div v-if="surgery.post_op_notes" class="mt-4"><h4 class="text-sm font-semibold text-gray-700 mb-2">Post-Op Notes</h4><p class="text-gray-900">{{ surgery.post_op_notes }}</p></div></BaseCard></div><div class="space-y-6"><BaseCard title="Patient Information"><div class="text-center mb-4"><div class="h-20 w-20 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto">{{ surgery.patient_name?.charAt(0) }}</div><h3 class="mt-3 font-semibold text-gray-900">{{ surgery.patient_name }}</h3><p class="text-sm text-gray-500">{{ surgery.patient_id }}</p></div></BaseCard><BaseCard title="Actions"><div class="space-y-2"><BaseButton v-if="surgery.status === 'scheduled'" variant="primary" fullWidth :loading="starting" @click="startSurgery">Start Surgery</BaseButton><BaseButton v-if="surgery.status === 'in_progress'" variant="primary" fullWidth :loading="completing" @click="completeSurgery">Complete Surgery</BaseButton><BaseButton v-if="['scheduled', 'in_progress'].includes(surgery.status)" variant="danger" fullWidth :loading="cancelling" @click="cancelSurgery">Cancel Surgery</BaseButton></div></BaseCard></div></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseButton, LoadingSpinner } from '@/components';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const route = useRoute();
const router = useRouter();
const hospitalStore = useHospitalStore();
const { success, error: showError, info } = useToast();
const loading = ref(true);
const starting = ref(false);
const completing = ref(false);
const cancelling = ref(false);
const surgery = ref({});

onMounted(async () => {
  try {
    surgery.value = await hospitalStore.getSurgery(route.params.id);
  } catch (error) {
    showError('Failed to load surgery');
    router.push('/hospital/surgeries');
  } finally {
    loading.value = false;
  }
});

const startSurgery = async () => {
  starting.value = true;
  try {
    await hospitalStore.updateSurgery(surgery.value.id, { status: 'in_progress' });
    success('Surgery started');
    surgery.value = await hospitalStore.getSurgery(route.params.id);
  } catch (error) {
    showError('Failed to start surgery');
  } finally {
    starting.value = false;
  }
};

const completeSurgery = async () => {
  completing.value = true;
  try {
    await hospitalStore.updateSurgery(surgery.value.id, { status: 'completed' });
    success('Surgery completed');
    surgery.value = await hospitalStore.getSurgery(route.params.id);
  } catch (error) {
    showError('Failed to complete surgery');
  } finally {
    completing.value = false;
  }
};

const cancelSurgery = async () => {
  const reason = prompt('Reason for cancellation:');
  if (!reason) return;
  cancelling.value = true;
  try {
    await hospitalStore.updateSurgery(surgery.value.id, { status: 'cancelled', cancellation_reason: reason });
    success('Surgery cancelled');
    surgery.value = await hospitalStore.getSurgery(route.params.id);
  } catch (error) {
    showError('Failed to cancel surgery');
  } finally {
    cancelling.value = false;
  }
};

const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy h:mm a');
const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
const getStatusBadge = (status) => ({ scheduled: 'badge badge-info', in_progress: 'badge badge-warning', completed: 'badge badge-success', cancelled: 'badge badge-error' }[status] || 'badge');
</script>
