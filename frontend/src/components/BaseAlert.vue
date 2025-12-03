<template>
  <div :class="alertClasses" role="alert">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <component :is="iconComponent" class="h-5 w-5" />
      </div>
      <div class="ml-3 flex-1">
        <h3 v-if="title" :class="titleClasses">{{ title }}</h3>
        <div :class="messageClasses">
          <slot>{{ message }}</slot>
        </div>
      </div>
      <div v-if="dismissible" class="ml-auto pl-3">
        <button @click="handleDismiss" class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  dismissible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['dismiss']);

const alertClasses = computed(() => {
  const baseClasses = 'alert';
  const typeClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info'
  };
  return `${baseClasses} ${typeClasses[props.type]}`;
});

const iconComponent = computed(() => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  };
  return icons[props.type];
});

const titleClasses = computed(() => {
  return 'text-sm font-medium mb-1';
});

const messageClasses = computed(() => {
  return 'text-sm';
});

const handleDismiss = () => {
  emit('dismiss');
};
</script>
