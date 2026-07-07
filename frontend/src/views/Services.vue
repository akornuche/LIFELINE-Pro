<template>
  <div class="bg-white font-sans">

    <!-- ── PAGE HERO ─────────────────────────────────────────── -->
    <section class="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
      <div class="max-w-7xl mx-auto px-6 lg:px-10 text-center">
        <span class="inline-block text-xs font-bold text-primary-500 uppercase tracking-widest mb-4">What We Offer</span>
        <h1 class="text-4xl lg:text-5xl font-black text-neutral-800 mb-5 leading-tight">
          Our Health Services
        </h1>
        <p class="text-neutral-600 text-[16px] max-w-2xl mx-auto leading-relaxed">
          LifeLine connects you to doctors, hospitals, and pharmacies across Nigeria — all under one affordable subscription.
        </p>
      </div>
    </section>

    <!-- ── SERVICES GRID ──────────────────────────────────────── -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-10">
        <div class="grid md:grid-cols-2 gap-10">

          <!-- Find A Doctor -->
          <div class="flex gap-6 items-start p-7 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
            <div class="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Find a Doctor</h3>
              <p class="text-sm text-neutral-500 leading-relaxed mb-4">
                Search by name, specialty, or location and connect with licensed doctors for online or in-person consultations. Get prescriptions, follow-up care, and specialist referrals from any device.
              </p>
              <ul class="space-y-1">
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> General practitioners &amp; specialists</li>
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> Digital prescriptions</li>
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> Available in your city</li>
              </ul>
            </div>
          </div>

          <!-- Find A Hospital -->
          <div class="flex gap-6 items-start p-7 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
            <div class="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Find a Hospital</h3>
              <p class="text-sm text-neutral-500 leading-relaxed mb-4">
                Locate accredited hospitals near you, view their services, and book admissions or procedures with ease. Covered for emergency care, surgeries, lab tests, and imaging under your plan.
              </p>
              <ul class="space-y-1">
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> Surgeries &amp; admissions</li>
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> Lab tests &amp; imaging</li>
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> Emergency services</li>
              </ul>
            </div>
          </div>

          <!-- Find A Pharmacy -->
          <div class="flex gap-6 items-start p-7 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
            <div class="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Find a Pharmacy</h3>
              <p class="text-sm text-neutral-500 leading-relaxed mb-4">
                Order prescription and over-the-counter medications from trusted pharmacies. Manage your prescriptions digitally and access drug dispensing covered by your insurance plan.
              </p>
              <ul class="space-y-1">
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> Prescription drug dispensing</li>
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> 24-hour pharmacies available</li>
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> Covered under Basic+ plans</li>
              </ul>
            </div>
          </div>

          <!-- Health Insurance -->
          <div class="flex gap-6 items-start p-7 rounded-2xl border border-neutral-100 hover:shadow-md transition-shadow">
            <div class="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Health Insurance</h3>
              <p class="text-sm text-neutral-500 leading-relaxed mb-4">
                NHIA-compliant health insurance plans from ₦1,500/month. Choose individual or family coverage, access a broad hospital network, and get peace of mind with predictable monthly premiums.
              </p>
              <ul class="space-y-1">
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> Individual &amp; family plans</li>
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> NHIA-compliant coverage</li>
                <li class="flex items-center gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold">✓</span> Up to 6 dependents</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ── HOW IT WORKS ───────────────────────────────────────── -->
    <section class="py-20 bg-neutral-50">
      <div class="max-w-5xl mx-auto px-6 lg:px-10">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-black text-neutral-800 mb-3">How LifeLine Works</h2>
          <p class="text-neutral-500 text-sm">Three simple steps to better healthcare</p>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-black mx-auto mb-5 shadow-lg">1</div>
            <h3 class="font-bold text-neutral-800 mb-2">Create Your Account</h3>
            <p class="text-sm text-neutral-500 leading-relaxed">Sign up in minutes. Choose a subscription plan that fits your budget and healthcare needs.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-black mx-auto mb-5 shadow-lg">2</div>
            <h3 class="font-bold text-neutral-800 mb-2">Find a Provider</h3>
            <p class="text-sm text-neutral-500 leading-relaxed">Browse doctors, hospitals, and pharmacies near you. Filter by city, specialty, or availability.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-black mx-auto mb-5 shadow-lg">3</div>
            <h3 class="font-bold text-neutral-800 mb-2">Book &amp; Get Treated</h3>
            <p class="text-sm text-neutral-500 leading-relaxed">Submit a service request. Your provider is notified and you're all set — covered by your plan.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── STATS ──────────────────────────────────────────────── -->
    <section class="py-16 bg-primary-600">
      <div class="max-w-5xl mx-auto px-6 lg:px-10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          <div>
            <p class="text-4xl font-black mb-1">500+</p>
            <p class="text-primary-200 text-sm">Verified Doctors</p>
          </div>
          <div>
            <p class="text-4xl font-black mb-1">120+</p>
            <p class="text-primary-200 text-sm">Partner Hospitals</p>
          </div>
          <div>
            <p class="text-4xl font-black mb-1">200+</p>
            <p class="text-primary-200 text-sm">Pharmacies</p>
          </div>
          <div>
            <p class="text-4xl font-black mb-1">15k+</p>
            <p class="text-primary-200 text-sm">Patients Served</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA ────────────────────────────────────────────────── -->
    <section class="py-20 bg-white text-center">
      <div class="max-w-xl mx-auto px-6">
        <h2 class="text-3xl font-black text-neutral-800 mb-4">Ready to get started?</h2>
        <p class="text-neutral-500 text-sm mb-8">Join thousands of Nigerians accessing quality healthcare through LifeLine.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink to="/register" class="inline-flex items-center justify-center px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-md transition-colors text-sm">
            Create Free Account
          </RouterLink>
          <RouterLink to="/pricing" class="inline-flex items-center justify-center px-8 py-3.5 border border-neutral-300 text-neutral-700 font-semibold rounded-md hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors text-sm">
            View Pricing Plans
          </RouterLink>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
</script>
