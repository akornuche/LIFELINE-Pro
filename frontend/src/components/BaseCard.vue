<template>
  <div :class="cardClasses">
    <div v-if="title || $slots.header" class="card-header">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </slot>
    </div>
    
    <div class="card-body">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  padding: {
    type: String,
    default: 'normal',
    validator: (value) => ['none', 'sm', 'normal', 'lg'].includes(value)
  }
});

const cardClasses = computed(() => {
  const classes = ['card'];
  
  if (props.hoverable) {
    classes.push('hover:shadow-md transition-shadow duration-200 cursor-pointer');
  }
  
  return classes.join(' ');
});
</script>
