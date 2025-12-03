<template>
  <div :class="['skeleton', skeletonClass]">
    <div v-if="type === 'text'" class="skeleton-lines">
      <div v-for="i in lines" :key="i" class="skeleton-line"></div>
    </div>
    <div v-else-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text"></div>
      </div>
    </div>
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div v-for="i in rows" :key="i" class="skeleton-row">
        <div v-for="j in cols" :key="j" class="skeleton-cell"></div>
      </div>
    </div>
    <div v-else-if="type === 'avatar'" class="skeleton-avatar"></div>
    <div v-else class="skeleton-rect"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'card', 'table', 'avatar', 'rect'].includes(value)
  },
  lines: {
    type: Number,
    default: 3
  },
  rows: {
    type: Number,
    default: 5
  },
  cols: {
    type: Number,
    default: 4
  },
  height: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: ''
  }
});

const skeletonClass = computed(() => {
  return `skeleton-${props.type}`;
});
</script>

<style scoped>
.skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton-line,
.skeleton-rect,
.skeleton-cell,
.skeleton-title,
.skeleton-text,
.skeleton-image,
.skeleton-avatar {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.25rem;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-line {
  height: 1rem;
  width: 100%;
}

.skeleton-line:last-child {
  width: 80%;
}

.skeleton-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.skeleton-image {
  height: 12rem;
  width: 100%;
}

.skeleton-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-title {
  height: 1.25rem;
  width: 60%;
}

.skeleton-text {
  height: 0.875rem;
  width: 100%;
}

.skeleton-text:last-child {
  width: 80%;
}

.skeleton-table {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.skeleton-row {
  display: grid;
  grid-template-columns: repeat(var(--cols, 4), 1fr);
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.skeleton-row:last-child {
  border-bottom: none;
}

.skeleton-cell {
  height: 1rem;
}

.skeleton-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
}

.skeleton-rect {
  height: 8rem;
  width: 100%;
  border-radius: 0.5rem;
}
</style>
