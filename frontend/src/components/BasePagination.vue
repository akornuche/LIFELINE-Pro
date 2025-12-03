<template>
  <div class="flex items-center justify-between">
    <div class="text-sm text-gray-700">
      Showing <span class="font-medium">{{ startItem }}</span> to <span class="font-medium">{{ endItem }}</span> of{' '}
      <span class="font-medium">{{ total }}</span> results
    </div>
    
    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        :class="getButtonClasses(true, currentPage === 1)"
        class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium"
      >
        <span class="sr-only">Previous</span>
        <ChevronLeftIcon class="h-5 w-5" />
      </button>
      
      <button
        v-for="page in displayPages"
        :key="page"
        @click="page !== '...' ? goToPage(page) : null"
        :class="getPageClasses(page)"
        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium"
      >
        {{ page }}
      </button>
      
      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        :class="getButtonClasses(true, currentPage === totalPages)"
        class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium"
      >
        <span class="sr-only">Next</span>
        <ChevronRightIcon class="h-5 w-5" />
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  perPage: {
    type: Number,
    default: 10
  },
  maxVisiblePages: {
    type: Number,
    default: 7
  }
});

const emit = defineEmits(['page-change']);

const startItem = computed(() => {
  return (props.currentPage - 1) * props.perPage + 1;
});

const endItem = computed(() => {
  return Math.min(props.currentPage * props.perPage, props.total);
});

const displayPages = computed(() => {
  const pages = [];
  const halfVisible = Math.floor(props.maxVisiblePages / 2);
  
  let startPage = Math.max(1, props.currentPage - halfVisible);
  let endPage = Math.min(props.totalPages, startPage + props.maxVisiblePages - 1);
  
  if (endPage - startPage < props.maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - props.maxVisiblePages + 1);
  }
  
  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push('...');
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  if (endPage < props.totalPages) {
    if (endPage < props.totalPages - 1) pages.push('...');
    pages.push(props.totalPages);
  }
  
  return pages;
});

const getButtonClasses = (isNav, isDisabled) => {
  return isDisabled
    ? 'text-gray-300 cursor-not-allowed'
    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700';
};

const getPageClasses = (page) => {
  if (page === '...') {
    return 'text-gray-700 cursor-default';
  }
  
  return page === props.currentPage
    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700';
};

const goToPage = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page);
  }
};
</script>
