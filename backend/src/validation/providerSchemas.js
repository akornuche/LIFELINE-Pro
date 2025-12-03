import Joi from 'joi';

/**
 * Provider Validation Schemas
 * Joi schemas for doctors, pharmacies, and hospitals
 */

/**
 * Doctor schemas
 */

// Update doctor profile
export const updateDoctorProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100),
  lastName: Joi.string().trim().min(2).max(100),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  specialization: Joi.string().trim().min(2).max(100),
  yearsOfExperience: Joi.number().integer().min(0).max(70),
  qualifications: Joi.array().items(Joi.string().trim().max(200)),
  hospitalAffiliations: Joi.array().items(Joi.string().trim().max(200)),
  consultationFee: Joi.number().positive().precision(2),
  bio: Joi.string().trim().max(1000),
  languages: Joi.array().items(Joi.string().trim().max(50)),
  consultationTypes: Joi.array().items(
    Joi.string().valid('in_person', 'telemedicine', 'both')
  ),
}).min(1);

// Set doctor availability
export const setDoctorAvailabilitySchema = Joi.object({
  schedule: Joi.array()
    .items(
      Joi.object({
        dayOfWeek: Joi.string()
          .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
          .required(),
        timeSlots: Joi.array()
          .items(
            Joi.object({
              startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
              endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
              slotDuration: Joi.number().integer().min(15).max(120).default(30),
            })
          )
          .required(),
        isAvailable: Joi.boolean().default(true),
      })
    )
    .min(1)
    .required(),
});

// Block time slot
export const blockTimeSlotSchema = Joi.object({
  startDate: Joi.date().min('now').required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  reason: Joi.string().trim().max(200).required(),
  isRecurring: Joi.boolean().default(false),
  recurrencePattern: Joi.string().when('isRecurring', {
    is: true,
    then: Joi.valid('daily', 'weekly', 'monthly').required(),
  }),
});

// Update license info
export const updateLicenseSchema = Joi.object({
  licenseNumber: Joi.string().trim().min(5).max(50).required(),
  licenseExpiryDate: Joi.date().min('now').required(),
  issuingAuthority: Joi.string().trim().max(200),
  licenseDocument: Joi.string().trim(), // File path or URL
});

// Create consultation request
export const createConsultationSchema = Joi.object({
  doctorId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid doctor ID format',
    'any.required': 'Doctor ID is required',
  }),
  patientId: Joi.string().uuid().required(),
  dependentId: Joi.string().uuid().allow(null),
  consultationType: Joi.string()
    .valid('in_person', 'telemedicine', 'follow_up', 'emergency')
    .required(),
  reasonForVisit: Joi.string().trim().min(10).max(1000).required().messages({
    'string.min': 'Please provide at least 10 characters describing the reason for visit',
  }),
  symptoms: Joi.array().items(Joi.string().trim().max(200)).min(1),
  appointmentDate: Joi.date().min('now').required(),
  preferredTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  priority: Joi.string().valid('normal', 'urgent', 'emergency').default('normal'),
  notes: Joi.string().trim().max(2000),
});

// Update consultation
export const updateConsultationSchema = Joi.object({
  diagnosis: Joi.string().trim().min(10).max(2000),
  symptoms: Joi.string().trim().max(2000),
  findings: Joi.string().trim().max(2000),
  treatment: Joi.string().trim().max(2000),
  followUpDate: Joi.date().min('now'),
  notes: Joi.string().trim().max(2000),
  vitalSigns: Joi.object({
    bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/),
    temperature: Joi.number().min(35).max(45),
    heartRate: Joi.number().integer().min(40).max(200),
    respiratoryRate: Joi.number().integer().min(10).max(60),
    oxygenSaturation: Joi.number().min(70).max(100),
    weight: Joi.number().positive(),
    height: Joi.number().positive(),
  }),
}).min(1);

// Create prescription
export const createPrescriptionSchema = Joi.object({
  consultationId: Joi.string().uuid().required(),
  patientId: Joi.string().uuid().required(),
  doctorId: Joi.string().uuid().required(),
  medications: Joi.array()
    .items(
      Joi.object({
        drugName: Joi.string().trim().min(2).max(200).required(),
        dosage: Joi.string().trim().required(),
        frequency: Joi.string().trim().required(),
        duration: Joi.string().trim().required(),
        quantity: Joi.number().integer().positive().required(),
        instructions: Joi.string().trim().max(500),
        drugClass: Joi.string().valid('generic', 'branded', 'specialized').default('generic'),
      })
    )
    .min(1)
    .required(),
  diagnosis: Joi.string().trim().min(10).max(500).required(),
  notes: Joi.string().trim().max(1000),
  refillsAllowed: Joi.number().integer().min(0).max(12).default(0),
  expiryDate: Joi.date().min('now').required(),
});

