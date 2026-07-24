<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Service Requests</h1>
      <p class="text-gray-600">Request healthcare services and track your appointments</p>
    </div>

    <!-- New Request Form -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="text-lg font-semibold">Request a Service</h2>
      </div>
      <div class="card-body">
        <form @submit.prevent="submitRequest" class="space-y-4">
          <!-- Service Catalog -->
          <div class="form-group">
            <label class="form-label">Select Services (toggle to add/remove)</label>

            <!-- Preferred provider banner — only visible when at least one service is selected -->
            <div v-if="preferredProvider && selectedServices.length > 0" class="rounded-lg bg-green-50 border border-green-200 p-3 mb-3 flex items-center justify-between gap-2 text-sm text-green-700">
              <div class="flex items-center gap-2">
                <CheckCircleIcon class="h-5 w-5 flex-shrink-0" />
                <span>Booking directly with <strong>{{ preferredProvider.name }}</strong></span>
              </div>
              <button @click="preferredProvider = null" type="button" class="text-green-500 hover:text-green-700 text-xs underline flex-shrink-0">Clear</button>
            </div>

            <!-- Selected services summary -->
            <div v-if="selectedServices.length > 0" class="rounded-lg bg-primary-50 border border-primary-200 p-3 mb-3 flex items-center justify-between gap-2 text-sm text-primary-700">
              <span><strong>{{ selectedServices.length }}</strong> service{{ selectedServices.length > 1 ? 's' : '' }} selected</span>
              <button @click="selectedServices.value = []" type="button" class="text-primary-500 hover:text-primary-700 text-xs underline flex-shrink-0">Clear all</button>
            </div>

            <!-- No active subscription warning -->
            <div v-if="!patientStore.hasActiveSubscription" class="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-3 flex gap-2 text-sm text-amber-700">
              <ExclamationTriangleIcon class="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>You need an active subscription to request services.
                <router-link to="/patient/subscription" class="font-semibold underline">Subscribe now</router-link>
              </span>
            </div>
            <div v-else class="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-3 flex gap-2 text-sm text-blue-700">
              <InformationCircleIcon class="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>Active plan: <strong>{{ planName(patientStore.currentPlanTier) }}</strong>. Grayed-out services require a higher plan — <router-link to="/patient/subscription" class="font-semibold underline">upgrade</router-link> to unlock them.</span>
            </div>

            <!-- Service catalog grouped by plan tier -->
            <div class="space-y-5">
              <div v-for="group in catalogByTier" :key="group.tier">
                <!-- Tier section header -->
                <div :class="['flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold mb-2', group.meta.headerBg]">
                  <span :class="['inline-block h-2 w-2 rounded-full flex-shrink-0', group.meta.dot]"></span>
                  <span :class="group.meta.color">{{ group.meta.label }}</span>
                  <span class="ml-auto font-normal text-gray-400">{{ group.services.length }} service{{ group.services.length !== 1 ? 's' : '' }}</span>
                </div>
                <!-- Services grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    v-for="svc in group.services"
                    :key="svc.value"
                    type="button"
                    :aria-pressed="isServiceSelected(svc.value)"
                    :disabled="!canSelectService(svc)"
                    @click="toggleService(svc)"
                    :class="[
                      'relative w-full rounded-xl border-2 p-3 text-left transition-all select-none',
                      isServiceSelected(svc.value)
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : canSelectService(svc)
                          ? 'border-gray-200 bg-white cursor-pointer hover:border-primary-300 hover:shadow-sm'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                    ]"
                  >
                    <LockClosedIcon v-if="!canSelectService(svc)" class="absolute top-2 right-2 h-3.5 w-3.5 text-gray-400" />
                    <CheckCircleIcon v-else-if="isServiceSelected(svc.value)" class="absolute top-2 right-2 h-3.5 w-3.5 text-primary-500" />
                    <div class="text-xl mb-1">{{ svc.icon }}</div>
                    <p class="text-xs font-semibold text-gray-900 leading-tight">{{ svc.label }}</p>
                    <p class="text-xs text-gray-400 mt-0.5 leading-tight">{{ svc.description }}</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Priority + Preferred Date -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select v-model="newRequest.priority" class="input">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Preferred Date (optional)</label>
              <input
                v-model="newRequest.preferredDate"
                type="datetime-local"
                class="input"
                :min="minDateTime"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="newRequest.description"
              rows="3"
              class="input"
              placeholder="Describe your symptoms or what you need..."
            ></textarea>
          </div>
          <button
            type="submit"
            :disabled="submitting || selectedServices.length === 0"
            class="btn btn-primary"
          >
            <span v-if="!submitting">Submit {{ selectedServices.length > 1 ? `${selectedServices.length} Requests` : 'Request' }}</span>
            <span v-else class="flex items-center">
              <span class="spinner spinner-sm mr-2"></span>
              Submitting...
            </span>
          </button>
        </form>

        <!-- How it works info box -->
        <div class="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span class="inline-block w-4 h-4 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">i</span>
            What happens after you submit?
          </h4>
          <ol class="space-y-2 text-sm text-gray-600">
            <li class="flex gap-2">
              <span class="font-semibold text-primary-600 flex-shrink-0">1.</span>
              Our system immediately identifies the best available provider in your city using our pairing algorithm.
            </li>
            <li class="flex gap-2">
              <span class="font-semibold text-primary-600 flex-shrink-0">2.</span>
              The provider is assigned within seconds and notified automatically.
            </li>
            <li class="flex gap-2">
              <span class="font-semibold text-primary-600 flex-shrink-0">3.</span>
              Status updates: <span class="font-medium">Pending -> Provider Assigned -> Accepted -> In Progress -> Completed</span>
            </li>
            <li class="flex gap-2">
              <span class="font-semibold text-primary-600 flex-shrink-0">4.</span>
              You can cancel at any time while status is <span class="font-medium">Pending</span> or <span class="font-medium">Assigned</span>.
            </li>
          </ol>
          <p class="text-xs text-gray-400 mt-3">Note: Your profile must have a city set for provider matching to work.</p>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex space-x-2 mb-4">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        @click="activeFilter = tab.value"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          activeFilter === tab.value
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Requests List -->
    <div v-if="loading" class="space-y-4">
      <SkeletonLoader type="card" v-for="n in 3" :key="n" />
    </div>

    <div v-else-if="filteredRequests.length === 0" class="card">
      <div class="card-body text-center py-12">
        <p class="text-gray-500">No service requests found</p>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="request in filteredRequests"
        :key="request.id"
        class="card hover:shadow-md transition-shadow"
      >
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center space-x-3">
                <h3 class="font-semibold text-gray-900">{{ formatServiceType(request.service_type) }}</h3>
                <span :class="statusBadgeClass(request.status)">
                  {{ formatStatus(request.status) }}
                </span>
                <span v-if="request.priority !== 'normal'" :class="priorityBadgeClass(request.priority)">
                  {{ request.priority }}
                </span>
              </div>
              <p v-if="request.description" class="text-sm text-gray-600 mt-1">{{ request.description }}</p>
              <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>{{ formatDate(request.created_at) }}</span>
                <span v-if="request.provider_name">
                  Assigned to: <strong>{{ request.provider_name }}</strong>
                </span>
                <span v-if="request.preferred_date">
                  Preferred: {{ formatDate(request.preferred_date) }}
                </span>
              </div>
            </div>
            <button
              v-if="['pending', 'assigned'].includes(request.status)"
              @click="cancelRequest(request.id)"
              class="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { queueService } from '@/services';
