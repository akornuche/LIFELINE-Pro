<template>
  <div class="bg-white font-sans">

    <!-- ═══════════════════════════════════════════════════════
         HERO SECTION
    ═══════════════════════════════════════════════════════ -->
    <section id="home" class="w-full bg-white">
      <img
        src="/flyer.jpg"
        alt="LifeLine – Accessible Healthcare anytime, anywhere"
        class="w-full h-auto block"
      />
    </section>

    <!-- ═══════════════════════════════════════════════════════
         HERO TEXT + IMAGES SECTION
    ═══════════════════════════════════════════════════════ -->
    <section class="py-14 lg:py-18 bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-10">
        <div class="grid lg:grid-cols-2 gap-8 items-center">

          <!-- Left: Text Content -->
          <div class="order-2 lg:order-1">
            <span class="inline-block text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Nigeria's #1 Health Platform</span>
            <h1 class="text-4xl lg:text-[42px] font-bold text-neutral-800 leading-[1.2] mb-5">
              Fast and affordable<br />
              <span class="text-primary-500">healthcare</span> at your<br />
              fingertips
            </h1>
            <p class="text-neutral-500 mb-5 text-[15px] leading-relaxed">
              For just <span class="font-bold text-neutral-800">₦1,500/month</span> you can connect with licensed doctors, hospitals, and pharmacies near you — from any device, anywhere in Nigeria.
            </p>
            <ul class="space-y-2 mb-7">
              <li class="flex items-center gap-2 text-sm text-neutral-600">
                <span class="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <svg class="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </span>
                Book a doctor consultation in under 2 minutes
              </li>
              <li class="flex items-center gap-2 text-sm text-neutral-600">
                <span class="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <svg class="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </span>
                Covers you and up to 4 dependents
              </li>
              <li class="flex items-center gap-2 text-sm text-neutral-600">
                <span class="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <svg class="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </span>
                NHIA-compliant insurance plans from ₦1,500/month
              </li>
              <li class="flex items-center gap-2 text-sm text-neutral-600">
                <span class="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <svg class="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </span>
                Access hospitals, pharmacies &amp; specialists in one app
              </li>
            </ul>
            <div class="flex flex-wrap gap-4">
              <a href="#plans" class="inline-flex items-center px-7 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-md transition-colors text-sm">
                See Our Plans
              </a>
              <a href="#about" class="inline-flex items-center px-7 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-md hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors text-sm">
                Learn More
              </a>
            </div>
          </div>

          <!-- Right: Images with Callouts -->
          <div class="order-1 lg:order-2 flex justify-center">
            <div class="relative w-[340px] h-[400px] sm:w-[380px] sm:h-[440px] shrink-0">

              <!-- Exam image — top left -->
              <div class="absolute top-0 left-0 w-[195px] h-[195px] sm:w-[220px] sm:h-[220px] rounded-3xl overflow-hidden shadow-xl z-10">
                <img src="/hero-exam.png" alt="Eye examination" class="w-full h-full object-cover" />
              </div>

              <!-- Pharmacist image — bottom right -->
              <div class="absolute bottom-0 right-0 w-[205px] h-[270px] sm:w-[230px] sm:h-[300px] rounded-3xl overflow-hidden shadow-xl z-10">
                <img src="/hero-pharmacist.png" alt="Pharmacist" class="w-full h-full object-cover" />
              </div>

              <!-- Callout 1: facilities — floats top-right corner -->
              <div class="absolute top-2 right-0 bg-white rounded-2xl shadow-lg px-4 py-3 w-[155px] border border-neutral-100 z-20">
                <p class="text-[11px] leading-snug">
                  <span class="text-primary-500 font-semibold block mb-0.5">Top notch facilities</span>
                  <span class="text-neutral-500">and professionals near you</span>
                </p>
              </div>

              <!-- Callout 2: insurance — floats bottom-left corner -->
              <div class="absolute bottom-4 left-0 bg-white border-2 border-primary-200 rounded-2xl px-4 py-3 w-[165px] z-20">
                <p class="text-[11px] text-primary-600 leading-snug font-medium">
                  Affordable medical insurance for you and your family
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         OUR HEALTH SERVICES
    ═══════════════════════════════════════════════════════ -->
    <section class="py-16 bg-white" id="services">
      <div class="max-w-7xl mx-auto px-6 lg:px-10">
        <h2 class="text-2xl lg:text-3xl font-bold text-center text-neutral-800 mb-12">Our Health Services</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <!-- Find A Doctor -->
          <div class="bg-[#e8f5e9] rounded-2xl p-6 text-center">
            <div class="w-14 h-14 bg-[#c8e6c9] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-primary-600 mb-3">Find A Doctor</h3>
            <p class="text-xs text-neutral-500 leading-relaxed">Search and connect instantly with licensed doctors near you for online or in-person consultations. Get expert advice, prescriptions, and follow-up care—all from your device.</p>
          </div>

          <!-- Find A Hospital -->
          <div class="bg-[#e8f5e9] rounded-2xl p-6 text-center">
            <div class="w-14 h-14 bg-[#c8e6c9] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-primary-600 mb-3">Find A Hospital</h3>
            <p class="text-xs text-neutral-500 leading-relaxed">Locate accredited hospitals in your area, view available services, and book appointments with ease. Access emergency care and specialized treatments when you need them most.</p>
          </div>

          <!-- Find A Pharmacy -->
          <div class="bg-[#e8f5e9] rounded-2xl p-6 text-center">
            <div class="w-14 h-14 bg-[#c8e6c9] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-primary-600 mb-3">Find A Pharmacy</h3>
            <p class="text-xs text-neutral-500 leading-relaxed">Order medications from trusted pharmacies, manage your prescriptions, and enjoy fast, secure delivery to your doorstep. Stay on top of your health with convenient pharmacy access.</p>
          </div>

          <!-- Health Insurance -->
          <div class="bg-[#e8f5e9] rounded-2xl p-6 text-center">
            <div class="w-14 h-14 bg-[#c8e6c9] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-primary-600 mb-3">Health Insurance</h3>
            <p class="text-xs text-neutral-500 leading-relaxed">Choose from flexible insurance plans for individuals and families. Enjoy affordable premiums, broad hospital networks, and peace of mind knowing your health is covered.</p>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         OUR PLANS
    ═══════════════════════════════════════════════════════ -->
    <section id="plans" class="py-16 bg-neutral-50">
      <div class="max-w-7xl mx-auto px-6 lg:px-10">
        <div class="text-center mb-12">
          <h2 class="text-2xl lg:text-3xl font-bold text-neutral-800 mb-3">Our Plans</h2>
          <p class="text-neutral-500 text-sm max-w-xl mx-auto">Choose a plan that works for you. From basic consultations to full coverage insurance for you and your family.</p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <!-- General -->
          <div class="bg-white rounded-2xl shadow-sm border border-neutral-100 flex flex-col p-6 hover:shadow-md transition-shadow">
            <div class="inline-block px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold uppercase rounded-full mb-4 self-start">General</div>
            <h3 class="text-xl font-black text-neutral-800 mb-1">General</h3>
            <p class="text-neutral-500 text-xs mb-4">Doctor consultations only</p>
            <div class="flex items-baseline mb-5">
              <span class="text-3xl font-black text-neutral-900">₦1,500</span>
              <span class="text-neutral-400 text-xs ml-1">/month</span>
            </div>
            <ul class="space-y-2 mb-6 flex-1">
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Doctor consultations only</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> 5 Consultations / month</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Basic lab tests (3 / month)</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Prescriptions (doctor-issued)</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Up to 4 Dependents</li>
            </ul>
            <RouterLink to="/register" class="block text-center py-2.5 px-4 rounded-lg bg-neutral-700 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors">Get Started</RouterLink>
          </div>

          <!-- Basic -->
          <div class="bg-white rounded-2xl shadow-sm border border-neutral-100 flex flex-col p-6 hover:shadow-md transition-shadow">
            <div class="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full mb-4 self-start">Insurance</div>
            <h3 class="text-xl font-black text-neutral-800 mb-1">Basic</h3>
            <p class="text-neutral-500 text-xs mb-4">Common illnesses coverage</p>
            <div class="flex items-baseline mb-5">
              <span class="text-3xl font-black text-neutral-900">₦3,500</span>
              <span class="text-neutral-400 text-xs ml-1">/month</span>
            </div>
            <ul class="space-y-2 mb-6 flex-1">
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Common illnesses coverage</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> 8 Consultations / month</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> 5 Lab Tests / month</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Pharmacy access</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Hospital admission (up to 3 days)</li>
            </ul>
            <RouterLink to="/register" class="block text-center py-2.5 px-4 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">Get Started</RouterLink>
          </div>

          <!-- Standard – Most Popular -->
          <div class="bg-white rounded-2xl shadow border-2 border-primary-500 flex flex-col p-6 relative hover:shadow-lg transition-shadow">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow">Most Popular</div>
            <div class="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full mb-4 self-start">Insurance</div>
            <h3 class="text-xl font-black text-neutral-800 mb-1">Standard</h3>
            <p class="text-neutral-500 text-xs mb-4">Illnesses + minor surgeries</p>
            <div class="flex items-baseline mb-5">
              <span class="text-3xl font-black text-neutral-900">₦5,500</span>
              <span class="text-neutral-400 text-xs ml-1">/month</span>
            </div>
            <ul class="space-y-2 mb-6 flex-1">
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Common illnesses + minor surgeries</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> 10 Consultations / month</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> 10 Lab Tests / month</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Specialist consultations</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Basic imaging (X-ray, Ultrasound)</li>
            </ul>
            <RouterLink to="/register" class="block text-center py-2.5 px-4 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors">Get Started</RouterLink>
          </div>

          <!-- Premium -->
          <div class="bg-white rounded-2xl shadow-sm border border-neutral-100 flex flex-col p-6 hover:shadow-md transition-shadow">
            <div class="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase rounded-full mb-4 self-start">Full Coverage</div>
            <h3 class="text-xl font-black text-neutral-800 mb-1">Premium</h3>
            <p class="text-neutral-500 text-xs mb-4">Complete health safety net</p>
            <div class="flex items-baseline mb-5">
              <span class="text-3xl font-black text-neutral-900">₦10,000</span>
              <span class="text-neutral-400 text-xs ml-1">/month</span>
            </div>
            <ul class="space-y-2 mb-6 flex-1">
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Full coverage incl. major surgeries</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Unlimited Consultations</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Unlimited Lab Tests</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Advanced imaging (CT, MRI)</li>
              <li class="flex items-start gap-2 text-xs text-neutral-600"><span class="text-primary-500 font-bold mt-0.5">✓</span> Up to 6 Dependents + home visits</li>
            </ul>
            <RouterLink to="/register" class="block text-center py-2.5 px-4 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors">Get Started</RouterLink>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         WHY LIFELINE?
    ═══════════════════════════════════════════════════════ -->
    <section id="about" class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-10">
        <h2 class="text-2xl lg:text-3xl font-bold text-center text-neutral-800 mb-12">Why LifeLine?</h2>
        
        <div class="grid lg:grid-cols-2 gap-12 items-start">
          <!-- Left: Doctor Image -->
          <div class="flex justify-center lg:justify-start">
            <div class="rounded-3xl overflow-hidden max-w-md">
              <img src="/doctor-consult.jpg" alt="Doctor consultation" class="w-full h-auto object-cover" />
            </div>
          </div>

          <!-- Right: Benefits -->
          <div class="space-y-7 pt-4">
            <div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Quick Access to Healthcare</h3>
              <p class="text-sm text-neutral-500 leading-relaxed">
                Our monthly regular subscription of N 1,200 gives you access to our mobile app and web app, so you can see a doctor from anywhere for you and 4 of your dependents.
              </p>
            </div>

            <div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Join as a Patient or Professional</h3>
              <p class="text-sm text-neutral-500 leading-relaxed">
                Sign up as a patient to access health services or as a doctor, hospital or pharmacy to provide services as well as connect with patients and other professionals near you.
              </p>
            </div>

            <div>
              <h3 class="text-lg font-bold text-neutral-800 mb-2">Accessible Health Insurance</h3>
              <p class="text-sm text-neutral-500 leading-relaxed">
                Go a step further by joining our classic, gold or premium health insurance plans which gives you more access to hospitals and their various services.
              </p>
            </div>

            <div class="pt-2">
              <RouterLink to="/register" class="inline-flex items-center px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-md transition-colors text-sm">
                Start Your Journey
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
</script>
