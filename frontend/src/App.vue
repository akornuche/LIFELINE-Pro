<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
    <ToastContainer />
    <ConfirmDialog />
    <PwaInstallPrompt />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import ErrorBoundary from '@/components/ErrorBoundary.vue';
import ToastContainer from '@/components/ToastContainer.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue';

const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  // Check authentication status on app load
  if (authStore.isAuthenticated) {
    try {
      await authStore.getCurrentUser();
    } catch (error) {
      // Only logout on 401 (unauthorized) - keep auth for network errors
      if (error.response?.status === 401) {
        console.error('Session expired, logging out');
        authStore.clearAuth();
        router.push('/login');
      } else {
        // For other errors (network, 404, 500), keep tokens and retry later
        console.warn('Failed to fetch user data, keeping session:', error.message);
      }
    }
  }
});
</script>

<style>
#app {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
