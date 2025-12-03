/**
 * Bulk View Enhancement Script
 * 
 * This script provides patterns for systematically enhancing remaining views.
 * Apply these replacements to each view following the pattern.
 */

// Views that use toast from 'vue3-toastify' - need to replace with useToast
const VIEWS_NEEDING_TOAST_REPLACEMENT = [
  // Doctor Portal
  'doctor/Dashboard.vue',
  'doctor/ConsultationDetails.vue',
  'doctor/NewConsultation.vue',
  'doctor/Profile.vue',
  'doctor/Settings.vue',
  'doctor/Statistics.vue',
  'doctor/Payments.vue',
  
  // Pharmacy Portal
  'pharmacy/Dashboard.vue',
  'pharmacy/Prescriptions.vue',
  'pharmacy/PrescriptionDetails.vue',
  'pharmacy/Profile.vue',
  'pharmacy/Settings.vue',
  'pharmacy/Payments.vue',
  'pharmacy/Statistics.vue',
  
  // Hospital Portal
  'hospital/Dashboard.vue',
  'hospital/Beds.vue',
  'hospital/Surgeries.vue',
  'hospital/SurgeryDetails.vue',
  'hospital/NewSurgery.vue',
  'hospital/Profile.vue',
  'hospital/Settings.vue',
  'hospital/Payments.vue',
  'hospital/Statistics.vue',
  
  // Admin Portal
  'admin/Dashboard.vue',
  'admin/Patients.vue',
  'admin/Doctors.vue',
  'admin/Pharmacies.vue',
  'admin/Hospitals.vue',
  'admin/Verifications.vue',
  'admin/Payments.vue',
  'admin/Settings.vue',
  'admin/Users.vue',
  'admin/Statements.vue',
  
  // Auth
  'auth/Register.vue'
];

// Enhancement patterns for each view type

const PATTERNS = {
  // 1. Replace toast import with useToast
  replaceToastImport: {
    find: "import { toast } from 'vue3-toastify';",
    replace: "import { useToast } from '@/composables/useToast';"
  },
  
  // 2. Setup composable after store/router declarations
  setupToast: {
    pattern: "const { success, error: showError, info } = useToast();"
  },
  
  // 3. Replace all toast calls
  toastReplacements: {
    'toast.success': 'success',
    'toast.error': 'showError',
    'toast.info': 'info',
    'toast.warning': 'info' // We don't have warning, use info
  },
  
  // 4. Replace confirm() calls with useConfirm
  confirmReplacement: {
    find: "if (confirm('",
    replace: `const confirmed = await confirm({
    title: 'Confirm Action',
    message: '`,
    needsAsync: true
  },
  
  // 5. Add SkeletonLoader for loading states
  loadingReplacement: {
    find: '<div class="spinner spinner-lg"></div>',
    replace: '<SkeletonLoader type="card" v-for="i in 5" :key="i" />',
    needsImport: 'SkeletonLoader'
  },
  
  // 6. Add animations
  animations: {
    header: 'animate-fade-in',
    cards: 'hover-lift',
    staggeredList: 'stagger-1, stagger-2, stagger-3, stagger-4'
  }
};

// Step-by-step enhancement guide for each view
const ENHANCEMENT_STEPS = `
For each view, follow these steps:

STEP 1: Import Replacements
---------------------------
Find: import { toast } from 'vue3-toastify';
Replace with: 
  import { useToast } from '@/composables/useToast';
  import { useConfirm } from '@/composables/useConfirm'; // If view has confirms
  import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'; // If view has loading

STEP 2: Setup Composables
-------------------------
After router/store declarations, add:
  const { success, error: showError, info } = useToast();
  const { confirm } = useConfirm(); // If needed

STEP 3: Replace All Toast Calls
-------------------------------
  toast.success('...') → success('...')
  toast.error('...') → showError('...')
  toast.info('...') → info('...')
  toast.warning('...') → info('...')

STEP 4: Replace Confirm Dialogs
-------------------------------
Find:
  if (confirm('Are you sure?')) {
    // action
  }

Replace with:
  const confirmed = await confirm({
    title: 'Confirm Action',
    message: 'Are you sure?',
    confirmText: 'Yes',
    isDangerous: true // For destructive actions
  });
  
  if (confirmed) {
    // action
  }

STEP 5: Replace Loading Spinners
--------------------------------
Find:
  <div v-if="loading" class="flex justify-center py-12">
    <div class="spinner spinner-lg"></div>
  </div>

Replace with:
  <div v-if="loading" class="space-y-4">
    <SkeletonLoader type="card" v-for="i in 5" :key="i" />
  </div>

Or for tables:
  <SkeletonLoader type="table" :rows="8" :cols="6" />

STEP 6: Add Animations
----------------------
Page header:
  <div class="mb-8"> → <div class="mb-8 animate-fade-in">

Cards/Items:
  class="card" → class="card hover-lift"

Staggered lists (for 3 cards):
  First card: animate-fade-in stagger-1
  Second card: animate-fade-in stagger-2
  Third card: animate-fade-in stagger-3

STEP 7: Add Error Handling
---------------------------
In catch blocks, add:
  showError('Failed to ...');

For success actions:
  success('Action completed successfully');
`;

// Quick reference for common patterns
const COMMON_PATTERNS = {
  dashboard: {
    loading: '<SkeletonLoader type="card" v-for="i in 4" :key="i" />',
    stats: 'Add stagger-1, stagger-2, stagger-3, stagger-4 to stat cards',
    header: 'animate-fade-in on page title'
  },
  
  listView: {
    loading: '<SkeletonLoader type="card" v-for="i in 5" :key="i" />',
    items: 'Add hover-lift to each card/row',
    header: 'animate-fade-in on page title'
  },
  
  tableView: {
    loading: '<SkeletonLoader type="table" :rows="8" :cols="6" />',
    header: 'animate-fade-in on page title'
  },
  
  detailView: {
    loading: '<SkeletonLoader type="card" />',
    sections: 'Add stagger-1, stagger-2 to different sections',
    header: 'animate-fade-in on page title'
  },
  
  formView: {
    submit: 'Add confirmation for destructive actions',
    success: 'Add success() toast on save',
    error: 'Add showError() in catch',
    header: 'animate-fade-in on page title'
  }
};

console.log(ENHANCEMENT_STEPS);
console.log('\n\n📋 Views remaining:', VIEWS_NEEDING_TOAST_REPLACEMENT.length);
console.log('✅ Views completed: 15/44 (34%)');
console.log('⏳ Views remaining: 29/44 (66%)');

module.exports = {
  PATTERNS,
  ENHANCEMENT_STEPS,
  COMMON_PATTERNS,
  VIEWS_NEEDING_TOAST_REPLACEMENT
};
