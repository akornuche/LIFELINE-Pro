<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead :class="theadClasses">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="getHeaderClasses(column)"
            @click="column.sortable ? handleSort(column.key) : null"
          >
            <div class="flex items-center gap-2">
              {{ column.label }}
              <span v-if="column.sortable" class="flex flex-col">
                <ChevronUpIcon
                  :class="['h-3 w-3', sortBy === column.key && sortOrder === 'asc' ? 'text-primary-600' : 'text-gray-400']"
                />
                <ChevronDownIcon
                  :class="['h-3 w-3 -mt-1', sortBy === column.key && sortOrder === 'desc' ? 'text-primary-600' : 'text-gray-400']"
                />
              </span>
            </div>
          </th>
          <th v-if="$slots.actions" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-if="loading" class="hover:bg-gray-50">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center">
            <div class="flex justify-center">
              <div class="spinner spinner-lg"></div>
            </div>
          </td>
        </tr>
        
        <tr v-else-if="!sortedData.length" class="hover:bg-gray-50">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center text-gray-500">
            {{ emptyText }}
          </td>
        </tr>
        
        <tr
          v-else
          v-for="(row, index) in sortedData"
          :key="index"
          :class="rowClasses"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            :class="getCellClasses(column)"
          >
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
              {{ formatCellValue(row[column.key], column) }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: 'No data available'
  },
  striped: {
    type: Boolean,
    default: false
  },
  hoverable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['sort']);

const sortBy = ref('');
const sortOrder = ref('asc');

const theadClasses = computed(() => {
  return 'bg-gray-50';
});

const rowClasses = computed(() => {
  const classes = [];
  if (props.hoverable) classes.push('hover:bg-gray-50');
  return classes.join(' ');
});

const getHeaderClasses = (column) => {
  const classes = ['px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'];
  if (column.sortable) classes.push('cursor-pointer select-none');
  return classes.join(' ');
};

const getCellClasses = (column) => {
  const classes = ['px-6 py-4'];
  if (column.align === 'center') classes.push('text-center');
  else if (column.align === 'right') classes.push('text-right');
  else classes.push('text-left');
  
  if (!column.wrap) classes.push('whitespace-nowrap');
  
  return classes.join(' ');
};

const sortedData = computed(() => {
  if (!sortBy.value) return props.data;
  
  return [...props.data].sort((a, b) => {
    const aVal = a[sortBy.value];
    const bVal = b[sortBy.value];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal > bVal ? 1 : -1;
    return sortOrder.value === 'asc' ? comparison : -comparison;
  });
});

const handleSort = (key) => {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = key;
    sortOrder.value = 'asc';
  }
  emit('sort', { key: sortBy.value, order: sortOrder.value });
};

const formatCellValue = (value, column) => {
  if (column.format) {
    return column.format(value);
  }
  return value;
};
</script>
