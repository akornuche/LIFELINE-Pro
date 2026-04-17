<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full mx-4">
      <div class="card p-8 text-center">
        <!-- Loading state -->
        <div v-if="status === 'verifying'" class="space-y-4">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <h2 class="text-xl font-bold text-gray-900">Verifying Payment...</h2>
          <p class="text-gray-500">Please wait while we confirm your payment with Paystack.</p>
        </div>

        <!-- Success state -->
        <div v-else-if="status === 'success'" class="space-y-4">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircleIcon class="h-10 w-10 text-green-600" />
          </div>
          <h2 class="text-2xl font-black text-gray-900">Payment Successful!</h2>
          <p class="text-gray-600">Your <strong class="capitalize">{{ packageType }}</strong> subscription has been activated.</p>
          <p class="text-sm text-gray-400">Redirecting to your dashboard...</p>
        </div>

        <!-- Failed state -->
        <div v-else-if="status === 'failed'" class="space-y-4">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <XCircleIcon class="h-10 w-10 text-red-600" />
          </div>
          <h2 class="text-2xl font-black text-gray-900">Payment Failed</h2>
          <p class="text-gray-600">{{ errorMessage }}</p>
          <button @click="goBack" class="btn-primary w-full mt-4">
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePatientStore } from '@/stores/patient';
import { paymentService } from '@/services';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const route = useRoute();
const patientStore = usePatientStore();

const status = ref('verifying');
const packageType = ref('');
const errorMessage = ref('Payment could not be verified. Please contact support.');

onMounted(async () => {
  const reference = route.query.reference || sessionStorage.getItem('pendingPaymentReference');
  const pendingPackage = sessionStorage.getItem('pendingPackageType');
  packageType.value = pendingPackage || 'unknown';

  if (!reference) {
    status.value = 'failed';
    errorMessage.value = 'No payment reference found. Please try again.';
    return;
  }

  try {
    // Verify with backend
    const response = await paymentService.verifyPayment(reference);
    const result = response.data || response;

    if (result.status === 'success') {
      // Activate/update subscription
      const isRenewal = patientStore.hasActiveSubscription;
      try {
        if (isRenewal) {
          await patientStore.updateSubscription({
            packageType: pendingPackage,
            autoRenew: true,
            subscriptionStatus: 'active',
          });
        } else {
          await patientStore.createSubscription({
            packageType: pendingPackage,
            autoRenew: true,
            subscriptionStatus: 'active',
          });
        }
        await patientStore.fetchSubscription();
      } catch (subErr) {
        console.error('Subscription activation error after payment:', subErr);
      }

      // Clean up session storage
      sessionStorage.removeItem('pendingPackageType');
      sessionStorage.removeItem('pendingPaymentReference');

      status.value = 'success';
      setTimeout(() => {
        router.push('/patient');
      }, 2500);
    } else {
      status.value = 'failed';
      errorMessage.value = 'Your payment was not completed. Please try again.';
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    status.value = 'failed';
    errorMessage.value = err.response?.data?.message || 'Payment verification failed.';
  }
});

const goBack = () => {
  router.push('/patient/subscription');
};
</script>
