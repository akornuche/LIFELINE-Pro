<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Offline banner -->
    <div
      v-if="!isOnline"
      class="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-yellow-500 text-white text-sm font-semibold py-2 px-4"
      role="alert"
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728" />
      </svg>
      You're offline — some features may be unavailable
    </div>

    <!-- SW update banner -->
    <div
      v-if="needsUpdate"
      class="fixed top-0 inset-x-0 z-50 flex items-center justify-between bg-primary-600 text-white text-sm font-semibold py-2 px-4"
      role="alert"
    >
      <span>A new version of LifeLine is available.</span>
      <button
        @click="applyUpdate"
        class="ml-4 underline hover:no-underline focus:outline-none"
      >
        Update now
      </button>
    </div>

    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
    <ConfirmDialog />
    <PwaInstallPrompt />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import ErrorBoundary from '@/components/ErrorBoundary.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue';

const authStore = useAuthStore();
const router = useRouter();

// PWA state
const isOnline = ref(navigator.onLine);
const needsUpdate = ref(false);
let swRegistration = null;

const applyUpdate = () => {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  } else {
    window.location.reload();
  }
};

onMounted(async () => {
  // Auth check
  if (authStore.isAuthenticated) {
    try {
      await authStore.getCurrentUser();
    } catch (error) {
      if (error.response?.status === 401) {
        authStore.clearAuth();
        router.push('/login');
      }
    }
  }

  // Online/offline tracking
  window.addEventListener('online',  () => { isOnline.value = true; });
  window.addEventListener('offline', () => { isOnline.value = false; });

  // SW update events dispatched from main.js
  window.addEventListener('pwa-needs-refresh', (e) => {
    swRegistration = e.detail || null;
    needsUpdate.value = true;
  });
});
</script>

<style>
#app {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
