<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center">
        <button @click="$router.back()" class="mr-4 text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon class="h-6 w-6" />
        </button>
        <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Consultation Details</h1>
      </div>
      <span :class="getStatusBadge(consultation.status)" v-if="consultation.status">
        {{ consultation.status }}
      </span>
    </div>

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <SkeletonLoader type="card" v-for="i in 3" :key="i" />
      </div>
      <SkeletonLoader type="card" />
    </div>

    <div v-else-if="consultation.id" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Consultation Information -->
        <BaseCard title="Consultation Information">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Type</p>
              <p class="font-medium">{{ consultation.consultation_type }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Date & Time</p>
              <p class="font-medium">{{ formatDate(consultation.consultation_date) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Fee</p>
              <p class="font-medium">₦{{ formatMoney(consultation.fee) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Duration</p>
              <p class="font-medium">{{ consultation.duration || 'N/A' }} mins</p>
            </div>
          </div>
        </BaseCard>

        <!-- Medical Details -->
        <BaseCard title="Medical Details">
          <div class="space-y-4">
            <div v-if="consultation.chief_complaint">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Chief Complaint</h4>
              <p class="text-gray-900">{{ consultation.chief_complaint }}</p>
            </div>
            
            <div v-if="consultation.symptoms">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Symptoms</h4>
              <p class="text-gray-900">{{ consultation.symptoms }}</p>
            </div>

            <div v-if="consultation.vital_signs">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Vital Signs</h4>
              <div class="grid grid-cols-3 gap-4">
                <div v-if="consultation.vital_signs.temperature">
                  <p class="text-sm text-gray-500">Temperature</p>
                  <p class="font-medium">{{ consultation.vital_signs.temperature }}°C</p>
                </div>
                <div v-if="consultation.vital_signs.blood_pressure">
                  <p class="text-sm text-gray-500">Blood Pressure</p>
                  <p class="font-medium">{{ consultation.vital_signs.blood_pressure }}</p>
                </div>
                <div v-if="consultation.vital_signs.heart_rate">
                  <p class="text-sm text-gray-500">Heart Rate</p>
                  <p class="font-medium">{{ consultation.vital_signs.heart_rate }} bpm</p>
                </div>
              </div>
            </div>
            
            <div v-if="consultation.diagnosis">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Diagnosis</h4>
              <p class="text-gray-900">{{ consultation.diagnosis }}</p>
            </div>
            
            <div v-if="consultation.treatment_plan">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Treatment Plan</h4>
              <p class="text-gray-900">{{ consultation.treatment_plan }}</p>
            </div>
            
            <div v-if="consultation.notes">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Additional Notes</h4>
              <p class="text-gray-600">{{ consultation.notes }}</p>
            </div>
          </div>
        </BaseCard>

        <!-- Prescriptions -->
        <BaseCard title="Prescriptions">
          <div v-if="consultation.prescriptions?.length > 0" class="space-y-3">
            <div
              v-for="prescription in consultation.prescriptions"
              :key="prescription.id"
              class="p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900">Prescription #{{ prescription.id }}</h4>
                <span :class="getStatusBadge(prescription.status)">{{ prescription.status }}</span>
              </div>
              <div class="space-y-2">
                <div v-for="drug in prescription.drugs" :key="drug.id" class="text-sm">
                  <p class="font-medium">{{ drug.drug_name }}</p>
                  <p class="text-gray-600">{{ drug.dosage }} - {{ drug.frequency }} for {{ drug.duration }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            No prescriptions issued yet
          </div>
          
          <template #footer v-if="consultation.status !== 'cancelled'">
            <BaseButton @click="showPrescriptionModal = true" size="sm">
              Create Prescription
            </BaseButton>
          </template>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Patient Information -->
        <BaseCard title="Patient Information">
          <div class="text-center mb-4">
            <div class="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto">
              {{ consultation.patient_name?.charAt(0) }}
            </div>
            <h3 class="mt-3 font-semibold text-gray-900">{{ consultation.patient_name }}</h3>
            <p class="text-sm text-gray-500">{{ consultation.patient_id }}</p>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Age</span>
              <span class="font-medium">{{ consultation.patient_age }} years</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Gender</span>
              <span class="font-medium">{{ consultation.patient_gender }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Package</span>
              <span class="font-medium">{{ consultation.package_type }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Actions -->
        <BaseCard title="Actions">
          <div class="space-y-2">
            <BaseButton
              v-if="consultation.status === 'scheduled'"
              @click="startConsultation"
              variant="primary"
              fullWidth
              :loading="starting"
            >
              Start Consultation
            </BaseButton>
            
            <BaseButton
              v-if="consultation.status === 'in_progress'"
              @click="completeConsultation"
              variant="primary"
              fullWidth
              :loading="completing"
            >
              Complete Consultation
            </BaseButton>
            
            <BaseButton
              v-if="['scheduled', 'in_progress'].includes(consultation.status)"
              @click="cancelConsultation"
              variant="danger"
              fullWidth
              :loading="cancelling"
            >
              Cancel Consultation
            </BaseButton>
            
            <BaseButton
              @click="downloadReport"
              variant="outline"
              fullWidth
            >
              Download Report
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Create Prescription Modal -->
    <BaseModal :is-open="showPrescriptionModal" @close="showPrescriptionModal = false" title="Create Prescription" size="lg">
      <form @submit.prevent="createPrescription" class="space-y-4">
        <div v-for="(drug, index) in prescriptionForm.drugs" :key="index" class="p-4 border border-gray-200 rounded-lg">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-medium">Drug {{ index + 1 }}</h4>
            <button
              v-if="prescriptionForm.drugs.length > 1"
              type="button"
              @click="removeDrug(index)"
              class="text-red-600 hover:text-red-700"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
          
          <div class="space-y-3">
            <BaseInput v-model="drug.drug_name" label="Drug Name" required />
            <BaseInput v-model="drug.dosage" label="Dosage" required />
            <BaseInput v-model="drug.frequency" label="Frequency" required />
            <BaseInput v-model="drug.duration" label="Duration" required />
            <BaseInput v-model="drug.instructions" label="Instructions" type="textarea" :rows="2" />
          </div>
        </div>
        
        <BaseButton type="button" variant="outline" @click="addDrug" fullWidth>
          Add Another Drug
        </BaseButton>
        
        <BaseInput
          v-model="prescriptionForm.notes"
          label="Additional Notes"
          type="textarea"
          :rows="3"
        />
      </form>

      <template #footer>
        <BaseButton variant="outline" @click="showPrescriptionModal = false">
          Cancel
        </BaseButton>
        <BaseButton @click="createPrescription" :loading="creatingPrescription">
          Create Prescription
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDoctorStore } from '@/stores/doctor';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { BaseCard, BaseButton, BaseModal, BaseInput, LoadingSpinner } from '@/components';
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const route = useRoute();
const router = useRouter();
const doctorStore = useDoctorStore();
const { success, error: showError, info } = useToast();
const { confirm } = useConfirm();

const loading = ref(true);
const starting = ref(false);
const completing = ref(false);
const cancelling = ref(false);
const creatingPrescription = ref(false);
const consultation = ref({});
const showPrescriptionModal = ref(false);

const prescriptionForm = ref({
  drugs: [{
    drug_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }],
  notes: ''
});

onMounted(async () => {
  await loadConsultation();
  loading.value = false;
});

const loadConsultation = async () => {
  try {
    consultation.value = await doctorStore.getConsultation(route.params.id);
  } catch (error) {
    showError('Failed to load consultation');
    router.push('/doctor/consultations');
  }
};

const startConsultation = async () => {
  starting.value = true;
  try {
    await doctorStore.startConsultation(consultation.value.id);
    success('Consultation started');
    await loadConsultation();
  } catch (error) {
    showError('Failed to start consultation');
  } finally {
    starting.value = false;
  }
};

const completeConsultation = async () => {
  completing.value = true;
  try {
    await doctorStore.completeConsultation(consultation.value.id, {});
    success('Consultation completed');
    await loadConsultation();
  } catch (error) {
    showError('Failed to complete consultation');
  } finally {
    completing.value = false;
  }
};

const cancelConsultation = async () => {
  const reason = prompt('Please provide a reason for cancellation:');
  if (!reason) return;
  
  cancelling.value = true;
  try {
    await doctorStore.cancelConsultation(consultation.value.id, reason);
    success('Consultation cancelled');
    await loadConsultation();
  } catch (error) {
    showError('Failed to cancel consultation');
  } finally {
    cancelling.value = false;
  }
};

const addDrug = () => {
  prescriptionForm.value.drugs.push({
    drug_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
};

const removeDrug = (index) => {
  prescriptionForm.value.drugs.splice(index, 1);
};

const createPrescription = async () => {
  creatingPrescription.value = true;
  try {
    const data = {
      consultation_id: consultation.value.id,
      patient_id: consultation.value.patient_id,
      ...prescriptionForm.value
    };
    
    await doctorStore.createPrescription(data);
    success('Prescription created successfully');
    showPrescriptionModal.value = false;
    await loadConsultation();
    
    // Reset form
    prescriptionForm.value = {
      drugs: [{ drug_name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      notes: ''
    };
  } catch (error) {
    showError('Failed to create prescription');
  } finally {
    creatingPrescription.value = false;
  }
};

const downloadReport = () => {
  info('Download feature coming soon');
};

const formatDate = (dateString) => {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a');
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount);
};

const getStatusBadge = (status) => {
  const badges = {
    scheduled: 'badge badge-info',
    in_progress: 'badge badge-warning',
    completed: 'badge badge-success',
    cancelled: 'badge badge-error',
    pending: 'badge badge-warning',
    dispensed: 'badge badge-success'
  };
  return badges[status] || 'badge';
};
</script>
