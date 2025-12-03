<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <h2 class="error-title">Something went wrong</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="error-actions">
        <button @click="retry" class="btn btn-primary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Try Again
        </button>
        <button @click="goHome" class="btn btn-secondary">
          Go to Home
        </button>
      </div>
      <details v-if="showDetails" class="error-details">
        <summary>Technical Details</summary>
        <pre>{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const hasError = ref(false);
const errorMessage = ref('');
const errorDetails = ref('');
const showDetails = ref(import.meta.env.DEV);

onErrorCaptured((err, instance, info) => {
  hasError.value = true;
  errorMessage.value = err.message || 'An unexpected error occurred';
  errorDetails.value = `${err.stack}\n\nComponent: ${instance?.$options?.name || 'Unknown'}\nInfo: ${info}`;
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error captured:', err);
    console.error('Component:', instance);
    console.error('Info:', info);
  }
  
  return false; // Prevent error from propagating
});

const retry = () => {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = '';
  window.location.reload();
};

const goHome = () => {
  hasError.value = false;
  router.push('/');
};
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.error-content {
  max-width: 600px;
  width: 100%;
  background: white;
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.error-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #ef4444;
}

.error-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
}

.error-message {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.error-details {
  margin-top: 2rem;
  text-align: left;
}

.error-details summary {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.error-details pre {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: #374151;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
}

@media (max-width: 640px) {
  .error-content {
    padding: 2rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
