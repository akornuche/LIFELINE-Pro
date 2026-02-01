<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 animate-fade-in">
      <!-- Logo and Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-primary-600 mb-2 animate-bounce-in">LifeLine Pro</h1>
        <h2 class="text-2xl font-semibold text-gray-900 animate-fade-in stagger-1">Welcome Back</h2>
        <p class="mt-2 text-sm text-gray-600 animate-fade-in stagger-2">
          Sign in to access your health dashboard
        </p>
      </div>

      <!-- Login Form -->
      <div class="card">
        <div class="card-body">
          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Email -->
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                :class="['input', { 'input-error': errors.email }]"
                placeholder="you@example.com"
                :disabled="loading"
              />
              <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <div class="relative">
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  :class="['input pr-10', { 'input-error': errors.password }]"
                  placeholder="Patient@123"
                  :disabled="loading"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabindex="-1"
                >
                  <svg v-if="!showPassword" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  id="remember-me"
                  v-model="form.rememberMe"
                  type="checkbox"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label for="remember-me" class="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div class="text-sm">
                <router-link
                  to="/forgot-password"
                  class="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </router-link>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="loading"
              class="btn btn-primary w-full btn-lg"
            >
              <span v-if="!loading">Sign In</span>
              <span v-else class="flex items-center justify-center">
                <span class="spinner spinner-sm mr-2"></span>
                Signing in...
              </span>
            </button>
          </form>
        </div>
      </div>

      <!-- Sign Up Link -->
      <p class="text-center text-sm text-gray-600">
        Don't have an account?
        <router-link
          to="/register"
          class="font-medium text-primary-600 hover:text-primary-500"
        >
          Create an account
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { success, error: showError } = useToast();

const loading = ref(false);
const showPassword = ref(false);

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
});

const errors = reactive({
  email: '',
  password: ''
});

const handleLogin = async () => {
  // Reset errors
  errors.email = '';
  errors.password = '';

  // Validate
  if (!form.email) {
    errors.email = 'Email is required';
    return;
  }
  if (!form.password) {
    errors.password = 'Password is required';
    return;
  }

  loading.value = true;

  try {
    await authStore.login({
      email: form.email,
      password: form.password
    });

    success(`Welcome back, ${authStore.user?.first_name || 'User'}!`);

    // Redirect to appropriate dashboard based on role
    const roleRoutes = {
      patient: '/patient',
      doctor: '/doctor',
      pharmacy: '/pharmacy',
      hospital: '/hospital',
      admin: '/admin'
    };

    const redirectTo = route.query.redirect || roleRoutes[authStore.userRole] || '/';
    
    // Small delay to show success message
    setTimeout(() => {
      router.push(redirectTo);
    }, 500);
  } catch (error) {
    console.error('Login failed:', error);
    if (error.response?.status === 401) {
      errors.email = 'Invalid email or password';
      errors.password = 'Invalid email or password';
      showError('Invalid email or password. Please try again.');
    } else if (error.response?.status === 403) {
      showError('Your account is not verified. Please check your email.');
    } else {
      showError('Login failed. Please try again later.');
    }
  } finally {
    loading.value = false;
  }
};
</script>
