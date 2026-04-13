<template>
  <div class="page-container">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Subscription</h1>
        <p class="text-gray-600 mt-2">Manage your LifeLine Pro plan and benefits</p>
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

    <!-- Alert for Inactive Subscription -->
    <div v-if="!patientStore.hasActiveSubscription" class="mb-8 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm animate-bounce-in">
      <div class="flex">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="h-6 w-6 text-red-500" />
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-bold text-red-800">Subscription Required</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>Your dashboard is currently locked. Please select a package below to continue using LifeLine Pro services.</p>
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
                  :stroke-dashoffset="2 * Math.PI * 58 * (1 - patientStore.daysRemaining / 365)"
                  :class="patientStore.daysRemaining <= 30 ? 'text-red-500' : 'text-primary-600'"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <div class="absolute flex flex-col items-center">
                <span class="text-3xl font-black text-gray-900">{{ patientStore.daysRemaining }}</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase">Days Left</span>
              </div>
            </div>
            <p v-if="patientStore.daysRemaining <= 30" class="text-xs font-bold text-primary-600 animate-pulse">Renewal link now active!</p>
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
            !patientStore.canRenew && patientStore.packageType !== 'general' ? 'opacity-50 grayscale-[0.5]' : ''
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
                patientStore.packageType === 'general' ? 'bg-primary-100 text-primary-700 cursor-default' : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg'
              ]"
              :disabled="!patientStore.canRenew || patientStore.packageType === 'general'"
            >
              {{ patientStore.packageType === 'general' ? 'Currently Active' : (patientStore.hasActiveSubscription ? 'Switch' : 'Select') }}
            </button>
          </div>
        </div>

        <!-- Basic Insurance -->
        <div 
          class="card flex flex-col transition-all duration-300" 
          :class="[
            patientStore.packageType === 'basic' ? 'ring-4 ring-primary-500 shadow-2xl scale-105 z-10' : 'hover:scale-[1.02] shadow-lg',
            !patientStore.canRenew && patientStore.packageType !== 'basic' ? 'opacity-50 grayscale-[0.5]' : ''
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
                patientStore.packageType === 'basic' ? 'bg-primary-100 text-primary-700 cursor-default' : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg'
              ]"
              :disabled="!patientStore.canRenew || patientStore.packageType === 'basic'"
            >
              {{ patientStore.packageType === 'basic' ? 'Currently Active' : (patientStore.hasActiveSubscription ? 'Switch' : 'Select') }}
            </button>
          </div>
        </div>

        <!-- Standard Insurance (Featured) -->
        <div 
          class="card flex flex-col relative transition-all duration-300" 
          :class="[
            patientStore.packageType === 'standard' ? 'ring-4 ring-primary-500 shadow-2xl scale-105 z-10' : 'hover:scale-[1.02] shadow-lg',
            !patientStore.canRenew && patientStore.packageType !== 'standard' ? 'opacity-50 grayscale-[0.5]' : ''
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
                patientStore.packageType === 'standard' ? 'bg-primary-100 text-primary-700 cursor-default' : 'bg-secondary-600 text-white hover:bg-secondary-700 hover:shadow-lg'
              ]"
              :disabled="!patientStore.canRenew || patientStore.packageType === 'standard'"
            >
              {{ patientStore.packageType === 'standard' ? 'Currently Active' : (patientStore.hasActiveSubscription ? 'Upgrade' : 'Select') }}
            </button>
          </div>
        </div>

        <!-- Premium Insurance -->
        <div 
          class="card flex flex-col relative transition-all duration-300" 
          :class="[
            patientStore.packageType === 'premium' ? 'ring-4 ring-primary-500 shadow-2xl scale-105 z-10' : 'hover:scale-[1.02] shadow-lg',
            !patientStore.canRenew && patientStore.packageType !== 'premium' ? 'opacity-50 grayscale-[0.5]' : ''
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
                patientStore.packageType === 'premium' ? 'bg-primary-100 text-primary-700 cursor-default' : 'bg-gray-900 text-white hover:bg-black hover:shadow-lg'
              ]"
              :disabled="!patientStore.canRenew || patientStore.packageType === 'premium'"
            >
              {{ patientStore.packageType === 'premium' ? 'Currently Active' : (patientStore.hasActiveSubscription ? 'Ultimate Upgrade' : 'Select') }}
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
import { usePatientStore } from '@/stores/patient';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { 
  CheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CreditCardIcon 
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const router = useRouter();
const patientStore = usePatientStore();
const { success, error: showError } = useToast();
const { confirm } = useConfirm();

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
  const isRenewal = patientStore.hasActiveSubscription;
  
  const confirmed = await confirm({
    title: isRenewal ? 'Renew/Change Plan' : 'Select Plan',
    message: `${isRenewal ? 'Switch/Renew' : 'Subscribe'} to ${packageType.toUpperCase()} plan for ₦${packagePrices[packageType]}/year?`,
    confirmText: 'Confirm Payment',
    type: 'info'
  });
  
  if (!confirmed) return;
  
  try {
    if (isRenewal) {
      await patientStore.updateSubscription({ 
        packageType: packageType,
        autoRenew: true,
        subscriptionStatus: 'active'
      });
    } else {
      await patientStore.createSubscription({
        packageType: packageType,
        autoRenew: true,
        subscriptionStatus: 'active'
      });
    }
    
    success(`Plan ${packageType} activated! Unlocking your dashboard...`);
    await patientStore.fetchSubscription();
    
    // Redirect to dashboard after selection
    setTimeout(() => {
      router.push('/patient');
    }, 1500);
    
  } catch (error) {
    console.error('Subscription error:', error);
    showError(error.response?.data?.message || 'Transaction failed. Please try again.');
  }
};
</script>
