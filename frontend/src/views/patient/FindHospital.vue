<template>
  <div class="page-container">
    <div class="mb-8 animate-fade-in">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Find a Hospital</h1>
      <p class="text-gray-600 mt-2">Search for hospitals and medical centers</p>
    </div>

    <!-- Search Bar -->
    <div class="card mb-6">
      <div class="card-body">
        <div class="flex gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, location, services..."
              class="input"
              @keyup.enter="searchHospitals"
            />
          </div>
          <button @click="searchHospitals" class="btn btn-primary">
            <MagnifyingGlassIcon class="h-5 w-5 mr-2" />
            Search
          </button>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-4 gap-6">
      <!-- Filters Sidebar -->
      <div class="lg:col-span-1">
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Filters</h3>
          </div>
          <div class="card-body space-y-6">
            <!-- Type Filter -->
            <div>
              <label class="form-label">Hospital Type</label>
              <select v-model="filters.type" class="input" @change="searchHospitals">
                <option value="">All Types</option>
                <option value="general">General Hospital</option>
                <option value="specialist">Specialist Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="teaching">Teaching Hospital</option>
              </select>
            </div>

            <!-- Verification Filter -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="filters.verified"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="searchHospitals"
                />
                <span class="ml-2 text-sm text-gray-700">Verified Only</span>
              </label>
            </div>

            <!-- Emergency Services Filter -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="filters.emergencyServices"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="searchHospitals"
                />
                <span class="ml-2 text-sm text-gray-700">Emergency Services</span>
              </label>
            </div>

            <!-- Available Beds Filter -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="filters.hasAvailableBeds"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="searchHospitals"
                />
                <span class="ml-2 text-sm text-gray-700">Available Beds</span>
              </label>
            </div>

            <!-- Rating Filter -->
            <div>
              <label class="form-label">Minimum Rating</label>
              <select v-model.number="filters.minRating" class="input" @change="searchHospitals">
                <option :value="0">Any Rating</option>
                <option :value="3">3+ Stars</option>
                <option :value="4">4+ Stars</option>
                <option :value="4.5">4.5+ Stars</option>
              </select>
            </div>

            <button @click="resetFilters" class="btn btn-secondary btn-sm w-full">
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div class="lg:col-span-3">
        <!-- Loading State -->
        <div v-if="loading" class="space-y-4">
          <SkeletonLoader type="card" v-for="i in 5" :key="i" />
        </div>

        <!-- Empty State -->
        <div v-else-if="!hospitals.length" class="card">
          <div class="card-body text-center py-12">
            <BuildingOffice2Icon class="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Hospitals Found</h3>
            <p class="text-gray-600">Try adjusting your search criteria</p>
          </div>
        </div>

        <!-- Hospitals Grid -->
        <div v-else class="space-y-4">
          <div
            v-for="hospital in hospitals"
            :key="hospital.id"
            class="card hover-lift"
          >
            <div class="card-body">
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div class="flex-shrink-0">
                  <div class="h-16 w-16 rounded-lg bg-red-100 flex items-center justify-center">
                    <BuildingOffice2Icon class="h-8 w-8 text-red-600" />
                  </div>
                </div>

                <!-- Info -->
                <div class="flex-1">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">
                        {{ hospital.hospital_name }}
                        <CheckBadgeIcon
                          v-if="hospital.verification_status === 'verified'"
                          class="h-5 w-5 text-red-500 inline ml-1"
                        />
                      </h3>
                      <p class="text-sm text-gray-600 capitalize">{{ hospital.type }}</p>
                    </div>
                    <div class="text-right">
                      <div class="flex items-center gap-1">
                        <StarIcon class="h-5 w-5 text-yellow-400 fill-current" />
                        <span class="font-semibold">{{ hospital.rating || 'N/A' }}</span>
                      </div>
                      <p class="text-xs text-gray-600">
                        {{ hospital.surgery_count || 0 }} procedures
                      </p>
                    </div>
                  </div>

                  <div class="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p class="text-sm text-gray-600">Address</p>
                      <p class="text-sm font-medium">{{ hospital.address }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Phone</p>
                      <p class="text-sm font-medium">{{ hospital.phone }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Bed Capacity</p>
                      <p class="text-sm font-medium">
                        {{ hospital.total_beds || 'N/A' }}
                        <span v-if="hospital.available_beds" class="text-green-600">
                          ({{ hospital.available_beds }} available)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Services</p>
                      <div class="flex gap-1 flex-wrap mt-1">
                        <span v-if="hospital.emergency_services" class="badge badge-danger">Emergency</span>
                        <span v-if="hospital.icu_beds > 0" class="badge badge-info">ICU</span>
                        <span v-if="hospital.operating_rooms > 0" class="badge badge-warning">Surgery</span>
                      </div>
                    </div>
                  </div>

                  <p v-if="hospital.description" class="text-sm text-gray-600 mb-3">
                    {{ truncate(hospital.description, 150) }}
                  </p>

                  <div class="flex gap-2">
                    <button @click="viewDetails(hospital)" class="btn btn-primary btn-sm">
                      View Details
                    </button>
                    <button @click="viewLocation(hospital)" class="btn btn-secondary btn-sm">
                      <MapPinIcon class="h-4 w-4 mr-1" />
                      Location
                    </button>
                    <button @click="contactHospital(hospital)" class="btn btn-secondary btn-sm">
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { hospitalService } from '@/services';
import {
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  StarIcon,
  MapPinIcon
} from '@heroicons/vue/24/outline';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/SkeletonLoader.vue';

const { success, error: showError } = useToast();

const loading = ref(true);
const searchQuery = ref('');
const hospitals = ref([]);

const filters = ref({
  type: '',
  verified: false,
  emergencyServices: false,
  hasAvailableBeds: false,
  minRating: 0
});

onMounted(async () => {
  await searchHospitals();
});

const searchHospitals = async () => {
  loading.value = true;
  try {
    const params = {
      search: searchQuery.value,
      ...filters.value
    };
    const response = await hospitalService.searchHospitals(params);
    hospitals.value = response.hospitals || [];
  } catch (error) {
    console.error('Failed to search hospitals:', error);
    showError('Failed to search hospitals');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.value = {
    type: '',
    verified: false,
    emergencyServices: false,
    hasAvailableBeds: false,
    minRating: 0
  };
  searchQuery.value = '';
  success('Filters reset');
  searchHospitals();
};

const truncate = (text, length) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const viewDetails = (hospital) => {
  // TODO: Show hospital details modal
  console.log('View details:', hospital);
};

const viewLocation = (hospital) => {
  // TODO: Show map modal
  console.log('View location:', hospital);
};

const contactHospital = (hospital) => {
  window.location.href = `tel:${hospital.phone}`;
};
</script>
