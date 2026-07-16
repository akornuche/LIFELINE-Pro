<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Full-screen offline overlay -->
    <transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!isOnline"
        class="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6 text-center"
      >
        <!-- Offline icon -->
        <div class="w-24 h-24 mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728" />
            <!-- Strike-through line -->
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4l16 16" class="text-red-400" />
          </svg>
        </div>

        <!-- Message -->
        <h2 class="text-xl font-bold text-gray-800 mb-2">No Internet Connection</h2>
        <p class="text-gray-500 text-sm max-w-xs mb-6">
          Please check your connection and try again. The app will reconnect automatically when you're back online.
        </p>

        <!-- Retry button -->
        <button
          @click="checkConnection"
          class="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>

        <!-- Animated pulse dots to indicate waiting -->
        <div class="mt-8 flex items-center gap-1.5">
          <span class="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style="animation-delay: 0ms"></span>
          <span class="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style="animation-delay: 200ms"></span>
          <span class="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style="animation-delay: 400ms"></span>
        </div>
        <p class="text-xs text-gray-400 mt-2">Waiting for connection...</p>
      </div>
    </transition>

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
import { ref, onMounted, onUnmounted } from 'vue';
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
let pollInterval = null;

const applyUpdate = () => {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  } else {
    window.location.reload();
  }
};

const goOnline = () => {
  isOnline.value = true;
  stopPolling();
};

const goOffline = () => {
  isOnline.value = false;
  startPolling();
};

// Active polling fallback — some devices don't fire online/offline events reliably
const startPolling = () => {
  if (pollInterval) return;
  pollInterval = setInterval(() => {
    if (navigator.onLine) {
      goOnline();
    }
  }, 2000);
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

// Manual retry button
const checkConnection = () => {
  if (navigator.onLine) {
    goOnline();
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
  window.addEventListener('online', goOnline);
  window.addEventListener('offline', goOffline);

  // Start polling if already offline on mount
  if (!navigator.onLine) {
    startPolling();
  }

  // SW update events dispatched from main.js
  window.addEventListener('pwa-needs-refresh', (e) => {
    swRegistration = e.detail || null;
    needsUpdate.value = true;
  });
});

onUnmounted(() => {
  window.removeEventListener('online', goOnline);
  window.removeEventListener('offline', goOffline);
  stopPolling();
});
</script>

<style>
#app {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
