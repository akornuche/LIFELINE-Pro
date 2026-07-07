<template>
  <div class="bg-white font-sans">

    <!-- ── PAGE HERO ─────────────────────────────────────────── -->
    <section class="bg-gradient-to-br from-primary-50 to-primary-100 py-20 text-center">
      <div class="max-w-3xl mx-auto px-6 lg:px-10">
        <span class="inline-block text-xs font-bold text-primary-500 uppercase tracking-widest mb-4">Get in Touch</span>
        <h1 class="text-4xl lg:text-5xl font-black text-neutral-800 mb-5 leading-tight">Contact Us</h1>
        <p class="text-neutral-600 text-[16px] leading-relaxed max-w-xl mx-auto">
          Have a question, partnership enquiry, or need support? We're here to help.
        </p>
      </div>
    </section>

    <!-- ── CONTACT BODY ───────────────────────────────────────── -->
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-6 lg:px-10">
        <div class="grid lg:grid-cols-2 gap-14">

          <!-- Left: Contact Form -->
          <div>
            <h2 class="text-2xl font-black text-neutral-800 mb-2">Send us a message</h2>
            <p class="text-sm text-neutral-500 mb-8">We typically respond within 24 hours on business days.</p>

            <form @submit.prevent="submitForm" class="space-y-5">
              <div class="grid sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-semibold text-neutral-700 mb-1.5">First Name <span class="text-red-400">*</span></label>
                  <input
                    v-model="form.firstName"
                    type="text"
                    required
                    placeholder="Emeka"
                    class="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-neutral-700 mb-1.5">Last Name <span class="text-red-400">*</span></label>
                  <input
                    v-model="form.lastName"
                    type="text"
                    required
                    placeholder="Okafor"
                    class="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-neutral-700 mb-1.5">Email Address <span class="text-red-400">*</span></label>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="emeka@example.com"
                  class="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-neutral-700 mb-1.5">Phone Number</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  class="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-neutral-700 mb-1.5">Subject <span class="text-red-400">*</span></label>
                <select
                  v-model="form.subject"
                  required
                  class="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition bg-white"
                >
                  <option value="" disabled>Select a subject</option>
                  <option value="general">General Enquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="partnership">Partnership / Provider Onboarding</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-neutral-700 mb-1.5">Message <span class="text-red-400">*</span></label>
                <textarea
                  v-model="form.message"
                  required
                  rows="5"
                  placeholder="Tell us how we can help..."
                  class="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition resize-none"
                ></textarea>
              </div>

              <!-- Success / Error -->
              <div v-if="submitted" class="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Message sent! We'll get back to you within 24 hours.
              </div>
              <div v-if="submitError" class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {{ submitError }}
              </div>

              <button
                type="submit"
                :disabled="sending"
                class="w-full py-3 px-6 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors"
              >
                {{ sending ? 'Sending…' : 'Send Message' }}
              </button>
            </form>
          </div>

          <!-- Right: Contact Info -->
          <div class="space-y-8 pt-2">
            <div>
              <h2 class="text-2xl font-black text-neutral-800 mb-2">Other ways to reach us</h2>
              <p class="text-sm text-neutral-500">Our support team is available Mon–Fri, 8am–6pm WAT.</p>
            </div>

            <div class="space-y-6">
              <div v-for="item in contactInfo" :key="item.label" class="flex gap-5 items-start">
                <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <component :is="item.icon" class="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p class="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-0.5">{{ item.label }}</p>
                  <p class="text-sm font-medium text-neutral-800">{{ item.value }}</p>
                  <p v-if="item.sub" class="text-xs text-neutral-500">{{ item.sub }}</p>
                </div>
              </div>
            </div>

            <!-- Social Links -->
            <div>
              <p class="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-4">Follow Us</p>
              <div class="flex gap-3">
                <a v-for="social in socials" :key="social.name" :href="social.href" target="_blank" rel="noopener noreferrer"
                  class="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-primary-100 hover:text-primary-600 flex items-center justify-center text-neutral-500 transition-colors text-sm font-bold">
                  {{ social.abbr }}
                </a>
              </div>
            </div>

            <!-- Map Placeholder -->
            <div class="rounded-2xl bg-neutral-100 h-44 flex items-center justify-center text-neutral-400">
              <div class="text-center">
                <svg class="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <p class="text-xs">Lagos, Nigeria</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ── FAQ STRIP ──────────────────────────────────────────── -->
    <section class="py-16 bg-neutral-50">
      <div class="max-w-3xl mx-auto px-6 lg:px-10 text-center">
        <h2 class="text-xl font-black text-neutral-800 mb-4">Looking for quick answers?</h2>
        <p class="text-sm text-neutral-500 mb-6">Check our pricing page for FAQs about plans, billing, and coverage.</p>
        <RouterLink to="/pricing" class="inline-flex items-center px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-md transition-colors text-sm">
          View FAQs &amp; Pricing
        </RouterLink>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, h } from 'vue'

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})
const sending = ref(false)
const submitted = ref(false)
const submitError = ref('')

async function submitForm() {
  sending.value = true
  submitError.value = ''
  submitted.value = false
  // Simulate async send (replace with real API call when backend endpoint exists)
  await new Promise(resolve => setTimeout(resolve, 1000))
  sending.value = false
  submitted.value = true
  form.value = { firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' }
}

// Inline SVG components for contact icons
const EmailIcon = {
  render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '1.5', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }),
  ])
}
const PhoneIcon = {
  render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '1.5', d: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' }),
  ])
}
const LocationIcon = {
  render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '1.5', d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' }),
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '1.5', d: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z' }),
  ])
}

const contactInfo = [
  { label: 'Email', value: 'hello@lifeline.ng', sub: 'We respond within 24 hours', icon: EmailIcon },
  { label: 'Phone', value: '+234 800 LIFELINE', sub: 'Mon–Fri, 8am–6pm WAT', icon: PhoneIcon },
  { label: 'Office', value: '14 Adeyemo Alakija St, Victoria Island', sub: 'Lagos, Nigeria', icon: LocationIcon },
]

const socials = [
  { name: 'Twitter', abbr: 'X', href: '#' },
  { name: 'Instagram', abbr: 'IG', href: '#' },
  { name: 'Facebook', abbr: 'FB', href: '#' },
  { name: 'LinkedIn', abbr: 'in', href: '#' },
]
</script>
