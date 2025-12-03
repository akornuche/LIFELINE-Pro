import Joi from 'joi';

/**
 * Medical Records Validation Schemas
 * Joi schemas for consultations, prescriptions, surgeries, and lab tests
 */

/**
 * Consultation schemas
 */

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

// Complete consultation
export const completeConsultationSchema = Joi.object({
  diagnosis: Joi.string().trim().min(10).max(2000).required(),
  treatment: Joi.string().trim().max(2000).required(),
  prescriptions: Joi.array().items(Joi.string().uuid()),
  labTestsOrdered: Joi.array().items(Joi.string().uuid()),
  referralTo: Joi.string().uuid(),
  followUpRequired: Joi.boolean().default(false),
  followUpDate: Joi.date().min('now').when('followUpRequired', {
    is: true,
    then: Joi.required(),
  }),
  notes: Joi.string().trim().max(2000),
  totalCost: Joi.number().positive().required(),
});

// Cancel consultation
export const cancelConsultationSchema = Joi.object({
  reason: Joi.string()
    .valid('patient_request', 'doctor_unavailable', 'emergency', 'other')
    .required(),
  notes: Joi.string().trim().max(500),
});

/**
 * Prescription schemas
 */

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

// Request prescription refill
export const refillPrescriptionSchema = Joi.object({
  prescriptionId: Joi.string().uuid().required(),
  reason: Joi.string().trim().max(500),
});

/**
 * Surgery schemas
 */

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
 * Lab test schemas
 */

// Order lab test
export const orderLabTestSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  doctorId: Joi.string().uuid().required(),
  consultationId: Joi.string().uuid(),
  testType: Joi.string().trim().min(2).max(200).required(),
  testCategory: Joi.string()
    .valid('blood', 'urine', 'imaging', 'biopsy', 'other')
    .required(),
  urgency: Joi.string().valid('routine', 'urgent', 'stat').default('routine'),
  clinicalIndication: Joi.string().trim().min(10).max(1000).required(),
  specialInstructions: Joi.string().trim().max(500),
  fastingRequired: Joi.boolean().default(false),
  estimatedCost: Joi.number().positive().required(),
});

// Update lab test results
export const updateLabTestSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'sample_collected', 'in_progress', 'completed', 'cancelled')
    .required(),
  results: Joi.string().trim().max(10000).when('status', {
    is: 'completed',
    then: Joi.required(),
  }),
  abnormalFindings: Joi.string().trim().max(2000),
  testDate: Joi.date().max('now'),
  performedBy: Joi.string().trim().max(100),
  verifiedBy: Joi.string().trim().max(100),
  notes: Joi.string().trim().max(1000),
});

/**
 * Medical record schemas
 */

// Create medical record
export const createMedicalRecordSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  recordType: Joi.string()
    .valid('consultation', 'prescription', 'surgery', 'lab_test', 'vaccination', 'other')
    .required(),
  title: Joi.string().trim().min(5).max(200).required(),
  description: Joi.string().trim().min(10).max(5000).required(),
  recordDate: Joi.date().max('now').required(),
  attachments: Joi.array().items(Joi.string().trim()),
  tags: Joi.array().items(Joi.string().trim().max(50)),
});

// Update medical record
export const updateMedicalRecordSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200),
  description: Joi.string().trim().min(10).max(5000),
  attachments: Joi.array().items(Joi.string().trim()),
  tags: Joi.array().items(Joi.string().trim().max(50)),
}).min(1);

/**
 * Medical history query schemas
 */

// Get patient medical history
export const getMedicalHistorySchema = Joi.object({
  startDate: Joi.date().max('now'),
  endDate: Joi.date().min(Joi.ref('startDate')).max('now'),
  recordType: Joi.string().valid(
    'consultation',
    'prescription',
    'surgery',
    'lab_test',
    'all'
  ),
  includeDependent: Joi.boolean().default(true),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

/**
 * Referral schema
 */
export const createReferralSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  fromDoctorId: Joi.string().uuid().required(),
  toDoctorId: Joi.string().uuid().required(),
  specialization: Joi.string().trim().required(),
  reason: Joi.string().trim().min(20).max(2000).required(),
  urgency: Joi.string().valid('routine', 'urgent', 'emergency').default('routine'),
  diagnosis: Joi.string().trim().max(1000),
  attachedReports: Joi.array().items(Joi.string().trim()),
  validUntil: Joi.date().min('now').required(),
});

/**
 * Vital signs schema
 */
export const recordVitalSignsSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  consultationId: Joi.string().uuid(),
  bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/),
  temperature: Joi.number().min(35).max(45),
  heartRate: Joi.number().integer().min(40).max(200),
  respiratoryRate: Joi.number().integer().min(10).max(60),
  oxygenSaturation: Joi.number().min(70).max(100),
  weight: Joi.number().positive(),
  height: Joi.number().positive(),
  bmi: Joi.number().positive(),
  recordedAt: Joi.date().max('now').default(new Date()),
  recordedBy: Joi.string().trim().required(),
  notes: Joi.string().trim().max(500),
});

/**
 * ID parameter validation
 */
export const consultationIdParamSchema = Joi.object({
  consultationId: Joi.string().uuid().required(),
});

export const prescriptionIdParamSchema = Joi.object({
  prescriptionId: Joi.string().uuid().required(),
});

export const surgeryIdParamSchema = Joi.object({
  surgeryId: Joi.string().uuid().required(),
});

export const labTestIdParamSchema = Joi.object({
  labTestId: Joi.string().uuid().required(),
});

export default {
  createConsultationSchema,
  updateConsultationSchema,
  completeConsultationSchema,
  cancelConsultationSchema,
  createPrescriptionSchema,
  dispensePrescriptionSchema,
  refillPrescriptionSchema,
  scheduleSurgerySchema,
  updateSurgerySchema,
  orderLabTestSchema,
  updateLabTestSchema,
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  getMedicalHistorySchema,
  createReferralSchema,
  recordVitalSignsSchema,
  consultationIdParamSchema,
  prescriptionIdParamSchema,
  surgeryIdParamSchema,
  labTestIdParamSchema,
};
