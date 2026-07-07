<template>
  <footer class="bg-primary-900 text-white mt-auto">
    <div class="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <!-- Brand -->
        <div class="col-span-2 md:col-span-1">
          <RouterLink to="/" class="flex items-center mb-4">
            <img src="/logo-white.svg" alt="LifeLine" class="h-8 w-auto" />
          </RouterLink>
          <p class="text-sm text-primary-200 leading-relaxed">
            NHIA-compliant HMO & health insurance platform. Your health, our priority.
          </p>
        </div>
        <!-- Patients -->
        <div>
          <h4 class="text-xs font-semibold text-white mb-4 uppercase tracking-wide">Patients</h4>
          <ul class="space-y-2 text-sm text-primary-300">
            <li><RouterLink to="/register" class="hover:text-white transition-colors">Register</RouterLink></li>
            <li><RouterLink to="/login" class="hover:text-white transition-colors">Log In</RouterLink></li>
            <li><RouterLink to="/#plans" class="hover:text-white transition-colors">Our Plans</RouterLink></li>
            <li><RouterLink to="/#services" class="hover:text-white transition-colors">Services</RouterLink></li>
          </ul>
        </div>
        <!-- Professionals -->
        <div>
          <h4 class="text-xs font-semibold text-white mb-4 uppercase tracking-wide">Professionals</h4>
          <ul class="space-y-2 text-sm text-primary-300">
            <li><RouterLink to="/register" class="hover:text-white transition-colors">Provider Registration</RouterLink></li>
            <li><RouterLink to="/login" class="hover:text-white transition-colors">Provider Login</RouterLink></li>
          </ul>
        </div>
        <!-- Legal -->
        <div>
          <h4 class="text-xs font-semibold text-white mb-4 uppercase tracking-wide">Legal</h4>
          <ul class="space-y-2 text-sm text-primary-300">
            <li><RouterLink to="/privacy-policy" class="hover:text-white transition-colors">Privacy Policy</RouterLink></li>
            <li><RouterLink to="/terms-of-service" class="hover:text-white transition-colors">Terms of Service</RouterLink></li>
            <li><a href="mailto:complaints@lifeline.com" class="hover:text-white transition-colors">Contact Us</a></li>
          </ul>
        </div>
      </div>

      <div class="border-t border-primary-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-xs text-primary-400 text-center md:text-left">
          © {{ new Date().getFullYear() }} LifeLine. All rights reserved. NHIA Regulated. NDPA 2023 Compliant.
        </p>
        <div class="flex items-center gap-4">
          <a href="#" aria-label="Twitter/X" class="w-9 h-9 bg-primary-700 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="#" aria-label="LinkedIn" class="w-9 h-9 bg-primary-700 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>
