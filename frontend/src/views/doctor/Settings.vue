<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Settings</h1>

    <div class="space-y-6">
      <!-- Availability Schedule -->
      <BaseCard title="Availability Schedule">
        <form @submit.prevent="updateAvailability" class="space-y-4">
          <div v-for="day in daysOfWeek" :key="day" class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
            <div class="w-32">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="availability[day].enabled"
                  class="mr-2"
                />
                <span class="font-medium">{{ day }}</span>
              </label>
            </div>
            
            <div v-if="availability[day].enabled" class="flex items-center gap-4 flex-1">
              <BaseInput
                v-model="availability[day].start_time"
                type="time"
                class="w-32"
              />
              <span class="text-gray-500">to</span>
              <BaseInput
                v-model="availability[day].end_time"
                type="time"
                class="w-32"
              />
              <BaseInput
                v-model.number="availability[day].slots_per_hour"
                type="number"
                min="1"
                max="4"
                placeholder="Slots/hour"
                class="w-32"
              />
            </div>
          </div>
          
          <div class="flex justify-end">
            <BaseButton type="submit" :loading="savingAvailability">
              Save Availability
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- Consultation Fees -->
      <BaseCard title="Consultation Fees">
        <form @submit.prevent="updateFees" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput
              v-model.number="fees.general_consultation"
              label="General Consultation"
              type="number"
              required
            >
              <template #prefix>
                <span class="text-gray-500">₦</span>
              </template>
            </BaseInput>
            
            <BaseInput
              v-model.number="fees.follow_up"
              label="Follow-up Consultation"
              type="number"
              required
            >
              <template #prefix>
                <span class="text-gray-500">₦</span>
              </template>
            </BaseInput>
            
            <BaseInput
              v-model.number="fees.emergency"
              label="Emergency Consultation"
              type="number"
              required
            >
              <template #prefix>
                <span class="text-gray-500">₦</span>
              </template>
            </BaseInput>
            
            <BaseInput
              v-model.number="fees.specialist"
              label="Specialist Consultation"
              type="number"
              required
            >
              <template #prefix>
                <span class="text-gray-500">₦</span>
              </template>
            </BaseInput>
          </div>
          
          <div class="flex justify-end">
            <BaseButton type="submit" :loading="savingFees">
              Update Fees
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- Notification Preferences -->
      <BaseCard title="Notification Preferences">
        <form @submit.prevent="updateNotifications" class="space-y-4">
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="notifications.new_consultations"
                class="mr-3"
              />
              <div>
                <p class="font-medium text-gray-900">New Consultations</p>
                <p class="text-sm text-gray-500">Get notified when a new consultation is scheduled</p>
              </div>
            </label>
            
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="notifications.consultation_reminders"
                class="mr-3"
              />
              <div>
                <p class="font-medium text-gray-900">Consultation Reminders</p>
                <p class="text-sm text-gray-500">Receive reminders before upcoming consultations</p>
              </div>
            </label>
            
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="notifications.payment_updates"
                class="mr-3"
              />
              <div>
                <p class="font-medium text-gray-900">Payment Updates</p>
                <p class="text-sm text-gray-500">Get notified about payment transactions</p>
              </div>
            </label>
            
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="notifications.patient_messages"
                class="mr-3"
              />
              <div>
                <p class="font-medium text-gray-900">Patient Messages</p>
                <p class="text-sm text-gray-500">Receive notifications for new patient messages</p>
              </div>
            </label>
            
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="notifications.email_notifications"
                class="mr-3"
              />
              <div>
                <p class="font-medium text-gray-900">Email Notifications</p>
                <p class="text-sm text-gray-500">Receive notifications via email</p>
              </div>
            </label>
          </div>
          
          <div class="flex justify-end">
            <BaseButton type="submit" :loading="savingNotifications">
              Save Preferences
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- Account Settings -->
      <BaseCard title="Account Settings">
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Two-Factor Authentication</p>
              <p class="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button
              @click="toggle2FA"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Accept New Patients</p>
              <p class="text-sm text-gray-500">Allow new patients to book consultations</p>
            </div>
            <button
              @click="toggleAcceptingPatients"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                acceptingPatients ? 'bg-primary-600' : 'bg-gray-200'
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  acceptingPatients ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p class="font-medium text-red-900">Deactivate Account</p>
              <p class="text-sm text-red-600">Temporarily suspend your account</p>
            </div>
            <BaseButton variant="danger" size="sm" @click="showDeactivateModal = true">
              Deactivate
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Deactivate Account Modal -->
    <BaseModal :is-open="showDeactivateModal" @close="showDeactivateModal = false" title="Deactivate Account">
      <div class="space-y-4">
        <BaseAlert type="warning" title="Warning">
          This action will temporarily suspend your account. You won't be able to access your account until you reactivate it.
        </BaseAlert>
        
        <BaseInput
          v-model="deactivateReason"
          label="Reason for deactivation"
          type="textarea"
          :rows="3"
          required
        />
      </div>

      <template #footer>
        <BaseButton variant="outline" @click="showDeactivateModal = false">
          Cancel
        </BaseButton>
        <BaseButton variant="danger" @click="deactivateAccount" :loading="deactivating">
          Deactivate Account
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { useDoctorStore } from '@/stores/doctor';
import { useAuthStore } from '@/stores/auth';
import { BaseCard, BaseInput, BaseButton, BaseModal, BaseAlert } from '@/components';

