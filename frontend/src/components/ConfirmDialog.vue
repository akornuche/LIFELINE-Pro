<template>
  <transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click="handleCancel">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div :class="['modal-icon', `modal-icon-${config.type}`]">
            <svg v-if="config.type === 'danger'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <svg v-else-if="config.type === 'warning'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="modal-title">{{ config.title }}</h3>
        </div>
        
        <div class="modal-body">
          <p class="modal-message">{{ config.message }}</p>
        </div>
        
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleCancel"
          >
            {{ config.cancelText }}
          </button>
          <button
            type="button"
            :class="['btn', config.type === 'danger' ? 'btn-danger' : 'btn-primary']"
            @click="handleConfirm"
          >
            {{ config.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useConfirm } from '@/composables/useConfirm';

const { isOpen, config } = useConfirm();

const handleConfirm = () => {
  config.value.onConfirm();
};

const handleCancel = () => {
  config.value.onCancel();
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 28rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  padding-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.modal-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}

.modal-icon-danger {
  background-color: #fee2e2;
  color: #dc2626;
}

.modal-icon-warning {
  background-color: #fef3c7;
  color: #d97706;
}

.modal-icon-info {
  background-color: #dbeafe;
  color: #2563eb;
}

.modal-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.75rem;
  margin-top: 0.5rem;
}

.modal-body {
  padding: 0 1.5rem;
}

.modal-message {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.modal-footer {
  padding: 1.5rem;
  padding-top: 1.25rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-danger {
  background-color: #dc2626;
  color: white;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.9) translateY(-20px);
}

.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
}

@media (max-width: 640px) {
  .modal-container {
    max-width: none;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
