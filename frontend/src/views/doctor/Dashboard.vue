<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Doctor Dashboard</h1>
    
    <div v-if="loading">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SkeletonLoader type="card" v-for="i in 4" :key="i" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonLoader type="card" v-for="i in 2" :key="'s'+i" />
      </div>
    </div>
    
    <div v-else>
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <BaseCard class="animate-fade-in stagger-1">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="p-3 bg-blue-100 rounded-lg">
                <CalendarIcon class="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Today's Appointments</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.todayAppointments }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="animate-fade-in stagger-2">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="p-3 bg-green-100 rounded-lg">
                <UserGroupIcon class="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Patients</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.totalPatients }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="animate-fade-in stagger-3">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="p-3 bg-purple-100 rounded-lg">
                <DocumentTextIcon class="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Prescriptions</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.totalPrescriptions }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="animate-fade-in stagger-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="p-3 bg-yellow-100 rounded-lg">
                <CurrencyDollarIcon class="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Earnings (This Month)</p>
              <p class="text-2xl font-semibold text-gray-900">₦{{ formatMoney(stats.monthlyEarnings) }}</p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Today's Schedule -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BaseCard title="Today's Schedule">
          <div v-if="todayConsultations.length === 0" class="text-center py-8 text-gray-500">
            No appointments scheduled for today
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="consultation in todayConsultations"
              :key="consultation.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {{ consultation.patient_name.charAt(0) }}
                  </div>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">{{ consultation.patient_name }}</p>
                  <p class="text-xs text-gray-500">{{ consultation.consultation_type }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">{{ formatTime(consultation.consultation_date) }}</p>
                <span :class="getStatusBadge(consultation.status)">
                  {{ consultation.status }}
                </span>
              </div>
            </div>
          </div>
          <template #footer>
            <router-link to="/doctor/consultations" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all appointments →
            </router-link>
          </template>
        </BaseCard>

        <!-- Recent Activity -->
        <BaseCard title="Recent Activity">
          <div v-if="recentActivity.length === 0" class="text-center py-8 text-gray-500">
            No recent activity
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="flex items-start"
            >
              <div class="flex-shrink-0">
                <div :class="getActivityIcon(activity.type)">
                  <component :is="getActivityIconComponent(activity.type)" class="h-5 w-5" />
                </div>
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm text-gray-900">{{ activity.description }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(activity.created_at) }}</p>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDoctorStore } from '@/stores/doctor';
import { BaseCard, LoadingSpinner } from '@/components';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue';
import {
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const router = useRouter();
const doctorStore = useDoctorStore();
const { error: showError } = useToast();

const loading = ref(true);
const stats = ref({
  todayAppointments: 0,
  totalPatients: 0,
  totalPrescriptions: 0,
  monthlyEarnings: 0
});
const todayConsultations = ref([]);
const recentActivity = ref([]);

onMounted(async () => {
  try {
    await Promise.all([
      loadStats(),
      loadTodayConsultations(),
      loadRecentActivity()
    ]);
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showError('Failed to load dashboard data');
  } finally {
    loading.value = false;
  }
});

const loadStats = async () => {
  try {
    const data = await doctorStore.getStatistics();
    stats.value = data;
  } catch (error) {
    console.error('Error loading stats:', error);
    showError('Failed to load statistics');
  }
};

const loadTodayConsultations = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await doctorStore.getConsultations({ date: today, limit: 5 });
    todayConsultations.value = data.consultations || [];
  } catch (error) {
    console.error('Error loading consultations:', error);
  }
};

const loadRecentActivity = async () => {
  try {
    // This would come from an activity API endpoint
    recentActivity.value = [
      { id: 1, type: 'consultation', description: 'Completed consultation with John Doe', created_at: new Date() },
      { id: 2, type: 'prescription', description: 'Issued prescription for Jane Smith', created_at: new Date() },
      { id: 3, type: 'payment', description: 'Received payment for consultation #1234', created_at: new Date() }
    ];
  } catch (error) {
    console.error('Error loading activity:', error);
  }
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount);
};

const formatTime = (dateString) => {
  return format(new Date(dateString), 'h:mm a');
};

const formatDate = (dateString) => {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a');
};

const getStatusBadge = (status) => {
  const badges = {
    scheduled: 'badge badge-info',
    completed: 'badge badge-success',
    cancelled: 'badge badge-error',
    in_progress: 'badge badge-warning'
  };
  return badges[status] || 'badge';
};

const getActivityIcon = (type) => {
  const icons = {
    consultation: 'p-2 bg-blue-100 rounded-full text-blue-600',
    prescription: 'p-2 bg-green-100 rounded-full text-green-600',
    payment: 'p-2 bg-yellow-100 rounded-full text-yellow-600'
  };
  return icons[type] || 'p-2 bg-gray-100 rounded-full text-gray-600';
};

const getActivityIconComponent = (type) => {
  const components = {
    consultation: CheckCircleIcon,
    prescription: DocumentTextIcon,
    payment: CurrencyDollarIcon
  };
  return components[type] || ClockIcon;
};
</script>
