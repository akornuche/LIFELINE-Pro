<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">System Settings</h1>
    <div class="space-y-6"><BaseCard title="Platform Configuration"><form @submit.prevent="saveSettings" class="space-y-4"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><BaseInput v-model="settings.platform_name" label="Platform Name" required /><BaseInput v-model="settings.support_email" label="Support Email" type="email" required /><BaseInput v-model="settings.support_phone" label="Support Phone" required /><BaseInput v-model.number="settings.commission_rate" label="Commission Rate (%)" type="number" step="0.01" required /></div><BaseButton type="submit" :loading="saving">Save Platform Settings</BaseButton></form></BaseCard>
      <BaseCard title="Payment Gateway"><form @submit.prevent="saveSettings" class="space-y-4"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><BaseInput v-model="settings.paystack_public_key" label="Paystack Public Key" required /><BaseInput v-model="settings.paystack_secret_key" label="Paystack Secret Key" type="password" required /></div><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.enable_test_mode" class="checkbox" id="testMode"><label for="testMode" class="text-sm font-medium text-gray-700">Enable Test Mode</label></div><BaseButton type="submit" :loading="saving">Save Payment Settings</BaseButton></form></BaseCard>
      <BaseCard title="Email Configuration"><form @submit.prevent="saveSettings" class="space-y-4"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><BaseInput v-model="settings.smtp_host" label="SMTP Host" required /><BaseInput v-model.number="settings.smtp_port" label="SMTP Port" type="number" required /><BaseInput v-model="settings.smtp_username" label="SMTP Username" required /><BaseInput v-model="settings.smtp_password" label="SMTP Password" type="password" required /></div><BaseButton type="submit" :loading="saving">Save Email Settings</BaseButton></form></BaseCard>
      <BaseCard title="Feature Flags"><div class="space-y-3"><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.features.consultations" class="checkbox" id="consultations"><label for="consultations" class="text-sm text-gray-700">Enable Online Consultations</label></div><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.features.prescriptions" class="checkbox" id="prescriptions"><label for="prescriptions" class="text-sm text-gray-700">Enable E-Prescriptions</label></div><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.features.surgeries" class="checkbox" id="surgeries"><label for="surgeries" class="text-sm text-gray-700">Enable Surgery Management</label></div><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.features.subscriptions" class="checkbox" id="subscriptions"><label for="subscriptions" class="text-sm text-gray-700">Enable Subscriptions</label></div></div><BaseButton @click="saveSettings" :loading="saving" class="mt-4">Save Feature Flags</BaseButton></BaseCard></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useAdminStore } from '@/stores/admin';
import { BaseCard, BaseInput, BaseButton } from '@/components';

const adminStore = useAdminStore();
const { success, error: showError, info } = useToast();
const saving = ref(false);
const settings = ref({ platform_name: 'LIFELINE Pro', support_email: 'support@lifelinepro.com', support_phone: '+234 800 000 0000', commission_rate: 5.0, paystack_public_key: '', paystack_secret_key: '', enable_test_mode: true, smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '', features: { consultations: true, prescriptions: true, surgeries: true, subscriptions: true } });

onMounted(async () => {
  try {
    const data = await adminStore.getSettings();
    if (data) settings.value = { ...settings.value, ...data };
  } catch (error) {
    // Use default settings
  }
});

const saveSettings = async () => {
  saving.value = true;
  try {
    await adminStore.updateSettings(settings.value);
    success('Settings saved successfully');
  } catch (error) {
    showError('Failed to save settings');
  } finally {
    saving.value = false;
  }
};
</script>
