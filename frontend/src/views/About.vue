<template>
  <div class="bg-white font-sans">

    <!-- ── PAGE HERO ─────────────────────────────────────────── -->
    <section class="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 py-24">
      <div class="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span class="inline-block text-xs font-bold text-primary-200 uppercase tracking-widest mb-4">About LifeLine</span>
            <h1 class="text-4xl lg:text-5xl font-black text-white mb-5 leading-tight">
              Healthcare that works<br />for every Nigerian
            </h1>
            <p class="text-primary-100 text-[16px] leading-relaxed mb-8 max-w-lg">
              LifeLine is Nigeria's first NHIA-compliant digital health platform — making quality healthcare accessible and affordable for individuals and families across the country.
            </p>
            <RouterLink to="/register" class="inline-flex items-center px-8 py-3.5 bg-white text-primary-600 hover:bg-primary-50 font-bold rounded-md transition-colors text-sm">
              Join LifeLine Today
            </RouterLink>
          </div>
          <div class="flex justify-center">
            <div class="rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full">
              <img src="/doctor-consult.png" alt="Doctor consultation" class="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </div>
      <!-- Decorative circles -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-primary-500 opacity-20 rounded-full translate-x-1/2 -translate-y-1/2"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-primary-400 opacity-20 rounded-full -translate-x-1/3 translate-y-1/3"></div>
    </section>

    <!-- ── OUR MISSION ────────────────────────────────────────── -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-10">
        <div class="grid lg:grid-cols-3 gap-10">

          <div class="text-center p-8 rounded-2xl bg-primary-50 border border-primary-100">
            <div class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-neutral-800 mb-3">Our Mission</h3>
            <p class="text-sm text-neutral-600 leading-relaxed">
              To make quality healthcare accessible and affordable for every Nigerian, from urban centres to rural communities — powered by technology.
            </p>
          </div>

          <div class="text-center p-8 rounded-2xl bg-primary-50 border border-primary-100">
            <div class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-neutral-800 mb-3">Our Vision</h3>
            <p class="text-sm text-neutral-600 leading-relaxed">
              A Nigeria where no one delays medical care due to cost, distance, or lack of information — where everyone has a healthcare partner they trust.
            </p>
          </div>

          <div class="text-center p-8 rounded-2xl bg-primary-50 border border-primary-100">
            <div class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-neutral-800 mb-3">Who We Serve</h3>
            <p class="text-sm text-neutral-600 leading-relaxed">
              Patients seeking care, doctors offering consultations, hospitals managing admissions, and pharmacies dispensing medications — all on one platform.
            </p>
          </div>

        </div>
      </div>
    </section>

    <!-- ── WHY LIFELINE ───────────────────────────────────────── -->
    <section class="py-20 bg-neutral-50">
      <div class="max-w-7xl mx-auto px-6 lg:px-10">
        <div class="grid lg:grid-cols-2 gap-14 items-center">

          <div class="order-2 lg:order-1 space-y-8">
            <div>
              <h2 class="text-3xl font-black text-neutral-800 mb-3">Why LifeLine?</h2>
              <p class="text-neutral-500 text-sm leading-relaxed">We built LifeLine because healthcare in Nigeria deserves better. From long waiting times to unavailable specialists and out-of-pocket costs that cripple families, we set out to fix these problems.</p>
            </div>

            <div class="space-y-6">
              <div class="flex gap-4">
                <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div>
                  <h4 class="font-bold text-neutral-800 text-sm mb-1">Quick Access to Healthcare</h4>
                  <p class="text-xs text-neutral-500 leading-relaxed">Our monthly subscription gives you instant access to our platform — see a doctor in minutes from anywhere, for you and up to 4 dependents.</p>
                </div>
              </div>

              <div class="flex gap-4">
                <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
                </div>
                <div>
                  <h4 class="font-bold text-neutral-800 text-sm mb-1">Join as a Patient or Professional</h4>
                  <p class="text-xs text-neutral-500 leading-relaxed">Sign up as a patient to access health services, or as a doctor, hospital, or pharmacy to connect with patients and manage your practice digitally.</p>
                </div>
              </div>

              <div class="flex gap-4">
                <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <div>
                  <h4 class="font-bold text-neutral-800 text-sm mb-1">Accessible Health Insurance</h4>
                  <p class="text-xs text-neutral-500 leading-relaxed">NHIA-compliant insurance plans give you access to hospitals, specialists, labs, and more — all at a fraction of traditional insurance costs.</p>
                </div>
              </div>
            </div>

            <RouterLink to="/register" class="inline-flex items-center px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-md transition-colors text-sm">
              Start Your Journey
            </RouterLink>
          </div>

          <div class="order-1 lg:order-2 flex justify-center">
            <div class="rounded-3xl overflow-hidden shadow-xl max-w-md w-full">
              <img src="/hero-exam.png" alt="Doctor with patient" class="w-full h-auto object-cover" />
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ── VALUES ─────────────────────────────────────────────── -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-10">
        <h2 class="text-2xl font-black text-neutral-800 text-center mb-10">Our Values</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="value in values" :key="value.title" class="text-center p-6 rounded-2xl bg-neutral-50 hover:bg-primary-50 transition-colors border border-transparent hover:border-primary-100">
            <div class="text-3xl mb-3">{{ value.icon }}</div>
            <h4 class="font-bold text-neutral-800 text-sm mb-2">{{ value.title }}</h4>
            <p class="text-xs text-neutral-500 leading-relaxed">{{ value.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA ────────────────────────────────────────────────── -->
    <section class="py-20 bg-primary-600 text-center">
      <div class="max-w-xl mx-auto px-6">
        <h2 class="text-3xl font-black text-white mb-4">Be Part of the LifeLine Community</h2>
        <p class="text-primary-100 text-sm mb-8 leading-relaxed">Whether you're a patient, doctor, hospital, or pharmacy — LifeLine has a place for you.</p>
        <RouterLink to="/register" class="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-600 hover:bg-primary-50 font-bold rounded-md transition-colors text-sm">
          Get Started Free
        </RouterLink>
      </div>
    </section>

  </div>
</template>

<script setup>
const values = [
  { icon: '🤝', title: 'Accessibility', desc: 'Healthcare for everyone, regardless of location or income.' },
  { icon: '🔒', title: 'Trust & Safety', desc: 'All providers are verified. Your data is protected.' },
  { icon: '⚡', title: 'Speed', desc: 'Book a doctor or hospital in under 2 minutes.' },
  { icon: '💚', title: 'Compassion', desc: 'We put patients first in everything we build.' },
]
</script>
