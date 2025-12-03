<template>
  <div v-if="loading" :class="containerClasses">
    <div :class="spinnerClasses"></div>
    <p v-if="text" :class="textClasses">{{ text }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  text: {
    type: String,
    default: ''
  },
  fullscreen: {
    type: Boolean,
    default: false
  },
  overlay: {
    type: Boolean,
    default: false
  }
});

const containerClasses = computed(() => {
  const classes = ['flex flex-col items-center justify-center'];
  
  if (props.fullscreen) {
    classes.push('fixed inset-0 z-50 bg-white');
  } else if (props.overlay) {
    classes.push('absolute inset-0 z-40 bg-white bg-opacity-75');
  } else {
    classes.push('py-12');
  }
  
  return classes.join(' ');
});

const spinnerClasses = computed(() => {
  const classes = ['spinner'];
  
  if (props.size === 'sm') classes.push('spinner-sm');
  else if (props.size === 'lg') classes.push('spinner-lg');
  
  return classes.join(' ');
});

const textClasses = computed(() => {
  return 'mt-4 text-gray-600';
});
</script>
