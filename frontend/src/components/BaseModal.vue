<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel :class="modalClasses">
              <div v-if="title || $slots.header" class="flex items-center justify-between mb-4">
                <DialogTitle v-if="title" as="h3" class="text-lg font-semibold text-gray-900">
                  {{ title }}
                </DialogTitle>
                <slot v-else name="header" />
                
                <button
                  v-if="showClose"
                  @click="closeModal"
                  class="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <XMarkIcon class="h-6 w-6" />
                </button>
              </div>

              <div :class="bodyClasses">
                <slot />
              </div>

              <div v-if="$slots.footer" class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed } from 'vue';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  showClose: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const modalClasses = computed(() => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };
  
  return [
    'w-full',
    sizeClasses[props.size],
    'transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'
  ].join(' ');
});

const bodyClasses = computed(() => {
  return 'text-sm text-gray-500';
});

const closeModal = () => {
  if (!props.persistent) {
    emit('close');
  }
};
</script>
