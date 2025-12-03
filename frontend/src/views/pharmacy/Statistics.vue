<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Statistics & Analytics</h1>
    <LoadingSpinner v-if="loading" />
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <BaseCard><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Total Prescriptions</p><p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalPrescriptions }}</p><p class="text-xs text-green-600 mt-1">+{{ stats.prescriptionsGrowth }}%</p></div><div class="p-3 bg-green-100 rounded-lg"><DocumentTextIcon class="h-8 w-8 text-green-600" /></div></div></BaseCard>
        <BaseCard><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Dispensed</p><p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.dispensedPrescriptions }}</p><p class="text-xs text-green-600 mt-1">+{{ stats.dispensedGrowth }}%</p></div><div class="p-3 bg-blue-100 rounded-lg"><CheckCircleIcon class="h-8 w-8 text-blue-600" /></div></div></BaseCard>
        <BaseCard><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Total Revenue</p><p class="text-3xl font-bold text-gray-900 mt-2">₦{{ formatMoney(stats.totalRevenue) }}</p><p class="text-xs text-green-600 mt-1">+{{ stats.revenueGrowth }}%</p></div><div class="p-3 bg-yellow-100 rounded-lg"><CurrencyDollarIcon class="h-8 w-8 text-yellow-600" /></div></div></BaseCard>
        <BaseCard><div class="flex items-center justify-between"><div><p class="text-sm font-medium text-gray-500">Avg Rating</p><p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.averageRating }}<span class="text-xl">/5</span></p><p class="text-xs text-gray-600 mt-1">{{ stats.totalReviews }} reviews</p></div><div class="p-3 bg-purple-100 rounded-lg"><StarIcon class="h-8 w-8 text-purple-600" /></div></div></BaseCard>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BaseCard title="Monthly Prescriptions"><div class="h-80"><canvas ref="prescriptionsChart"></canvas></div></BaseCard>
        <BaseCard title="Revenue Trend"><div class="h-80"><canvas ref="revenueChart"></canvas></div></BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePharmacyStore } from '@/stores/pharmacy';
import { BaseCard, LoadingSpinner } from '@/components';
import { DocumentTextIcon, CheckCircleIcon, CurrencyDollarIcon, StarIcon } from '@heroicons/vue/24/outline';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const pharmacyStore = usePharmacyStore();
const loading = ref(true);
const prescriptionsChart = ref(null);
const revenueChart = ref(null);
const stats = ref({ totalPrescriptions: 0, prescriptionsGrowth: 0, dispensedPrescriptions: 0, dispensedGrowth: 0, totalRevenue: 0, revenueGrowth: 0, averageRating: 0, totalReviews: 0 });

onMounted(async () => {
  const data = await pharmacyStore.getStatistics();
  stats.value = { ...stats.value, ...data };
  initCharts();
  loading.value = false;
});

const initCharts = () => {
  if (prescriptionsChart.value) {
    new Chart(prescriptionsChart.value, { type: 'line', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], datasets: [{ label: 'Prescriptions', data: [45, 52, 48, 65, 59, 72, 68, 78, 75, 85, 88, 95], borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
  }
  if (revenueChart.value) {
    new Chart(revenueChart.value, { type: 'bar', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], datasets: [{ label: 'Revenue', data: [120000, 145000, 135000, 180000, 165000, 195000, 185000, 210000, 205000, 230000, 240000, 260000], backgroundColor: 'rgb(234, 179, 8)' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
  }
};

const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
</script>
