<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Statistics & Analytics</h1>

    <div v-if="loading">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SkeletonLoader type="card" v-for="i in 4" :key="i" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <SkeletonLoader type="card" v-for="i in 2" :key="'c'+i" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonLoader type="card" v-for="i in 2" :key="'d'+i" />
      </div>
    </div>

    <div v-else>
      <!-- Overview Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <BaseCard class="animate-fade-in stagger-1">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Consultations</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalConsultations }}</p>
              <p class="text-xs text-green-600 mt-1">+{{ stats.consultationsGrowth }}% from last month</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-lg">
              <CalendarIcon class="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </BaseCard>

        <BaseCard class="animate-fade-in stagger-2">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Patients</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalPatients }}</p>
              <p class="text-xs text-green-600 mt-1">+{{ stats.patientsGrowth }}% from last month</p>
            </div>
            <div class="p-3 bg-green-100 rounded-lg">
              <UserGroupIcon class="h-8 w-8 text-green-600" />
            </div>
          </div>
        </BaseCard>

        <BaseCard class="animate-fade-in stagger-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Revenue</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">₦{{ formatMoney(stats.totalRevenue) }}</p>
              <p class="text-xs text-green-600 mt-1">+{{ stats.revenueGrowth }}% from last month</p>
            </div>
            <div class="p-3 bg-yellow-100 rounded-lg">
              <CurrencyDollarIcon class="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </BaseCard>

        <BaseCard class="animate-fade-in stagger-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Avg Rating</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.averageRating }}<span class="text-xl">/5</span></p>
              <p class="text-xs text-gray-600 mt-1">{{ stats.totalReviews }} reviews</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-lg">
              <StarIcon class="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <BaseCard title="Monthly Consultations">
          <div class="h-80">
            <canvas ref="consultationsChart"></canvas>
          </div>
        </BaseCard>

        <BaseCard title="Revenue Trend">
          <div class="h-80">
            <canvas ref="revenueChart"></canvas>
          </div>
        </BaseCard>
      </div>

      <!-- Detailed Statistics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BaseCard title="Consultation Types">
          <div class="space-y-4">
            <div v-for="type in stats.consultationTypes" :key="type.name" class="flex items-center justify-between">
              <div class="flex items-center flex-1">
                <span class="text-sm font-medium text-gray-900">{{ type.name }}</span>
                <div class="ml-4 flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full"
                    :style="{ width: `${(type.count / stats.totalConsultations) * 100}%` }"
                  ></div>
                </div>
              </div>
              <span class="ml-4 text-sm font-semibold text-gray-900">{{ type.count }}</span>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="Performance Metrics">
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p class="text-sm text-gray-600">Avg Consultation Duration</p>
                <p class="text-xl font-bold text-gray-900">{{ stats.avgConsultationDuration }} mins</p>
              </div>
              <ClockIcon class="h-8 w-8 text-gray-400" />
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p class="text-sm text-gray-600">Completion Rate</p>
                <p class="text-xl font-bold text-gray-900">{{ stats.completionRate }}%</p>
              </div>
              <CheckCircleIcon class="h-8 w-8 text-green-500" />
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p class="text-sm text-gray-600">Prescriptions Issued</p>
                <p class="text-xl font-bold text-gray-900">{{ stats.totalPrescriptions }}</p>
              </div>
              <DocumentTextIcon class="h-8 w-8 text-blue-500" />
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p class="text-sm text-gray-600">Patient Satisfaction</p>
                <p class="text-xl font-bold text-gray-900">{{ stats.patientSatisfaction }}%</p>
              </div>
              <FaceSmileIcon class="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDoctorStore } from '@/stores/doctor';
import { BaseCard, LoadingSpinner } from '@/components';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue';
import {
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline';
import { FaceSmileIcon } from '@heroicons/vue/24/solid';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const doctorStore = useDoctorStore();
const { error: showError } = useToast();
const loading = ref(true);
const consultationsChart = ref(null);
const revenueChart = ref(null);

const stats = ref({
  totalConsultations: 0,
  consultationsGrowth: 0,
  totalPatients: 0,
  patientsGrowth: 0,
  totalRevenue: 0,
  revenueGrowth: 0,
  averageRating: 0,
  totalReviews: 0,
  consultationTypes: [],
  avgConsultationDuration: 0,
  completionRate: 0,
  totalPrescriptions: 0,
  patientSatisfaction: 0
});

onMounted(async () => {
  await loadStatistics();
  initCharts();
  loading.value = false;
});

const loadStatistics = async () => {
  try {
    const data = await doctorStore.getStatistics();
    stats.value = {
      totalConsultations: data.totalConsultations || 0,
      consultationsGrowth: data.consultationsGrowth || 0,
      totalPatients: data.totalPatients || 0,
      patientsGrowth: data.patientsGrowth || 0,
      totalRevenue: data.totalRevenue || 0,
      revenueGrowth: data.revenueGrowth || 0,
      averageRating: data.averageRating || 0,
      totalReviews: data.totalReviews || 0,
      consultationTypes: data.consultationTypes || [],
      avgConsultationDuration: data.avgConsultationDuration || 0,
      completionRate: data.completionRate || 0,
      totalPrescriptions: data.totalPrescriptions || 0,
      patientSatisfaction: data.patientSatisfaction || 0
    };
  } catch (error) {
    console.error('Error loading statistics:', error);
    showError('Failed to load statistics');
  }
};

const initCharts = () => {
  // Consultations Chart
  if (consultationsChart.value) {
    new Chart(consultationsChart.value, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Consultations',
          data: [12, 19, 15, 25, 22, 30, 28, 35, 32, 38, 40, 45],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  // Revenue Chart
  if (revenueChart.value) {
    new Chart(revenueChart.value, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Revenue',
          data: [45000, 52000, 48000, 65000, 59000, 72000, 68000, 78000, 75000, 85000, 88000, 95000],
          backgroundColor: 'rgb(234, 179, 8)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-NG').format(amount);
};
</script>
