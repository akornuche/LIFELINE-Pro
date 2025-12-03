<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Analytics</h1>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"><div class="stat-card"><p class="text-3xl font-bold text-gray-900">{{ stats.totalUsers }}</p><p class="text-sm text-gray-500">Total Users</p><p class="text-xs text-green-600">+{{ stats.userGrowth }}%</p></div><div class="stat-card"><p class="text-3xl font-bold text-gray-900">₦{{ formatMoney(stats.totalRevenue) }}</p><p class="text-sm text-gray-500">Total Revenue</p><p class="text-xs text-green-600">+{{ stats.revenueGrowth }}%</p></div><div class="stat-card"><p class="text-3xl font-bold text-gray-900">{{ stats.activeProviders }}</p><p class="text-sm text-gray-500">Active Providers</p></div><div class="stat-card"><p class="text-3xl font-bold text-gray-900">{{ stats.totalTransactions }}</p><p class="text-sm text-gray-500">Transactions</p></div></div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"><BaseCard title="User Growth"><canvas ref="userGrowthChart"></canvas></BaseCard><BaseCard title="Revenue Trend"><canvas ref="revenueChart"></canvas></BaseCard></div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8"><BaseCard title="Portal Usage"><canvas ref="portalUsageChart"></canvas></BaseCard><BaseCard title="Provider Distribution"><div class="space-y-3"><div><div class="flex justify-between text-sm mb-1"><span>Doctors</span><span class="font-semibold">{{ stats.doctorCount }}</span></div><div class="w-full bg-gray-200 rounded-full h-2"><div class="bg-red-500 h-2 rounded-full" :style="{ width: (stats.doctorCount / stats.totalProviders * 100) + '%' }"></div></div></div><div><div class="flex justify-between text-sm mb-1"><span>Pharmacies</span><span class="font-semibold">{{ stats.pharmacyCount }}</span></div><div class="w-full bg-gray-200 rounded-full h-2"><div class="bg-blue-500 h-2 rounded-full" :style="{ width: (stats.pharmacyCount / stats.totalProviders * 100) + '%' }"></div></div></div><div><div class="flex justify-between text-sm mb-1"><span>Hospitals</span><span class="font-semibold">{{ stats.hospitalCount }}</span></div><div class="w-full bg-gray-200 rounded-full h-2"><div class="bg-green-500 h-2 rounded-full" :style="{ width: (stats.hospitalCount / stats.totalProviders * 100) + '%' }"></div></div></div></div></BaseCard></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Chart } from 'chart.js/auto';
import { useAdminStore } from '@/stores/admin';
import { BaseCard } from '@/components';

const adminStore = useAdminStore();
const stats = ref({ totalUsers: 1247, totalRevenue: 5420000, activeProviders: 124, totalTransactions: 3456, userGrowth: 12, revenueGrowth: 18, totalProviders: 124, doctorCount: 56, pharmacyCount: 38, hospitalCount: 30 });
const userGrowthChart = ref(null);
const revenueChart = ref(null);
const portalUsageChart = ref(null);

onMounted(async () => {
  const data = await adminStore.getStatistics();
  if (data) stats.value = { ...stats.value, ...data };
  createUserGrowthChart();
  createRevenueChart();
  createPortalUsageChart();
});

const createUserGrowthChart = () => {
  new Chart(userGrowthChart.value, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{ label: 'New Users', data: [120, 195, 150, 280, 250, 340], borderColor: 'rgb(59, 130, 246)', tension: 0.1 }]
    },
    options: { responsive: true, maintainAspectRatio: true }
  });
};

const createRevenueChart = () => {
  new Chart(revenueChart.value, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{ label: 'Revenue (₦)', data: [650000, 890000, 750000, 1200000, 980000, 1450000], backgroundColor: 'rgb(34, 197, 94)' }]
    },
    options: { responsive: true, maintainAspectRatio: true }
  });
};

const createPortalUsageChart = () => {
  new Chart(portalUsageChart.value, {
    type: 'doughnut',
    data: {
      labels: ['Patient', 'Doctor', 'Pharmacy', 'Hospital'],
      datasets: [{ data: [856, 56, 38, 30], backgroundColor: ['rgb(147, 51, 234)', 'rgb(239, 68, 68)', 'rgb(59, 130, 246)', 'rgb(34, 197, 94)'] }]
    },
    options: { responsive: true, maintainAspectRatio: true }
  });
};

const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
</script>
