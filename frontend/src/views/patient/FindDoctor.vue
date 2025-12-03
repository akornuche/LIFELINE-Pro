<template>
  <div class="page-container">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">Find a Doctor</h1>
      <p class="text-gray-600 mt-2">Search for qualified healthcare providers</p>
    </div>

    <!-- Search Bar -->
    <div class="card mb-6">
      <div class="card-body">
        <div class="flex gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, specialization..."
              class="input"
              @keyup.enter="searchDoctors"
            />
          </div>
          <button @click="searchDoctors" class="btn btn-primary">
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
            <!-- Specialization Filter -->
            <div>
              <label class="form-label">Specialization</label>
              <select v-model="filters.specialization" class="input" @change="searchDoctors">
                <option value="">All Specializations</option>
                <option value="general">General Practice</option>
                <option value="cardiology">Cardiology</option>
                <option value="dermatology">Dermatology</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="neurology">Neurology</option>
                <option value="psychiatry">Psychiatry</option>
              </select>
            </div>

            <!-- Verification Filter -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="filters.verified"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  @change="searchDoctors"
                />
                <span class="ml-2 text-sm text-gray-700">Verified Only</span>
              </label>
            </div>

            <!-- Years of Experience -->
            <div>
              <label class="form-label">Min. Years of Experience</label>
              <input
                v-model.number="filters.minExperience"
                type="number"
                min="0"
                class="input"
                @change="searchDoctors"
              />
            </div>

            <!-- Rating Filter -->
            <div>
              <label class="form-label">Minimum Rating</label>
              <select v-model.number="filters.minRating" class="input" @change="searchDoctors">
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
        <div v-else-if="!doctors.length" class="card">
          <div class="card-body text-center py-12">
            <UserIcon class="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Doctors Found</h3>
            <p class="text-gray-600">Try adjusting your search criteria</p>
          </div>
        </div>

        <!-- Doctors Grid -->
        <div v-else class="space-y-4">
          <div
            v-for="(doctor, index) in doctors"
            :key="doctor.id"
            class="card hover-lift animate-fade-in"
            :class="`stagger-${Math.min(index + 1, 4)}`"
          >
            <div class="card-body">
              <div class="flex items-start gap-4">
                <!-- Avatar -->
                <div class="flex-shrink-0">
                  <div class="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <span class="text-blue-600 font-semibold text-2xl">
                      {{ doctor.first_name[0] }}{{ doctor.last_name[0] }}
                    </span>
                  </div>
                </div>

                <!-- Info -->
                <div class="flex-1">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">
                        Dr. {{ doctor.first_name }} {{ doctor.last_name }}
                        <CheckBadgeIcon
                          v-if="doctor.verification_status === 'verified'"
                          class="h-5 w-5 text-blue-500 inline ml-1"
                        />
                      </h3>
                      <p class="text-sm text-gray-600 capitalize">{{ doctor.specialization }}</p>
                    </div>
                    <div class="text-right">
                      <div class="flex items-center gap-1">
                        <StarIcon class="h-5 w-5 text-yellow-400 fill-current" />
                        <span class="font-semibold">{{ doctor.rating || 'N/A' }}</span>
                      </div>
                      <p class="text-xs text-gray-600">
                        {{ doctor.consultation_count || 0 }} consultations
                      </p>
                    </div>
                  </div>

                  <div class="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p class="text-sm text-gray-600">License Number</p>
                      <p class="text-sm font-medium">{{ doctor.license_number }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Experience</p>
                      <p class="text-sm font-medium">{{ doctor.years_of_experience || 'N/A' }} years</p>
                    </div>
                    <div v-if="doctor.hospital">
                      <p class="text-sm text-gray-600">Hospital</p>
                      <p class="text-sm font-medium">{{ doctor.hospital }}</p>
                    </div>
                    <div v-if="doctor.consultation_fee">
                      <p class="text-sm text-gray-600">Consultation Fee</p>
                      <p class="text-sm font-medium text-primary-600">
                        ₦{{ doctor.consultation_fee.toLocaleString() }}
                      </p>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <button @click="bookConsultation(doctor)" class="btn btn-primary btn-sm">
                      Book Consultation
                    </button>
                    <button @click="viewProfile(doctor)" class="btn btn-secondary btn-sm">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="doctors.length" class="mt-6 flex justify-center">
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm">Previous</button>
            <span class="px-4 py-2 text-sm text-gray-700">Page 1</span>
            <button class="btn btn-secondary btn-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { doctorService } from '@/services';
import { useToast } from '@/composables/useToast';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import {
  MagnifyingGlassIcon,
  UserIcon,
  CheckBadgeIcon,
  StarIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const { success, error: showError } = useToast();

const loading = ref(true);
const searchQuery = ref('');
const doctors = ref([]);

const filters = ref({
  specialization: '',
  verified: false,
  minExperience: 0,
  minRating: 0
});

onMounted(async () => {
  await searchDoctors();
});

const searchDoctors = async () => {
  loading.value = true;
  try {
    const params = {
      search: searchQuery.value,
      ...filters.value
    };
    const response = await doctorService.searchDoctors(params);
    doctors.value = response.doctors || [];
  } catch (error) {
    console.error('Failed to search doctors:', error);
    showError('Failed to load doctors. Please try again.');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.value = {
    specialization: '',
    verified: false,
    minExperience: 0,
    minRating: 0
  };
  searchQuery.value = '';
  success('Filters reset');
  searchDoctors();
};

const bookConsultation = (doctor) => {
  // TODO: Navigate to consultation booking
  router.push(`/patient/consultation/book?doctor=${doctor.id}`);
};

const viewProfile = (doctor) => {
  // TODO: Show doctor profile modal
  console.log('View profile:', doctor);
};
</script>
