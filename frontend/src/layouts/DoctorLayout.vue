<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-sm">
      <div class="h-full flex flex-col">
        <!-- Logo -->
        <div class="px-6 py-6 border-b">
          <h1 class="text-2xl font-bold text-primary-600">LifeLine Pro</h1>
          <p class="text-sm text-gray-600 mt-1">Doctor Portal</p>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <RouterLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
            active-class="bg-primary-50 text-primary-600 font-medium"
          >
            <component :is="item.icon" class="h-5 w-5 mr-3" />
            {{ item.name }}
          </RouterLink>
        </nav>

        <!-- User Menu -->
        <div class="px-4 py-4 border-t">
          <div class="flex items-center px-4 py-3">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span class="text-blue-600 font-semibold">
                  {{ userInitials }}
                </span>
              </div>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ authStore.userName }}</p>
              <p class="text-xs text-gray-500">Doctor</p>
            </div>
          </div>
          <button @click="handleLogout" class="w-full mt-2 btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CogIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();

const navigation = [
  { name: 'Dashboard', to: '/doctor', icon: HomeIcon },
  { name: 'Profile', to: '/doctor/profile', icon: UserIcon },
  { name: 'Consultations', to: '/doctor/consultations', icon: ClipboardDocumentListIcon },
  { name: 'Prescriptions', to: '/doctor/prescriptions', icon: DocumentTextIcon },
  { name: 'Statistics', to: '/doctor/statistics', icon: ChartBarIcon },
  { name: 'Payments', to: '/doctor/payments', icon: CurrencyDollarIcon },
  { name: 'Settings', to: '/doctor/settings', icon: CogIcon }
];

const userInitials = computed(() => {
  const user = authStore.user;
  if (!user) return '';
  return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
});

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>
