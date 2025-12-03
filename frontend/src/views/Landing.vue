<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
    <!-- Hero Section -->
    <nav class="container mx-auto px-6 py-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold">LifeLine Pro</h1>
      <div class="space-x-4">
        <RouterLink to="/login" class="btn bg-white text-primary-600 hover:bg-gray-100">
          Sign In
        </RouterLink>
        <RouterLink to="/register" class="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600">
          Sign Up
        </RouterLink>
      </div>
    </nav>

    <div class="container mx-auto px-6 py-20 text-center">
      <h2 class="text-5xl md:text-6xl font-bold mb-6">
        Your Health, Our Priority
      </h2>
      <p class="text-xl md:text-2xl mb-8 text-primary-100">
        Comprehensive HMO & Health Insurance Platform
      </p>
      <RouterLink to="/register" class="btn btn-lg bg-white text-primary-600 hover:bg-gray-100">
        Get Started Today
      </RouterLink>
    </div>

    <!-- Features Section -->
    <div class="bg-white text-gray-900 py-20">
      <div class="container mx-auto px-6">
        <h3 class="text-3xl font-bold text-center mb-12">Why Choose LifeLine Pro?</h3>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 class="text-xl font-semibold mb-2">Comprehensive Coverage</h4>
            <p class="text-gray-600">Access to quality healthcare across all providers</p>
          </div>
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 class="text-xl font-semibold mb-2">Affordable Plans</h4>
            <p class="text-gray-600">Flexible packages starting from ₦3,500/month</p>
          </div>
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 class="text-xl font-semibold mb-2">Fast & Easy</h4>
            <p class="text-gray-600">Quick registration and instant access to services</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
