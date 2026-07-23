<template>
  <div class="page-container">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Subscription</h1>
        <p class="text-gray-600 mt-2">Manage your LifeLine plan and benefits</p>
      </div>
      <div v-if="patientStore.hasActiveSubscription" class="text-right">
        <div class="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full border border-primary-100 shadow-sm animate-pulse">
          <ClockIcon class="h-5 w-5 text-primary-600 mr-2" />
          <span class="text-primary-700 font-bold text-sm">
            {{ patientStore.daysRemaining }} Days Remaining
          </span>
        </div>
      </div>
    </div>

    <!-- Step 1: Email Verification Gate -->
    <div v-if="!authStore.isEmailVerified" class="mb-8 p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg shadow-sm">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="h-6 w-6 text-amber-500" />
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-lg font-bold text-amber-800">Step 1 of 2 — Verify your email address</h3>
          <p class="mt-1 text-sm text-amber-700">A verification link was sent to <strong>{{ authStore.user?.email }}</strong>. Click the link in that email, then come back here to select a plan.</p>
          <div class="mt-3 flex items-center gap-4">
            <button
              @click="handleResendVerification"
              :disabled="resendingVerification || verificationResent"
              class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ verificationResent ? 'Email sent ✓' : (resendingVerification ? 'Sending…' : 'Resend verification email') }}
            </button>
            <span class="text-xs text-amber-600">Check your spam folder if you don't see it.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2 / Alert for Inactive Subscription (only show when email is verified) -->
    <div v-else-if="!patientStore.hasActiveSubscription" class="mb-8 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm animate-bounce-in">
      <div class="flex">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="h-6 w-6 text-red-500" />
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-bold text-red-800">Step 2 of 2 — Choose a subscription plan</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>Your email is verified. Now select a package below to activate your LifeLine account.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Subscription Card -->
    <div class="card mb-10 overflow-hidden shadow-premium transition-all hover:shadow-xl" v-if="patientStore.subscription">
      <div class="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-white flex items-center">
            <CreditCardIcon class="h-6 w-6 mr-2" />
            Current Active Plan
          </h2>
          <span class="badge badge-success bg-white/20 text-white border-white/30 backdrop-blur-sm">Active</span>
        </div>
      </div>
      <div class="card-body p-8">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div class="space-y-4">
            <div>
              <h3 class="text-3xl font-black text-gray-900 capitalize tracking-tight">{{ patientStore.packageType }} Plan</h3>
              <p class="text-gray-500 mt-1 font-medium">Enjoying all {{ patientStore.packageType }} benefits</p>
            </div>
            <div class="pt-4 border-t border-gray-100 flex gap-10">
              <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Expires On</p>
                <p class="font-bold text-gray-900">{{ formatDate(patientStore.subscription.end_date) }}</p>
              </div>
              <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Yearly Plan</p>
                <p class="font-extrabold text-primary-600 text-xl">₦{{ packagePrices[patientStore.packageType] || 0 }}</p>
              </div>
            </div>
          </div>
          
          <!-- Countdown Visualization -->
          <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
            <div class="relative inline-flex items-center justify-center p-1 mb-2">
              <svg class="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="transparent"
                  class="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="transparent"
                  :stroke-dasharray="2 * Math.PI * 58"
                  :stroke-dashoffset="2 * Math.PI * 58 * (1 - patientStore.subscriptionProgress)"
                  :class="patientStore.daysRemaining <= 30 ? 'text-red-500' : 'text-primary-600'"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <div class="absolute flex flex-col items-center">
                <span class="text-3xl font-black text-gray-900">{{ patientStore.daysRemaining }}</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase">Days Left</span>
              </div>
            </div>
            <p class="text-xs text-gray-500">of {{ patientStore.subscriptionTotalDays }}-day plan</p>
            <p v-if="patientStore.daysRemaining <= 30" class="text-xs font-bold text-primary-600 animate-pulse mt-1">Renewal link now active!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Package Comparison -->
    <div class="mb-8">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-black text-gray-900 mb-4">{{ patientStore.hasActiveSubscription ? 'Plan Options & Renewal' : 'Available Subscription Packages' }}</h2>
        <p class="text-gray-600 max-w-2xl mx-auto">
          {{ patientStore.canRenew 
              ? 'Choose or renew your package below. Since you are within the 30-day window or have no active sub, you can select a plan now.' 
              : `Renewal is locked until you are within 30 days of your expiry date (${formatDate(new Date(new Date(patientStore.subscription.end_date) - (30 * 24 * 60 * 60 * 1000)))}).` }}
        </p>
      </div>
      
      <div class="grid lg:grid-cols-4 gap-6">
        <!-- General Plan -->
        <div 
          class="card flex flex-col transition-all duration-300" 
          :class="[
            patientStore.packageType === 'general' ? 'ring-4 ring-primary-500 shadow-2xl scale-105 z-10' : 'hover:scale-[1.02] shadow-lg',
            patientStore.getPlanAction('general').isDowngrade ? 'opacity-40 grayscale-[0.3]' : ''
          ]"
        >
          <div class="p-6 flex-1">
            <div class="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded-full mb-3">General</div>
            <h3 class="text-xl font-black mb-1">General</h3>
            <p class="text-gray-500 text-sm mb-4">Doctor consultations only</p>
            <div class="flex items-baseline mb-6">
              <span class="text-4xl font-black text-gray-900 tracking-tighter">₦1,500</span>
              <span class="text-gray-500 ml-1 font-bold">/month</span>
            </div>
            
            <ul class="space-y-3 mb-6">
              <li v-for="(feature, index) in generalFeatures" :key="index" class="flex items-start group">
                <div class="bg-green-100 p-1 rounded-full mr-2 group-hover:scale-110 transition-transform flex-shrink-0">
                  <CheckIcon class="h-3 w-3 text-green-600" />
                </div>
                <span class="text-gray-700 text-xs font-medium">{{ feature }}</span>
              </li>
            </ul>
          </div>
          
          <div class="p-6 pt-0 mt-auto">
            <button
              @click="selectPlan('general')"
              class="w-full py-3 rounded-xl font-black text-sm transition-all"
              :class="[
                !authStore.isEmailVerified ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : patientStore.getPlanAction('general').isCurrent ? 'bg-primary-100 text-primary-700 cursor-default'
                : patientStore.getPlanAction('general').isDowngrade ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg'
              ]"
              :disabled="!authStore.isEmailVerified || patientStore.getPlanAction('general').disabled"
            >
              {{ !authStore.isEmailVerified ? 'Verify email first' : patientStore.getPlanAction('general').label }}
            </button>
          </div>
        </div>

        <!-- Basic Insurance -->
        <div 
          class="card flex flex-col transition-all duration-300" 
          :class="[
            patientStore.packageType === 'basic' ? 'ring-4 ring-primary-500 shadow-2xl scale-105 z-10' : 'hover:scale-[1.02] shadow-lg',
            patientStore.getPlanAction('basic').isDowngrade ? 'opacity-40 grayscale-[0.3]' : ''
          ]"
        >
          <div class="p-6 flex-1">
            <div class="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full mb-3">Insurance</div>
            <h3 class="text-xl font-black mb-1">Basic</h3>
            <p class="text-gray-500 text-sm mb-4">Common illnesses coverage</p>
            <div class="flex items-baseline mb-6">
              <span class="text-4xl font-black text-gray-900 tracking-tighter">₦3,500</span>
              <span class="text-gray-500 ml-1 font-bold">/month</span>
            </div>
            
            <ul class="space-y-3 mb-6">
              <li v-for="(feature, index) in basicFeatures" :key="index" class="flex items-start group">
                <div class="bg-green-100 p-1 rounded-full mr-2 group-hover:scale-110 transition-transform flex-shrink-0">
                  <CheckIcon class="h-3 w-3 text-green-600" />
                </div>
                <span class="text-gray-700 text-xs font-medium">{{ feature }}</span>
              </li>
            </ul>
          </div>
          
          <div class="p-6 pt-0 mt-auto">
            <button
              @click="selectPlan('basic')"
              class="w-full py-3 rounded-xl font-black text-sm transition-all"
              :class="[
                !authStore.isEmailVerified ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : patientStore.getPlanAction('basic').isCurrent ? 'bg-primary-100 text-primary-700 cursor-default'
                : patientStore.getPlanAction('basic').isDowngrade ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg'
              ]"
              :disabled="!authStore.isEmailVerified || patientStore.getPlanAction('basic').disabled"
            >
              {{ !authStore.isEmailVerified ? 'Verify email first' : patientStore.getPlanAction('basic').label }}
            </button>
          </div>
        </div>

        <!-- Standard Insurance (Featured) -->
        <div 
          class="card flex flex-col relative transition-all duration-300" 
          :class="[
            patientStore.packageType === 'standard' ? 'ring-4 ring-primary-500 shadow-2xl scale-105 z-10' : 'hover:scale-[1.02] shadow-lg',
            patientStore.getPlanAction('standard').isDowngrade ? 'opacity-40 grayscale-[0.3]' : ''
          ]"
        >
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-secondary-500 text-white px-5 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">Most Popular</div>
          <div class="p-6 flex-1">
            <div class="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full mb-3">Insurance</div>
            <h3 class="text-xl font-black mb-1">Standard</h3>
            <p class="text-gray-500 text-sm mb-4">Illnesses + minor surgeries</p>
            <div class="flex items-baseline mb-6">
              <span class="text-4xl font-black text-gray-900 tracking-tighter">₦5,500</span>
              <span class="text-gray-500 ml-1 font-bold">/month</span>
            </div>
            
            <ul class="space-y-3 mb-6">
              <li v-for="(feature, index) in standardFeatures" :key="index" class="flex items-start group">
                <div class="bg-green-100 p-1 rounded-full mr-2 group-hover:scale-110 transition-transform flex-shrink-0">
                  <CheckIcon class="h-3 w-3 text-green-600" />
                </div>
                <span class="text-gray-700 text-xs font-medium">{{ feature }}</span>
              </li>
            </ul>
          </div>
          
          <div class="p-6 pt-0 mt-auto">
            <button
              @click="selectPlan('standard')"
              class="w-full py-3 rounded-xl font-black text-sm transition-all"
              :class="[
                !authStore.isEmailVerified ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : patientStore.getPlanAction('standard').isCurrent ? 'bg-primary-100 text-primary-700 cursor-default'
                : patientStore.getPlanAction('standard').isDowngrade ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-secondary-600 text-white hover:bg-secondary-700 hover:shadow-lg'
              ]"
              :disabled="!authStore.isEmailVerified || patientStore.getPlanAction('standard').disabled"
            >
              {{ !authStore.isEmailVerified ? 'Verify email first' : patientStore.getPlanAction('standard').label }}
            </button>
          </div>
        </div>

        <!-- Premium Insurance -->
        <div 
          class="card flex flex-col relative transition-all duration-300" 
          :class="[
            patientStore.packageType === 'premium' ? 'ring-4 ring-primary-500 shadow-2xl scale-105 z-10' : 'hover:scale-[1.02] shadow-lg'
          ]"
        >
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-5 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">Premium</div>
          <div class="p-6 flex-1">
            <div class="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase rounded-full mb-3">Full Coverage</div>
            <h3 class="text-xl font-black mb-1">Premium</h3>
            <p class="text-gray-500 text-sm mb-4">Complete health safety net</p>
            <div class="flex items-baseline mb-6">
              <span class="text-4xl font-black text-gray-900 tracking-tighter">₦10,000</span>
              <span class="text-gray-500 ml-1 font-bold">/month</span>
            </div>
            
            <ul class="space-y-3 mb-6">
              <li v-for="(feature, index) in premiumFeatures" :key="index" class="flex items-start group">
                <div class="bg-green-100 p-1 rounded-full mr-2 group-hover:scale-110 transition-transform flex-shrink-0">
                  <CheckIcon class="h-3 w-3 text-green-600" />
                </div>
                <span class="text-gray-700 text-xs font-medium">{{ feature }}</span>
              </li>
            </ul>
          </div>
          
          <div class="p-6 pt-0 mt-auto">
            <button
              @click="selectPlan('premium')"
              class="w-full py-3 rounded-xl font-black text-sm transition-all"
              :class="[
                !authStore.isEmailVerified ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : patientStore.getPlanAction('premium').isCurrent ? 'bg-primary-100 text-primary-700 cursor-default'
                : 'bg-gray-900 text-white hover:bg-black hover:shadow-lg'
              ]"
              :disabled="!authStore.isEmailVerified || patientStore.getPlanAction('premium').disabled"
            >
              {{ !authStore.isEmailVerified ? 'Verify email first' : patientStore.getPlanAction('premium').label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usePatientStore } from '@/stores/patient';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { paymentService } from '@/services';
import { 
  CheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CreditCardIcon 
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const router = useRouter();
const authStore = useAuthStore();
const patientStore = usePatientStore();
const { success, error: showError } = useToast();
const { confirm } = useConfirm();

const resendingVerification = ref(false);
const verificationResent = ref(false);
const paymentProcessing = ref(false);

const handleResendVerification = async () => {
  if (resendingVerification.value || verificationResent.value) return;
  resendingVerification.value = true;
  try {
    // Uses the signed-in user's registered email; subscription restrictions do not apply here.
    await authStore.resendVerification();
    verificationResent.value = true;
  } catch (e) {
    showError('Failed to resend verification email. Please try again.');
  } finally {
    resendingVerification.value = false;
  }
};

const packagePrices = {
  general: 1500,
  basic: 3500,
  standard: 5500,
  premium: 10000
};

const generalFeatures = [
  'Doctor consultations only',
  '5 Consultations / month',
  'Basic lab tests (3 / month)',
  'Prescriptions (doctor-issued only)',
  'Up to 4 Dependents',
  'No pharmacy / hospital access'
];

const basicFeatures = [
  'Common illnesses coverage',
  '8 Consultations / month',
  '5 Lab Tests / month',
  'Pharmacy access (10 dispensings / month)',
  'Hospital admission (up to 3 days)',
  'Up to 4 Dependents'
];

const standardFeatures = [
  'Common illnesses + minor surgeries',
  '10 Consultations / month',
  '10 Lab Tests / month',
  '2 Minor Surgeries / year',
  'Specialist consultations',
  'Up to 4 Dependents',
  'Basic imaging (X-ray, Ultrasound)'
];

const premiumFeatures = [
  'Full coverage including major surgeries',
  'Unlimited Consultations',
  'Unlimited Lab Tests',
  'Childbirth & major surgery coverage',
  'Up to 6 Dependents',
  'Premium specialist support',
  'Advanced imaging (CT, MRI)',
  'Priority care & home visits'
];

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return 'Invalid date';
  }
};

