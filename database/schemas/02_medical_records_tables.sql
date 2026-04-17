-- ===================================
-- LIFELINE PRO - Medical Records Tables
-- ===================================
-- Tables: Pricing, Dependents, Consultations, Prescriptions, Surgeries, Lab Tests
-- Version: 2.0.0  (aligned with runtime schemas)
-- Database: SQLite
-- ===================================

-- 1. PRICING TABLE (4-tier: GENERAL / BASIC / STANDARD / PREMIUM)
CREATE TABLE IF NOT EXISTS pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type VARCHAR(50) NOT NULL,
    package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('GENERAL', 'BASIC', 'STANDARD', 'PREMIUM')),
    patient_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    provider_share DECIMAL(10,2) NOT NULL DEFAULT 0,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_type, package_type)
);

CREATE INDEX IF NOT EXISTS idx_pricing_service ON pricing(service_type);
CREATE INDEX IF NOT EXISTS idx_pricing_package ON pricing(package_type);

-- 2. DEPENDENTS TABLE
CREATE TABLE IF NOT EXISTS dependents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    relationship VARCHAR(50) NOT NULL,
    blood_group VARCHAR(10),
    allergies TEXT,
    chronic_conditions TEXT,
    emergency_contact TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dependents_patient ON dependents(patient_id);
CREATE INDEX IF NOT EXISTS idx_dependents_active ON dependents(is_active);

-- 3. CONSULTATIONS TABLE
CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id TEXT REFERENCES hospitals(id),
    dependent_id TEXT REFERENCES dependents(id),
    consultation_type VARCHAR(50) NOT NULL,
    reason_for_visit TEXT NOT NULL,
    appointment_date DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    diagnosis TEXT,
    symptoms TEXT,
    findings TEXT,
    treatment TEXT,
    follow_up_date DATE,
    notes TEXT,
    total_cost DECIMAL(10,2),
    referral_needed BOOLEAN DEFAULT FALSE,
    referral_to VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_hospital ON consultations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(appointment_date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- 4. PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    consultation_id TEXT REFERENCES consultations(id),
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    pharmacy_id TEXT REFERENCES pharmacies(id),
    medications TEXT NOT NULL,
    diagnosis TEXT,
    notes TEXT,
    refills_allowed INTEGER DEFAULT 0,
    refills_used INTEGER DEFAULT 0,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    dispensed_at DATETIME,
    dispensed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacy ON prescriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- 5. SURGERIES TABLE
CREATE TABLE IF NOT EXISTS surgeries (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    surgery_type VARCHAR(200) NOT NULL,
    description TEXT,
    scheduled_date DATETIME NOT NULL,
    duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled',
    pre_op_notes TEXT,
    post_op_notes TEXT,
    complications TEXT,
    outcome TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_surgeries_patient ON surgeries(patient_id);
CREATE INDEX IF NOT EXISTS idx_surgeries_doctor ON surgeries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_surgeries_hospital ON surgeries(hospital_id);
CREATE INDEX IF NOT EXISTS idx_surgeries_date ON surgeries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_surgeries_status ON surgeries(status);

-- 6. LAB TESTS TABLE
CREATE TABLE IF NOT EXISTS lab_tests (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    consultation_id TEXT REFERENCES consultations(id),
    test_type VARCHAR(200) NOT NULL,
    test_category VARCHAR(100),
    clinical_indication TEXT,
    urgency VARCHAR(20) DEFAULT 'routine',
    status VARCHAR(20) DEFAULT 'pending',
    test_date DATETIME,
    results TEXT,
    performed_by VARCHAR(200),
    notes TEXT,
    estimated_cost DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lab_tests_patient ON lab_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_doctor ON lab_tests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_consultation ON lab_tests(consultation_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_status ON lab_tests(status);
CREATE INDEX IF NOT EXISTS idx_lab_tests_type ON lab_tests(test_type);
