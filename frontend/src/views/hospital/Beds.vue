<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold text-gray-900 mb-8 animate-fade-in">Bed Management</h1>
    <BaseCard class="mb-6"><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><select v-model="filters.ward" class="input" @change="loadBeds"><option value="">All Wards</option><option value="General Ward">General Ward</option><option value="ICU">ICU</option><option value="Emergency">Emergency</option><option value="Maternity">Maternity</option></select><select v-model="filters.status" class="input" @change="loadBeds"><option value="">All Status</option><option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option></select><BaseInput v-model="filters.search" placeholder="Search bed number..." @input="handleSearch" /><BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton></div></BaseCard>
    <LoadingSpinner v-if="loading" />
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="bed in beds" :key="bed.id" class="p-4 border rounded-lg" :class="getBedBorderColor(bed.status)"><div class="flex justify-between items-start mb-2"><div><h4 class="font-semibold text-gray-900">{{ bed.bed_number }}</h4><p class="text-sm text-gray-500">{{ bed.ward }}</p></div><span :class="getBedStatusBadge(bed.status)">{{ bed.status }}</span></div><div v-if="bed.patient_name" class="mt-3"><p class="text-sm text-gray-600">Patient:</p><p class="font-medium text-gray-900">{{ bed.patient_name }}</p></div><div class="mt-3 flex gap-2"><BaseButton v-if="bed.status === 'available'" size="sm" variant="primary" fullWidth @click="assignBed(bed)">Assign</BaseButton><BaseButton v-if="bed.status === 'occupied'" size="sm" variant="outline" fullWidth @click="releaseBed(bed)">Release</BaseButton><BaseButton v-if="bed.status !== 'maintenance'" size="sm" variant="outline" fullWidth @click="setMaintenance(bed)">Maintenance</BaseButton></div></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseInput, BaseButton, LoadingSpinner } from '@/components';

const hospitalStore = useHospitalStore();
const { success, error: showError, info } = useToast();
const loading = ref(false);
const beds = ref([]);
const filters = ref({ ward: '', status: '', search: '' });

onMounted(() => loadBeds());

const loadBeds = async () => {
  loading.value = true;
  try {
    const data = await hospitalStore.getBeds(filters.value);
    beds.value = data.beds || [];
  } catch (error) {
    showError('Failed to load beds');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => loadBeds();
const resetFilters = () => { filters.value = { ward: '', status: '', search: '' }; loadBeds(); };
const assignBed = async (bed) => {
  const patientName = prompt('Enter patient name:');
  if (!patientName) return;
  try {
    await hospitalStore.updateBed(bed.id, { status: 'occupied', patient_name: patientName });
    success('Bed assigned');
    loadBeds();
  } catch (error) {
    showError('Failed to assign bed');
  }
};
const releaseBed = async (bed) => {
  try {
    await hospitalStore.updateBed(bed.id, { status: 'available', patient_name: null });
    success('Bed released');
    loadBeds();
  } catch (error) {
    showError('Failed to release bed');
  }
};
const setMaintenance = async (bed) => {
  try {
    await hospitalStore.updateBed(bed.id, { status: 'maintenance' });
    success('Bed set to maintenance');
    loadBeds();
  } catch (error) {
    showError('Failed to update bed');
  }
};
const getBedBorderColor = (status) => ({ available: 'border-green-300 bg-green-50', occupied: 'border-red-300 bg-red-50', maintenance: 'border-gray-300 bg-gray-50' }[status] || 'border-gray-300');
const getBedStatusBadge = (status) => ({ available: 'badge badge-success', occupied: 'badge badge-error', maintenance: 'badge badge-warning' }[status] || 'badge');
</script>
