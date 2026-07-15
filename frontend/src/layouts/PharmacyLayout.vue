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
            <p class="text-xs text-gray-500 mt-1">Pharmacy Portal</p>
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
              <img
                v-if="authStore.profilePictureUrl"
                :src="authStore.profilePictureUrl"
                class="h-10 w-10 rounded-full object-cover"
                alt="Pharmacy logo"
              />
              <div v-else class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <span class="text-green-600 font-semibold">{{ userInitials }}</span>
              </div>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ authStore.userName }}</p>
              <p class="text-xs text-gray-500">Pharmacy</p>
            </div>
          </div>
          <button @click="handleLogout" class="w-full mt-2 btn btn-secondary btn-sm">Logout</button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="lg:ml-64 flex flex-col min-h-screen">
      <header class="sticky top-0 bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 z-20 border-b border-neutral-100 flex-shrink-0">
        <button
          @click="sidebarOpen = true"
          class="lg:hidden p-2 -ml-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Bars3Icon class="h-6 w-6" />
        </button>

        <nav class="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-500">
          <RouterLink to="/" class="hover:text-primary-500 transition-colors">Home</RouterLink>
          <RouterLink to="/services" class="hover:text-primary-500 transition-colors" active-class="!text-primary-500">Services</RouterLink>
          <RouterLink to="/about" class="hover:text-primary-500 transition-colors" active-class="!text-primary-500">About</RouterLink>
          <RouterLink to="/pricing" class="hover:text-primary-500 transition-colors" active-class="!text-primary-500">Plans</RouterLink>
          <RouterLink to="/contact" class="hover:text-primary-500 transition-colors" active-class="!text-primary-500">Contact</RouterLink>
        </nav>

        <Menu as="div" class="relative">
          <MenuButton class="flex items-center hover:opacity-80 transition-opacity focus:outline-none">
            <div class="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-2 shadow-sm overflow-hidden">
              <img v-if="authStore.profilePictureUrl" :src="authStore.profilePictureUrl" class="h-full w-full object-cover" />
              <span v-else class="text-green-600 font-semibold text-sm">{{ userInitials }}</span>
            </div>
            <span class="hidden sm:inline text-sm font-medium text-gray-700 mr-1">{{ authStore.userName }}</span>
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
                <RouterLink to="/pharmacy/profile" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 w-full text-left']">Profile Settings</RouterLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <RouterLink to="/pharmacy/settings" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 w-full text-left']">Settings</RouterLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button @click="handleLogout" :class="[active ? 'bg-gray-100 text-red-600' : 'text-red-500', 'block w-full text-left px-4 py-2 text-sm']">Logout</button>
              </MenuItem>
            </MenuItems>
          </transition>
        </Menu>
      </header>

      <main class="flex-1">
        <EmailVerificationBanner />
        <RouterView />
      </main>
      <SiteFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SiteFooter from '@/components/SiteFooter.vue';
import EmailVerificationBanner from '@/components/EmailVerificationBanner.vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CogIcon,
  QueueListIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/vue/24/outline';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';

const router = useRouter();
const authStore = useAuthStore();
const sidebarOpen = ref(false);

const navigation = [
  { name: 'Dashboard', to: '/pharmacy', icon: HomeIcon },
  { name: 'Profile', to: '/pharmacy/profile', icon: UserIcon },
  { name: 'Prescriptions', to: '/pharmacy/prescriptions', icon: ClipboardDocumentCheckIcon },
  { name: 'Statistics', to: '/pharmacy/statistics', icon: ChartBarIcon },
  { name: 'Payments', to: '/pharmacy/payments', icon: CurrencyDollarIcon },
  { name: 'Assignments', to: '/pharmacy/assignments', icon: QueueListIcon },
  { name: 'Settings', to: '/pharmacy/settings', icon: CogIcon }
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
