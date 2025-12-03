<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">
          Reset your password
        </h2>
        <p class="text-gray-600">
          Enter your new password below
        </p>
      </div>

      <div class="card">
        <div class="card-body p-8">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="form-group">
              <label for="password" class="form-label">
                New Password
              </label>
              <div class="relative">
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="input pr-10"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  @click="showPassword = !showPassword"
                >
                  <EyeIcon v-if="!showPassword" class="h-5 w-5 text-gray-400" />
                  <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              :disabled="authStore.loading"
              class="btn btn-primary w-full"
            >
              <span v-if="!authStore.loading">Reset Password</span>
              <span v-else class="flex items-center justify-center">
                <span class="spinner spinner-sm mr-2"></span>
                Resetting...
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const showPassword = ref(false);
const form = reactive({
  password: '',
  confirmPassword: ''
});

const handleSubmit = async () => {
  if (form.password !== form.confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  try {
    await authStore.resetPassword({
      token: route.query.token,
      password: form.password
    });
    router.push('/login');
  } catch (error) {
    console.error('Password reset failed:', error);
  }
};
</script>
