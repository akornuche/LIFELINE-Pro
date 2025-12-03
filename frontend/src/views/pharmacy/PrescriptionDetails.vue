<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center">
        <button @click="$router.back()" aria-label="Go back" class="mr-4 text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon class="h-6 w-6" />
        </button>
        <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Prescription Details</h1>
      </div>
      <span :class="getStatusBadge(prescription.status)" v-if="prescription.status">{{ prescription.status }}</span>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="prescription.id" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <BaseCard title="Prescribed Drugs">
          <div class="space-y-4">
            <div v-for="(drug, index) in prescription.drugs" :key="index" class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-gray-900 mb-2">{{ drug.drug_name }}</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="text-gray-500">Dosage:</span> {{ drug.dosage }}</div>
                <div><span class="text-gray-500">Frequency:</span> {{ drug.frequency }}</div>
                <div><span class="text-gray-500">Duration:</span> {{ drug.duration }}</div>
              </div>
              <p v-if="drug.instructions" class="text-sm text-gray-600 mt-2">{{ drug.instructions }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard v-if="prescription.status === 'pending'" title="Dispense Prescription">
          <form @submit.prevent="dispensePrescription" class="space-y-4">
            <BaseInput v-model.number="form.total_amount" label="Total Amount (₦)" type="number" required />
            <BaseInput v-model="form.pharmacist_name" label="Pharmacist Name" required />
            <BaseInput v-model="form.notes" label="Dispensing Notes" type="textarea" :rows="3" />
            <div class="flex justify-end">
              <BaseButton type="submit" :loading="dispensing">Dispense Prescription</BaseButton>
            </div>
          </form>
        </BaseCard>

        <BaseCard v-if="prescription.dispensed_at" title="Dispensing Information">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Dispensed By:</span><span class="font-medium">{{ prescription.pharmacist_name }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Dispensed At:</span><span class="font-medium">{{ formatDate(prescription.dispensed_at) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Amount:</span><span class="font-medium">₦{{ formatMoney(prescription.total_amount) }}</span></div>
            <p v-if="prescription.dispensing_notes" class="text-gray-600 mt-2">{{ prescription.dispensing_notes }}</p>
          </div>
        </BaseCard>
      </div>

      <div class="space-y-6">
        <BaseCard title="Patient Information">
          <div class="text-center mb-4">
            <div class="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto">
              {{ prescription.patient_name?.charAt(0) }}
            </div>
            <h3 class="mt-3 font-semibold text-gray-900">{{ prescription.patient_name }}</h3>
            <p class="text-sm text-gray-500">{{ prescription.patient_id }}</p>
          </div>
        </BaseCard>

        <BaseCard title="Doctor Information">
          <div class="space-y-2 text-sm">
            <div><span class="text-gray-500">Name:</span> <span class="font-medium">{{ prescription.doctor_name }}</span></div>
            <div><span class="text-gray-500">License:</span> <span class="font-medium">{{ prescription.doctor_license }}</span></div>
            <div><span class="text-gray-500">Date Issued:</span> <span class="font-medium">{{ formatDate(prescription.created_at) }}</span></div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { usePharmacyStore } from '@/stores/pharmacy';
import { BaseCard, BaseInput, BaseButton, LoadingSpinner } from '@/components';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const route = useRoute();
const router = useRouter();
const pharmacyStore = usePharmacyStore();
const { success, error: showError, info } = useToast();
const loading = ref(true);
const dispensing = ref(false);
const prescription = ref({});
const form = ref({ total_amount: 0, pharmacist_name: '', notes: '' });

onMounted(async () => {
  try {
    prescription.value = await pharmacyStore.getPrescription(route.params.id);
  } catch (error) {
    showError('Failed to load prescription');
    router.push('/pharmacy/prescriptions');
  } finally {
    loading.value = false;
  }
});

const dispensePrescription = async () => {
  dispensing.value = true;
  try {
    await pharmacyStore.dispensePrescription(prescription.value.id, form.value);
    success('Prescription dispensed successfully');
    prescription.value = await pharmacyStore.getPrescription(route.params.id);
    form.value = { total_amount: 0, pharmacist_name: '', notes: '' };
  } catch (error) {
    showError('Failed to dispense prescription');
  } finally {
    dispensing.value = false;
  }
};

const formatDate = (dateString) => format(new Date(dateString), 'MMM d, yyyy h:mm a');
const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
const getStatusBadge = (status) => ({ pending: 'badge badge-warning', dispensed: 'badge badge-success', cancelled: 'badge badge-error' }[status] || 'badge');
</script>
