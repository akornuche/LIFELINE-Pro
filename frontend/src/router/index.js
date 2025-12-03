import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public Routes
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/Landing.vue'),
      meta: { public: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/Login.vue'),
      meta: { public: true, guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/Register.vue'),
      meta: { public: true, guest: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPassword.vue'),
      meta: { public: true, guest: true }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPassword.vue'),
      meta: { public: true, guest: true }
    },
    {
      path: '/verify-email/:token',
      name: 'verify-email',
      component: () => import('@/views/auth/VerifyEmail.vue'),
      meta: { public: true }
    },

    // Patient Portal
    {
      path: '/patient',
      component: () => import('@/layouts/PatientLayout.vue'),
      meta: { requiresAuth: true, role: 'patient' },
      children: [
        {
          path: '',
          name: 'patient-dashboard',
          component: () => import('@/views/patient/Dashboard.vue')
        },
        {
          path: 'profile',
          name: 'patient-profile',
          component: () => import('@/views/patient/Profile.vue')
        },
        {
          path: 'subscription',
          name: 'patient-subscription',
          component: () => import('@/views/patient/Subscription.vue')
        },
        {
          path: 'dependents',
          name: 'patient-dependents',
          component: () => import('@/views/patient/Dependents.vue')
        },
        {
          path: 'medical-history',
          name: 'patient-medical-history',
          component: () => import('@/views/patient/MedicalHistory.vue')
        },
        {
          path: 'find-doctor',
          name: 'patient-find-doctor',
          component: () => import('@/views/patient/FindDoctor.vue')
        },
        {
          path: 'find-pharmacy',
          name: 'patient-find-pharmacy',
          component: () => import('@/views/patient/FindPharmacy.vue')
        },
        {
          path: 'find-hospital',
          name: 'patient-find-hospital',
          component: () => import('@/views/patient/FindHospital.vue')
        },
        {
          path: 'payments',
          name: 'patient-payments',
          component: () => import('@/views/patient/Payments.vue')
        },
        {
          path: 'settings',
          name: 'patient-settings',
          component: () => import('@/views/patient/Settings.vue')
        }
      ]
    },

    // Doctor Portal
    {
      path: '/doctor',
      component: () => import('@/layouts/DoctorLayout.vue'),
      meta: { requiresAuth: true, role: 'doctor' },
      children: [
        {
          path: '',
          name: 'doctor-dashboard',
          component: () => import('@/views/doctor/Dashboard.vue')
        },
        {
          path: 'profile',
          name: 'doctor-profile',
          component: () => import('@/views/doctor/Profile.vue')
        },
        {
          path: 'consultations',
          name: 'doctor-consultations',
          component: () => import('@/views/doctor/Consultations.vue')
        },
        {
          path: 'consultations/new',
          name: 'doctor-new-consultation',
          component: () => import('@/views/doctor/NewConsultation.vue')
        },
        {
          path: 'consultations/:id',
          name: 'doctor-consultation-details',
          component: () => import('@/views/doctor/ConsultationDetails.vue')
        },
        {
          path: 'prescriptions',
          name: 'doctor-prescriptions',
          component: () => import('@/views/doctor/Prescriptions.vue')
        },
        {
          path: 'payments',
          name: 'doctor-payments',
          component: () => import('@/views/doctor/Payments.vue')
        },
        {
          path: 'statistics',
          name: 'doctor-statistics',
          component: () => import('@/views/doctor/Statistics.vue')
        },
        {
          path: 'settings',
          name: 'doctor-settings',
          component: () => import('@/views/doctor/Settings.vue')
        }
      ]
    },

    // Pharmacy Portal
    {
      path: '/pharmacy',
      component: () => import('@/layouts/PharmacyLayout.vue'),
      meta: { requiresAuth: true, role: 'pharmacy' },
      children: [
        {
          path: '',
          name: 'pharmacy-dashboard',
          component: () => import('@/views/pharmacy/Dashboard.vue')
        },
        {
          path: 'profile',
          name: 'pharmacy-profile',
          component: () => import('@/views/pharmacy/Profile.vue')
        },
        {
          path: 'prescriptions',
          name: 'pharmacy-prescriptions',
          component: () => import('@/views/pharmacy/Prescriptions.vue')
        },
        {
          path: 'prescriptions/:id',
          name: 'pharmacy-prescription-details',
          component: () => import('@/views/pharmacy/PrescriptionDetails.vue')
        },
        {
          path: 'payments',
          name: 'pharmacy-payments',
          component: () => import('@/views/pharmacy/Payments.vue')
        },
        {
          path: 'statistics',
          name: 'pharmacy-statistics',
          component: () => import('@/views/pharmacy/Statistics.vue')
        },
        {
          path: 'settings',
          name: 'pharmacy-settings',
          component: () => import('@/views/pharmacy/Settings.vue')
        }
      ]
    },

    // Hospital Portal
    {
      path: '/hospital',
      component: () => import('@/layouts/HospitalLayout.vue'),
      meta: { requiresAuth: true, role: 'hospital' },
      children: [
        {
          path: '',
          name: 'hospital-dashboard',
          component: () => import('@/views/hospital/Dashboard.vue')
        },
        {
          path: 'profile',
          name: 'hospital-profile',
          component: () => import('@/views/hospital/Profile.vue')
        },
        {
          path: 'surgeries',
          name: 'hospital-surgeries',
          component: () => import('@/views/hospital/Surgeries.vue')
        },
        {
          path: 'surgeries/new',
          name: 'hospital-new-surgery',
          component: () => import('@/views/hospital/NewSurgery.vue')
        },
        {
          path: 'surgeries/:id',
          name: 'hospital-surgery-details',
          component: () => import('@/views/hospital/SurgeryDetails.vue')
        },
        {
          path: 'beds',
          name: 'hospital-beds',
          component: () => import('@/views/hospital/Beds.vue')
        },
        {
          path: 'payments',
          name: 'hospital-payments',
          component: () => import('@/views/hospital/Payments.vue')
        },
        {
          path: 'statistics',
          name: 'hospital-statistics',
          component: () => import('@/views/hospital/Statistics.vue')
        },
        {
          path: 'settings',
          name: 'hospital-settings',
          component: () => import('@/views/hospital/Settings.vue')
        }
      ]
    },

    // Admin Portal
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/Dashboard.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/Users.vue')
        },
        {
          path: 'patients',
          name: 'admin-patients',
          component: () => import('@/views/admin/Patients.vue')
        },
        {
          path: 'doctors',
          name: 'admin-doctors',
          component: () => import('@/views/admin/Doctors.vue')
        },
        {
          path: 'pharmacies',
          name: 'admin-pharmacies',
          component: () => import('@/views/admin/Pharmacies.vue')
        },
        {
          path: 'hospitals',
          name: 'admin-hospitals',
          component: () => import('@/views/admin/Hospitals.vue')
        },
        {
          path: 'verifications',
          name: 'admin-verifications',
          component: () => import('@/views/admin/Verifications.vue')
        },
        {
          path: 'payments',
          name: 'admin-payments',
          component: () => import('@/views/admin/Payments.vue')
        },
        {
          path: 'statements',
          name: 'admin-statements',
          component: () => import('@/views/admin/Statements.vue')
        },
        {
          path: 'analytics',
          name: 'admin-analytics',
          component: () => import('@/views/admin/Analytics.vue')
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: () => import('@/views/admin/Settings.vue')
        }
      ]
    },

    // Error Pages
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/errors/403.vue'),
      meta: { public: true }
    },
    {
      path: '/404',
      name: 'not-found',
      component: () => import('@/views/errors/404.vue'),
      meta: { public: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404'
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isGuest = to.matched.some(record => record.meta.guest);
  const requiredRole = to.meta.role;

  // Check if route requires authentication
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  // If user is authenticated but user data isn't loaded yet, load it first
  if (authStore.isAuthenticated && !authStore.user) {
    try {
      await authStore.getCurrentUser();
    } catch (error) {
      // If getCurrentUser fails, clear auth and redirect to login
      authStore.clearAuth();
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
  }

  // Redirect authenticated users away from guest-only pages
  if (isGuest && authStore.isAuthenticated) {
    const roleRoutes = {
      patient: 'patient-dashboard',
      doctor: 'doctor-dashboard',
      pharmacy: 'pharmacy-dashboard',
      hospital: 'hospital-dashboard',
      admin: 'admin-dashboard'
    };
    next({ name: roleRoutes[authStore.user?.role] || 'landing' });
    return;
  }

  // Check role-based access
  if (requiredRole && authStore.user?.role !== requiredRole) {
    next({ name: 'forbidden' });
    return;
  }

  next();
});

export default router;