const router = useRouter();
const doctorStore = useDoctorStore();
const authStore = useAuthStore();
const { success, error: showError } = useToast();
const { confirm } = useConfirm();

const savingAvailability = ref(false);
const savingFees = ref(false);
const savingNotifications = ref(false);
const deactivating = ref(false);
const twoFactorEnabled = ref(false);
const acceptingPatients = ref(true);
const showDeactivateModal = ref(false);
const deactivateReason = ref('');

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const availability = ref({
  Monday: { enabled: true, start_time: '09:00', end_time: '17:00', slots_per_hour: 2 },
  Tuesday: { enabled: true, start_time: '09:00', end_time: '17:00', slots_per_hour: 2 },
  Wednesday: { enabled: true, start_time: '09:00', end_time: '17:00', slots_per_hour: 2 },
  Thursday: { enabled: true, start_time: '09:00', end_time: '17:00', slots_per_hour: 2 },
  Friday: { enabled: true, start_time: '09:00', end_time: '17:00', slots_per_hour: 2 },
  Saturday: { enabled: false, start_time: '09:00', end_time: '13:00', slots_per_hour: 1 },
  Sunday: { enabled: false, start_time: '09:00', end_time: '13:00', slots_per_hour: 1 }
});

const fees = ref({
  general_consultation: 5000,
  follow_up: 3000,
  emergency: 10000,
  specialist: 8000
});

const notifications = ref({
  new_consultations: true,
  consultation_reminders: true,
  payment_updates: true,
  patient_messages: true,
  email_notifications: true
});

onMounted(() => {
  loadSettings();
});

const loadSettings = async () => {
  try {
    // Load settings from API
    // const settings = await doctorStore.getSettings();
    // availability.value = settings.availability;
    // fees.value = settings.fees;
    // notifications.value = settings.notifications;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

const updateAvailability = async () => {
  savingAvailability.value = true;
  try {
    await doctorStore.updateSettings({ availability: availability.value });
    success('Availability updated successfully');
  } catch (error) {
    showError('Failed to update availability');
  } finally {
    savingAvailability.value = false;
  }
};

const updateFees = async () => {
  savingFees.value = true;
  try {
    await doctorStore.updateSettings({ fees: fees.value });
    success('Fees updated successfully');
  } catch (error) {
    showError('Failed to update fees');
  } finally {
    savingFees.value = false;
  }
};

const updateNotifications = async () => {
  savingNotifications.value = true;
  try {
    await doctorStore.updateSettings({ notifications: notifications.value });
    success('Notification preferences updated');
  } catch (error) {
    showError('Failed to update preferences');
  } finally {
    savingNotifications.value = false;
  }
};

const toggle2FA = () => {
  twoFactorEnabled.value = !twoFactorEnabled.value;
  info('Two-factor authentication ' + (twoFactorEnabled.value ? 'enabled' : 'disabled'));
};

const toggleAcceptingPatients = () => {
  acceptingPatients.value = !acceptingPatients.value;
  info(acceptingPatients.value ? 'Now accepting new patients' : 'Not accepting new patients');
};

const deactivateAccount = async () => {
  if (!deactivateReason.value) {
    showError('Please provide a reason');
    return;
  }
  
  deactivating.value = true;
  try {
    await authStore.deactivateAccount({ reason: deactivateReason.value });
    success('Account deactivated successfully');
    router.push('/login');
  } catch (error) {
    showError('Failed to deactivate account');
  } finally {
    deactivating.value = false;
  }
};
</script>
