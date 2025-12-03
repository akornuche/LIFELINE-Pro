import { defineStore } from 'pinia';
import { ref } from 'vue';
import { paymentService } from '@/services';
import { toast } from 'vue3-toastify';

export const usePaymentStore = defineStore('payment', () => {
  // State
  const paymentHistory = ref([]);
  const providerPayments = ref([]);
  const statements = ref([]);
  const pendingStatements = ref([]);
  const analytics = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Actions
  async function initializePayment(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.initializePayment(data);
      toast.success('Payment initialized. Redirecting...');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Payment initialization failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function verifyPayment(reference) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.verifyPayment(reference);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Payment verification failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPaymentHistory(params = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.getPaymentHistory(params);
      paymentHistory.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch payment history';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProviderPayments(params = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.getProviderPayments(params);
      providerPayments.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch provider payments';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function generateStatement(data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.generateStatement(data);
      toast.success('Statement generated successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Statement generation failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatements(params = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.getStatements(params);
      statements.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch statements';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPendingStatements(params = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.getPendingStatements(params);
      pendingStatements.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch pending statements';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function approveStatement(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.approveStatement(id);
      toast.success('Statement approved successfully');
      // Update local state
      const index = pendingStatements.value.findIndex(s => s.id === id);
      if (index !== -1) {
        pendingStatements.value.splice(index, 1);
      }
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Statement approval failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function rejectStatement(id, reason) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.rejectStatement(id, { reason });
      toast.success('Statement rejected');
      // Update local state
      const index = pendingStatements.value.findIndex(s => s.id === id);
      if (index !== -1) {
        pendingStatements.value.splice(index, 1);
      }
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Statement rejection failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAnalytics(params = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.getPaymentAnalytics(params);
      analytics.value = response.data;
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch analytics';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function processRefund(id, data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await paymentService.processRefund(id, data);
      toast.success('Refund processed successfully');
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Refund processing failed';
      toast.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    paymentHistory.value = [];
    providerPayments.value = [];
    statements.value = [];
    pendingStatements.value = [];
    analytics.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    paymentHistory,
    providerPayments,
    statements,
    pendingStatements,
    analytics,
    loading,
    error,
    // Actions
    initializePayment,
    verifyPayment,
    fetchPaymentHistory,
    fetchProviderPayments,
    generateStatement,
    fetchStatements,
    fetchPendingStatements,
    approveStatement,
    rejectStatement,
    fetchAnalytics,
    processRefund,
    reset
  };
});
