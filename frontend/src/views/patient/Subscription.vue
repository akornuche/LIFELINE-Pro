<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Subscription</h1>
      <p class="text-gray-600 mt-2">Manage your LifeLine Pro plan</p>
    </div>

    <!-- Current Subscription -->
    <div class="card mb-8" v-if="patientStore.subscription">
      <div class="card-header">
        <h2 class="text-xl font-semibold">Current Plan</h2>
      </div>
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-2xl font-bold capitalize">{{ patientStore.packageType }} Package</h3>
            <p class="text-gray-600 mt-1">
              Status:
              <span :class="patientStore.hasActiveSubscription ? 'text-green-600' : 'text-red-600'" class="font-semibold">
                {{ patientStore.subscription.status }}
              </span>
            </p>
            <p class="text-gray-600">
              Started: {{ formatDate(patientStore.subscription.start_date) }}
            </p>
            <p class="text-gray-600" v-if="patientStore.subscription.end_date">
              Expires: {{ formatDate(patientStore.subscription.end_date) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold text-primary-600">
              ₦{{ packagePrices[patientStore.packageType] || 0 }}
            </p>
            <p class="text-gray-600">per month</p>
          </div>
        </div>
      </div>
      <div class="card-footer flex justify-end gap-3">
        <button @click="showUpgradeModal = true" class="btn btn-primary">
          Upgrade Plan
        </button>
        <button @click="showCancelModal = true" class="btn btn-danger">
          Cancel Subscription
        </button>
      </div>
    </div>

    <!-- No Subscription -->
    <div class="card mb-8" v-else>
      <div class="card-body text-center py-12">
        <h3 class="text-2xl font-bold text-gray-900 mb-2">No Active Subscription</h3>
        <p class="text-gray-600 mb-6">Choose a plan to get started with LifeLine Pro</p>
        <button @click="showPlansModal = true" class="btn btn-primary">
          View Plans
        </button>
      </div>
    </div>

    <!-- Package Comparison -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Compare Plans</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <!-- Basic Plan -->
        <div class="card hover-lift animate-fade-in stagger-1" :class="{ 'ring-2 ring-primary-500': patientStore.packageType === 'basic' }">
          <div class="card-body">
            <h3 class="text-xl font-bold mb-2">Basic</h3>
            <p class="text-3xl font-bold text-primary-600 mb-4">₦3,500<span class="text-sm text-gray-600">/mo</span></p>
            <ul class="space-y-3 mb-6">
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">5 Consultations/month</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">10 Prescriptions/month</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">5 Lab Tests/month</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">1 Surgery/year</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">Up to 2 Dependents</span>
              </li>
            </ul>
            <button
              @click="selectPlan('basic')"
              class="btn w-full"
              :class="patientStore.packageType === 'basic' ? 'btn-secondary' : 'btn-primary'"
              :disabled="patientStore.packageType === 'basic'"
            >
              {{ patientStore.packageType === 'basic' ? 'Current Plan' : 'Select Plan' }}
            </button>
          </div>
        </div>

        <!-- Medium Plan -->
        <div class="card hover-lift animate-fade-in stagger-2" :class="{ 'ring-2 ring-primary-500': patientStore.packageType === 'medium' }">
          <div class="card-body">
            <div class="badge badge-info mb-2">Popular</div>
            <h3 class="text-xl font-bold mb-2">Medium</h3>
            <p class="text-3xl font-bold text-primary-600 mb-4">₦5,000<span class="text-sm text-gray-600">/mo</span></p>
            <ul class="space-y-3 mb-6">
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">10 Consultations/month</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">20 Prescriptions/month</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">10 Lab Tests/month</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">2 Surgeries/year</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">Up to 4 Dependents</span>
              </li>
            </ul>
            <button
              @click="selectPlan('medium')"
              class="btn w-full"
              :class="patientStore.packageType === 'medium' ? 'btn-secondary' : 'btn-primary'"
              :disabled="patientStore.packageType === 'medium'"
            >
              {{ patientStore.packageType === 'medium' ? 'Current Plan' : 'Select Plan' }}
            </button>
          </div>
        </div>

        <!-- Advanced Plan -->
        <div class="card hover-lift animate-fade-in stagger-3" :class="{ 'ring-2 ring-primary-500': patientStore.packageType === 'advanced' }">
          <div class="card-body">
            <div class="badge badge-success mb-2">Best Value</div>
            <h3 class="text-xl font-bold mb-2">Advanced</h3>
            <p class="text-3xl font-bold text-primary-600 mb-4">₦10,000<span class="text-sm text-gray-600">/mo</span></p>
            <ul class="space-y-3 mb-6">
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">Unlimited Consultations</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">Unlimited Prescriptions</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">20 Lab Tests/month</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">4 Surgeries/year</span>
              </li>
              <li class="flex items-start">
                <CheckIcon class="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <span class="text-sm">Up to 6 Dependents</span>
              </li>
            </ul>
            <button
              @click="selectPlan('advanced')"
              class="btn w-full"
              :class="patientStore.packageType === 'advanced' ? 'btn-secondary' : 'btn-primary'"
              :disabled="patientStore.packageType === 'advanced'"
            >
              {{ patientStore.packageType === 'advanced' ? 'Current Plan' : 'Select Plan' }}
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
import { CheckIcon } from '@heroicons/vue/24/outline';
import { format } from 'date-fns';

const router = useRouter();
const patientStore = usePatientStore();
const { success, error: showError } = useToast();
const { confirm } = useConfirm();

const showUpgradeModal = ref(false);
const showCancelModal = ref(false);
const showPlansModal = ref(false);

const packagePrices = {
  basic: 3500,
  medium: 5000,
  advanced: 10000
};

const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

const selectPlan = async (packageType) => {
  if (patientStore.subscription) {
    // Update existing subscription
    const confirmed = await confirm({
      title: 'Upgrade Plan',
      message: `Upgrade to ${packageType.toUpperCase()} plan for ₦${packagePrices[packageType]}/month?`,
      confirmText: 'Upgrade',
      type: 'info'
    });
    
    if (!confirmed) return;
    
    try {
      await patientStore.updateSubscription({ package_type: packageType });
      success('Subscription updated successfully!');
    } catch (error) {
      console.error('Failed to update subscription:', error);
      showError('Failed to update subscription. Please try again.');
    }
  } else {
    // Create new subscription - redirect to payment
    router.push(`/patient/payments?package=${packageType}`);
  }
};
</script>
