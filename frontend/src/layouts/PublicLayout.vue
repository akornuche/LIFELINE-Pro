<template>
  <div class="flex flex-col min-h-screen bg-white font-sans">

    <!-- ═══════════════════════════════════════════════════════
         STICKY NAVBAR
    ═══════════════════════════════════════════════════════ -->
    <nav class="bg-white sticky top-0 z-50 border-b border-neutral-100 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">

        <!-- Logo -->
        <RouterLink to="/" class="flex items-center shrink-0">
          <img src="/logo-bg.svg" alt="LifeLine" class="h-8 w-auto" />
        </RouterLink>

        <!-- Desktop Nav Links -->
        <ul class="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-500">
          <li>
            <RouterLink
              to="/"
              class="transition-colors hover:text-primary-500"
              :class="route.name === 'landing' ? 'text-primary-500 font-semibold' : ''"
            >Home</RouterLink>
          </li>
          <li>
            <RouterLink to="/services" class="transition-colors hover:text-primary-500" active-class="!text-primary-500 font-semibold">
              Our Services
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/about" class="transition-colors hover:text-primary-500" active-class="!text-primary-500 font-semibold">
              About
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/pricing" class="transition-colors hover:text-primary-500" active-class="!text-primary-500 font-semibold">
              Plans
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/contact" class="transition-colors hover:text-primary-500" active-class="!text-primary-500 font-semibold">
              Contact
            </RouterLink>
          </li>
        </ul>

        <!-- Auth / Dashboard Buttons -->
        <div class="hidden md:flex items-center gap-4">
          <template v-if="!authStore.isAuthenticated">
            <RouterLink
              to="/login"
              class="text-sm font-medium text-neutral-600 hover:text-primary-500 transition-colors"
            >Log In</RouterLink>
            <RouterLink
              to="/register"
              class="inline-flex items-center px-5 py-2 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
            >Register</RouterLink>
          </template>
          <template v-else>
            <span class="text-sm text-neutral-500 hidden lg:inline">Hi, {{ authStore.userName.split(' ')[0] }}</span>
            <RouterLink
              :to="dashboardRoute"
              class="inline-flex items-center px-5 py-2 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
            >Dashboard</RouterLink>
          </template>
        </div>

        <!-- Mobile Hamburger -->
        <button
          @click="mobileOpen = !mobileOpen"
          class="md:hidden p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mobile Menu Dropdown -->
      <div v-show="mobileOpen" class="md:hidden bg-white border-t border-neutral-100 px-6 pb-5 pt-3 space-y-3">
        <RouterLink to="/" @click="mobileOpen=false" class="block text-sm font-medium text-neutral-700 hover:text-primary-500" :class="route.name === 'landing' ? '!text-primary-500' : ''">Home</RouterLink>
        <RouterLink to="/services" @click="mobileOpen=false" class="block text-sm font-medium text-neutral-700 hover:text-primary-500" active-class="!text-primary-500">Our Services</RouterLink>
        <RouterLink to="/about" @click="mobileOpen=false" class="block text-sm font-medium text-neutral-700 hover:text-primary-500" active-class="!text-primary-500">About</RouterLink>
        <RouterLink to="/pricing" @click="mobileOpen=false" class="block text-sm font-medium text-neutral-700 hover:text-primary-500" active-class="!text-primary-500">Plans</RouterLink>
        <RouterLink to="/contact" @click="mobileOpen=false" class="block text-sm font-medium text-neutral-700 hover:text-primary-500" active-class="!text-primary-500">Contact</RouterLink>
        <hr class="border-neutral-100" />
        <template v-if="!authStore.isAuthenticated">
          <RouterLink to="/login" @click="mobileOpen=false" class="block text-sm font-medium text-neutral-700">Log In</RouterLink>
          <RouterLink to="/register" @click="mobileOpen=false" class="block w-full text-center px-5 py-2 text-sm font-semibold bg-primary-500 text-white rounded-md">Register</RouterLink>
        </template>
        <template v-else>
          <RouterLink :to="dashboardRoute" @click="mobileOpen=false" class="block w-full text-center px-5 py-2 text-sm font-semibold bg-primary-500 text-white rounded-md">Dashboard</RouterLink>
        </template>
      </div>
    </nav>

    <!-- Page Content -->
    <main class="flex-1">
      <RouterView />
    </main>

    <!-- Footer -->
    <SiteFooter />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SiteFooter from '@/components/SiteFooter.vue'

const route = useRoute()
const authStore = useAuthStore()
const mobileOpen = ref(false)

const dashboardRoute = computed(() => {
  const routes = {
    patient: '/patient',
    doctor: '/doctor',
    pharmacy: '/pharmacy',
    hospital: '/hospital',
    admin: '/admin',
  }
  return routes[authStore.user?.role] || '/patient'
})
</script>
