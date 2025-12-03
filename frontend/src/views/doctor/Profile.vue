<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">My Profile</h1>
    
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <SkeletonLoader type="card" />
      <div class="lg:col-span-2 space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
      </div>
    </div>
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Profile Photo -->
      <div class="lg:col-span-1">
        <BaseCard>
          <div class="text-center">
            <div class="mb-4">
              <img
                v-if="profile.profile_photo"
                :src="profile.profile_photo"
                alt="Profile"
                class="h-32 w-32 rounded-full mx-auto object-cover"
              />
              <div v-else class="h-32 w-32 rounded-full mx-auto bg-blue-500 flex items-center justify-center">
                <span class="text-4xl font-bold text-white">{{ initials }}</span>
              </div>
            </div>
            <h3 class="text-xl font-semibold text-gray-900">{{ profile.full_name }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ profile.specialization }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ profile.license_number }}</p>
            
            <div class="mt-4">
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handlePhotoUpload"
              />
              <BaseButton
                variant="outline"
                size="sm"
                fullWidth
                @click="$refs.fileInput.click()"
                :loading="uploading"
              >
                Change Photo
              </BaseButton>
            </div>
          </div>
        </BaseCard>
        
        <BaseCard class="mt-6" title="Verification Status">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Email</span>
              <CheckCircleIcon v-if="profile.is_verified" class="h-5 w-5 text-green-500" />
              <XCircleIcon v-else class="h-5 w-5 text-gray-400" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">License</span>
              <CheckCircleIcon v-if="profile.license_verified" class="h-5 w-5 text-green-500" />
              <XCircleIcon v-else class="h-5 w-5 text-gray-400" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Account</span>
              <CheckCircleIcon v-if="profile.is_active" class="h-5 w-5 text-green-500" />
              <XCircleIcon v-else class="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Profile Information -->
      <div class="lg:col-span-2 space-y-6">
        <BaseCard title="Personal Information">
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseInput
                v-model="form.full_name"
                label="Full Name"
                required
              />
              <BaseInput
                v-model="form.email"
                label="Email"
                type="email"
                required
              />
              <BaseInput
                v-model="form.phone"
                label="Phone Number"
                required
              />
              <BaseInput
                v-model="form.specialization"
                label="Specialization"
                required
              />
              <BaseInput
                v-model="form.license_number"
                label="License Number"
                readonly
              />
              <BaseInput
                v-model="form.years_of_experience"
                label="Years of Experience"
                type="number"
              />
            </div>
            
            <BaseInput
              v-model="form.qualifications"
              label="Qualifications"
              type="textarea"
              :rows="3"
            />
            
            <BaseInput
              v-model="form.bio"
              label="Professional Bio"
              type="textarea"
              :rows="4"
            />

            <div class="flex justify-end">
              <BaseButton type="submit" :loading="saving">
                Save Changes
              </BaseButton>
            </div>
          </form>
        </BaseCard>

        <BaseCard title="Change Password">
          <form @submit.prevent="changePassword" class="space-y-4">
            <BaseInput
              v-model="passwordForm.current_password"
              label="Current Password"
              type="password"
              required
            />
            <BaseInput
              v-model="passwordForm.new_password"
              label="New Password"
              type="password"
              required
            />
            <BaseInput
              v-model="passwordForm.confirm_password"
              label="Confirm New Password"
              type="password"
              required
            />

            <div class="flex justify-end">
              <BaseButton type="submit" :loading="changingPassword">
                Update Password
              </BaseButton>
            </div>
          </form>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDoctorStore } from '@/stores/doctor';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import { BaseCard, BaseInput, BaseButton, LoadingSpinner } from '@/components';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline';
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue';

const doctorStore = useDoctorStore();
const authStore = useAuthStore();
const { success, error: showError } = useToast();

const loading = ref(true);
const saving = ref(false);
const changingPassword = ref(false);
const uploading = ref(false);
const profile = ref({});
const fileInput = ref(null);

const form = ref({
  full_name: '',
  email: '',
  phone: '',
  specialization: '',
  license_number: '',
  years_of_experience: 0,
  qualifications: '',
  bio: ''
});

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const initials = computed(() => {
  if (!profile.value.full_name) return '?';
  const names = profile.value.full_name.split(' ');
  return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
});

onMounted(async () => {
  await loadProfile();
  loading.value = false;
});

const loadProfile = async () => {
  try {
    profile.value = await doctorStore.getProfile();
    form.value = { ...profile.value };
  } catch (error) {
    showError('Failed to load profile');
  }
};

const updateProfile = async () => {
  saving.value = true;
  try {
    await doctorStore.updateProfile(form.value);
    success('Profile updated successfully');
    await loadProfile();
  } catch (error) {
    showError(error.response?.data?.message || 'Failed to update profile');
  } finally {
    saving.value = false;
  }
};

const changePassword = async () => {
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    showError('Passwords do not match');
    return;
  }
  
  changingPassword.value = true;
  try {
    await authStore.changePassword(passwordForm.value);
    success('Password changed successfully');
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    };
  } catch (error) {
    showError(error.response?.data?.message || 'Failed to change password');
  } finally {
    changingPassword.value = false;
  }
};

const handlePhotoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  uploading.value = true;
  try {
    await doctorStore.uploadProfilePhoto(file);
    success('Profile photo updated');
    await loadProfile();
  } catch (error) {
    showError('Failed to upload photo');
  } finally {
    uploading.value = false;
  }
};
</script>
