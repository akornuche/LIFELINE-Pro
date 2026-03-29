<template>
  <div class="page-container">
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <router-link to="/admin/users" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeftIcon class="h-6 w-6 text-gray-600" />
        </router-link>
        <h1 class="text-3xl font-bold text-gray-900">User Details</h1>
      </div>
      <div class="flex gap-3">
        <BaseButton v-if="user?.status === 'active'" variant="danger" @click="handleDeactivate">
          Deactivate Account
        </BaseButton>
        <BaseButton v-if="user?.status === 'inactive'" variant="success" @click="handleActivate">
          Activate Account
        </BaseButton>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="spinner spinner-lg"></div>
    </div>

    <div v-else-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      <!-- Sidebar: User Summary -->
      <div class="space-y-6">
        <BaseCard class="text-center">
          <div class="mb-4 flex justify-center">
            <div v-if="user.profile_image_url" class="h-24 w-24 rounded-full border-4 border-primary-100 overflow-hidden">
              <img :src="user.profile_image_url" :alt="user.first_name" class="h-full w-full object-cover" />
            </div>
            <div v-else class="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold">
              {{ user.first_name?.charAt(0) }}{{ user.last_name?.charAt(0) }}
            </div>
          </div>
          <h2 class="text-xl font-bold text-gray-900">{{ user.first_name }} {{ user.last_name }}</h2>
          <p class="text-gray-500 mb-4">{{ user.lifeline_id }}</p>
          <div class="flex justify-center gap-2 mb-4">
            <span :class="['badge', getRoleBadge(user.role)]">{{ user.role }}</span>
            <span :class="['badge', user.status === 'active' ? 'badge-success' : 'badge-error']">{{ user.status }}</span>
          </div>
          <hr class="my-4 border-gray-100" />
          <div class="text-left space-y-3">
            <div class="flex items-center gap-3 text-sm">
              <EnvelopeIcon class="h-4 w-4 text-gray-400" />
              <span class="text-gray-600 truncate">{{ user.email }}</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <PhoneIcon class="h-4 w-4 text-gray-400" />
              <span class="text-gray-600">{{ user.phone || 'No phone provided' }}</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <CalendarIcon class="h-4 w-4 text-gray-400" />
              <span class="text-gray-600 italic">Joined {{ formatDate(user.created_at) }}</span>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="Verification Status">
          <div v-if="user.email_verified" class="flex items-center gap-2 text-green-600 text-sm font-medium mb-3">
            <CheckBadgeIcon class="h-5 w-5" />
            Email Verified
          </div>
          <div v-else class="flex items-center gap-2 text-warning-600 text-sm font-medium mb-3">
            <ExclamationTriangleIcon class="h-5 w-5" />
            Email Pending
          </div>

          <div v-if="user.profile?.verification_status" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-xs text-gray-400 uppercase mb-2">Provider Status</p>
            <span :class="['badge', user.profile.verification_status === 'verified' ? 'badge-success' : 'badge-warning']">
              {{ user.profile.verification_status }}
            </span>
          </div>
        </BaseCard>
      </div>

      <!-- Main Content: Detailed Information -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Personal Information -->
        <BaseCard title="Personal Information">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="text-xs text-gray-400 uppercase">First Name</label>
              <p class="font-medium text-gray-900">{{ user.first_name }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Last Name</label>
              <p class="font-medium text-gray-900">{{ user.last_name }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Gender</label>
              <p class="font-medium text-gray-900">{{ user.gender || 'Not specified' }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Date of Birth</label>
              <p class="font-medium text-gray-900">{{ user.date_of_birth ? formatDate(user.date_of_birth) : 'Not specified' }}</p>
            </div>
            <div class="md:col-span-2">
              <label class="text-xs text-gray-400 uppercase">Address</label>
              <p class="font-medium text-gray-900">
                {{ user.address }}{{ user.city ? `, ${user.city}` : '' }}{{ user.state ? `, ${user.state}` : '' }}{{ user.country ? `, ${user.country}` : '' }}
                {{ !user.address && !user.city ? 'No address provided' : '' }}
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Role-Specific Details (Profile) -->
        <BaseCard v-if="user.profile" :title="getProfileTitle(user.role)">
          <div v-if="user.role === 'patient'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="text-xs text-gray-400 uppercase">Plan Package</label>
              <p class="font-bold text-primary-600 capitalize">{{ user.profile.package }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Primary Facility</label>
              <p class="font-medium text-gray-900">{{ user.profile.pfa_id || 'Not assigned' }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Blood Group</label>
              <p class="font-medium text-gray-900">{{ user.profile.blood_group || 'Unknown' }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Genotype</label>
              <p class="font-medium text-gray-900">{{ user.profile.genotype || 'Unknown' }}</p>
            </div>
          </div>

          <div v-if="user.role === 'doctor'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="text-xs text-gray-400 uppercase">Specialization</label>
              <p class="font-medium text-gray-900">{{ user.profile.specialization }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">License Number</label>
              <p class="font-medium text-gray-900">{{ user.profile.license_number }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Experience</label>
              <p class="font-medium text-gray-900">{{ user.profile.experience_years }} years</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Bio</label>
              <p class="text-sm text-gray-600 line-clamp-3">{{ user.profile.bio || 'No bio provided' }}</p>
            </div>
          </div>

          <div v-if="user.role === 'pharmacy' || user.role === 'hospital'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="text-xs text-gray-400 uppercase">Entity Name</label>
              <p class="font-medium text-gray-900">{{ user.profile.name }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase">Registration ID</label>
              <p class="font-medium text-gray-900">{{ user.profile.license_number || user.profile.reg_no }}</p>
            </div>
            <div class="md:col-span-2">
              <label class="text-xs text-gray-400 uppercase">Business Address</label>
              <p class="font-medium text-gray-900">{{ user.profile.address }}</p>
            </div>
          </div>
        </BaseCard>

        <!-- System Logs / Metadata -->
        <BaseCard title="Account Administration">
          <div class="flex flex-wrap gap-4 text-sm text-gray-500">
             <div class="bg-gray-50 p-4 rounded-lg flex-1 min-w-[200px]">
               <p class="text-xs uppercase text-gray-400 mb-1">Last Login</p>
               <p class="font-medium">{{ user.last_login_at ? formatDate(user.last_login_at, true) : 'Never' }}</p>
             </div>
             <div class="bg-gray-50 p-4 rounded-lg flex-1 min-w-[200px]">
               <p class="text-xs uppercase text-gray-400 mb-1">Account Created</p>
               <p class="font-medium">{{ formatDate(user.created_at, true) }}</p>
             </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';
import { useToast } from '@/composables/useToast';
import { BaseCard, BaseButton } from '@/components';
import { 
  ChevronLeftIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, 
  CheckBadgeIcon, ExclamationTriangleIcon 
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const route = useRoute();
const router = useRouter();
const adminStore = useAdminStore();
const { success, error: showError } = useToast();

const user = ref(null);
const loading = ref(true);

const loadUser = async () => {
  loading.value = true;
  try {
    user.value = await adminStore.getUser(route.params.id);
  } catch (err) {
    showError('Failed to load user details');
    router.push('/admin/users');
  } finally {
    loading.value = false;
  }
};

const handleDeactivate = async () => {
  if (!confirm('Are you sure you want to deactivate this account?')) return;
  try {
    await adminStore.deactivateUser(user.value.id);
    success('Account deactivated');
    loadUser();
  } catch (err) {
    showError('Action failed');
  }
};

const handleActivate = async () => {
  try {
    await adminStore.activateUser(user.value.id);
    success('Account reactivated');
    loadUser();
  } catch (err) {
    showError('Action failed');
  }
};

const getRoleBadge = (role) => {
  const map = {
    admin: 'badge-purple',
    doctor: 'badge-info',
    patient: 'badge-primary',
    pharmacy: 'badge-warning',
    hospital: 'badge-error'
  };
  return map[role] || 'badge-info';
};

const getProfileTitle = (role) => {
  const map = {
    patient: 'Patient Profile & Subscription',
    doctor: 'Professional Qualifications',
    pharmacy: 'Facility Details',
    hospital: 'Medical Facility Metrics'
  };
  return map[role] || 'Profile Details';
};

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), includeTime ? 'PPP p' : 'MMM d, yyyy');
};

onMounted(() => loadUser());
</script>
