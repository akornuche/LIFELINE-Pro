<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Profile</h1>
      <p class="text-gray-600 mt-2">Manage your personal information</p>
    </div>

    <div v-if="loading" class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
      </div>
      <div class="lg:col-span-2">
        <SkeletonLoader type="card" />
      </div>
    </div>

    <div v-else class="grid lg:grid-cols-3 gap-6 animate-fade-in">
      <!-- Profile Card -->
      <div class="lg:col-span-1">
        <div class="card">
          <div class="card-body text-center">
            <div class="mb-6">
              <div class="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <span class="text-primary-600 font-semibold text-4xl">
                  {{ userInitials }}
                </span>
              </div>
              <button class="btn btn-secondary btn-sm">Upload Photo</button>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-1">
              {{ form.first_name }} {{ form.last_name }}
            </h3>
            <p class="text-gray-600 mb-4">{{ form.email }}</p>
            <div class="badge" :class="patientStore.hasActiveSubscription ? 'badge-success' : 'badge-gray'">
              {{ patientStore.hasActiveSubscription ? 'Active Member' : 'Inactive' }}
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="card mt-6">
          <div class="card-body">
            <h4 class="font-semibold text-gray-900 mb-4">Quick Stats</h4>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Package</span>
                <span class="font-semibold capitalize">{{ patientStore.packageType || 'None' }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Dependents</span>
                <span class="font-semibold">{{ patientStore.dependentCount }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Member Since</span>
                <span class="font-semibold">{{ memberSince }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Form -->
      <div class="lg:col-span-2">
        <div class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold">Personal Information</h2>
          </div>
          <div class="card-body">
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <div class="grid md:grid-cols-2 gap-6">
                <div class="form-group">
                  <label class="form-label">First Name</label>
                  <input v-model="form.first_name" type="text" class="input" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name</label>
                  <input v-model="form.last_name" type="text" class="input" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Email</label>
                <input v-model="form.email" type="email" class="input" disabled />
                <p class="form-help">Email cannot be changed</p>
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input v-model="form.phone" type="tel" class="input" />
              </div>

              <div class="grid md:grid-cols-2 gap-6">
                <div class="form-group">
                  <label class="form-label">Date of Birth</label>
                  <input v-model="form.date_of_birth" type="date" class="input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Gender</label>
                  <select v-model="form.gender" class="input">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Address</label>
                <textarea v-model="form.address" class="input" rows="3"></textarea>
              </div>

              <div class="flex justify-end gap-3">
                <button type="button" @click="resetForm" class="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" :disabled="saving" class="btn btn-primary">
                  <span v-if="saving" class="spinner spinner-sm mr-2"></span>
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Change Password -->
        <div class="card mt-6">
          <div class="card-header">
            <h2 class="text-xl font-semibold">Change Password</h2>
          </div>
          <div class="card-body">
            <form @submit.prevent="handlePasswordChange" class="space-y-6">
              <div class="form-group">
                <label class="form-label">Current Password</label>
                <input v-model="passwordForm.currentPassword" type="password" class="input" required />
              </div>

              <div class="form-group">
                <label class="form-label">New Password</label>
                <input v-model="passwordForm.newPassword" type="password" class="input" required />
              </div>

              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input v-model="passwordForm.confirmPassword" type="password" class="input" required />
              </div>

              <div class="flex justify-end">
                <button type="submit" :disabled="changingPassword" class="btn btn-primary">
                  <span v-if="changingPassword" class="spinner spinner-sm mr-2"></span>
                  {{ changingPassword ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usePatientStore } from '@/stores/patient';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { format } from 'date-fns';

const authStore = useAuthStore();
const patientStore = usePatientStore();
const { success, error: showError } = useToast();
const { confirm } = useConfirm();

const loading = ref(true);
const saving = ref(false);
const changingPassword = ref(false);

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  address: ''
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const userInitials = computed(() => {
  return `${form.value.first_name?.[0] || ''}${form.value.last_name?.[0] || ''}`.toUpperCase();
});

const memberSince = computed(() => {
  if (authStore.user?.created_at) {
    return format(new Date(authStore.user.created_at), 'MMM yyyy');
  }
  return 'N/A';
});

onMounted(async () => {
  try {
    await Promise.all([
      patientStore.fetchProfile(),
      patientStore.fetchSubscription()
    ]);
    
    // Populate form with user data
    form.value = {
      first_name: authStore.user.first_name || '',
      last_name: authStore.user.last_name || '',
      email: authStore.user.email || '',
      phone: authStore.user.phone || '',
      date_of_birth: authStore.user.date_of_birth || '',
      gender: authStore.user.gender || '',
      address: authStore.user.address || ''
    };
  } catch (error) {
    console.error('Failed to load profile:', error);
    showError('Failed to load profile data. Please refresh the page.');
  } finally {
    loading.value = false;
  }
});

const handleSubmit = async () => {
  saving.value = true;
  try {
    await authStore.updateProfile(form.value);
    success('Profile updated successfully!');
  } catch (error) {
    console.error('Failed to update profile:', error);
    showError('Failed to update profile. Please try again.');
  } finally {
    saving.value = false;
  }
};

const resetForm = () => {
  form.value = {
    first_name: authStore.user.first_name || '',
    last_name: authStore.user.last_name || '',
    email: authStore.user.email || '',
    phone: authStore.user.phone || '',
    date_of_birth: authStore.user.date_of_birth || '',
    gender: authStore.user.gender || '',
    address: authStore.user.address || ''
  };
};

const handlePasswordChange = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showError('Passwords do not match');
    return;
  }

  const confirmed = await confirm({
    title: 'Change Password',
    message: 'Are you sure you want to change your password? You will need to log in again with your new password.',
    confirmText: 'Change Password',
    type: 'warning'
  });

  if (!confirmed) return;

  changingPassword.value = true;
  try {
    await authStore.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    );
    success('Password changed successfully!');
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } catch (error) {
    console.error('Failed to change password:', error);
    showError('Failed to change password. Please check your current password.');
  } finally {
    changingPassword.value = false;
  }
};
</script>
