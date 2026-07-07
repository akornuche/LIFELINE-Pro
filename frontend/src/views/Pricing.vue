<template>
  <div class="bg-white font-sans">

    <!-- ── PAGE HERO ─────────────────────────────────────────── -->
    <section class="bg-gradient-to-br from-primary-50 to-primary-100 py-20 text-center">
      <div class="max-w-3xl mx-auto px-6 lg:px-10">
        <span class="inline-block text-xs font-bold text-primary-500 uppercase tracking-widest mb-4">Pricing</span>
        <h1 class="text-4xl lg:text-5xl font-black text-neutral-800 mb-5 leading-tight">
          Affordable Plans for Every Nigerian
        </h1>
        <p class="text-neutral-600 text-[16px] leading-relaxed max-w-xl mx-auto">
          From basic doctor consultations to full family coverage — choose the plan that fits your life.
        </p>
      </div>
    </section>

    <!-- ── PRICING CARDS ──────────────────────────────────────── -->
    <section id="plans" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-10">
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

    <!-- ── HOW IT WORKS ───────────────────────────────────────── -->
    <section class="py-20 bg-neutral-50">
      <div class="max-w-5xl mx-auto px-6 lg:px-10">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-black text-neutral-800 mb-3">How to Get Started</h2>
          <p class="text-neutral-500 text-sm">From sign-up to first consultation in minutes</p>
        </div>
        <div class="grid md:grid-cols-4 gap-8 relative">
          <!-- Connecting line for desktop -->
          <div class="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-primary-200 -z-0"></div>
          <div v-for="(step, i) in steps" :key="i" class="text-center relative z-10">
            <div class="w-16 h-16 rounded-full bg-white border-2 border-primary-500 text-primary-600 flex items-center justify-center text-xl font-black mx-auto mb-5 shadow-md">
              {{ i + 1 }}
            </div>
            <h4 class="font-bold text-neutral-800 text-sm mb-2">{{ step.title }}</h4>
            <p class="text-xs text-neutral-500 leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── COMPARISON TABLE ───────────────────────────────────── -->
    <section class="py-20 bg-white">
      <div class="max-w-5xl mx-auto px-6 lg:px-10">
        <h2 class="text-2xl font-black text-neutral-800 text-center mb-10">Plan Comparison</h2>
        <div class="overflow-x-auto rounded-2xl border border-neutral-100 shadow-sm">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-neutral-50 border-b border-neutral-100">
                <th class="text-left px-5 py-4 font-bold text-neutral-700 w-40">Feature</th>
                <th class="px-5 py-4 font-bold text-neutral-700 text-center">General</th>
                <th class="px-5 py-4 font-bold text-primary-600 text-center bg-primary-50">Basic</th>
                <th class="px-5 py-4 font-bold text-primary-700 text-center bg-primary-50">Standard</th>
                <th class="px-5 py-4 font-bold text-purple-700 text-center">Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparison" :key="row.feature" class="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                <td class="px-5 py-3 text-neutral-600 font-medium">{{ row.feature }}</td>
                <td class="px-5 py-3 text-center" v-html="cell(row.general)"></td>
                <td class="px-5 py-3 text-center bg-primary-50/30" v-html="cell(row.basic)"></td>
                <td class="px-5 py-3 text-center bg-primary-50/30" v-html="cell(row.standard)"></td>
                <td class="px-5 py-3 text-center" v-html="cell(row.premium)"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ── FAQ ────────────────────────────────────────────────── -->
    <section class="py-20 bg-neutral-50">
      <div class="max-w-3xl mx-auto px-6 lg:px-10">
        <h2 class="text-2xl font-black text-neutral-800 text-center mb-10">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <div
            v-for="(faq, i) in faqs"
            :key="i"
            class="bg-white rounded-xl border border-neutral-100 overflow-hidden"
          >
            <button
              class="w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-neutral-800 text-sm hover:bg-neutral-50 transition-colors"
              @click="openFaq = openFaq === i ? null : i"
            >
              {{ faq.q }}
              <svg class="w-5 h-5 text-neutral-400 shrink-0 transition-transform" :class="openFaq === i ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div v-show="openFaq === i" class="px-6 pb-4 text-sm text-neutral-500 leading-relaxed">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA ────────────────────────────────────────────────── -->
    <section class="py-20 bg-primary-600 text-center">
      <div class="max-w-xl mx-auto px-6">
        <h2 class="text-3xl font-black text-white mb-4">Start with any plan today</h2>
        <p class="text-primary-100 text-sm mb-8">No hidden fees. Cancel anytime. Your health is the priority.</p>
        <RouterLink to="/register" class="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-600 hover:bg-primary-50 font-bold rounded-md transition-colors text-sm">
          Create Your Account
        </RouterLink>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const openFaq = ref(null)

const steps = [
  { title: 'Create Account', desc: 'Sign up as a patient in under 2 minutes with your email.' },
  { title: 'Choose a Plan', desc: 'Pick General or an insurance plan based on your needs.' },
  { title: 'Find a Provider', desc: 'Browse verified doctors, hospitals, and pharmacies.' },
  { title: 'Book & Get Care', desc: 'Submit a request and receive confirmation instantly.' },
]

const comparison = [
  { feature: 'Monthly Price', general: '₦1,500', basic: '₦3,500', standard: '₦5,500', premium: '₦10,000' },
  { feature: 'Consultations', general: '5 / month', basic: '8 / month', standard: '10 / month', premium: 'Unlimited' },
  { feature: 'Lab Tests', general: '3 / month', basic: '5 / month', standard: '10 / month', premium: 'Unlimited' },
  { feature: 'Pharmacy Access', general: false, basic: true, standard: true, premium: true },
  { feature: 'Hospital Admission', general: false, basic: '3 days', standard: '7 days', premium: 'Unlimited' },
  { feature: 'Specialist Consults', general: false, basic: false, standard: true, premium: true },
  { feature: 'Imaging (X-ray etc.)', general: false, basic: false, standard: 'Basic', premium: 'Advanced' },
  { feature: 'Major Surgeries', general: false, basic: false, standard: false, premium: true },
  { feature: 'Dependents', general: '4', basic: '4', standard: '4', premium: '6 + home visits' },
]

function cell(val) {
  if (val === true) return '<span class="text-primary-500 font-bold text-base">✓</span>'
  if (val === false) return '<span class="text-neutral-300 font-bold text-base">—</span>'
  return `<span class="text-neutral-700 font-medium text-xs">${val}</span>`
}

const faqs = [
  {
    q: 'Can I change my plan later?',
    a: 'Yes. You can upgrade or downgrade your plan at any time from your dashboard. Changes take effect on your next billing cycle.',
  },
  {
    q: 'Does my plan cover my family members?',
    a: 'All plans include coverage for dependents — up to 4 for General, Basic, and Standard plans, and up to 6 for the Premium plan.',
  },
  {
    q: 'Is LifeLine NHIA-compliant?',
    a: 'Yes. Our insurance plans (Basic, Standard, Premium) are fully NHIA-compliant and satisfy national health insurance requirements.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept debit/credit cards and bank transfers via Paystack. All payments are secure and encrypted.',
  },
  {
    q: 'How quickly can I see a doctor after signing up?',
    a: 'Immediately! Once your subscription is active, you can search for a doctor and submit a service request in under 2 minutes.',
  },
]
</script>
