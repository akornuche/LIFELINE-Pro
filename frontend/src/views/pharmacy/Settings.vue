<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Settings</h1>
    <div class="space-y-6">
      <BaseCard title="Operating Hours">
        <form @submit.prevent="updateHours" class="space-y-4">
          <div v-for="day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']" :key="day" class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
            <div class="w-32"><label class="flex items-center"><input type="checkbox" v-model="hours[day].enabled" class="mr-2" /><span class="font-medium">{{ day }}</span></label></div>
            <div v-if="hours[day].enabled" class="flex items-center gap-4 flex-1">
              <BaseInput v-model="hours[day].start" type="time" class="w-32" />
              <span class="text-gray-500">to</span>
              <BaseInput v-model="hours[day].end" type="time" class="w-32" />
            </div>
          </div>
          <div class="flex justify-end"><BaseButton type="submit" :loading="saving">Save Hours</BaseButton></div>
        </form>
      </BaseCard>

      <BaseCard title="Services">
        <div class="space-y-3">
          <label class="flex items-center"><input type="checkbox" v-model="services.is_24_7" class="mr-3" /><div><p class="font-medium text-gray-900">24/7 Service</p><p class="text-sm text-gray-500">Available round the clock</p></div></label>
          <label class="flex items-center"><input type="checkbox" v-model="services.delivery" class="mr-3" /><div><p class="font-medium text-gray-900">Home Delivery</p><p class="text-sm text-gray-500">Deliver prescriptions to patients</p></div></label>
          <label class="flex items-center"><input type="checkbox" v-model="services.accepts_insurance" class="mr-3" /><div><p class="font-medium text-gray-900">Accept Insurance</p><p class="text-sm text-gray-500">Process insurance claims</p></div></label>
        </div>
      </BaseCard>

      <BaseCard title="Notifications">
        <div class="space-y-3">
          <label class="flex items-center"><input type="checkbox" v-model="notifications.new_prescriptions" class="mr-3" /><div><p class="font-medium text-gray-900">New Prescriptions</p><p class="text-sm text-gray-500">Alert for new prescriptions</p></div></label>
          <label class="flex items-center"><input type="checkbox" v-model="notifications.low_stock" class="mr-3" /><div><p class="font-medium text-gray-900">Low Stock</p><p class="text-sm text-gray-500">Alert when inventory is low</p></div></label>
          <label class="flex items-center"><input type="checkbox" v-model="notifications.payments" class="mr-3" /><div><p class="font-medium text-gray-900">Payment Updates</p><p class="text-sm text-gray-500">Notifications for transactions</p></div></label>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { usePharmacyStore } from '@/stores/pharmacy';
import { BaseCard, BaseInput, BaseButton } from '@/components';

const pharmacyStore = usePharmacyStore();
const { success, error: showError, info } = useToast();
const saving = ref(false);
const hours = ref({ Monday: { enabled: true, start: '09:00', end: '18:00' }, Tuesday: { enabled: true, start: '09:00', end: '18:00' }, Wednesday: { enabled: true, start: '09:00', end: '18:00' }, Thursday: { enabled: true, start: '09:00', end: '18:00' }, Friday: { enabled: true, start: '09:00', end: '18:00' }, Saturday: { enabled: true, start: '09:00', end: '14:00' }, Sunday: { enabled: false, start: '09:00', end: '14:00' } });
const services = ref({ is_24_7: false, delivery: false, accepts_insurance: true });
const notifications = ref({ new_prescriptions: true, low_stock: true, payments: true });

const updateHours = async () => {
  saving.value = true;
  try {
    await pharmacyStore.updateSettings({ operating_hours: hours.value, services: services.value, notifications: notifications.value });
    success('Settings updated successfully');
  } catch (error) {
    showError('Failed to update settings');
  } finally {
    saving.value = false;
  }
};
</script>
