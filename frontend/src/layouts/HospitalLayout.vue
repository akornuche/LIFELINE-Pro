<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-sm">
      <div class="h-full flex flex-col">
        <!-- Logo -->
        <div class="px-6 py-5 border-b">
          <RouterLink to="/" class="block mb-1">
            <img src="/logo-bg.svg" alt="LifeLine" class="h-8 w-auto" />
          </RouterLink>
          <p class="text-xs text-gray-500 mt-1">Hospital Portal</p>
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
              <img
                v-if="authStore.profilePictureUrl"
                :src="authStore.profilePictureUrl"
                class="h-10 w-10 rounded-full object-cover"
                alt="Hospital logo"
              />
              <div v-else class="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <span class="text-red-600 font-semibold">
                  {{ userInitials }}
                </span>
              </div>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ authStore.userName }}</p>
              <p class="text-xs text-gray-500">Hospital</p>
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
      <div class="min-h-full flex flex-col">
        <!-- Top nav bar -->
        <header class="sticky top-0 bg-white shadow-sm h-16 flex items-center justify-between px-6 z-20 border-b border-neutral-100 flex-shrink-0">
          <nav class="flex items-center gap-6 text-sm font-medium text-neutral-500">
            <RouterLink to="/" class="hover:text-primary-500 transition-colors">Home</RouterLink>
            <RouterLink to="/services" class="hover:text-primary-500 transition-colors" active-class="!text-primary-500">Services</RouterLink>
            <RouterLink to="/about" class="hover:text-primary-500 transition-colors" active-class="!text-primary-500">About</RouterLink>
            <RouterLink to="/pricing" class="hover:text-primary-500 transition-colors" active-class="!text-primary-500">Plans</RouterLink>
            <RouterLink to="/contact" class="hover:text-primary-500 transition-colors" active-class="!text-primary-500">Contact</RouterLink>
          </nav>
          <!-- Profile dropdown -->
          <Menu as="div" class="relative">
            <MenuButton class="flex items-center hover:opacity-80 transition-opacity focus:outline-none">
              <div class="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center mr-2 shadow-sm overflow-hidden">
                <img v-if="authStore.profilePictureUrl" :src="authStore.profilePictureUrl" class="h-full w-full object-cover" alt="logo" />
                <span v-else class="text-red-600 font-semibold text-sm">{{ userInitials }}</span>
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
                  <RouterLink to="/hospital/profile" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 w-full text-left']">Profile</RouterLink>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <RouterLink to="/hospital/settings" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 w-full text-left']">Settings</RouterLink>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button @click="handleLogout" :class="[active ? 'bg-gray-100 text-red-600' : 'text-red-500', 'block w-full text-left px-4 py-2 text-sm']">Logout</button>
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>
        </header>
        <EmailVerificationBanner />
        <div class="flex-1"><RouterView /></div>
        <SiteFooter />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import SiteFooter from '@/components/SiteFooter.vue';
import EmailVerificationBanner from '@/components/EmailVerificationBanner.vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useHospitalStore } from '@/stores/hospital';
import {
  HomeIcon,
  UserIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CogIcon,
  QueueListIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';

const router = useRouter();
const authStore = useAuthStore();
const hospitalStore = useHospitalStore();

// Ensure hospital name and logo are synced into authStore on every page load
onMounted(async () => {
  if (!authStore.userName || !authStore.profilePictureUrl) {
    try { await hospitalStore.getProfile(); } catch { /* non-fatal */ }
  }
});

const navigation = [
  { name: 'Dashboard', to: '/hospital', icon: HomeIcon },
  { name: 'Profile', to: '/hospital/profile', icon: UserIcon },
  { name: 'Surgeries', to: '/hospital/surgeries', icon: BeakerIcon },
  { name: 'Bed Management', to: '/hospital/beds', icon: ClipboardDocumentListIcon },
  { name: 'Statistics', to: '/hospital/statistics', icon: ChartBarIcon },
  { name: 'Payments', to: '/hospital/payments', icon: CurrencyDollarIcon },
  { name: 'Assignments', to: '/hospital/assignments', icon: QueueListIcon },
  { name: 'Settings', to: '/hospital/settings', icon: CogIcon }
];

const userInitials = computed(() => {
  const user = authStore.user;
  if (!user) return 'H';
  // Hospitals have hospital_name or full_name, not first/last name
  const name = user.first_name
    ? `${user.first_name} ${user.last_name || ''}`
    : (user.full_name || user.hospital_name || '');
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'H';
});

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