// Update verification status
export const updateVerificationStatusSchema = Joi.object({
  verificationStatus: Joi.string()
    .valid('approved', 'rejected', 'pending')
    .required(),
  adminNotes: Joi.string().trim().max(1000),
});

// Update rating
export const updateRatingSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().trim().max(1000),
});

/**
 * Pharmacy schemas
 */

// Update pharmacy profile
export const updatePharmacyProfileSchema = Joi.object({
  pharmacyName: Joi.string().trim().min(2).max(200),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  address: Joi.string().trim().min(10).max(500),
  operatingHours: Joi.object({
    monday: Joi.string().trim(),
    tuesday: Joi.string().trim(),
    wednesday: Joi.string().trim(),
    thursday: Joi.string().trim(),
    friday: Joi.string().trim(),
    saturday: Joi.string().trim(),
    sunday: Joi.string().trim(),
  }),
  hasDelivery: Joi.boolean(),
  deliveryRadius: Joi.number().positive().when('hasDelivery', {
    is: true,
    then: Joi.required(),
  }),
  deliveryFee: Joi.number().min(0).precision(2),
  emergencyContact: Joi.object({
    name: Joi.string().trim().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  }),
  services: Joi.array().items(Joi.string().trim().max(100)),
}).min(1);

// Update pharmacy inventory
export const updatePharmacyInventorySchema = Joi.object({
  medications: Joi.array()
    .items(
      Joi.object({
        drugName: Joi.string().trim().required(),
        drugClass: Joi.string().valid('generic', 'branded', 'specialized').required(),
        manufacturer: Joi.string().trim().required(),
        quantity: Joi.number().integer().min(0).required(),
        unitPrice: Joi.number().positive().precision(2).required(),
        expiryDate: Joi.date().min('now').required(),
        batchNumber: Joi.string().trim().required(),
        reorderLevel: Joi.number().integer().min(0),
      })
    )
    .min(1)
    .required(),
});

// Dispense prescription (pharmacy)
export const dispensePrescriptionSchema = Joi.object({
  prescriptionId: Joi.string().uuid().required(),
  pharmacyId: Joi.string().uuid().required(),
  dispensedQuantity: Joi.object()
    .pattern(
      Joi.string(), // medication ID
      Joi.number().integer().positive() // quantity dispensed
    )
    .required(),
  dispensedBy: Joi.string().trim().min(2).max(100).required(),
  totalCost: Joi.number().positive().required(),
  patientPaidAmount: Joi.number().min(0).required(),
  notes: Joi.string().trim().max(500),
});

// Update pharmacy license
export const updatePharmacyLicenseSchema = Joi.object({
  licenseNumber: Joi.string().trim().min(5).max(50).required(),
  licenseExpiryDate: Joi.date().min('now').required(),
  issuingAuthority: Joi.string().trim().max(200),
  licenseDocument: Joi.string().trim(),
});

/**
 * Hospital schemas
 */

// Update hospital profile
export const updateHospitalProfileSchema = Joi.object({
  hospitalName: Joi.string().trim().min(2).max(200),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  address: Joi.string().trim().min(10).max(500),
  hospitalType: Joi.string().valid('general', 'specialized', 'teaching', 'clinic'),
  numberOfBeds: Joi.number().integer().positive(),
  hasEmergency: Joi.boolean(),
  hasICU: Joi.boolean(),
  icuBeds: Joi.number().integer().min(0).when('hasICU', {
    is: true,
    then: Joi.required(),
  }),
  departments: Joi.array().items(Joi.string().trim().max(100)),
  accreditation: Joi.string().trim().max(200),
  facilities: Joi.array().items(Joi.string().trim().max(100)),
  emergencyContact: Joi.object({
    name: Joi.string().trim().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  }),
}).min(1);

// Manage bed availability
export const updateBedAvailabilitySchema = Joi.object({
  totalBeds: Joi.number().integer().positive().required(),
  occupiedBeds: Joi.number().integer().min(0).required(),
  reservedBeds: Joi.number().integer().min(0).default(0),
  icuBeds: Joi.object({
    total: Joi.number().integer().min(0).required(),
    occupied: Joi.number().integer().min(0).required(),
  }),
  wardBreakdown: Joi.array().items(
    Joi.object({
      wardName: Joi.string().trim().required(),
      totalBeds: Joi.number().integer().positive().required(),
      occupiedBeds: Joi.number().integer().min(0).required(),
    })
  ),
});

