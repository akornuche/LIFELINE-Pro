<template>
  <div class="page-container">
    <div class="flex items-center mb-8"><button @click="$router.back()" aria-label="Go back" class="mr-4 text-gray-600 hover:text-gray-900"><ArrowLeftIcon class="h-6 w-6" /></button><h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Schedule New Surgery</h1></div>
    <BaseCard><form @submit.prevent="submitSurgery" class="space-y-4"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><BaseInput v-model="form.patient_name" label="Patient Name" required /><BaseInput v-model="form.patient_id" label="Patient ID" required /><BaseInput v-model="form.surgery_type" label="Surgery Type" required /><BaseInput v-model="form.surgeon_name" label="Surgeon Name" required /><BaseInput v-model="form.surgery_date" label="Surgery Date & Time" type="datetime-local" required /><BaseInput v-model.number="form.estimated_duration" label="Estimated Duration (hours)" type="number" step="0.5" required /></div><BaseInput v-model="form.pre_op_notes" label="Pre-Operation Notes" type="textarea" :rows="3" /><BaseInput v-model="form.anesthesia_type" label="Anesthesia Type" required /><BaseInput v-model.number="form.estimated_cost" label="Estimated Cost (₦)" type="number" required /><div class="flex justify-end gap-3"><BaseButton variant="outline" @click="$router.back()">Cancel</BaseButton><BaseButton type="submit" :loading="submitting">Schedule Surgery</BaseButton></div></form></BaseCard>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseInput, BaseButton } from '@/components';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const hospitalStore = useHospitalStore();
const { success, error: showError, info } = useToast();
const submitting = ref(false);
const form = ref({ patient_name: '', patient_id: '', surgery_type: '', surgeon_name: '', surgery_date: '', estimated_duration: 0, pre_op_notes: '', anesthesia_type: '', estimated_cost: 0 });

const submitSurgery = async () => {
  submitting.value = true;
  try {
    const surgery = await hospitalStore.createSurgery(form.value);
    success('Surgery scheduled successfully');
    router.push(`/hospital/surgeries/${surgery.id}`);
  } catch (error) {
    showError('Failed to schedule surgery');
  } finally {
    submitting.value = false;
  }
};
</script>
