<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2">
          <span class="text-2xl font-black text-primary-600 tracking-tight">LIFELINE</span>
          <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Pro</span>
        </RouterLink>
        <RouterLink to="/register" class="text-sm font-semibold text-primary-600 hover:text-primary-700">
          ← Back to Registration
        </RouterLink>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-6 py-12">
      <!-- Title -->
      <div class="mb-10">
        <h1 class="text-4xl font-black text-gray-900 mb-3">Terms of Service</h1>
        <p class="text-gray-500 text-sm">Last updated: April 2026 &nbsp;·&nbsp; Effective Date: April 16, 2026</p>
        <p class="text-gray-500 text-sm mt-1">LifeLine Pro Health Management Organisation Limited — RC: <span class="font-semibold">To be registered with CAC</span></p>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10 text-sm text-amber-800">
        <strong>Important Notice:</strong> Please read these Terms carefully before using LifeLine Pro. By registering, clicking "I agree", or using any part of this platform, you confirm that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. If you do not agree, do not use this platform.
      </div>

      <div class="space-y-10 text-gray-700 leading-relaxed">

        <!-- 1 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">1. About LifeLine Pro</h2>
          <p>LifeLine Pro is a digital Health Management Organisation (HMO) platform operated in Nigeria, providing technology-driven access to healthcare services including doctor consultations, pharmacy dispensing, hospital care, laboratory tests, and surgical procedures. LifeLine Pro connects enrolled members with accredited healthcare providers across Nigeria.</p>
          <p class="mt-3">Our platform is governed by Nigerian law, including the <strong>National Health Insurance Authority (NHIA) Act 2022</strong>, the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong>, the <strong>Consumer Protection Council Act</strong>, and applicable regulations of the <strong>Federal Ministry of Health</strong>.</p>
        </section>

        <!-- 2 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">2. Eligibility</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li>You must be at least <strong>18 years of age</strong> to register as a primary subscriber. Dependants under 18 may be enrolled under an adult subscriber's account.</li>
            <li>You must be physically present in Nigeria or a Nigerian citizen/resident to subscribe.</li>
            <li>Healthcare providers (doctors, pharmacies, hospitals) must hold valid licences from the <strong>Medical and Dental Council of Nigeria (MDCN)</strong>, <strong>Pharmacists Council of Nigeria (PCN)</strong>, or other relevant regulatory bodies.</li>
            <li>You must provide accurate, current, and complete information during registration. Providing false information is grounds for immediate account termination.</li>
          </ul>
        </section>

        <!-- 3 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">3. Subscription Plans and Payments</h2>

          <h3 class="font-bold text-gray-800 mb-2">3.1 Available Plans</h3>
          <div class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-4">
            <table class="w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left px-4 py-3 font-bold">Plan</th>
                  <th class="text-left px-4 py-3 font-bold">Monthly Premium</th>
                  <th class="text-left px-4 py-3 font-bold">Coverage</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr><td class="px-4 py-3 font-semibold">General</td><td class="px-4 py-3">₦1,500</td><td class="px-4 py-3">Doctor consultations only</td></tr>
                <tr><td class="px-4 py-3 font-semibold">Basic</td><td class="px-4 py-3">₦3,500</td><td class="px-4 py-3">Common illnesses, pharmacy, hospital (up to 3 days)</td></tr>
                <tr><td class="px-4 py-3 font-semibold">Standard</td><td class="px-4 py-3">₦5,500</td><td class="px-4 py-3">Illnesses, minor surgeries, specialist consultations</td></tr>
                <tr><td class="px-4 py-3 font-semibold">Premium</td><td class="px-4 py-3">₦10,000</td><td class="px-4 py-3">Full coverage including major surgeries, childbirth, advanced imaging</td></tr>
              </tbody>
            </table>
          </div>

          <h3 class="font-bold text-gray-800 mb-2">3.2 Payment Terms</h3>
          <ul class="list-disc pl-5 space-y-2">
            <li>All payments are processed in <strong>Nigerian Naira (₦)</strong> via Paystack, a PCI-DSS compliant payment gateway licensed by the <strong>Central Bank of Nigeria (CBN)</strong>.</li>
            <li>Subscriptions are billed monthly. Your subscription activates upon successful payment confirmation.</li>
            <li>A <strong>30-day renewal window</strong> is permitted before expiry. Renewals outside this window require a new subscription cycle.</li>
            <li>LifeLine Pro reserves the right to revise subscription prices with <strong>30 days' prior notice</strong> via email or in-app notification.</li>
          </ul>

          <h3 class="font-bold text-gray-800 mt-4 mb-2">3.3 Refund Policy</h3>
          <ul class="list-disc pl-5 space-y-2">
            <li>Subscription fees are <strong>non-refundable</strong> once the subscription period has commenced.</li>
            <li>In the event of a documented billing error or duplicate charge, you may request a refund within <strong>7 calendar days</strong> by contacting support.</li>
            <li>Refunds, if approved, will be credited to the original payment method within <strong>5–10 business days</strong>.</li>
          </ul>
        </section>

        <!-- 4 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">4. Healthcare Services</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li>LifeLine Pro is a <strong>technology intermediary</strong> connecting you to independent healthcare providers. We do not directly employ doctors, pharmacists, or hospital staff.</li>
            <li>All clinical decisions, diagnoses, and treatments are the sole responsibility of the treating healthcare professional.</li>
            <li>Service availability depends on your enrolled subscription tier. Services not covered under your plan will be cited at point of care.</li>
            <li>Emergency care (life-threatening situations) should be directed to the nearest government hospital with full NHIA facilities regardless of your subscription status. Contact <strong>NEMA Emergency Line: 0800-CALL-NEMA</strong> or go to your nearest Federal Government hospital.</li>
            <li>Dependants enrolled under your account (up to 4 for General/Basic/Standard, 6 for Premium) share your subscription tier benefits.</li>
          </ul>
        </section>

        <!-- 5 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">5. User Obligations</h2>
          <p>As a user of LifeLine Pro, you agree to:</p>
          <ul class="list-disc pl-5 space-y-2 mt-3">
            <li>Provide truthful and accurate personal and medical information.</li>
            <li>Keep your login credentials confidential. You are responsible for all activities on your account.</li>
            <li>Not share your Lifeline ID or credentials with any person not enrolled under your account.</li>
            <li>Not attempt to access services beyond your enrolled plan.</li>
            <li>Not use the platform for any unlawful purpose under Nigerian law.</li>
            <li>Notify us immediately at <a href="mailto:support@lifelinepro.com" class="text-primary-600 hover:underline">support@lifelinepro.com</a> if you suspect unauthorised access to your account.</li>
          </ul>
        </section>

        <!-- 6 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">6. Platform Availability</h2>
          <p>We aim for 99.5% uptime but do not guarantee uninterrupted access. Scheduled maintenance will be communicated at least <strong>24 hours in advance</strong>. LifeLine Pro shall not be held liable for service disruptions caused by third-party infrastructure, force majeure events, or acts of God.</p>
        </section>

        <!-- 7 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">7. Intellectual Property</h2>
          <p>All content, branding, software, and design elements of LifeLine Pro are the exclusive property of LifeLine Pro Health Management Organisation Limited. You are granted a limited, non-exclusive, non-transferable licence to use the platform for personal health management purposes only. You may not reproduce, distribute, or create derivative works without express written permission.</p>
        </section>

        <!-- 8 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by Nigerian law:</p>
          <ul class="list-disc pl-5 space-y-2 mt-3">
            <li>LifeLine Pro's total liability shall not exceed the <strong>total subscription fees paid by you in the 3 months</strong> preceding the claim.</li>
            <li>We are not liable for any indirect, incidental, or consequential damages arising from use of the platform.</li>
            <li>We are not liable for clinical outcomes, adverse medical events, or healthcare provider negligence. Such matters are the responsibility of the relevant healthcare professional and their regulatory body.</li>
          </ul>
        </section>

        <!-- 9 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">9. Termination</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li>You may cancel your subscription at any time from your account settings. Access continues to your plan expiry date.</li>
            <li>LifeLine Pro may suspend or terminate your account for breach of these Terms, fraudulent activity, or at regulatory direction.</li>
            <li>On termination, your medical records remain accessible for download for <strong>90 days</strong> as required by Nigerian health records law.</li>
          </ul>
        </section>

        <!-- 10 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">10. Dispute Resolution</h2>
          <p>In the event of a dispute:</p>
          <ol class="list-decimal pl-5 space-y-2 mt-3">
            <li>First, contact us at <a href="mailto:support@lifelinepro.com" class="text-primary-600 hover:underline">support@lifelinepro.com</a>. We aim to resolve complaints within <strong>5 business days</strong>.</li>
            <li>If unresolved, either party may escalate to the <strong>Consumer Protection Council (CPC)</strong> or the <strong>National Health Insurance Authority (NHIA)</strong>.</li>
            <li>Disputes not resolved by mediation shall be submitted to arbitration under the <strong>Arbitration and Conciliation Act (Cap A18) LFN 2004</strong> in Lagos, Nigeria.</li>
          </ol>
          <p class="mt-3">These Terms are governed by the laws of the <strong>Federal Republic of Nigeria</strong>.</p>
        </section>

        <!-- 11 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">11. Changes to Terms</h2>
          <p>We may update these Terms from time to time. Material changes will be communicated via email and in-app notification at least <strong>14 days before</strong> they take effect. Continued use of the platform after the effective date constitutes acceptance of the revised Terms.</p>
        </section>

        <!-- 12 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">12. Contact Us</h2>
          <div class="bg-gray-50 rounded-xl border border-gray-200 p-5 text-sm space-y-1">
            <p><strong>LifeLine Pro Health Management Organisation Limited</strong></p>
            <p>Email: <a href="mailto:support@lifelinepro.com" class="text-primary-600 hover:underline">support@lifelinepro.com</a></p>
            <p>Complaints: <a href="mailto:complaints@lifelinepro.com" class="text-primary-600 hover:underline">complaints@lifelinepro.com</a></p>
            <p>Phone: +234 800 000 0000</p>
            <p>Business Hours: Monday–Friday, 8:00am–6:00pm WAT</p>
          </div>
        </section>

      </div>

      <!-- Footer nav -->
      <div class="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
        <RouterLink to="/privacy-policy" class="text-primary-600 hover:underline font-semibold">Privacy Policy →</RouterLink>
        <RouterLink to="/register" class="text-gray-500 hover:text-gray-700">Back to Registration</RouterLink>
        <RouterLink to="/" class="text-gray-500 hover:text-gray-700">Home</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
