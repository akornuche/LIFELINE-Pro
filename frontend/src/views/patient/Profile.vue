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
              <div class="relative inline-block">
                <div class="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  <img 
                    v-if="profilePictureUrl" 
                    :src="profilePictureUrl" 
                    alt="Profile" 
                    class="h-full w-full object-cover"
                  />
                  <span v-else class="text-primary-600 font-semibold text-4xl">
                    {{ userInitials }}
                  </span>
                </div>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                class="hidden"
              />
              <button 
                type="button"
                @click="$refs.fileInput.click()"
                class="btn btn-secondary btn-sm"
              >
                Upload Photo
              </button>
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
                <div class="relative">
                  <input v-model="passwordForm.currentPassword" :type="showCurrentPassword ? 'text' : 'password'" class="input pr-10" required />
                  <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700">
                    <EyeIcon v-if="!showCurrentPassword" class="h-5 w-5" />
                    <EyeSlashIcon v-else class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">New Password</label>
                <div class="relative">
                  <input v-model="passwordForm.newPassword" :type="showNewPassword ? 'text' : 'password'" class="input pr-10" required />
                  <button type="button" @click="showNewPassword = !showNewPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700">
                    <EyeIcon v-if="!showNewPassword" class="h-5 w-5" />
                    <EyeSlashIcon v-else class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <div class="relative">
                  <input v-model="passwordForm.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" class="input pr-10" required />
                  <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700">
                    <EyeIcon v-if="!showConfirmPassword" class="h-5 w-5" />
                    <EyeSlashIcon v-else class="h-5 w-5" />
                  </button>
                </div>
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
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';

const authStore = useAuthStore();
const patientStore = usePatientStore();
const { success, error: showError } = useToast();
const { confirm } = useConfirm();

const loading = ref(true);
const saving = ref(false);
const changingPassword = ref(false);
const fileInput = ref(null);
const profilePictureUrl = ref(null);

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

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

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
    
    // Set profile picture if available
    if (authStore.user.profile_picture) {
      profilePictureUrl.value = authStore.user.profile_picture;
    }
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

const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showError('Please select an image file');
    return;
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showError('Image size must be less than 2MB');
    return;
  }

  try {
    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target.result;
      profilePictureUrl.value = base64Image;

      // Update profile with new picture
      try {
        await authStore.updateProfile({ profile_picture: base64Image });
      } catch (error) {
        console.error('Failed to upload profile picture:', error);
        profilePictureUrl.value = authStore.user.profile_picture || null;
      }
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('File read error:', error);
    showError('Failed to read image file');
  }
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
    await authStore.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
      confirmPassword: passwordForm.value.confirmPassword
    });
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } catch (error) {
    console.error('Failed to change password:', error);
  } finally {
    changingPassword.value = false;
  }
};
</script>