// Add department
export const addDepartmentSchema = Joi.object({
  departmentName: Joi.string().trim().min(2).max(100).required(),
  headOfDepartment: Joi.string().trim().max(100),
  services: Joi.array().items(Joi.string().trim().max(200)),
  operatingHours: Joi.object({
    monday: Joi.string().trim(),
    tuesday: Joi.string().trim(),
    wednesday: Joi.string().trim(),
    thursday: Joi.string().trim(),
    friday: Joi.string().trim(),
    saturday: Joi.string().trim(),
    sunday: Joi.string().trim(),
  }),
  contactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
});

// Update hospital license
export const updateHospitalLicenseSchema = Joi.object({
  licenseNumber: Joi.string().trim().min(5).max(50).required(),
  licenseExpiryDate: Joi.date().min('now').required(),
  issuingAuthority: Joi.string().trim().max(200),
  licenseDocument: Joi.string().trim(),
});

/**
 * Provider verification schemas
 */

// Submit verification documents
export const submitVerificationDocumentsSchema = Joi.object({
  documentType: Joi.string()
    .valid('license', 'certification', 'insurance', 'identification', 'other')
    .required(),
  documentName: Joi.string().trim().min(2).max(200).required(),
  documentNumber: Joi.string().trim().max(100),
  issueDate: Joi.date().max('now').required(),
  expiryDate: Joi.date().min('now'),
  issuingAuthority: Joi.string().trim().max(200).required(),
  documentFile: Joi.string().trim().required(), // File path or URL
});

// Admin verify provider
export const verifyProviderSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  providerType: Joi.string().valid('doctor', 'pharmacy', 'hospital').required(),
  verificationStatus: Joi.string()
    .valid('verified', 'rejected', 'pending_additional_info')
    .required(),
  verifiedBy: Joi.string().uuid().required(),
  verificationNotes: Joi.string().trim().max(1000),
  rejectionReason: Joi.string().trim().max(1000).when('verificationStatus', {
    is: 'rejected',
    then: Joi.required(),
  }),
  additionalInfoRequired: Joi.array().items(Joi.string().trim()).when('verificationStatus', {
    is: 'pending_additional_info',
    then: Joi.required(),
  }),
});

/**
 * Provider statistics schema
 */
export const getProviderStatsSchema = Joi.object({
  startDate: Joi.date().max('now').required(),
  endDate: Joi.date().min(Joi.ref('startDate')).max('now').required(),
  metrics: Joi.array()
    .items(
      Joi.string().valid(
        'consultations',
        'prescriptions',
        'surgeries',
        'revenue',
        'patient_count',
        'ratings'
      )
    )
    .min(1)
    .default(['consultations', 'revenue']),
});

// Complete surgery
export const completeSurgerySchema = Joi.object({
  postOpNotes: Joi.string().trim().max(5000).required(),
  complications: Joi.string().trim().max(2000).allow(null),
  outcome: Joi.string().valid('successful', 'complicated', 'failed').required(),
});

// Schedule surgery
export const scheduleSurgerySchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  doctorId: Joi.string().uuid().required(),
  hospitalId: Joi.string().uuid().required(),
  surgeryType: Joi.string().valid('minor', 'major').required(),
  surgeryName: Joi.string().trim().min(5).max(200).required(),
  diagnosis: Joi.string().trim().min(10).max(1000).required(),
  scheduledDate: Joi.date().min('now').required(),
  estimatedDuration: Joi.number().integer().positive().required(),
  preOpInstructions: Joi.string().trim().max(2000),
  surgicalTeam: Joi.array().items(
    Joi.object({
      role: Joi.string().trim().required(),
      name: Joi.string().trim().required(),
    })
  ),
  requiredEquipment: Joi.array().items(Joi.string().trim().max(200)),
  anesthesiaType: Joi.string()
    .valid('local', 'regional', 'general', 'sedation')
    .required(),
  estimatedCost: Joi.number().positive().required(),
  notes: Joi.string().trim().max(2000),
});

