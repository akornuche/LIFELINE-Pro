<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl w-full space-y-8">
      <!-- Logo and Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-primary-600 mb-2">LifeLine Pro</h1>
        <h2 class="text-2xl font-semibold text-gray-900">Create Your Account</h2>
        <p class="mt-2 text-sm text-gray-600">
          Join LifeLine Pro and get access to quality healthcare
        </p>
      </div>

      <!-- Registration Form -->
      <div class="card">
        <div class="card-body">
          <form @submit.prevent="handleRegister" class="space-y-6">
            <!-- Role Selection -->
            <div class="form-group">
              <label class="form-label">Register As</label>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  v-for="role in roles"
                  :key="role.value"
                  type="button"
                  @click="form.role = role.value"
                  :class="[
                    'px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all',
                    form.role === role.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  ]"
                >
                  {{ role.label }}
                </button>
              </div>
            </div>

            <!-- Personal Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-group">
                <label for="firstName" class="form-label">First Name</label>
                <input
                  id="firstName"
                  v-model="form.firstName"
                  type="text"
                  required
                  class="input"
                  placeholder="John"
                  :disabled="loading"
                />
              </div>

              <div class="form-group">
                <label for="lastName" class="form-label">Last Name</label>
                <input
                  id="lastName"
                  v-model="form.lastName"
                  type="text"
                  required
                  class="input"
                  placeholder="Doe"
                  :disabled="loading"
                />
              </div>
            </div>

            <!-- Contact Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div class="form-group">
                <label for="phone" class="form-label">Phone Number</label>
                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  required
                  class="input"
                  placeholder="08012345678"
                  :disabled="loading"
                />
              </div>
            </div>

            <!-- Date of Birth & Gender -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-group">
                <label for="dateOfBirth" class="form-label">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  v-model="form.dateOfBirth"
                  type="date"
                  required
                  class="input"
                  :max="maxDate"
                  :disabled="loading"
                />
              </div>

              <div class="form-group">
                <label for="gender" class="form-label">Gender</label>
                <select
                  id="userType"
                  v-model="form.userType"
                  required
                  class="input"
                  :disabled="loading"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <!-- Address -->
            <div class="form-group">
              <label for="address" class="form-label">Address</label>
              <textarea
                id="address"
                v-model="form.address"
                required
                rows="2"
                class="input"
                placeholder="Enter your full address"
                :disabled="loading"
              ></textarea>
            </div>

            <!-- Password -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <div class="relative">
                  <input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    autocomplete="new-password"
                    class="input pr-10"
                    placeholder="Patient@123"
                    :disabled="loading"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                    :disabled="loading"
                  >
                    <svg
                      class="h-5 w-5 text-gray-400"
                      :class="{ 'text-gray-600': showPassword }"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        v-if="!showPassword"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        v-if="!showPassword"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                      <path
                        v-if="showPassword"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  </button>
                </div>
                <p class="form-help">Minimum 8 characters</p>
              </div>

              <div class="form-group">
                <label for="confirmPassword" class="form-label">Confirm Password</label>
                <div class="relative">
                  <input
                    id="confirmPassword"
                    v-model="form.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    required
                    autocomplete="new-password"
                    class="input pr-10"
                    placeholder="Patient@123"
                    :disabled="loading"
                  />
                  <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                    :disabled="loading"
                  >
                    <svg
                      class="h-5 w-5 text-gray-400"
                      :class="{ 'text-gray-600': showConfirmPassword }"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        v-if="!showConfirmPassword"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        v-if="!showConfirmPassword"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                      <path
                        v-if="showConfirmPassword"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="form-group">
              <div class="flex items-start">
                <input
                  id="terms"
                  v-model="form.acceptTerms"
                  type="checkbox"
                  required
                  class="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label for="terms" class="ml-2 block text-sm text-gray-700">
                  I agree to the
                  <a href="#" class="text-primary-600 hover:text-primary-500">Terms of Service</a>
                  and
                  <a href="#" class="text-primary-600 hover:text-primary-500">Privacy Policy</a>
                </label>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="loading || !form.acceptTerms"
              class="btn btn-primary w-full btn-lg"
            >
              <span v-if="!loading">Create Account</span>
              <span v-else class="flex items-center justify-center">
                <span class="spinner spinner-sm mr-2"></span>
                Creating account...
              </span>
            </button>
          </form>
        </div>
      </div>

      <!-- Sign In Link -->
      <p class="text-center text-sm text-gray-600">
        Already have an account?
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
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const authStore = useAuthStore();
const { success, error: showError, info } = useToast();

const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const roles = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'admin', label: 'Admin' }
];

const form = reactive({
  userType: 'patient',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
});

const maxDate = computed(() => {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 18); // Must be 18+
  return today.toISOString().split('T')[0];
});

const handleRegister = async () => {
  // Validate passwords match
  if (form.password !== form.confirmPassword) {
    showError('Passwords do not match');
    return;
  }

  // Validate password strength
  if (form.password.length < 8) {
    showError('Password must be at least 8 characters');
    return;
  }

  loading.value = true;

  try {
    const registrationData = {
      userType: form.userType,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      address: form.address,
      password: form.password,
      confirmPassword: form.confirmPassword
    };

    await authStore.register(registrationData);
    
    // Redirect to login page
    router.push({
      name: 'login',
      query: { registered: 'true' }
    });
  } catch (error) {
    console.error('Registration failed:', error);
  } finally {
    loading.value = false;
  }
};
</script>
