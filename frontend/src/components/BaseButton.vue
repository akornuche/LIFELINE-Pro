<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <span v-if="loading" class="spinner spinner-sm mr-2"></span>
    <component v-if="icon && !loading" :is="icon" :class="iconClasses" />
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'button'
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'outline', 'ghost'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  icon: {
    type: Object,
    default: null
  },
  iconPosition: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const buttonClasses = computed(() => {
  const classes = ['btn'];
  
  // Variant
  if (props.variant === 'primary') classes.push('btn-primary');
  else if (props.variant === 'secondary') classes.push('btn-secondary');
  else if (props.variant === 'danger') classes.push('btn-danger');
  else if (props.variant === 'outline') classes.push('btn-outline');
  else if (props.variant === 'ghost') classes.push('hover:bg-gray-100');
  
  // Size
  if (props.size === 'sm') classes.push('btn-sm');
  else if (props.size === 'lg') classes.push('btn-lg');
  
  // Full width
  if (props.fullWidth) classes.push('w-full');
  
  // Disabled/Loading state
  if (props.disabled || props.loading) classes.push('opacity-50 cursor-not-allowed');
  
  return classes.join(' ');
});

const iconClasses = computed(() => {
  const classes = ['h-5 w-5'];
  if (props.iconPosition === 'left') classes.push('mr-2');
  else classes.push('ml-2');
  return classes.join(' ');
});

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>
