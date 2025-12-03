<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Settings</h1>
    <div class="space-y-6"><BaseCard title="Facility Configuration"><form @submit.prevent="saveSettings" class="space-y-4"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><BaseInput v-model.number="settings.total_beds" label="Total Beds" type="number" required /><BaseInput v-model="settings.emergency_hours" label="Emergency Hours" placeholder="24/7" required /></div><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.emergency_services" class="checkbox" id="emergency"><label for="emergency" class="text-sm font-medium text-gray-700">24/7 Emergency Services</label></div><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.ambulance_service" class="checkbox" id="ambulance"><label for="ambulance" class="text-sm font-medium text-gray-700">Ambulance Service</label></div><BaseButton type="submit" :loading="saving">Save Facility Settings</BaseButton></form></BaseCard>
      <BaseCard title="Operating Hours"><div class="space-y-3"><div v-for="day in days" :key="day" class="flex items-center gap-4"><div class="flex items-center gap-2 w-32"><input type="checkbox" v-model="settings.operating_hours[day].enabled" class="checkbox" :id="day"><label :for="day" class="text-sm font-medium text-gray-700">{{ day }}</label></div><div v-if="settings.operating_hours[day].enabled" class="flex gap-2 flex-1"><input v-model="settings.operating_hours[day].start" type="time" class="input" /><input v-model="settings.operating_hours[day].end" type="time" class="input" /></div></div></div><BaseButton @click="saveSettings" :loading="saving" class="mt-4">Save Hours</BaseButton></BaseCard>
      <BaseCard title="Notification Preferences"><div class="space-y-3"><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.notifications.new_admissions" class="checkbox" id="admissions"><label for="admissions" class="text-sm text-gray-700">New patient admissions</label></div><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.notifications.surgery_reminders" class="checkbox" id="surgeries"><label for="surgeries" class="text-sm text-gray-700">Surgery reminders</label></div><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.notifications.bed_availability" class="checkbox" id="beds"><label for="beds" class="text-sm text-gray-700">Bed availability alerts</label></div><div class="flex items-center gap-2"><input type="checkbox" v-model="settings.notifications.payments" class="checkbox" id="payments"><label for="payments" class="text-sm text-gray-700">Payment notifications</label></div></div><BaseButton @click="saveSettings" :loading="saving" class="mt-4">Save Preferences</BaseButton></BaseCard></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseInput, BaseButton } from '@/components';

const hospitalStore = useHospitalStore();
const { success, error: showError, info } = useToast();
const saving = ref(false);
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const settings = ref({ total_beds: 0, emergency_hours: '24/7', emergency_services: false, ambulance_service: false, operating_hours: {}, notifications: { new_admissions: true, surgery_reminders: true, bed_availability: true, payments: true } });

onMounted(() => {
  days.forEach(day => {
    settings.value.operating_hours[day] = { enabled: true, start: '08:00', end: '17:00' };
  });
});

const saveSettings = async () => {
  saving.value = true;
  try {
    await hospitalStore.updateSettings(settings.value);
    success('Settings saved successfully');
  } catch (error) {
    showError('Failed to save settings');
  } finally {
    saving.value = false;
  }
};
</script>
