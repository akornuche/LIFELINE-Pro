<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-primary-600 mb-2">LifeLine Pro</h1>
        <h2 class="text-2xl font-semibold text-gray-900">Reset Your Password</h2>
        <p class="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you a password reset link
        </p>
      </div>

      <!-- Success State -->
      <div v-if="emailSent" class="card">
        <div class="card-body text-center space-y-4">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Check Your Email</h3>
            <p class="text-sm text-gray-600">
              We've sent a password reset link to
              <strong class="text-gray-900">{{ form.email }}</strong>
            </p>
          </div>

          <div class="pt-4">
            <router-link
              to="/login"
              class="btn btn-primary w-full"
            >
              Back to Login
            </router-link>
          </div>

          <p class="text-sm text-gray-600">
            Didn't receive the email?
            <button
              @click="resendEmail"
              :disabled="resendCooldown > 0"
              class="text-primary-600 hover:text-primary-500 font-medium"
            >
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend' }}
            </button>
          </p>
        </div>
      </div>

      <!-- Form State -->
      <div v-else class="card">
        <div class="card-body">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Email -->
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                class="input"
                placeholder="you@example.com"
                :disabled="loading"
              />
              <p class="form-help">
                Enter the email address associated with your account
              </p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="loading"
              class="btn btn-primary w-full btn-lg"
            >
              <span v-if="!loading">Send Reset Link</span>
              <span v-else class="flex items-center justify-center">
                <span class="spinner spinner-sm mr-2"></span>
                Sending...
              </span>
            </button>
          </form>
        </div>
      </div>

      <!-- Back to Login Link -->
      <p class="text-center text-sm text-gray-600">
        Remember your password?
        <router-link
          to="/login"
          class="font-medium text-primary-600 hover:text-primary-500"
        >
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const loading = ref(false);
const emailSent = ref(false);
const resendCooldown = ref(0);

const form = reactive({
  email: ''
});

const handleSubmit = async () => {
  loading.value = true;

  try {
    await authStore.forgotPassword(form.email);
    emailSent.value = true;
  } catch (error) {
    console.error('Password reset request failed:', error);
  } finally {
    loading.value = false;
  }
};

const resendEmail = async () => {
  if (resendCooldown.value > 0) return;

  loading.value = true;

  try {
    await authStore.forgotPassword(form.email);
    
    // Start cooldown
    resendCooldown.value = 60;
    const interval = setInterval(() => {
      resendCooldown.value--;
      if (resendCooldown.value <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  } catch (error) {
    console.error('Resend failed:', error);
  } finally {
    loading.value = false;
  }
};
</script>
