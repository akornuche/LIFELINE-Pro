<template>
  <div
    v-if="!authStore.isEmailVerified && !dismissed"
    class="bg-amber-500 text-white px-5 py-3 flex items-center justify-between gap-4 shadow-md z-40 relative"
  >
    <!-- Left: icon + message -->
    <div class="flex items-center gap-3 min-w-0">
      <ExclamationTriangleIcon class="h-5 w-5 shrink-0" />
      <p class="text-sm font-bold leading-tight">
        Your email address is not verified.
        <span class="font-normal opacity-90">Please check your inbox and click the verification link to unlock payments.</span>
      </p>
    </div>

    <!-- Right: actions -->
    <div class="flex items-center gap-3 shrink-0">
      <button
        @click="handleResend"
        :disabled="resending || resent"
        class="text-xs font-bold underline underline-offset-2 hover:opacity-80 disabled:opacity-60 transition-opacity whitespace-nowrap"
      >
        {{ resent ? 'Email sent ✓' : (resending ? 'Sending…' : 'Resend email') }}
      </button>
      <button
        @click="dismissed = true"
        class="hover:opacity-70 transition-opacity"
        aria-label="Dismiss"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const authStore = useAuthStore();

const dismissed = ref(false);
const resending = ref(false);
const resent = ref(false);

async function handleResend() {
  if (resending.value || resent.value) return;
  resending.value = true;
  try {
    await authStore.resendVerification();
    resent.value = true;
    // Reset after 60s so they can try again
    setTimeout(() => { resent.value = false; }, 60_000);
  } catch {
    // toast is already shown by the store
  } finally {
    resending.value = false;
  }
}
</script>
