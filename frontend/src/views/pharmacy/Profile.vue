<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Pharmacy Profile</h1>
    
    <LoadingSpinner v-if="loading" />
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Logo & Verification -->
      <div class="lg:col-span-1">
        <BaseCard>
          <div class="text-center">
            <div class="mb-4">
              <img
                v-if="profile.logo"
                :src="profile.logo"
                alt="Logo"
                class="h-32 w-32 rounded-lg mx-auto object-cover"
              />
              <div v-else class="h-32 w-32 rounded-lg mx-auto bg-green-500 flex items-center justify-center">
                <BuildingStorefrontIcon class="h-16 w-16 text-white" />
              </div>
            </div>
            <h3 class="text-xl font-semibold text-gray-900">{{ profile.name }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ profile.license_number }}</p>
            
            <div class="mt-4">
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleLogoUpload"
              />
              <BaseButton
                variant="outline"
                size="sm"
                fullWidth
                @click="$refs.fileInput.click()"
                :loading="uploading"
              >
                Change Logo
              </BaseButton>
            </div>
          </div>
        </BaseCard>
        
        <BaseCard class="mt-6" title="Verification Status">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">License</span>
              <CheckCircleIcon v-if="profile.is_verified" class="h-5 w-5 text-green-500" />
              <XCircleIcon v-else class="h-5 w-5 text-gray-400" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Account</span>
              <CheckCircleIcon v-if="profile.is_active" class="h-5 w-5 text-green-500" />
              <XCircleIcon v-else class="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </BaseCard>

        <BaseCard class="mt-6" title="Operating Hours">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Weekdays</span>
              <span class="font-medium">{{ profile.operating_hours?.weekdays || '9:00 AM - 6:00 PM' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Saturday</span>
              <span class="font-medium">{{ profile.operating_hours?.saturday || '9:00 AM - 2:00 PM' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Sunday</span>
              <span class="font-medium">{{ profile.operating_hours?.sunday || 'Closed' }}</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Business Information -->
      <div class="lg:col-span-2 space-y-6">
        <BaseCard title="Business Information">
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseInput
                v-model="form.name"
                label="Pharmacy Name"
                required
              />
              <BaseInput
                v-model="form.license_number"
                label="License Number"
                readonly
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
            </div>
            
            <BaseInput
              v-model="form.address"
              label="Address"
              required
            />
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BaseInput
                v-model="form.city"
                label="City"
                required
              />
              <BaseInput
                v-model="form.state"
                label="State"
                required
              />
              <BaseInput
                v-model="form.postal_code"
                label="Postal Code"
              />
            </div>

            <div class="flex items-center">
              <input
                type="checkbox"
                v-model="form.is_24_7"
                class="mr-2"
              />
              <label class="text-sm font-medium text-gray-700">24/7 Service Available</label>
            </div>

            <div class="flex items-center">
              <input
                type="checkbox"
                v-model="form.delivery_available"
                class="mr-2"
              />
              <label class="text-sm font-medium text-gray-700">Home Delivery Available</label>
            </div>

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
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { usePharmacyStore } from '@/stores/pharmacy';
import { useAuthStore } from '@/stores/auth';
import { BaseCard, BaseInput, BaseButton, LoadingSpinner } from '@/components';
import { CheckCircleIcon, XCircleIcon, BuildingStorefrontIcon } from '@heroicons/vue/24/outline';

const pharmacyStore = usePharmacyStore();
const authStore = useAuthStore();
const { success, error: showError, info } = useToast();

const loading = ref(true);
const saving = ref(false);
const changingPassword = ref(false);
const uploading = ref(false);
const profile = ref({});
const fileInput = ref(null);

const form = ref({
  name: '',
  license_number: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  is_24_7: false,
  delivery_available: false
});

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

onMounted(async () => {
  await loadProfile();
  loading.value = false;
});

const loadProfile = async () => {
  try {
    profile.value = await pharmacyStore.getProfile();
    form.value = { ...profile.value };
  } catch (error) {
    showError('Failed to load profile');
  }
};

const updateProfile = async () => {
  saving.value = true;
  try {
    await pharmacyStore.updateProfile(form.value);
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

const handleLogoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  uploading.value = true;
  try {
    await pharmacyStore.uploadLogo(file);
    success('Logo updated');
    await loadProfile();
  } catch (error) {
    showError('Failed to upload logo');
  } finally {
    uploading.value = false;
  }
};
</script>
