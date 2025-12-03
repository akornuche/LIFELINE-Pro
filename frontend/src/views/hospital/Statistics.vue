<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Statistics</h1>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"><div class="stat-card"><p class="text-3xl font-bold text-gray-900">{{ stats.totalSurgeries }}</p><p class="text-sm text-gray-500">Total Surgeries</p><p class="text-xs text-green-600">+{{ stats.surgeryGrowth }}%</p></div><div class="stat-card"><p class="text-3xl font-bold text-gray-900">{{ stats.totalPatients }}</p><p class="text-sm text-gray-500">Active Patients</p><p class="text-xs text-green-600">+{{ stats.patientGrowth }}%</p></div><div class="stat-card"><p class="text-3xl font-bold text-gray-900">₦{{ formatMoney(stats.totalRevenue) }}</p><p class="text-sm text-gray-500">Total Revenue</p><p class="text-xs text-green-600">+{{ stats.revenueGrowth }}%</p></div><div class="stat-card"><p class="text-3xl font-bold text-gray-900">{{ stats.bedOccupancy }}%</p><p class="text-sm text-gray-500">Bed Occupancy</p></div></div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8"><BaseCard title="Monthly Surgeries"><canvas ref="surgeriesChart"></canvas></BaseCard><BaseCard title="Revenue Trend"><canvas ref="revenueChart"></canvas></BaseCard></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Chart } from 'chart.js/auto';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard } from '@/components';

const hospitalStore = useHospitalStore();
const stats = ref({ totalSurgeries: 0, totalPatients: 0, totalRevenue: 0, bedOccupancy: 0, surgeryGrowth: 0, patientGrowth: 0, revenueGrowth: 0 });
const surgeriesChart = ref(null);
const revenueChart = ref(null);

onMounted(async () => {
  const data = await hospitalStore.getStatistics();
  stats.value = data || stats.value;
  createSurgeriesChart();
  createRevenueChart();
});

const createSurgeriesChart = () => {
  new Chart(surgeriesChart.value, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{ label: 'Surgeries', data: [12, 19, 15, 25, 22, 30], borderColor: 'rgb(239, 68, 68)', tension: 0.1 }]
    },
    options: { responsive: true, maintainAspectRatio: true }
  });
};

const createRevenueChart = () => {
  new Chart(revenueChart.value, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{ label: 'Revenue (₦)', data: [850000, 1200000, 950000, 1500000, 1300000, 1800000], backgroundColor: 'rgb(59, 130, 246)' }]
    },
    options: { responsive: true, maintainAspectRatio: true }
  });
};

const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
</script>
