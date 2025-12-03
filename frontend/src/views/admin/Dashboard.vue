<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Admin Dashboard</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><div class="stat-card"><UserGroupIcon class="h-8 w-8 text-blue-600 mb-2" /><p class="text-2xl font-bold text-gray-900">{{ stats.totalUsers }}</p><p class="text-sm text-gray-500">Total Users</p><p class="text-xs text-green-600">+{{ stats.userGrowth }}%</p></div><div class="stat-card"><UserIcon class="h-8 w-8 text-purple-600 mb-2" /><p class="text-2xl font-bold text-gray-900">{{ stats.totalPatients }}</p><p class="text-sm text-gray-500">Active Patients</p></div><div class="stat-card"><BuildingOffice2Icon class="h-8 w-8 text-orange-600 mb-2" /><p class="text-2xl font-bold text-gray-900">{{ stats.totalProviders }}</p><p class="text-sm text-gray-500">Healthcare Providers</p></div><div class="stat-card"><CurrencyDollarIcon class="h-8 w-8 text-green-600 mb-2" /><p class="text-2xl font-bold text-gray-900">₦{{ formatMoney(stats.totalRevenue) }}</p><p class="text-sm text-gray-500">Total Revenue</p><p class="text-xs text-green-600">+{{ stats.revenueGrowth }}%</p></div></div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8"><div class="lg:col-span-2"><BaseCard title="Recent Activities"><div class="space-y-3"><div v-for="activity in recentActivities" :key="activity.id" class="flex items-start gap-3 pb-3 border-b last:border-0"><div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><component :is="getActivityIcon(activity.type)" class="h-5 w-5 text-blue-600" /></div><div class="flex-1"><p class="text-sm font-medium text-gray-900">{{ activity.title }}</p><p class="text-xs text-gray-500">{{ activity.description }}</p><p class="text-xs text-gray-400 mt-1">{{ formatDate(activity.date) }}</p></div></div></div></BaseCard></div><div class="space-y-6"><BaseCard title="Pending Verifications"><div class="text-center py-4"><p class="text-3xl font-bold text-orange-600">{{ stats.pendingVerifications }}</p><p class="text-sm text-gray-500 mt-1">Awaiting Review</p><BaseButton variant="outline" size="sm" class="mt-3" @click="$router.push('/admin/verifications')">Review Now</BaseButton></div></BaseCard><BaseCard title="Quick Actions"><div class="space-y-2"><BaseButton variant="outline" fullWidth @click="$router.push('/admin/users')">Manage Users</BaseButton><BaseButton variant="outline" fullWidth @click="$router.push('/admin/verifications')">Verifications</BaseButton><BaseButton variant="outline" fullWidth @click="$router.push('/admin/payments')">View Payments</BaseButton><BaseButton variant="outline" fullWidth @click="$router.push('/admin/analytics')">Analytics</BaseButton></div></BaseCard></div></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from '@/stores/admin';
import { BaseCard, BaseButton } from '@/components';
import { UserGroupIcon, UserIcon, BuildingOffice2Icon, CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const adminStore = useAdminStore();
const stats = ref({ totalUsers: 1247, totalPatients: 856, totalProviders: 124, totalRevenue: 5420000, userGrowth: 12, revenueGrowth: 18, pendingVerifications: 8 });
const recentActivities = ref([
  { id: 1, type: 'user', title: 'New User Registration', description: 'John Doe registered as a patient', date: new Date() },
  { id: 2, type: 'verification', title: 'Doctor Verified', description: 'Dr. Sarah Johnson verified successfully', date: new Date() },
  { id: 3, type: 'payment', title: 'Payment Received', description: 'Payment of ₦15,000 received', date: new Date() },
]);

onMounted(async () => {
  const data = await adminStore.getStatistics();
  if (data) stats.value = { ...stats.value, ...data };
});

const formatMoney = (amount) => new Intl.NumberFormat('en-NG').format(amount);
const formatDate = (date) => format(date, 'MMM d, h:mm a');
const getActivityIcon = (type) => ({ user: UserIcon, verification: CheckCircleIcon, payment: CurrencyDollarIcon }[type] || DocumentTextIcon);
</script>
