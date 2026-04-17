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
        <h1 class="text-4xl font-black text-gray-900 mb-3">Privacy Policy</h1>
        <p class="text-gray-500 text-sm">Last updated: April 2026 &nbsp;·&nbsp; Effective Date: April 16, 2026</p>
        <p class="text-gray-500 text-sm mt-1">LifeLine Pro Health Management Organisation Limited</p>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-10 text-sm text-blue-900">
        <strong>Your privacy matters.</strong> This policy explains exactly what personal and health data we collect, why we collect it, how we use it, and your rights under the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong> and the <strong>Nigeria Data Protection Regulation 2019 (NDPR)</strong>. LifeLine Pro is committed to lawful, transparent, and secure handling of your data.
      </div>

      <div class="space-y-10 text-gray-700 leading-relaxed">

        <!-- 1 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">1. Who We Are (Data Controller)</h2>
          <p><strong>LifeLine Pro Health Management Organisation Limited</strong> is the Data Controller responsible for your personal data collected through this platform. We are subject to the <strong>Nigeria Data Protection Commission (NDPC)</strong> and operate in compliance with the NDPA 2023.</p>
          <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4 text-sm space-y-1">
            <p><strong>Data Protection Officer (DPO):</strong></p>
            <p>Email: <a href="mailto:dpo@lifelinepro.com" class="text-primary-600 hover:underline">dpo@lifelinepro.com</a></p>
            <p>Address: Nigeria</p>
          </div>
        </section>

        <!-- 2 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">2. Data We Collect</h2>

          <h3 class="font-bold text-gray-800 mb-2">2.1 Information You Provide</h3>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Identity data:</strong> Full name, date of birth, gender, nationality, NIN (National Identification Number) where required</li>
            <li><strong>Contact data:</strong> Email address, phone number, state and LGA of residence</li>
            <li><strong>Account data:</strong> Username, password (stored as a one-way bcrypt hash — never in plain text), profile photo</li>
            <li><strong>Health data:</strong> Medical history, diagnoses, prescriptions, lab results, surgical records, consultation notes — classified as <strong>sensitive personal data</strong> under the NDPA</li>
            <li><strong>Dependant data:</strong> Names, dates of birth, and relationship for enrolled dependants</li>
            <li><strong>Payment data:</strong> Transaction references and subscription status. We do <strong>not</strong> store card numbers — payments are handled by Paystack (CBN-licensed)</li>
          </ul>

          <h3 class="font-bold text-gray-800 mt-5 mb-2">2.2 Data Collected Automatically</h3>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Usage data:</strong> Pages visited, features used, session duration, click events</li>
            <li><strong>Device data:</strong> IP address, browser type, operating system</li>
            <li><strong>Audit logs:</strong> Login timestamps, actions performed, data accessed — maintained for security and regulatory compliance</li>
          </ul>

          <h3 class="font-bold text-gray-800 mt-5 mb-2">2.3 Data from Third Parties</h3>
          <ul class="list-disc pl-5 space-y-2">
            <li>Payment confirmation data from <strong>Paystack</strong> (transaction status, reference)</li>
            <li>Healthcare provider verification data from <strong>MDCN, PCN</strong>, and other regulatory bodies</li>
          </ul>
        </section>

        <!-- 3 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">3. Lawful Basis for Processing</h2>
          <p>Under the NDPA 2023, we process your data on the following legal bases:</p>
          <div class="mt-4 space-y-3">
            <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm">
              <p class="font-bold text-gray-800">Contract Performance</p>
              <p class="text-gray-600 mt-1">Processing necessary to provide your subscription services — account management, healthcare access, payment processing.</p>
            </div>
            <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm">
              <p class="font-bold text-gray-800">Legitimate Interest</p>
              <p class="text-gray-600 mt-1">Platform security, fraud prevention, audit logging, service improvement, and preventing abuse.</p>
            </div>
            <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm">
              <p class="font-bold text-gray-800">Legal Obligation</p>
              <p class="text-gray-600 mt-1">Compliance with NDPA 2023, NHIA regulations, Federal Ministry of Health directives, FIRS tax obligations, and court orders.</p>
            </div>
            <div class="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm">
              <p class="font-bold text-gray-800">Explicit Consent</p>
              <p class="text-gray-600 mt-1">For processing <strong>sensitive health data</strong>, which you explicitly consent to by registering and using healthcare services on this platform. You may withdraw consent at any time (see Section 7).</p>
            </div>
          </div>
        </section>

        <!-- 4 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">4. How We Use Your Data</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li>Verifying your identity and managing your account</li>
            <li>Connecting you with healthcare providers and facilitating consultations, prescriptions, and treatments</li>
            <li>Processing subscription payments and maintaining billing records</li>
            <li>Sending appointment reminders, renewal notices, prescription alerts, and service notifications via email and SMS</li>
            <li>Generating anonymised aggregate statistics for healthcare analytics (no individual identification)</li>
            <li>Investigating complaints, resolving disputes, and conducting security audits</li>
            <li>Complying with regulatory reporting requirements to the NHIA, NDPC, and other authorities</li>
            <li>Improving platform features and user experience</li>
          </ul>
          <p class="mt-4 text-sm bg-amber-50 border border-amber-200 rounded-lg p-4"><strong>We do not sell your personal or health data to any third party. Ever.</strong></p>
        </section>

        <!-- 5 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">5. Who We Share Data With</h2>
          <p>We only share your data where necessary:</p>
          <ul class="list-disc pl-5 space-y-3 mt-3">
            <li><strong>Healthcare providers you engage:</strong> Doctors, pharmacies, hospitals, and laboratories receive only the health information necessary to provide care to you.</li>
            <li><strong>Paystack (payment processor):</strong> Receives transaction data required to process your subscription payment. Governed by their own privacy policy and CBN regulations.</li>
            <li><strong>SMS/Email service providers (Termii, etc.):</strong> Receive your contact details solely to deliver notifications you have opted into.</li>
            <li><strong>Regulatory authorities:</strong> The NHIA, NDPC, MDCN, or courts where we are legally required to disclose.</li>
            <li><strong>Our technical infrastructure providers:</strong> Hosting and database providers bound by data processing agreements and NDPA obligations.</li>
          </ul>
          <p class="mt-3">All third-party processors are contractually bound to handle your data securely and only for the stated purpose.</p>
        </section>

        <!-- 6 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">6. Data Security</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li>Passwords are hashed using <strong>bcrypt</strong> (12 rounds) — they are never stored in readable form</li>
            <li>All API communications are encrypted via <strong>HTTPS/TLS 1.2+</strong></li>
            <li>Authentication uses short-lived <strong>JWT tokens</strong> with refresh token rotation</li>
            <li>Health data access is role-restricted — a pharmacist cannot see surgical records; a doctor cannot see unrelated patients</li>
            <li>All sensitive data access is logged in immutable audit trails</li>
            <li>Regular security reviews and penetration testing</li>
            <li>Payment card data is never stored on our servers — handled exclusively by Paystack's PCI-DSS compliant infrastructure</li>
          </ul>
          <p class="mt-3">Despite these measures, no system is 100% secure. In the event of a data breach affecting your rights, we will notify you and the NDPC within <strong>72 hours</strong> as required by the NDPA 2023.</p>
        </section>

        <!-- 7 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">7. Your Rights Under the NDPA 2023</h2>
          <p>As a data subject, you have the following rights which you can exercise by contacting <a href="mailto:dpo@lifelinepro.com" class="text-primary-600 hover:underline">dpo@lifelinepro.com</a>:</p>
          <div class="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="font-bold text-gray-800">Right to Access</p>
              <p class="text-gray-600 mt-1">Request a copy of all personal data we hold about you.</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="font-bold text-gray-800">Right to Rectification</p>
              <p class="text-gray-600 mt-1">Correct inaccurate or incomplete data.</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="font-bold text-gray-800">Right to Erasure</p>
              <p class="text-gray-600 mt-1">Request deletion of your data, subject to legal retention requirements (e.g. health records must be retained for 6 years under Nigerian law).</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="font-bold text-gray-800">Right to Portability</p>
              <p class="text-gray-600 mt-1">Receive your data in a structured, machine-readable format.</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="font-bold text-gray-800">Right to Object</p>
              <p class="text-gray-600 mt-1">Object to processing based on legitimate interest, including marketing.</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="font-bold text-gray-800">Right to Withdraw Consent</p>
              <p class="text-gray-600 mt-1">Withdraw consent for sensitive data processing at any time. This may affect your ability to use healthcare services.</p>
            </div>
          </div>
          <p class="mt-4 text-sm">We will respond to all rights requests within <strong>30 days</strong>. If unsatisfied, you may lodge a complaint with the <strong>Nigeria Data Protection Commission (NDPC)</strong> at <a href="https://ndpc.gov.ng" class="text-primary-600 hover:underline" target="_blank">ndpc.gov.ng</a>.</p>
        </section>

        <!-- 8 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">8. Data Retention</h2>
          <div class="overflow-hidden rounded-lg border border-gray-200 text-sm">
            <table class="w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left px-4 py-3 font-bold">Data Type</th>
                  <th class="text-left px-4 py-3 font-bold">Retention Period</th>
                  <th class="text-left px-4 py-3 font-bold">Basis</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr><td class="px-4 py-3">Medical/health records</td><td class="px-4 py-3">6 years after last service</td><td class="px-4 py-3">Nigerian health law</td></tr>
                <tr><td class="px-4 py-3">Payment records</td><td class="px-4 py-3">7 years</td><td class="px-4 py-3">FIRS/tax obligations</td></tr>
                <tr><td class="px-4 py-3">Account data</td><td class="px-4 py-3">Duration of account + 90 days after deletion</td><td class="px-4 py-3">Contract</td></tr>
                <tr><td class="px-4 py-3">Audit logs</td><td class="px-4 py-3">2 years</td><td class="px-4 py-3">Security/legal</td></tr>
                <tr><td class="px-4 py-3">Communication logs (email/SMS)</td><td class="px-4 py-3">1 year</td><td class="px-4 py-3">Legitimate interest</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 9 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">9. Cookies and Tracking</h2>
          <p>LifeLine Pro uses minimal session-based storage (browser localStorage and sessionStorage) solely to maintain your login session and temporary payment state. We do <strong>not</strong> use third-party advertising cookies or cross-site trackers. No data is shared with social media platforms for advertising purposes.</p>
        </section>

        <!-- 10 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">10. Children's Privacy</h2>
          <p>LifeLine Pro does not allow direct registration by individuals under 18. Minors may only be enrolled as <strong>dependants</strong> under an adult primary subscriber. The adult subscriber is responsible for consenting on behalf of their enrolled dependants.</p>
        </section>

        <!-- 11 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">11. Cross-Border Data Transfers</h2>
          <p>Your data is primarily stored and processed in Nigeria. In limited cases (e.g. cloud infrastructure), data may be processed outside Nigeria. Where this occurs, we ensure the recipient country provides adequate data protection, or we put in place appropriate contractual safeguards as required by the NDPA 2023 and NDPC guidelines.</p>
        </section>

        <!-- 12 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">12. Changes to This Policy</h2>
          <p>We will notify you of material changes to this Privacy Policy via email and in-app notification at least <strong>14 days before</strong> the changes take effect. The "Last updated" date at the top of this page will always reflect the current version.</p>
        </section>

        <!-- 13 -->
        <section>
          <h2 class="text-xl font-black text-gray-900 mb-4">13. Contact &amp; Complaints</h2>
          <div class="bg-gray-50 rounded-xl border border-gray-200 p-5 text-sm space-y-1">
            <p><strong>Data Protection Officer — LifeLine Pro</strong></p>
            <p>Email: <a href="mailto:dpo@lifelinepro.com" class="text-primary-600 hover:underline">dpo@lifelinepro.com</a></p>
            <p>General Support: <a href="mailto:support@lifelinepro.com" class="text-primary-600 hover:underline">support@lifelinepro.com</a></p>
            <p>Phone: +234 800 000 0000</p>
            <p class="pt-2"><strong>Nigeria Data Protection Commission (NDPC):</strong> <a href="https://ndpc.gov.ng" target="_blank" class="text-primary-600 hover:underline">ndpc.gov.ng</a></p>
          </div>
        </section>

      </div>

      <!-- Footer nav -->
      <div class="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
        <RouterLink to="/terms-of-service" class="text-primary-600 hover:underline font-semibold">Terms of Service →</RouterLink>
        <RouterLink to="/register" class="text-gray-500 hover:text-gray-700">Back to Registration</RouterLink>
        <RouterLink to="/" class="text-gray-500 hover:text-gray-700">Home</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
