<template>
  <BaseModal
    :isOpen="isOpen"
    :title="dependent ? 'Edit Dependent' : 'Add Dependent'"
    size="lg"
    @close="handleClose"
  >
    <form ref="formRef" @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Name Fields -->
      <div class="grid md:grid-cols-2 gap-4">
        <div class="form-group">
          <label class="form-label required">First Name</label>
          <input
            v-model="form.first_name"
            type="text"
            class="input"
            required
            placeholder="Enter first name"
          />
        </div>
        <div class="form-group">
          <label class="form-label required">Last Name</label>
          <input
            v-model="form.last_name"
            type="text"
            class="input"
            required
            placeholder="Enter last name"
          />
        </div>
      </div>

      <!-- Relationship & DOB -->
      <div class="grid md:grid-cols-2 gap-4">
        <div class="form-group">
          <label class="form-label required">Relationship</label>
          <select v-model="form.relationship" class="input" required>
            <option value="">Select relationship</option>
            <option value="spouse">Spouse</option>
            <option value="child">Child</option>
            <option value="parent">Parent</option>
            <option value="sibling">Sibling</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Date of Birth</label>
          <input
            v-model="form.date_of_birth"
            type="date"
            class="input"
            required
            :max="maxDate"
          />
        </div>
      </div>

      <!-- Gender -->
      <div class="form-group">
        <label class="form-label required">Gender</label>
        <div class="flex gap-4">
          <label class="flex items-center">
            <input
              v-model="form.gender"
              type="radio"
              value="male"
              class="mr-2"
              required
            />
            Male
          </label>
          <label class="flex items-center">
            <input
              v-model="form.gender"
              type="radio"
              value="female"
              class="mr-2"
              required
            />
            Female
          </label>
          <label class="flex items-center">
            <input
              v-model="form.gender"
              type="radio"
              value="other"
              class="mr-2"
              required
            />
            Other
          </label>
        </div>
      </div>

      <!-- Medical Conditions (Optional) -->
      <div class="form-group">
        <label class="form-label">Known Medical Conditions</label>
        <textarea
          v-model="form.medical_conditions"
          class="input"
          rows="3"
          placeholder="Enter any known medical conditions (optional)"
        ></textarea>
        <p class="form-help">This helps healthcare providers provide better care</p>
      </div>

      <!-- Allergies (Optional) -->
      <div class="form-group">
        <label class="form-label">Allergies</label>
        <input
          v-model="form.allergies"
          type="text"
          class="input"
          placeholder="E.g., Penicillin, Peanuts (optional)"
        />
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        @click="handleClose"
        class="btn btn-secondary"
        :disabled="saving"
      >
        Cancel
      </button>
      <button
        type="button"
        @click="handleSubmit"
        class="btn btn-primary"
        :disabled="saving"
      >
        <span v-if="saving" class="spinner spinner-sm mr-2"></span>
        {{ saving ? 'Saving...' : (dependent ? 'Update' : 'Add') }} Dependent
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  dependent: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'submit']);

const saving = ref(false);

const maxDate = new Date().toISOString().split('T')[0];

const form = ref({
  first_name: '',
  last_name: '',
  relationship: '',
  date_of_birth: '',
  gender: '',
  medical_conditions: '',
  allergies: ''
});

// Reset form when modal opens/closes or dependent changes
watch([() => props.isOpen, () => props.dependent], () => {
  if (props.isOpen) {
    if (props.dependent) {
      // Editing existing dependent
      form.value = {
        first_name: props.dependent.first_name || '',
        last_name: props.dependent.last_name || '',
        relationship: props.dependent.relationship || '',
        date_of_birth: props.dependent.date_of_birth || '',
        gender: props.dependent.gender || '',
        medical_conditions: props.dependent.medical_conditions || '',
        allergies: props.dependent.allergies || ''
      };
    } else {
      // Adding new dependent
      form.value = {
        first_name: '',
        last_name: '',
        relationship: '',
        date_of_birth: '',
        gender: '',
        medical_conditions: '',
        allergies: ''
      };
    }
  }
}, { immediate: true });
const formRef = ref(null);

const handleClose = () => {
  if (!saving.value) {
    emit('close');
  }
};

const handleSubmit = async () => {
  if (formRef.value && !formRef.value.checkValidity()) {
    formRef.value.reportValidity();
    return;
  }

  saving.value = true;
  try {
    await emit('submit', form.value);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.form-label.required::after {
  content: ' *';
  color: #ef4444;
}
</style>