import { useToast } from '@/composables/useToast';
import { usePatientStore } from '@/stores/patient';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import {
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';

const { success, error: showError } = useToast();
const router = useRouter();
const route = useRoute();
const patientStore = usePatientStore();

const loading = ref(true);
const submitting = ref(false);
const requests = ref([]);
const activeFilter = ref('all');

// Multi-select services
const selectedServices = ref([]);

// Preferred provider (set when arriving from Find pages)
const preferredProvider = ref(null); // { id, name, type }

// Comprehensive service catalog
const SERVICE_CATALOG = [
  { value: 'consultation',               label: 'GP Consultation',           description: 'General practitioner visit & diagnosis',                   icon: '🩺', requiredTier: 1 },
  { value: 'prescription',               label: 'Prescription',              description: 'Medications prescribed by a doctor',                       icon: '💊', requiredTier: 1 },
  { value: 'laboratory_test',            label: 'Basic Lab Test',            description: 'Malaria, blood count, urinalysis, blood sugar & pregnancy test', icon: '🧪', requiredTier: 1 },
  { value: 'vaccination',                label: 'Vaccination',               description: 'Immunization, childhood vaccines & flu shots',             icon: '💉', requiredTier: 1 },
  { value: 'emergency',                  label: 'Emergency Care',            description: 'Urgent & life-threatening medical conditions',             icon: '🚨', requiredTier: 1 },
  { value: 'drug_dispensing',            label: 'Drug Dispensing',           description: 'Collect medications directly from a pharmacy',             icon: '🏪', requiredTier: 2 },
  { value: 'admission',                  label: 'Hospital Admission',        description: 'Inpatient care & hospital stay (up to 3 days)',            icon: '🏥', requiredTier: 2 },
  { value: 'antenatal_care',             label: 'Antenatal Care',            description: 'Prenatal check-ups, scans & maternal health support',      icon: '🤰', requiredTier: 2 },
  { value: 'specialist_consultation',    label: 'Specialist Consultation',   description: 'Orthopaedics, ENT, Dermatology, Paediatrics & Gynaecology', icon: '🩻', requiredTier: 3 },
  { value: 'advanced_lab_test',          label: 'Advanced Lab Test',         description: 'Lipid profile, liver & kidney function, HIV, Hepatitis panel', icon: '⚗️', requiredTier: 3 },
  { value: 'imaging',                    label: 'Basic Imaging',             description: 'X-ray & Ultrasound scans',                                icon: '📡', requiredTier: 3 },
  { value: 'minor_surgery',              label: 'Minor Surgery',             description: 'Suturing, cyst removal, hernia repair & circumcision',    icon: '⚕️', requiredTier: 3 },
  { value: 'physiotherapy',              label: 'Physiotherapy',             description: 'Rehabilitation, physical therapy & post-surgical recovery', icon: '🏃', requiredTier: 3 },
  { value: 'mental_health',              label: 'Mental Health',             description: 'Counselling, psychiatry & psychological support',          icon: '🧠', requiredTier: 3 },
  { value: 'dental_care',                label: 'Dental Care',               description: 'Tooth extraction, fillings & oral health treatment',       icon: '🦷', requiredTier: 3 },
  { value: 'chronic_disease_management', label: 'Chronic Disease Mgmt',      description: 'Diabetes, hypertension & ongoing condition monitoring',    icon: '🫀', requiredTier: 3 },
  { value: 'advanced_imaging',           label: 'Advanced Imaging',          description: 'CT Scan, MRI, Mammography, ECG & Echocardiography',       icon: '🔭', requiredTier: 4 },
  { value: 'major_surgery',              label: 'Major Surgery',             description: 'Cardiac, neurosurgery, abdominal & cancer surgery',        icon: '🏨', requiredTier: 4 },
  { value: 'maternity_care',             label: 'Maternity & Childbirth',    description: 'Delivery, C-section, postnatal care & newborn care',      icon: '👶', requiredTier: 4 },
  { value: 'ambulance',                  label: 'Ambulance Service',         description: 'Emergency medical transport to hospital',                  icon: '🚑', requiredTier: 4 },
  { value: 'home_visit',                 label: 'Doctor Home Visit',         description: 'Doctor visits you at home for consultation or follow-up',  icon: '🏠', requiredTier: 4 },
  { value: 'second_opinion',             label: 'Medical Second Opinion',    description: 'Independent specialist review of diagnosis or treatment',  icon: '📋', requiredTier: 4 },
];

const PLAN_NAMES = { 0: 'No Plan', 1: 'General', 2: 'Basic', 3: 'Standard', 4: 'Premium' };
const planName = (tier) => PLAN_NAMES[tier] || 'Unknown';

const TIER_META = {
  1: { label: 'General Plan & Above',       headerBg: 'bg-gray-50 border-gray-200',    color: 'text-gray-700',   dot: 'bg-gray-400'   },
  2: { label: 'Basic Insurance & Above',    headerBg: 'bg-blue-50 border-blue-200',    color: 'text-blue-700',   dot: 'bg-blue-500'   },
  3: { label: 'Standard Insurance & Above', headerBg: 'bg-indigo-50 border-indigo-200',color: 'text-indigo-700', dot: 'bg-indigo-500' },
  4: { label: 'Premium Insurance Only',     headerBg: 'bg-purple-50 border-purple-200',color: 'text-purple-700', dot: 'bg-purple-500' },
};

const canSelectService = (svc) =>
  patientStore.hasActiveSubscription && patientStore.currentPlanTier >= svc.requiredTier;

const isServiceSelected = (value) => selectedServices.value.includes(value);

const toggleService = (svc) => {
  if (!patientStore.hasActiveSubscription) {
    showError('You need an active subscription to request services.');
    return;
  }
  if (patientStore.currentPlanTier < svc.requiredTier) {
    showError(`"${svc.label}" requires the ${planName(svc.requiredTier)} plan or higher. Upgrade your subscription to unlock this service.`);
    return;
  }
  const current = selectedServices.value;
  const idx = current.indexOf(svc.value);
  if (idx >= 0) {
    // Reassign to new array so Vue 3 detects the change
    selectedServices.value = current.filter(v => v !== svc.value);
  } else {
    selectedServices.value = [...current, svc.value];
  }
};

const filterTabs = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const newRequest = reactive({
  priority: 'normal',
  preferredDate: '',
  description: '',
});

const minDateTime = computed(() => {
  return new Date().toISOString().slice(0, 16);
});

const catalogByTier = computed(() => {
  return [1, 2, 3, 4].map(tier => ({
    tier,
    meta: TIER_META[tier],
    services: SERVICE_CATALOG.filter(s => s.requiredTier === tier),
  }));
});

const filteredRequests = computed(() => {
  if (activeFilter.value === 'all') return requests.value;
  if (activeFilter.value === 'active') {
    return requests.value.filter(r => ['pending', 'assigned', 'accepted', 'in_progress'].includes(r.status));
  }
  return requests.value.filter(r => r.status === activeFilter.value);
});

const fetchRequests = async ({ silent = false } = {}) => {
  if (!silent) loading.value = true;
  try {
    const response = await queueService.getMyRequests();
    requests.value = Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    if (!silent) showError('Failed to load service requests');
  } finally {
    if (!silent) loading.value = false;
  }
};

const submitRequest = async () => {
  if (!patientStore.hasActiveSubscription) {
    showError('You need an active subscription to request services.');
    return;
  }
  if (selectedServices.value.length === 0) {
    showError('Please select at least one service.');
    return;
  }

  submitting.value = true;
  try {
    // Submit one request per selected service
    const results = [];
    for (const serviceType of selectedServices.value) {
      const svcMeta = SERVICE_CATALOG.find(s => s.value === serviceType);
      if (svcMeta && patientStore.currentPlanTier < svcMeta.requiredTier) {
        continue; // Skip services user can't access
      }
      const response = await queueService.createRequest({
        serviceType,
        priority: newRequest.priority,
        preferredDate: newRequest.preferredDate || null,
        description: newRequest.description || null,
        preferredProviderId: preferredProvider.value?.id || null,
        preferredProviderType: preferredProvider.value?.type || null,
      });
      results.push(response);
    }

    if (results.length === 1) {
      success(results[0].data?.message || 'Service request submitted');
    } else {
      success(`${results.length} service requests submitted`);
    }

    // Reset form
    selectedServices.value = [];
    newRequest.priority = 'normal';
    newRequest.preferredDate = '';
    newRequest.description = '';
    preferredProvider.value = null;

    // Refresh list immediately
    await fetchRequests();
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to submit request');
  } finally {
    submitting.value = false;
  }
};

const cancelRequest = async (id) => {
  if (!confirm('Are you sure you want to cancel this request?')) return;
  try {
    await queueService.cancelRequest(id, 'Cancelled by patient');
    success('Request cancelled');
    await fetchRequests();
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to cancel request');
  }
};

const formatServiceType = (type) => {
  const found = SERVICE_CATALOG.find(s => s.value === type);
  return found ? found.label : type;
};

const formatStatus = (status) => {
  const map = {
    pending: 'Pending',
    assigned: 'Provider Assigned',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
    expired: 'Expired',
  };
  return map[status] || status;
};

const statusBadgeClass = (status) => {
  const classes = {
    pending: 'badge badge-warning',
    assigned: 'badge badge-info',
    accepted: 'badge badge-primary',
    in_progress: 'badge badge-primary',
    completed: 'badge badge-success',
    cancelled: 'badge badge-danger',
    rejected: 'badge badge-danger',
    expired: 'badge badge-secondary',
  };
  return classes[status] || 'badge';
};

const priorityBadgeClass = (priority) => {
  const classes = {
    high: 'badge bg-orange-100 text-orange-700',
    emergency: 'badge bg-red-100 text-red-700',
  };
  return classes[priority] || 'badge';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

let requestRefreshInterval = null;

onMounted(async () => {
  if (!patientStore.subscription) {
    await patientStore.fetchSubscription().catch(() => {});
  }

  // Pre-fill from query params (when arriving from Find pages)
  const { serviceType, providerId, providerName, providerType } = route.query;
  if (serviceType) {
    const svc = SERVICE_CATALOG.find(s => s.value === serviceType);
    if (svc && canSelectService(svc)) {
      selectedServices.value = [serviceType];
    }
  }
  if (providerId && providerName) {
    preferredProvider.value = {
      id: providerId,
      name: decodeURIComponent(providerName),
      type: providerType || 'doctor',
    };
  }

  await fetchRequests();

  // Poll every 15s for status changes from providers
  requestRefreshInterval = window.setInterval(() => fetchRequests({ silent: true }), 15_000);
});

onUnmounted(() => {
  if (requestRefreshInterval) {
    window.clearInterval(requestRefreshInterval);
  }
});
</script>
