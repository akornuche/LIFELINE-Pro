<template>
  <div class="page-container">
    <div class="mb-8 animate-fade-in">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Settings</h1>
      <p class="text-gray-600 mt-2">Manage your account preferences</p>
    </div>

    <!-- Notification Settings -->
    <div class="card mb-6 animate-fade-in stagger-1">
      <div class="card-header">
        <h2 class="text-xl font-semibold">Notification Preferences</h2>
      </div>
      <div class="card-body space-y-4">
        <div class="flex items-center justify-between py-3 border-b">
          <div>
            <p class="font-medium text-gray-900">Email Notifications</p>
            <p class="text-sm text-gray-600">Receive updates via email</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="settings.emailNotifications" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between py-3 border-b">
          <div>
            <p class="font-medium text-gray-900">SMS Notifications</p>
            <p class="text-sm text-gray-600">Receive SMS alerts for important updates</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="settings.smsNotifications" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between py-3 border-b">
          <div>
            <p class="font-medium text-gray-900">Push Notifications</p>
            <p class="text-sm text-gray-600">Receive browser push notifications</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="settings.pushNotifications" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between py-3">
          <div>
            <p class="font-medium text-gray-900">Appointment Reminders</p>
            <p class="text-sm text-gray-600">Get reminded about upcoming appointments</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="settings.appointmentReminders" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
      <div class="card-footer flex justify-end">
        <button @click="saveSettings" :disabled="saving" class="btn btn-primary">
          <span v-if="saving" class="spinner spinner-sm mr-2"></span>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Privacy Settings -->
    <div class="card mb-6 animate-fade-in stagger-2">
      <div class="card-header">
        <h2 class="text-xl font-semibold">Privacy & Security</h2>
      </div>
      <div class="card-body space-y-4">
        <div class="flex items-center justify-between py-3 border-b">
          <div>
            <p class="font-medium text-gray-900">Profile Visibility</p>
            <p class="text-sm text-gray-600">Allow healthcare providers to see your profile</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="settings.profileVisible" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between py-3 border-b">
          <div>
            <p class="font-medium text-gray-900">Share Medical History</p>
            <p class="text-sm text-gray-600">Share your medical history with providers</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="settings.shareMedicalHistory" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between py-3">
          <div>
            <p class="font-medium text-gray-900">Two-Factor Authentication</p>
            <p class="text-sm text-gray-600">Add extra security to your account</p>
          </div>
          <button @click="setup2FA" class="btn btn-secondary btn-sm">
            {{ settings.twoFactorEnabled ? 'Disable' : 'Enable' }}
          </button>
        </div>
      </div>
      <div class="card-footer flex justify-end">
        <button @click="saveSettings" :disabled="saving" class="btn btn-primary">
          <span v-if="saving" class="spinner spinner-sm mr-2"></span>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="card border-red-200 animate-fade-in stagger-3">
      <div class="card-header bg-red-50">
        <h2 class="text-xl font-semibold text-red-900">Danger Zone</h2>
      </div>
      <div class="card-body">
        <div class="space-y-4">
          <div class="flex items-center justify-between py-3">
            <div>
              <p class="font-medium text-gray-900">Deactivate Account</p>
              <p class="text-sm text-gray-600">
                Temporarily disable your account. You can reactivate it anytime.
              </p>
            </div>
            <button @click="confirmDeactivate" class="btn btn-danger btn-sm">
              Deactivate
            </button>
          </div>

          <div class="flex items-center justify-between py-3">
            <div>
              <p class="font-medium text-gray-900">Delete Account</p>
              <p class="text-sm text-gray-600">
                Permanently delete your account and all data. This action cannot be undone.
              </p>
            </div>
            <button @click="confirmDelete" class="btn btn-danger btn-sm">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';

const router = useRouter();
const authStore = useAuthStore();
const { success, error: showError, info } = useToast();
const { confirm } = useConfirm();

const saving = ref(false);

const settings = ref({
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  appointmentReminders: true,
  profileVisible: true,
  shareMedicalHistory: true,
  twoFactorEnabled: false
});

onMounted(() => {
  // Load settings from backend or localStorage
  loadSettings();
});

const loadSettings = () => {
  // TODO: Load from API
  const saved = localStorage.getItem('patientSettings');
  if (saved) {
    settings.value = JSON.parse(saved);
  }
};

const saveSettings = async () => {
  saving.value = true;
  try {
    // TODO: Save to API
    localStorage.setItem('patientSettings', JSON.stringify(settings.value));
    success('Settings saved successfully');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showError('Failed to save settings');
  } finally {
    saving.value = false;
  }
};

const setup2FA = () => {
  // TODO: Implement 2FA setup
  settings.value.twoFactorEnabled = !settings.value.twoFactorEnabled;
  info('Two-factor authentication ' + (settings.value.twoFactorEnabled ? 'enabled' : 'disabled'));
};

const confirmDeactivate = async () => {
  const confirmed = await confirm({
    title: 'Deactivate Account',
    message: 'Are you sure you want to deactivate your account? You can reactivate it anytime.',
    confirmText: 'Deactivate',
    isDangerous: true
  });
  
  if (confirmed) {
    try {
      await authStore.deactivateAccount();
      success('Account deactivated successfully');
      router.push('/');
    } catch (error) {
      console.error('Failed to deactivate account:', error);
      showError('Failed to deactivate account');
    }
  }
};

const confirmDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete Account',
    message: 'Are you sure you want to permanently delete your account? This action cannot be undone. All your data will be lost.',
    confirmText: 'Delete Forever',
    isDangerous: true
  });
  
  if (confirmed) {
    // TODO: Implement account deletion
    showError('Account deletion is not implemented yet');
  }
};
</script>
