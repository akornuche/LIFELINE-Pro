<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Settings</h1>
    <div class="space-y-6">
      <p class="text-sm text-gray-500">
        To update bed count or emergency services, visit
        <router-link to="/hospital/profile" class="text-red-600 hover:underline">Facility Profile</router-link>.
      </p>

      <BaseCard title="Operational Settings">
        <form @submit.prevent="saveSettings" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput v-model="settings.emergency_hours" label="Emergency Hours" placeholder="24/7" />
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="settings.ambulance_service" class="checkbox" id="ambulance" />
            <label for="ambulance" class="text-sm font-medium text-gray-700">Ambulance Service Available</label>
          </div>
          <BaseButton type="submit" :loading="saving">Save Settings</BaseButton>
        </form>
      </BaseCard>

      <BaseCard title="Operating Hours">
        <div class="space-y-3">
          <div v-for="item in dayHours" :key="item.day" class="flex items-center gap-4">
            <div class="flex items-center gap-2 w-32">
              <input type="checkbox" v-model="item.enabled" class="checkbox" :id="item.day" />
              <label :for="item.day" class="text-sm font-medium text-gray-700">{{ item.day }}</label>
            </div>
            <div v-if="item.enabled" class="flex gap-2 flex-1">
              <input v-model="item.start" type="time" class="input" />
              <input v-model="item.end" type="time" class="input" />
            </div>
          </div>
        </div>
        <BaseButton @click="saveSettings" :loading="saving" class="mt-4">Save Hours</BaseButton>
      </BaseCard>

      <BaseCard title="Notification Preferences">
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="settings.notifications.new_admissions" class="checkbox" id="admissions" />
            <label for="admissions" class="text-sm text-gray-700">New patient admissions</label>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="settings.notifications.surgery_reminders" class="checkbox" id="surgeries" />
            <label for="surgeries" class="text-sm text-gray-700">Surgery reminders</label>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="settings.notifications.bed_availability" class="checkbox" id="beds" />
            <label for="beds" class="text-sm text-gray-700">Bed availability alerts</label>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="settings.notifications.payments" class="checkbox" id="payments" />
            <label for="payments" class="text-sm text-gray-700">Payment notifications</label>
          </div>
        </div>
        <BaseButton @click="saveSettings" :loading="saving" class="mt-4">Save Preferences</BaseButton>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseInput, BaseButton } from '@/components';

const hospitalStore = useHospitalStore();
const { success, error: showError } = useToast();
const saving = ref(false);

// Reactive array — never has undefined index issues
const dayHours = reactive(
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .map(day => ({ day, enabled: true, start: '08:00', end: '17:00' }))
);

const settings = reactive({
  emergency_hours: '24/7',
  ambulance_service: false,
  notifications: {
    new_admissions: true,
    surgery_reminders: true,
    bed_availability: true,
    payments: true,
  },
});

onMounted(async () => {
  try {
    const profile = await hospitalStore.getProfile();
    const raw = profile?.operating_hours;
    if (raw) {
      const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (saved.hours) {
        dayHours.forEach(item => {
          const h = saved.hours[item.day];
          if (h) {
            item.enabled = Boolean(h.enabled);
            item.start = h.start || '08:00';
            item.end = h.end || '17:00';
          }
        });
      }
      if (saved.emergency_hours != null) settings.emergency_hours = saved.emergency_hours;
      if (saved.ambulance_service != null) settings.ambulance_service = Boolean(saved.ambulance_service);
      if (saved.notifications) Object.assign(settings.notifications, saved.notifications);
    }
  } catch { /* non-fatal — defaults remain */ }
});

const saveSettings = async () => {
  saving.value = true;
  try {
    const hours = {};
    dayHours.forEach(item => { hours[item.day] = { enabled: item.enabled, start: item.start, end: item.end }; });
    await hospitalStore.updateSettings({
      hours,
      emergency_hours: settings.emergency_hours,
      ambulance_service: settings.ambulance_service,
      notifications: { ...settings.notifications },
    });
    success('Settings saved successfully');
  } catch {
    showError('Failed to save settings');
  } finally {
    saving.value = false;
  }
};
</script>