// Update surgery status
export const updateSurgerySchema = Joi.object({
  status: Joi.string()
    .valid('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')
    .required(),
  actualStartTime: Joi.date().when('status', {
    is: 'in_progress',
    then: Joi.required(),
  }),
  actualEndTime: Joi.date().when('status', {
    is: 'completed',
    then: Joi.required(),
  }),
  surgeonNotes: Joi.string().trim().max(5000),
  complications: Joi.string().trim().max(2000),
  postOpInstructions: Joi.string().trim().max(2000),
  followUpDate: Joi.date().min('now'),
  actualCost: Joi.number().positive(),
  cancelReason: Joi.string().trim().max(500).when('status', {
    is: 'cancelled',
    then: Joi.required(),
  }),
});

/**
 * Provider rating schemas
 */

// Submit rating
export const submitProviderRatingSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  providerType: Joi.string().valid('doctor', 'pharmacy', 'hospital').required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  reviewTitle: Joi.string().trim().min(5).max(100),
  reviewText: Joi.string().trim().min(20).max(1000),
  serviceDate: Joi.date().max('now').required(),
  wouldRecommend: Joi.boolean().default(true),
  aspects: Joi.object({
    professionalism: Joi.number().integer().min(1).max(5),
    communication: Joi.number().integer().min(1).max(5),
    waitTime: Joi.number().integer().min(1).max(5),
    facilities: Joi.number().integer().min(1).max(5),
  }),
});

// Respond to rating
export const respondToRatingSchema = Joi.object({
  ratingId: Joi.string().uuid().required(),
  response: Joi.string().trim().min(10).max(1000).required(),
});

/**
 * Provider earnings schema
 */
export const getProviderEarningsSchema = Joi.object({
  startDate: Joi.date().max('now').required(),
  endDate: Joi.date().min(Joi.ref('startDate')).max('now').required(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'service_type').default('month'),
  includeBreakdown: Joi.boolean().default(true),
});

/**
 * Provider search schema
 */
export const searchProvidersSchema = Joi.object({
  providerType: Joi.string().valid('doctor', 'pharmacy', 'hospital', 'all').default('all'),
  specialization: Joi.string().trim().max(100),
  location: Joi.string().trim(),
  radius: Joi.number().positive().default(10), // km
  availability: Joi.string().valid('available', 'all').default('all'),
  minRating: Joi.number().min(0).max(5).default(0),
  acceptsTelemedicine: Joi.boolean(),
  maxConsultationFee: Joi.number().positive(),
  sortBy: Joi.string()
    .valid('rating', 'distance', 'fee', 'experience', 'availability')
    .default('rating'),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

/**
 * Provider payout schema
 */
export const requestPayoutSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  payoutMethod: Joi.string().valid('bank_transfer', 'mobile_money', 'cheque').required(),
  bankDetails: Joi.object({
    bankName: Joi.string().trim().required(),
    accountNumber: Joi.string().pattern(/^\d{10}$/).required(),
    accountName: Joi.string().trim().required(),
  }).when('payoutMethod', {
    is: 'bank_transfer',
    then: Joi.required(),
  }),
  mobileMoneyDetails: Joi.object({
    provider: Joi.string().trim().required(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    accountName: Joi.string().trim().required(),
  }).when('payoutMethod', {
    is: 'mobile_money',
    then: Joi.required(),
  }),
});

/**
 * ID parameter validation
 */
export const doctorIdParamSchema = Joi.object({
  doctorId: Joi.string().uuid().required(),
});

export const pharmacyIdParamSchema = Joi.object({
  pharmacyId: Joi.string().uuid().required(),
});

export const hospitalIdParamSchema = Joi.object({
  hospitalId: Joi.string().uuid().required(),
});

export const providerIdParamSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
});

export default {
  updateDoctorProfileSchema,
  setDoctorAvailabilitySchema,
  blockTimeSlotSchema,
  updateLicenseSchema,
  createConsultationSchema,
  updateConsultationSchema,
  createPrescriptionSchema,
  dispensePrescriptionSchema,
  updateVerificationStatusSchema,
  updateRatingSchema,
  updatePharmacyProfileSchema,
  updatePharmacyInventorySchema,
  updatePharmacyLicenseSchema,
  updateHospitalProfileSchema,
  updateBedAvailabilitySchema,
  addDepartmentSchema,
  updateHospitalLicenseSchema,
  scheduleSurgerySchema,
  updateSurgerySchema,
  completeSurgerySchema,
  submitVerificationDocumentsSchema,
  verifyProviderSchema,
  getProviderStatsSchema,
  submitProviderRatingSchema,
  respondToRatingSchema,
  getProviderEarningsSchema,
  searchProvidersSchema,
  requestPayoutSchema,
  doctorIdParamSchema,
  pharmacyIdParamSchema,
  hospitalIdParamSchema,
  providerIdParamSchema,
};
