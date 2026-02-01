<template>
  <div class="page-container">
    <div class="flex items-center mb-8 animate-fade-in">
      <button @click="$router.back()" aria-label="Go back" class="mr-4 text-gray-600 hover:text-gray-900">
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">New Consultation</h1>
    </div>

    <BaseCard>
      <form @submit.prevent="submitConsultation" class="space-y-6">
        <!-- Patient Selection -->
        <div>
          <label class="form-label">Search Patient <span class="text-red-500">*</span></label>
          <div class="relative">
            <BaseInput
              v-model="patientSearch"
              placeholder="Search by name or patient ID..."
              @input="searchPatients"
            />
            <div
              v-if="searchResults.length > 0 && showResults"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div
                v-for="patient in searchResults"
                :key="patient.id"
                @click="selectPatient(patient)"
                class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              >
                <p class="font-medium text-gray-900">{{ patient.full_name }}</p>
                <p class="text-sm text-gray-500">ID: {{ patient.patient_id }}</p>
              </div>
            </div>
          </div>
          
          <div v-if="form.patient" class="mt-3 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">{{ form.patient.full_name }}</p>
              <p class="text-sm text-gray-600">ID: {{ form.patient.patient_id }}</p>
              <p class="text-sm text-gray-600">Package: {{ form.patient.package_type }}</p>
            </div>
            <button
              type="button"
              @click="clearPatient"
              class="text-red-600 hover:text-red-700"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Consultation Type <span class="text-red-500">*</span></label>
            <select v-model="form.consultation_type" class="input" required>
              <option value="">Select type</option>
              <option value="General Consultation">General Consultation</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Emergency">Emergency</option>
              <option value="Specialist Consultation">Specialist Consultation</option>
            </select>
          </div>

          <BaseInput
            v-model="form.consultation_date"
            label="Consultation Date & Time"
            type="datetime-local"
            required
          />
        </div>

        <BaseInput
          v-model="form.chief_complaint"
          label="Chief Complaint"
          type="textarea"
          :rows="3"
          required
        />

        <BaseInput
          v-model="form.symptoms"
          label="Symptoms"
          type="textarea"
          :rows="3"
        />

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseInput
            v-model="form.vital_signs.temperature"
            label="Temperature (°C)"
            type="number"
            step="0.1"
          />
          <BaseInput
            v-model="form.vital_signs.blood_pressure"
            label="Blood Pressure"
            placeholder="120/80"
          />
          <BaseInput
            v-model="form.vital_signs.heart_rate"
            label="Heart Rate (bpm)"
            type="number"
          />
        </div>

        <BaseInput
          v-model="form.diagnosis"
          label="Diagnosis"
          type="textarea"
          :rows="3"
        />

        <BaseInput
          v-model="form.treatment_plan"
          label="Treatment Plan"
          type="textarea"
          :rows="4"
        />

        <BaseInput
          v-model="form.notes"
          label="Additional Notes"
          type="textarea"
          :rows="3"
        />

        <BaseInput
          v-model.number="form.fee"
          label="Consultation Fee (₦)"
          type="number"
          required
        />

        <div class="flex justify-end gap-3">
          <BaseButton variant="outline" @click="$router.back()">
            Cancel
          </BaseButton>
          <BaseButton type="submit" :loading="submitting">
            Create Consultation
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDoctorStore } from '@/stores/doctor';
import { useToast } from '@/composables/useToast';
import { patientService } from '@/services';
import { BaseCard, BaseInput, BaseButton } from '@/components';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const doctorStore = useDoctorStore();
const { success, error: showError } = useToast();

const submitting = ref(false);
const patientSearch = ref('');
const searchResults = ref([]);
const showResults = ref(false);

const form = ref({
  patient: null,
  patient_id: null,
  consultation_type: '',
  consultation_date: '',
  chief_complaint: '',
  symptoms: '',
  vital_signs: {
    temperature: '',
    blood_pressure: '',
    heart_rate: ''
  },
  diagnosis: '',
  treatment_plan: '',
  notes: '',
  fee: 0
});

const searchPatients = async () => {
  if (patientSearch.value.length < 2) {
    searchResults.value = [];
    return;
  }
  
  try {
    const response = await patientService.searchPatients({ search: patientSearch.value });
    searchResults.value = response.data.patients || [];
    showResults.value = true;
  } catch (error) {
    console.error('Error searching patients:', error);
  }
};

const selectPatient = (patient) => {
  form.value.patient = patient;
  form.value.patient_id = patient.id;
  patientSearch.value = patient.full_name;
  showResults.value = false;
};

const clearPatient = () => {
  form.value.patient = null;
  form.value.patient_id = null;
  patientSearch.value = '';
};

const submitConsultation = async () => {
  if (!form.value.patient_id) {
    showError('Please select a patient');
    return;
  }
  
  submitting.value = true;
  try {
    const consultationData = {
      patient_id: form.value.patient_id,
      consultation_type: form.value.consultation_type,
      consultation_date: form.value.consultation_date,
      chief_complaint: form.value.chief_complaint,
      symptoms: form.value.symptoms,
      vital_signs: form.value.vital_signs,
      diagnosis: form.value.diagnosis,
      treatment_plan: form.value.treatment_plan,
      notes: form.value.notes,
      fee: form.value.fee
    };
    
    const consultation = await doctorStore.createConsultation(consultationData);
    success('Consultation created successfully');
    router.push(`/doctor/consultations/${consultation.id}`);
  } catch (error) {
    showError(error.response?.data?.message || 'Failed to create consultation');
  } finally {
    submitting.value = false;
  }
};
</script>
