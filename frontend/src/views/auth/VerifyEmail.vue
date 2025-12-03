<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div v-if="loading" class="flex flex-col items-center">
          <div class="spinner spinner-lg mb-4"></div>
          <h2 class="text-2xl font-bold text-gray-900">
            Verifying your email...
          </h2>
        </div>

        <div v-else-if="success" class="space-y-4">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircleIcon class="h-10 w-10 text-green-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900">
            Email verified successfully!
          </h2>
          <p class="text-gray-600">
            Your email has been verified. You can now login to your account.
          </p>
          <RouterLink
            to="/login"
            class="btn btn-primary inline-flex"
          >
            Continue to Login
          </RouterLink>
        </div>

        <div v-else class="space-y-4">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <XCircleIcon class="h-10 w-10 text-red-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900">
            Verification failed
          </h2>
          <p class="text-gray-600">
            {{ errorMessage }}
          </p>
          <RouterLink
            to="/login"
            class="btn btn-secondary inline-flex"
          >
            Back to Login
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const success = ref(false);
const errorMessage = ref('');

onMounted(async () => {
  const token = route.params.token;

  if (!token) {
    loading.value = false;
    errorMessage.value = 'Invalid verification link';
    return;
  }

  try {
    await authStore.verifyEmail(token);
    success.value = true;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Verification failed. The link may have expired.';
  } finally {
    loading.value = false;
  }
});
</script>
