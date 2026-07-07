<template>
  <div class="page-container">
    <div class="flex items-center mb-8">
      <button @click="$router.back()" aria-label="Go back" class="mr-4 text-gray-600 hover:text-gray-900"><ArrowLeftIcon class="h-6 w-6" /></button>
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Schedule New Surgery</h1>
    </div>

    <BaseCard>
      <form @submit.prevent="submitSurgery" class="space-y-6">

        <!-- Patient lookup -->
        <div>
          <p class="text-sm font-semibold text-gray-700 mb-1">Patient LifeLine ID <span class="text-red-500">*</span></p>
          <div class="flex gap-2">
            <input v-model="patientLifelineId" type="text" class="input flex-1 uppercase" placeholder="LLPAT-00001" :disabled="!!patient" />
            <BaseButton type="button" variant="outline" @click="lookupPatient" :loading="lookingUpPatient" :disabled="!!patient">Verify</BaseButton>
            <BaseButton v-if="patient" type="button" variant="danger" size="sm" @click="clearPatient">✕</BaseButton>
          </div>
          <p v-if="patient" class="mt-1 text-sm text-green-700 font-medium">✓ {{ patient.name }} ({{ patient.role }})</p>
          <p v-if="patientError" class="mt-1 text-sm text-red-600">{{ patientError }}</p>
        </div>

        <!-- Doctor lookup -->
        <div>
          <p class="text-sm font-semibold text-gray-700 mb-1">Assigned Doctor LifeLine ID <span class="text-red-500">*</span></p>
          <div class="flex gap-2">
            <input v-model="doctorLifelineId" type="text" class="input flex-1 uppercase" placeholder="LLDOC-00001" :disabled="!!doctor" />
            <BaseButton type="button" variant="outline" @click="lookupDoctor" :loading="lookingUpDoctor" :disabled="!!doctor">Verify</BaseButton>
            <BaseButton v-if="doctor" type="button" variant="danger" size="sm" @click="clearDoctor">✕</BaseButton>
          </div>
          <p v-if="doctor" class="mt-1 text-sm text-green-700 font-medium">✓ {{ doctor.name }} ({{ doctor.role }})</p>
          <p v-if="doctorError" class="mt-1 text-sm text-red-600">{{ doctorError }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Surgery Type <span class="text-red-500">*</span></label>
            <select v-model="form.surgeryType" class="input w-full" required>
              <option value="">Select type...</option>
              <option value="minor">Minor Surgery</option>
              <option value="major">Major Surgery</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Surgery Date & Time <span class="text-red-500">*</span></label>
            <input v-model="form.surgeryDate" type="datetime-local" class="input w-full" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (minutes) <span class="text-red-500">*</span></label>
            <input v-model.number="form.estimatedDuration" type="number" min="15" step="15" class="input w-full" placeholder="e.g. 90" required />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description / Surgery Name</label>
          <input v-model="form.description" type="text" class="input w-full" placeholder="e.g. Appendectomy, Laparoscopic cholecystectomy" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Pre-Operation Notes</label>
          <textarea v-model="form.preOpNotes" class="input w-full" rows="3" placeholder="Patient preparation instructions, allergies, etc."></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="outline" type="button" @click="$router.back()">Cancel</BaseButton>
          <BaseButton type="submit" :loading="submitting" :disabled="!patient || !doctor">Schedule Surgery</BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseButton } from '@/components';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const hospitalStore = useHospitalStore();
const { success, error: showError } = useToast();

const submitting = ref(false);
const lookingUpPatient = ref(false);
const lookingUpDoctor = ref(false);

const patientLifelineId = ref('');
const doctorLifelineId = ref('');
const patient = ref(null);
const doctor = ref(null);
const patientError = ref('');
const doctorError = ref('');

const form = ref({
  surgeryType: '',
  surgeryDate: '',
  estimatedDuration: 60,
  description: '',
  preOpNotes: '',
});

const lookupPatient = async () => {
  if (!patientLifelineId.value.trim()) return;
  patientError.value = '';
  lookingUpPatient.value = true;
  try {
    const result = await hospitalStore.lookupUser(patientLifelineId.value.trim());
    if (result.role !== 'patient') {
      patientError.value = `That LifeLine ID belongs to a ${result.role}, not a patient.`;
      return;
    }
    patient.value = result;
  } catch (err) {
    patientError.value = err.response?.data?.message || 'Patient not found';
  } finally {
    lookingUpPatient.value = false;
  }
};

const lookupDoctor = async () => {
  if (!doctorLifelineId.value.trim()) return;
  doctorError.value = '';
  lookingUpDoctor.value = true;
  try {
    const result = await hospitalStore.lookupUser(doctorLifelineId.value.trim());
    if (result.role !== 'doctor') {
      doctorError.value = `That LifeLine ID belongs to a ${result.role}, not a doctor.`;
      return;
    }
    doctor.value = result;
  } catch (err) {
    doctorError.value = err.response?.data?.message || 'Doctor not found';
  } finally {
    lookingUpDoctor.value = false;
  }
};

const clearPatient = () => { patient.value = null; patientLifelineId.value = ''; patientError.value = ''; };
const clearDoctor = () => { doctor.value = null; doctorLifelineId.value = ''; doctorError.value = ''; };

const submitSurgery = async () => {
  if (!patient.value) { showError('Please verify the patient LifeLine ID first'); return; }
  if (!doctor.value) { showError('Please verify the doctor LifeLine ID first'); return; }
  if (!form.value.surgeryType) { showError('Please select a surgery type'); return; }
  if (!form.value.surgeryDate) { showError('Please set the surgery date and time'); return; }

  submitting.value = true;
  try {
    const surgery = await hospitalStore.createSurgery({
      patientId: patient.value.id,
      doctorId: doctor.value.id,
      surgeryType: form.value.surgeryType,
      surgeryDate: form.value.surgeryDate,
      estimatedDuration: form.value.estimatedDuration,
      description: form.value.description || undefined,
      preOpNotes: form.value.preOpNotes || undefined,
    });
    success('Surgery scheduled successfully');
    router.push(`/hospital/surgeries/${surgery.id || ''}`);
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to schedule surgery');
  } finally {
    submitting.value = false;
  }
};
</script>

