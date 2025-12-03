/**
 * Batch View Enhancement Script
 * 
 * This script provides enhancement patterns that can be applied to all views.
 * Import this at the top of any view file to get all UI/UX features.
 */

// Standard imports for enhanced views
export const enhancedViewImports = `
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { useLoading } from '@/composables/useLoading';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
`.trim();

// Standard setup for enhanced views
export const enhancedViewSetup = `
const { success, error, warning, info } = useToast();
const { confirm } = useConfirm();
const { isLoading, withLoading } = useLoading();
`.trim();

// Loading template pattern
export const loadingTemplate = `
<!-- Loading State -->
<div v-if="isLoading" class="space-y-6">
  <SkeletonLoader type="card" v-for="i in 3" :key="i" />
</div>

<!-- Content -->
<div v-else class="animate-fade-in">
  <!-- Your content here -->
</div>
`.trim();

// Enhanced form submit pattern
export const enhancedFormSubmit = `
const handleSubmit = async () => {
  try {
    await withLoading(async () => {
      const result = await api.post('/endpoint', formData);
      success('Saved successfully!');
      return result;
    });
  } catch (err) {
    // Error automatically shown by API client
  }
};
`.trim();

// Enhanced delete with confirmation
export const enhancedDelete = `
const handleDelete = async (item) => {
  const confirmed = await confirm({
    title: 'Delete Item',
    message: \`Are you sure you want to delete \${item.name}? This cannot be undone.\`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger'
  });
  
  if (!confirmed) return;
  
  try {
    await api.delete(\`/items/\${item.id}\`);
    success('Item deleted successfully');
    // Refresh list
  } catch (err) {
    // Error handled automatically
  }
};
`.trim();

// Empty state template
export const emptyStateTemplate = `
<div class="card">
  <div class="card-body text-center py-12">
    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <!-- Your icon path here -->
    </svg>
    <h3 class="text-xl font-semibold text-gray-900 mb-2">No Items Found</h3>
    <p class="text-gray-600 mb-6">Get started by creating your first item</p>
    <button @click="showCreateModal" class="btn btn-primary">
      Create New Item
    </button>
  </div>
</div>
`.trim();

// Staggered list animation
export const staggeredListTemplate = `
<div 
  v-for="(item, index) in items" 
  :key="item.id"
  class="card hover-lift animate-fade-in"
  :class="\`stagger-\${Math.min(index + 1, 4)}\`"
>
  <!-- Item content -->
</div>
`.trim();

// Button loading state
export const buttonLoadingState = `
<button 
  type="submit" 
  :disabled="saving" 
  class="btn btn-primary"
>
  <span v-if="!saving">Save Changes</span>
  <span v-else class="flex items-center">
    <span class="spinner spinner-sm mr-2"></span>
    Saving...
  </span>
</button>
`.trim();

// Quick enhancement helper
export function enhanceView(view) {
  // Add imports if not present
  if (!view.includes('useToast')) {
    console.log('Add: import { useToast } from "@/composables/useToast";');
  }
  if (!view.includes('useConfirm')) {
    console.log('Add: import { useConfirm } from "@/composables/useConfirm";');
  }
  if (!view.includes('SkeletonLoader') && view.includes('v-if="loading"')) {
    console.log('Add: import SkeletonLoader from "@/components/SkeletonLoader.vue";');
  }
  
  // Replace alert() with toast
  if (view.includes('alert(')) {
    console.log('Replace: alert() with success() or error()');
  }
  
  // Replace confirm() with dialog
  if (view.includes('confirm(')) {
    console.log('Replace: confirm() with await confirm()');
  }
  
  // Add loading states
  if (view.includes('spinner') && !view.includes('SkeletonLoader')) {
    console.log('Consider: Replace spinner with SkeletonLoader');
  }
  
  // Add animations
  if (!view.includes('animate-fade-in')) {
    console.log('Add: class="animate-fade-in" to main content');
  }
}

export default {
  enhancedViewImports,
  enhancedViewSetup,
  loadingTemplate,
  enhancedFormSubmit,
  enhancedDelete,
  emptyStateTemplate,
  staggeredListTemplate,
  buttonLoadingState,
  enhanceView
};
