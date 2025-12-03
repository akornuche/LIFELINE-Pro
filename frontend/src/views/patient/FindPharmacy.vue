<template>
  <div class="page-container">
    <div class="mb-8 animate-fade-in">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Find a Pharmacy</h1>
      <p class="text-gray-600 mt-2">Search for verified pharmacies near you</p>
    </div>

    <!-- Search Bar -->
    <div class="card mb-6">
      <div class="card-body">
        <div class="flex gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, location..."
              class="input"
              @keyup.enter="searchPharmacies"
            />
          </div>
          <button @click="searchPharmacies" class="btn btn-primary">
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
            <!-- Verification Filter -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="filters.verified"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="searchPharmacies"
                />
                <span class="ml-2 text-sm text-gray-700">Verified Only</span>
              </label>
            </div>

            <!-- 24/7 Service Filter -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="filters.open24Hours"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="searchPharmacies"
                />
                <span class="ml-2 text-sm text-gray-700">24/7 Service</span>
              </label>
            </div>

            <!-- Delivery Available Filter -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="filters.deliveryAvailable"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="searchPharmacies"
                />
                <span class="ml-2 text-sm text-gray-700">Delivery Available</span>
              </label>
            </div>

            <!-- Rating Filter -->
            <div>
              <label class="form-label">Minimum Rating</label>
              <select v-model.number="filters.minRating" class="input" @change="searchPharmacies">
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
        <div v-else-if="!pharmacies.length" class="card">
          <div class="card-body text-center py-12">
            <BuildingStorefrontIcon class="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Pharmacies Found</h3>
            <p class="text-gray-600">Try adjusting your search criteria</p>
          </div>
        </div>

        <!-- Pharmacies Grid -->
        <div v-else class="space-y-4">
          <div
            v-for="pharmacy in pharmacies"
            :key="pharmacy.id"
            class="card hover-lift"
          >
            <div class="card-body">
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div class="flex-shrink-0">
                  <div class="h-16 w-16 rounded-lg bg-green-100 flex items-center justify-center">
                    <BuildingStorefrontIcon class="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <!-- Info -->
                <div class="flex-1">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">
                        {{ pharmacy.pharmacy_name }}
                        <CheckBadgeIcon
                          v-if="pharmacy.verification_status === 'verified'"
                          class="h-5 w-5 text-green-500 inline ml-1"
                        />
                      </h3>
                      <p class="text-sm text-gray-600">{{ pharmacy.license_number }}</p>
                    </div>
                    <div class="text-right">
                      <div class="flex items-center gap-1">
                        <StarIcon class="h-5 w-5 text-yellow-400 fill-current" />
                        <span class="font-semibold">{{ pharmacy.rating || 'N/A' }}</span>
                      </div>
                      <p class="text-xs text-gray-600">
                        {{ pharmacy.prescription_count || 0 }} prescriptions
                      </p>
                    </div>
                  </div>

                  <div class="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p class="text-sm text-gray-600">Address</p>
                      <p class="text-sm font-medium">{{ pharmacy.address }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Phone</p>
                      <p class="text-sm font-medium">{{ pharmacy.phone }}</p>
                    </div>
                    <div v-if="pharmacy.email">
                      <p class="text-sm text-gray-600">Email</p>
                      <p class="text-sm font-medium">{{ pharmacy.email }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Services</p>
                      <div class="flex gap-1 flex-wrap mt-1">
                        <span v-if="pharmacy.open_24_hours" class="badge badge-info">24/7</span>
                        <span v-if="pharmacy.delivery_available" class="badge badge-success">Delivery</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <button @click="viewLocation(pharmacy)" class="btn btn-secondary btn-sm">
                      <MapPinIcon class="h-4 w-4 mr-1" />
                      View Location
                    </button>
                    <button @click="contactPharmacy(pharmacy)" class="btn btn-primary btn-sm">
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
import { pharmacyService } from '@/services';
import {
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  StarIcon,
  MapPinIcon
} from '@heroicons/vue/24/outline';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/SkeletonLoader.vue';

const { success, error: showError } = useToast();

const loading = ref(true);
const searchQuery = ref('');
const pharmacies = ref([]);

const filters = ref({
  verified: false,
  open24Hours: false,
  deliveryAvailable: false,
  minRating: 0
});

onMounted(async () => {
  await searchPharmacies();
});

const searchPharmacies = async () => {
  loading.value = true;
  try {
    const params = {
      search: searchQuery.value,
      ...filters.value
    };
    const response = await pharmacyService.searchPharmacies(params);
    pharmacies.value = response.pharmacies || [];
  } catch (error) {
    console.error('Failed to search pharmacies:', error);
    showError('Failed to search pharmacies');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.value = {
    verified: false,
    open24Hours: false,
    deliveryAvailable: false,
    minRating: 0
  };
  searchQuery.value = '';
  success('Filters reset');
  searchPharmacies();
};

const viewLocation = (pharmacy) => {
  // TODO: Show map modal
  console.log('View location:', pharmacy);
};

const contactPharmacy = (pharmacy) => {
  // TODO: Show contact options
  window.location.href = `tel:${pharmacy.phone}`;
};
</script>
