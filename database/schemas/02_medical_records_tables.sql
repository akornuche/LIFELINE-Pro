-- ===================================
-- LIFELINE PRO - Medical Records Tables
-- ===================================
-- Tables: Dependents, MedicalRecords, Consultations, Prescriptions, Surgeries, LabTests
-- Version: 1.0.0
-- Date: 2025-11-22

-- ===================================
-- 1. DEPENDENTS TABLE
-- ===================================
CREATE TABLE dependents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    lifeline_id VARCHAR(20) UNIQUE NOT NULL, -- LLDEP-XXXXX
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    relationship VARCHAR(50) NOT NULL, -- Spouse, Child, Parent, etc.
    
    -- Medical Information
    blood_group VARCHAR(5),
    genotype VARCHAR(5),
    allergies TEXT,
    chronic_conditions TEXT,
    
    -- ID Document
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Dependents
CREATE INDEX idx_dependents_patient_id ON dependents(patient_id);
CREATE INDEX idx_dependents_lifeline_id ON dependents(lifeline_id);
CREATE INDEX idx_dependents_is_active ON dependents(is_active);

-- ===================================
-- 2. MEDICAL RECORDS TABLE (Master record)
-- ===================================
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Patient Information
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
    
    -- Service Information
    service_type VARCHAR(50) NOT NULL, -- consultation, surgery, lab_test, imaging, admission
    service_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Provider Information
    doctor_id UUID REFERENCES doctors(id),
    pharmacy_id UUID REFERENCES pharmacies(id),
    hospital_id UUID REFERENCES hospitals(id),
    
    -- Medical Details
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    notes TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    
    -- References to detailed records
    consultation_id UUID,
    prescription_id UUID,
    surgery_id UUID,
    lab_test_id UUID,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Medical Records
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_dependent_id ON medical_records(dependent_id);
CREATE INDEX idx_medical_records_service_type ON medical_records(service_type);
CREATE INDEX idx_medical_records_service_date ON medical_records(service_date DESC);
CREATE INDEX idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_status ON medical_records(status);

