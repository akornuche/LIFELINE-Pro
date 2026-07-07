<template>
  <div class="page-container">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Bed Management</h1>
      <BaseButton variant="primary" @click="openAddModal">+ Add Bed</BaseButton>
    </div>

    <BaseCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select v-model="filters.ward" class="input" @change="loadBeds">
          <option value="">All Wards</option>
          <option value="General Ward">General Ward</option>
          <option value="ICU">ICU</option>
          <option value="Emergency">Emergency</option>
          <option value="Maternity">Maternity</option>
          <option value="Paediatric">Paediatric</option>
        </select>
        <select v-model="filters.status" class="input" @change="loadBeds">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <BaseInput v-model="filters.search" placeholder="Search bed number..." @input="handleSearch" />
        <BaseButton variant="outline" @click="resetFilters" fullWidth>Reset</BaseButton>
      </div>
    </BaseCard>

    <LoadingSpinner v-if="loading" />
    <div v-else-if="beds.length === 0" class="text-center py-16 text-gray-500">
      <p class="text-lg font-medium">No beds registered yet.</p>
      <p class="text-sm mt-1">Click <strong>+ Add Bed</strong> to register your first bed.</p>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="bed in beds" :key="bed.id" class="p-4 border rounded-lg" :class="getBedBorderColor(bed.status)">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h4 class="font-semibold text-gray-900">{{ bed.bed_number }}</h4>
            <p class="text-sm text-gray-500">{{ bed.ward }}</p>
          </div>
          <span :class="getBedStatusBadge(bed.status)">{{ bed.status }}</span>
        </div>
        <div v-if="bed.patient_name" class="mt-3">
          <p class="text-sm text-gray-600">Patient:</p>
          <p class="font-medium text-gray-900">{{ bed.patient_name }}</p>
        </div>
        <div v-if="bed.notes" class="mt-2 text-xs text-gray-500 italic">{{ bed.notes }}</div>
        <div class="mt-3 flex flex-wrap gap-2">
          <BaseButton v-if="bed.status === 'available'" size="sm" variant="primary" fullWidth @click="assignBed(bed)">Assign</BaseButton>
          <BaseButton v-if="bed.status === 'occupied'" size="sm" variant="outline" fullWidth @click="releaseBed(bed)">Release</BaseButton>
          <BaseButton v-if="bed.status !== 'maintenance'" size="sm" variant="outline" fullWidth @click="setMaintenance(bed)">Maintenance</BaseButton>
          <BaseButton size="sm" variant="danger" fullWidth @click="removeBed(bed)">Delete</BaseButton>
        </div>
      </div>
    </div>

    <!-- Add Bed Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeAddModal">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Add New Bed</h2>
          <form @submit.prevent="handleAddBed" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bed Number <span class="text-red-500">*</span></label>
              <input v-model="newBed.bed_number" type="text" class="input w-full" placeholder="e.g. A-101, ICU-01" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ward <span class="text-red-500">*</span></label>
              <select v-model="newBed.ward" class="input w-full" required>
                <option value="General Ward">General Ward</option>
                <option value="ICU">ICU</option>
                <option value="Emergency">Emergency</option>
                <option value="Maternity">Maternity</option>
                <option value="Paediatric">Paediatric</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea v-model="newBed.notes" class="input w-full" rows="2" placeholder="Optional notes about this bed"></textarea>
            </div>
            <div class="flex gap-3 pt-2">
              <BaseButton type="button" variant="outline" fullWidth @click="closeAddModal">Cancel</BaseButton>
              <BaseButton type="submit" variant="primary" fullWidth :loading="saving">Add Bed</BaseButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useHospitalStore } from '@/stores/hospital';
import { BaseCard, BaseInput, BaseButton, LoadingSpinner } from '@/components';

const hospitalStore = useHospitalStore();
const { success, error: showError } = useToast();
const loading = ref(false);
const saving = ref(false);
const beds = ref([]);
const filters = ref({ ward: '', status: '', search: '' });
const showAddModal = ref(false);
const newBed = ref({ bed_number: '', ward: 'General Ward', notes: '' });

onMounted(() => loadBeds());

const openAddModal = () => {
  newBed.value = { bed_number: '', ward: 'General Ward', notes: '' };
  showAddModal.value = true;
};
const closeAddModal = () => { showAddModal.value = false; };

const handleAddBed = async () => {
  if (!newBed.value.bed_number.trim()) { showError('Bed number is required'); return; }
  saving.value = true;
  try {
    await hospitalStore.createBed(newBed.value);
    success(`Bed ${newBed.value.bed_number} added`);
    closeAddModal();
    loadBeds();
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to add bed');
  } finally {
    saving.value = false;
  }
};

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
const removeBed = async (bed) => {
  if (!confirm(`Delete bed ${bed.bed_number}? This cannot be undone.`)) return;
  try {
    await hospitalStore.deleteBed(bed.id);
    success(`Bed ${bed.bed_number} deleted`);
    beds.value = beds.value.filter(b => b.id !== bed.id);
  } catch (error) {
    showError('Failed to delete bed');
  }
};
const getBedBorderColor = (status) => ({ available: 'border-green-300 bg-green-50', occupied: 'border-red-300 bg-red-50', maintenance: 'border-gray-300 bg-gray-50' }[status] || 'border-gray-300');
const getBedStatusBadge = (status) => ({ available: 'badge badge-success', occupied: 'badge badge-error', maintenance: 'badge badge-warning' }[status] || 'badge');
</script>
