<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-sm">
      <div class="h-full flex flex-col">
        <!-- Logo -->
        <div class="px-6 py-6 border-b">
          <h1 class="text-2xl font-bold text-primary-600">LifeLine Pro</h1>
          <p class="text-sm text-gray-600 mt-1">Patient Portal</p>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <RouterLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            class="flex items-center px-4 py-3 rounded-lg transition-colors"
            :class="[
              isLocked(item) ? 'opacity-40 cursor-not-allowed filter grayscale pointer-events-none' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
            ]"
            active-class="bg-primary-50 text-primary-600 font-medium"
          >
            <div class="relative flex items-center">
              <component :is="item.icon" class="h-5 w-5 mr-3" />
              <div v-if="isLocked(item)" class="absolute -top-1 right-1">
                <LockClosedIcon class="h-3 w-3 text-red-600 bg-white rounded-full p-0.5 shadow-sm" />
              </div>
            </div>
            {{ item.name }}
          </RouterLink>
        </nav>

        <!-- User Menu (bottom of sidebar) -->
        <div class="px-4 py-4 border-t">
          <div class="flex items-center px-4 py-3">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                <img v-if="authStore.user?.profile_picture || authStore.user?.profile_image_url" :src="authStore.user.profile_picture || authStore.user.profile_image_url" class="h-full w-full object-cover" />
                <span v-else class="text-primary-600 font-semibold">{{ userInitials }}</span>
              </div>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ authStore.user?.first_name }}</p>
              <p class="text-xs text-gray-500">Patient</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="w-full mt-2 btn btn-secondary btn-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content wrapper -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Header -->
      <header class="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10 flex-shrink-0">
        <div class="flex-1"></div>
        <!-- Profile Dropdown -->
        <Menu as="div" class="relative">
          <MenuButton class="flex items-center hover:opacity-80 transition-opacity focus:outline-none">
            <div class="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center mr-2 shadow-sm overflow-hidden">
              <img v-if="authStore.user?.profile_picture || authStore.user?.profile_image_url" :src="authStore.user.profile_picture || authStore.user.profile_image_url" class="h-full w-full object-cover" />
              <span v-else class="text-primary-600 font-semibold text-sm">{{ userInitials }}</span>
            </div>
            <span class="text-sm font-medium text-gray-700 mr-1">{{ authStore.userName }}</span>
            <ChevronDownIcon class="h-4 w-4 text-gray-500" />
          </MenuButton>
          
          <transition 
            enter-active-class="transition ease-out duration-100" 
            enter-from-class="transform opacity-0 scale-95" 
            enter-to-class="transform opacity-100 scale-100" 
            leave-active-class="transition ease-in duration-75" 
            leave-from-class="transform opacity-100 scale-100" 
            leave-to-class="transform opacity-0 scale-95"
          >
            <MenuItems class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <MenuItem v-slot="{ active }">
                <RouterLink to="/patient/profile" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 w-full text-left']">Profile Settings</RouterLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <RouterLink to="/patient/settings" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 w-full text-left']">Dashboard Settings</RouterLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button @click="handleLogout" :class="[active ? 'bg-gray-100 text-red-600' : 'text-red-500', 'block w-full text-left px-4 py-2 text-sm']">Logout</button>
              </MenuItem>
            </MenuItems>
          </transition>
        </Menu>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usePatientStore } from '@/stores/patient';
import {
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  UsersIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  CogIcon,
  LockClosedIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';

const router = useRouter();
const authStore = useAuthStore();
const patientStore = usePatientStore();

const navigation = [
  { name: 'Dashboard', to: '/patient', icon: HomeIcon, always: false },
  { name: 'Profile', to: '/patient/profile', icon: UserIcon, always: true },
  { name: 'Subscription', to: '/patient/subscription', icon: CreditCardIcon, always: true },
  { name: 'Dependents', to: '/patient/dependents', icon: UsersIcon, always: false },
  { name: 'Medical History', to: '/patient/medical-history', icon: DocumentTextIcon, always: false },
  { name: 'Find Doctor', to: '/patient/find-doctor', icon: MagnifyingGlassIcon, always: false },
  { name: 'Find Pharmacy', to: '/patient/find-pharmacy', icon: MagnifyingGlassIcon, always: false },
  { name: 'Find Hospital', to: '/patient/find-hospital', icon: MagnifyingGlassIcon, always: false },
  { name: 'Payments', to: '/patient/payments', icon: CurrencyDollarIcon, always: false },
  { name: 'Settings', to: '/patient/settings', icon: CogIcon, always: true }
];

const isLocked = (item) => {
  if (item.always) return false;
  return !patientStore.hasActiveSubscription;
};

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