-- ===================================
-- 3. CONSULTATIONS TABLE
-- ===================================
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID UNIQUE NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    
    -- Patient & Provider
    patient_id UUID NOT NULL REFERENCES patients(id),
    dependent_id UUID REFERENCES dependents(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    
    -- Consultation Details
    consultation_type VARCHAR(50), -- In-person, Telemedicine
    appointment_date TIMESTAMP,
    actual_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Medical Assessment
    vital_signs JSONB, -- {"temperature": 37.5, "bp": "120/80", "pulse": 72, ...}
    chief_complaint TEXT NOT NULL,
    history_of_present_illness TEXT,
    physical_examination TEXT,
    diagnosis TEXT NOT NULL,
    differential_diagnosis TEXT,
    
    -- Treatment
    treatment_plan TEXT,
    medication_prescribed BOOLEAN DEFAULT FALSE,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    referral_needed BOOLEAN DEFAULT FALSE,
    referral_to VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    
    -- Package Validation
    package_validated BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Consultations
CREATE INDEX idx_consultations_medical_record_id ON consultations(medical_record_id);
CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX idx_consultations_appointment_date ON consultations(appointment_date);
CREATE INDEX idx_consultations_status ON consultations(status);

-- ===================================
-- 4. PRESCRIPTIONS TABLE
-- ===================================
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    
    -- Patient & Provider
    patient_id UUID NOT NULL REFERENCES patients(id),
    dependent_id UUID REFERENCES dependents(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    
    -- Prescription Details
    prescription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP, -- Typically 30-90 days from issue
    
    -- Medications (stored as JSONB array)
    medications JSONB NOT NULL, -- [{"name": "Paracetamol", "dosage": "500mg", "frequency": "3x daily", ...}]
    
    -- Instructions
    special_instructions TEXT,
    
    -- Dispensing Status
    dispensed BOOLEAN DEFAULT FALSE,
    dispensed_by UUID REFERENCES pharmacies(id),
    dispensed_at TIMESTAMP,
    partially_dispensed BOOLEAN DEFAULT FALSE,
    
    -- Package Validation
    package_validated BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'expired', 'cancelled')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Prescriptions
CREATE INDEX idx_prescriptions_medical_record_id ON prescriptions(medical_record_id);
CREATE INDEX idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_dispensed ON prescriptions(dispensed);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_prescription_date ON prescriptions(prescription_date DESC);

-- ===================================
-- 5. SURGERIES TABLE
-- ===================================
CREATE TABLE surgeries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID UNIQUE NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    
    -- Patient & Providers
    patient_id UUID NOT NULL REFERENCES patients(id),
    dependent_id UUID REFERENCES dependents(id),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    primary_surgeon_id UUID NOT NULL REFERENCES doctors(id),
    
    -- Surgery Details
    surgery_type VARCHAR(20) CHECK (surgery_type IN ('minor', 'major')),
    surgery_name VARCHAR(255) NOT NULL,
    surgery_category VARCHAR(100), -- Orthopedic, Cardiac, Abdominal, etc.
    
    -- Scheduling
    scheduled_date TIMESTAMP NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Pre-operative
    pre_op_diagnosis TEXT NOT NULL,
    pre_op_assessment TEXT,
    anesthesia_type VARCHAR(100),
    anesthesiologist_id UUID REFERENCES doctors(id),
    
    -- Operative Details
    procedure_performed TEXT,
    operative_findings TEXT,
    complications TEXT,
    blood_loss_ml INTEGER,
    
    -- Post-operative
    post_op_diagnosis TEXT,
    post_op_instructions TEXT,
    recovery_notes TEXT,
    discharge_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    
    -- Package Validation & Approval
    package_validated BOOLEAN DEFAULT FALSE,
    requires_admin_approval BOOLEAN DEFAULT FALSE,
    admin_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Surgeries
CREATE INDEX idx_surgeries_medical_record_id ON surgeries(medical_record_id);
CREATE INDEX idx_surgeries_patient_id ON surgeries(patient_id);
CREATE INDEX idx_surgeries_hospital_id ON surgeries(hospital_id);
CREATE INDEX idx_surgeries_surgeon_id ON surgeries(primary_surgeon_id);
CREATE INDEX idx_surgeries_scheduled_date ON surgeries(scheduled_date);
CREATE INDEX idx_surgeries_status ON surgeries(status);
CREATE INDEX idx_surgeries_surgery_type ON surgeries(surgery_type);

-- ===================================
-- 6. LAB TESTS TABLE
-- ===================================
CREATE TABLE lab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    
    -- Patient & Provider
    patient_id UUID NOT NULL REFERENCES patients(id),
    dependent_id UUID REFERENCES dependents(id),
    ordered_by UUID NOT NULL REFERENCES doctors(id),
    hospital_id UUID REFERENCES hospitals(id), -- Lab location
    
    -- Test Details
    test_category VARCHAR(50), -- basic, advanced, imaging
    test_type VARCHAR(100) NOT NULL, -- blood_count, x_ray, mri, etc.
    test_name VARCHAR(255) NOT NULL,
    
    -- Scheduling
    ordered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_date TIMESTAMP,
    performed_date TIMESTAMP,
    
    -- Results
    results JSONB, -- Structured test results
    results_notes TEXT,
    results_file_url TEXT, -- PDF/Image of results
    abnormal_flags TEXT,
    
    -- Interpretation
    interpretation TEXT,
    interpreted_by UUID REFERENCES doctors(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'ordered' CHECK (status IN ('ordered', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    
    -- Package Validation
    package_validated BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Lab Tests
CREATE INDEX idx_lab_tests_medical_record_id ON lab_tests(medical_record_id);
CREATE INDEX idx_lab_tests_consultation_id ON lab_tests(consultation_id);
CREATE INDEX idx_lab_tests_patient_id ON lab_tests(patient_id);
CREATE INDEX idx_lab_tests_ordered_by ON lab_tests(ordered_by);
CREATE INDEX idx_lab_tests_test_type ON lab_tests(test_type);
CREATE INDEX idx_lab_tests_status ON lab_tests(status);
CREATE INDEX idx_lab_tests_ordered_date ON lab_tests(ordered_date DESC);

-- ===================================
-- Triggers for updated_at
-- ===================================
CREATE TRIGGER update_dependents_updated_at BEFORE UPDATE ON dependents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surgeries_updated_at BEFORE UPDATE ON surgeries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON lab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- Comments
-- ===================================
COMMENT ON TABLE dependents IS 'Dependents linked to patient accounts (max 4 per patient)';
COMMENT ON TABLE medical_records IS 'Master medical record linking all medical events';
COMMENT ON TABLE consultations IS 'Doctor consultations with diagnoses and treatment plans';
COMMENT ON TABLE prescriptions IS 'Medication prescriptions from doctors';
COMMENT ON TABLE surgeries IS 'Surgical procedures with pre/post-operative details';
COMMENT ON TABLE lab_tests IS 'Laboratory and imaging test orders and results';
