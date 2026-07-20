<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">

        <!-- Loading state -->
        <div v-if="loading" class="flex flex-col items-center">
          <div class="spinner spinner-lg mb-4"></div>
          <h2 class="text-2xl font-bold text-gray-900">Verifying your email...</h2>
          <p class="text-gray-500 mt-2 text-sm">Please wait a moment</p>
        </div>

        <!-- Success state -->
        <div v-else-if="success" class="space-y-4">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircleIcon class="h-10 w-10 text-green-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Email verified!</h2>
          <p class="text-gray-600">
            Your email address has been verified successfully.
          </p>
          <RouterLink
            :to="authStore.isAuthenticated ? dashboardRoute : '/login'"
            class="btn btn-primary inline-flex"
          >
            {{ authStore.isAuthenticated ? 'Go to Dashboard' : 'Continue to Login' }}
          </RouterLink>
        </div>

        <!-- Resend sent state -->
        <div v-else-if="resendSuccess" class="space-y-4">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
            <EnvelopeIcon class="h-10 w-10 text-blue-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900">New link sent!</h2>
          <p class="text-gray-600">
            A fresh verification link has been sent to your email address.
            Check your inbox (and spam folder) and click the new link.
          </p>
          <RouterLink to="/login" class="btn btn-secondary inline-flex">
            Back to Login
          </RouterLink>
        </div>

        <!-- Error / expired state -->
        <div v-else class="space-y-5">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <XCircleIcon class="h-10 w-10 text-red-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Verification failed</h2>
          <p class="text-gray-600 text-sm">{{ errorMessage }}</p>

          <!-- Resend section — always shown on failure so user is never stuck -->
          <div class="rounded-xl border border-gray-200 bg-gray-50 p-5 text-left space-y-3">
            <p class="text-sm font-medium text-gray-700">Didn't receive it or link expired?</p>
            <p class="text-xs text-gray-500">
              We'll send a fresh verification link to the email address you registered with.
              No need to re-enter anything.
            </p>
            <button
              @click="handleResend"
              :disabled="resendLoading || resendCooldown > 0"
              class="btn btn-primary w-full"
            >
              <span v-if="resendLoading" class="flex items-center justify-center gap-2">
                <span class="spinner spinner-sm"></span>
                Sending...
              </span>
              <span v-else-if="resendCooldown > 0">
                Resend in {{ resendCooldown }}s
              </span>
              <span v-else>
                Send new verification link
              </span>
            </button>
          </div>

          <RouterLink to="/login" class="text-sm text-primary-600 hover:underline inline-block">
            Back to Login
          </RouterLink>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const success = ref(false);
const resendSuccess = ref(false);
const resendLoading = ref(false);
const resendCooldown = ref(0);
const errorMessage = ref('');

// The token from the URL — kept so we can pass it to the resend-by-token endpoint
const urlToken = ref('');
let cooldownTimer = null;

// Figure out which dashboard to send verified users to
const dashboardRoute = computed(() => {
  const role = authStore.user?.role;
  const map = {
    patient: '/patient',
    doctor: '/doctor',
    pharmacy: '/pharmacy',
    hospital: '/hospital',
    admin: '/admin',
  };
  return map[role] || '/login';
});

onMounted(async () => {
  urlToken.value = route.params.token || '';

  if (!urlToken.value) {
    loading.value = false;
    errorMessage.value = 'This verification link is invalid. Please request a new one below.';
    return;
  }

  try {
    await authStore.verifyEmail(urlToken.value);
    success.value = true;
  } catch (err) {
    const msg = err.response?.data?.message || '';
    const lc = msg.toLowerCase();
    if (lc.includes('expired')) {
      errorMessage.value = 'This verification link has expired. Use the button below to get a fresh one — your email address is already on file.';
    } else if (lc.includes('invalid') || lc.includes('purpose') || lc.includes('token')) {
      errorMessage.value = 'This verification link is no longer valid (it may be an old link). Use the button below to get a new one.';
    } else {
      errorMessage.value = msg || 'Verification failed. Please request a new link below.';
    }
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer);
});

async function handleResend() {
  resendLoading.value = true;

  try {
    // If user is authenticated, use the authenticated resend endpoint
    // Otherwise pass the URL token so the backend can decode the userId from it
    if (authStore.isAuthenticated) {
      await authStore.resendVerification();
    } else {
      await authStore.resendVerificationByToken(urlToken.value);
    }
    resendSuccess.value = true;
  } catch (err) {
    // Error toast already shown by the store — start cooldown so user doesn't spam
    startCooldown(30);
  } finally {
    resendLoading.value = false;
    // Start cooldown on success too so the "sent" state can't be triggered repeatedly
    if (resendSuccess.value) startCooldown(60);
  }
}

function startCooldown(seconds) {
  resendCooldown.value = seconds;
  cooldownTimer = setInterval(() => {
    resendCooldown.value -= 1;
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}
</script>