const selectPlan = async (packageType) => {
  // Block payment if email is not verified
  if (!authStore.isEmailVerified) {
    showError('Please verify your email address before subscribing. Check your inbox for the verification link.');
    return;
  }

  // Prevent double-click / re-submission
  if (paymentProcessing.value) return;

  const isRenewal = patientStore.hasActiveSubscription;
  const amount = packagePrices[packageType];
  
  const confirmed = await confirm({
    title: isRenewal ? 'Renew/Change Plan' : 'Select Plan',
    message: `${isRenewal ? 'Switch/Renew' : 'Subscribe'} to ${packageType.toUpperCase()} plan for ₦${amount}/month?`,
    confirmText: 'Proceed to Payment',
    type: 'info'
  });
  
  if (!confirmed) return;

  paymentProcessing.value = true;
  
  try {
    // Generate a unique idempotency key for this specific payment attempt
    // This ensures that even if the request is retried (network timeout, user refresh),
    // only one payment record is created on the backend
    const idempotencyKey = crypto.randomUUID();

    // Initialize Paystack payment
    const response = await paymentService.initializePayment({
      amount,
      paymentMethod: 'card',
      paymentType: 'subscription',
      description: `${packageType.charAt(0).toUpperCase() + packageType.slice(1)} subscription plan`,
      metadata: { packageType, isRenewal },
    }, idempotencyKey);

    const { authorizationUrl, paymentReference } = response.data || response;

    // Store pending package info so callback can activate subscription
    sessionStorage.setItem('pendingPackageType', packageType);
    sessionStorage.setItem('pendingPaymentReference', paymentReference);

    if (authorizationUrl && !authorizationUrl.includes('localhost')) {
      // Live Paystack — redirect to payment page
      window.location.href = authorizationUrl;
    } else {
      // Dev/mock mode — simulate successful payment and activate subscription directly
      success('Dev mode: simulating payment success...');
      await activateSubscription(packageType, isRenewal);
    }
  } catch (err) {
    console.error('Payment error:', err);
    showError(err.response?.data?.message || 'Payment initialization failed. Please try again.');
    paymentProcessing.value = false;
  }
};

const activateSubscription = async (packageType, isRenewal) => {
  try {
    if (isRenewal) {
      await patientStore.updateSubscription({ 
        packageType,
        autoRenew: true,
        subscriptionStatus: 'active'
      });
    } else {
      await patientStore.createSubscription({
        packageType,
        autoRenew: true,
        subscriptionStatus: 'active'
      });
    }
    
    success(`Plan ${packageType} activated! Unlocking your dashboard...`);
    await patientStore.fetchSubscription();
    
    setTimeout(() => {
      router.push('/patient');
    }, 1500);
  } catch (error) {
    console.error('Subscription activation error:', error);
    showError(error.response?.data?.message || 'Subscription activation failed.');
  }
};
</script>
