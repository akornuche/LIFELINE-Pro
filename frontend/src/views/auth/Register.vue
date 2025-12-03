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
                  v-model="form.phoneNumber"
                  type="tel"
                  required
                  class="input"
                  placeholder="+234 800 000 0000"
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
                  id="gender"
                  v-model="form.gender"
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
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  required
                  autocomplete="new-password"
                  class="input"
                  placeholder="••••••••"
                  :disabled="loading"
                />
                <p class="form-help">Minimum 8 characters</p>
              </div>

              <div class="form-group">
                <label for="confirmPassword" class="form-label">Confirm Password</label>
                <input
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  type="password"
                  required
                  autocomplete="new-password"
                  class="input"
                  placeholder="••••••••"
                  :disabled="loading"
                />
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

const roles = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'admin', label: 'Admin' }
];

const form = reactive({
  role: 'patient',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
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
      role: form.role,
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone_number: form.phoneNumber,
      date_of_birth: form.dateOfBirth,
      gender: form.gender,
      address: form.address,
      password: form.password
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
