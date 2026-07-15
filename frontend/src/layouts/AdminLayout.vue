<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile sidebar backdrop -->
    <transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        @click="sidebarOpen = false"
      />
    </transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-0 left-0 h-screen w-64 bg-white shadow-sm z-50 flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <div class="h-full flex flex-col">
        <div class="px-6 py-5 border-b flex items-center justify-between">
          <div>
            <RouterLink to="/" class="block mb-1">
              <img src="/logo-bg.svg" alt="LifeLine" class="h-8 w-auto" />
            </RouterLink>
            <p class="text-xs text-gray-500 mt-1">Admin Portal</p>
          </div>
          <button
            @click="sidebarOpen = false"
            class="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <RouterLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            @click="sidebarOpen = false"
            class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
            active-class="bg-primary-50 text-primary-600 font-medium"
          >
            <component :is="item.icon" class="h-5 w-5 mr-3" />
            {{ item.name }}
          </RouterLink>
        </nav>

        <div class="px-4 py-4 border-t">
          <div class="flex items-center px-4 py-3">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span class="text-purple-600 font-semibold">{{ userInitials }}</span>
              </div>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ authStore.userName }}</p>
              <p class="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button @click="handleLogout" class="w-full mt-2 btn btn-secondary btn-sm">Logout</button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="lg:ml-64 flex flex-col min-h-screen">
      <header class="sticky top-0 bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 z-20 flex-shrink-0">
        <button
          @click="sidebarOpen = true"
          class="lg:hidden p-2 -ml-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Bars3Icon class="h-6 w-6" />
        </button>
        <span class="hidden lg:block text-sm font-medium text-gray-700">Admin Dashboard</span>
        <div class="flex items-center gap-3">
          <span class="hidden sm:inline text-sm text-gray-500">{{ authStore.userName }}</span>
          <div class="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center shadow-sm">
            <span class="text-purple-600 font-semibold text-sm">{{ userInitials }}</span>
          </div>
        </div>
      </header>

      <main class="flex-1">
        <RouterView />
      </main>
      <SiteFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SiteFooter from '@/components/SiteFooter.vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  HomeIcon,
  UsersIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const authStore = useAuthStore();
const sidebarOpen = ref(false);

const navigation = [
  { name: 'Dashboard', to: '/admin', icon: HomeIcon },
  { name: 'Users', to: '/admin/users', icon: UsersIcon },
  { name: 'Patients', to: '/admin/patients', icon: UsersIcon },
  { name: 'Doctors', to: '/admin/doctors', icon: UsersIcon },
  { name: 'Pharmacies', to: '/admin/pharmacies', icon: UsersIcon },
  { name: 'Hospitals', to: '/admin/hospitals', icon: UsersIcon },
  { name: 'Verifications', to: '/admin/verifications', icon: ShieldCheckIcon },
  { name: 'Payments', to: '/admin/payments', icon: CurrencyDollarIcon },
  { name: 'Statements', to: '/admin/statements', icon: DocumentTextIcon },
  { name: 'Analytics', to: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Settings', to: '/admin/settings', icon: CogIcon }
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
