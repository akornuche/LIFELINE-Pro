-- ===================================
-- LIFELINE PRO - Core Tables Schema
-- ===================================
-- Tables: Users, Patients, Doctors, Pharmacies, Hospitals
-- Version: 1.0.0
-- Date: 2025-11-22

-- Note: Modified for SQLite compatibility

-- ===================================
-- 1. USERS TABLE (Base table for all user types)
-- ===================================
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    lifeline_id VARCHAR(20) UNIQUE NOT NULL, -- LLPAT-XXXXX, LLDOC-XXXXX, etc.
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'pharmacy', 'hospital', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_lifeline_id ON users(lifeline_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ===================================
-- 2. PATIENTS TABLE
-- ===================================
CREATE TABLE patients (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nigeria',
    
    -- Package Information
    package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('BASIC', 'MEDIUM', 'ADVANCED')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled', 'suspended')),
    subscription_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_end_date TIMESTAMP,
    next_billing_date TIMESTAMP,
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Medical Information
    blood_group VARCHAR(5),
    genotype VARCHAR(5),
    allergies TEXT,
    chronic_conditions TEXT,
    
    -- ID Documents (optional)
    id_type VARCHAR(50), -- NIN, Passport, Driver's License
    id_number VARCHAR(100),
    id_document_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Patients
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_package_type ON patients(package_type);
CREATE INDEX idx_patients_subscription_status ON patients(subscription_status);
CREATE INDEX idx_patients_next_billing_date ON patients(next_billing_date);
CREATE INDEX idx_patients_full_name ON patients(first_name, last_name);

-- ===================================
-- 3. DOCTORS TABLE
-- ===================================
CREATE TABLE doctors (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    
    -- Professional Information
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL, -- General Practice, Cardiology, etc.
    sub_specialty VARCHAR(100),
    years_of_experience INTEGER,
    qualifications TEXT, -- JSON or comma-separated
    
    -- Location
    hospital_affiliation VARCHAR(255),
    clinic_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nigeria',
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    
    -- Documents
    license_document_url TEXT,
    certificate_urls TEXT, -- JSON array
    
    -- Availability
    consultation_fee DECIMAL(10, 2) DEFAULT 0,
    is_accepting_patients BOOLEAN DEFAULT TRUE,
    max_patients_per_day INTEGER DEFAULT 20,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Doctors
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_license_number ON doctors(license_number);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_verification_status ON doctors(verification_status);
CREATE INDEX idx_doctors_city_state ON doctors(city, state);
CREATE INDEX idx_doctors_is_accepting ON doctors(is_accepting_patients);

-- ===================================
-- 4. PHARMACIES TABLE
-- ===================================
CREATE TABLE pharmacies (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business Information
    pharmacy_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    registration_number VARCHAR(100),
    
    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Nigeria',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact
    contact_person VARCHAR(200) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    alternative_phone VARCHAR(20),
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    
    -- Documents
    license_document_url TEXT,
    business_registration_url TEXT,
    
    -- Operation
    operating_hours TEXT, -- JSON: {"monday": "8am-6pm", ...}
    is_operational BOOLEAN DEFAULT TRUE,
    accepts_emergency BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Pharmacies
CREATE INDEX idx_pharmacies_user_id ON pharmacies(user_id);
CREATE INDEX idx_pharmacies_license_number ON pharmacies(license_number);
CREATE INDEX idx_pharmacies_verification_status ON pharmacies(verification_status);
CREATE INDEX idx_pharmacies_city_state ON pharmacies(city, state);
CREATE INDEX idx_pharmacies_is_operational ON pharmacies(is_operational);
CREATE INDEX idx_pharmacies_location ON pharmacies(latitude, longitude);

-- ===================================
-- 5. HOSPITALS TABLE
-- ===================================
CREATE TABLE hospitals (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business Information
    hospital_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    registration_number VARCHAR(100),
    hospital_type VARCHAR(50), -- General, Specialist, Teaching, etc.
    
    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Nigeria',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact
    contact_person VARCHAR(200) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    emergency_phone VARCHAR(20),
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    
    -- Documents
    license_document_url TEXT,
    accreditation_urls TEXT, -- JSON array
    
    -- Facilities
    total_beds INTEGER DEFAULT 0,
    available_beds INTEGER DEFAULT 0,
    has_emergency_unit BOOLEAN DEFAULT FALSE,
    has_icu BOOLEAN DEFAULT FALSE,
    has_surgery_unit BOOLEAN DEFAULT TRUE,
    ambulance_available BOOLEAN DEFAULT FALSE,
    
    -- Specialties Offered (JSON array)
    specialties_offered TEXT,
    
    -- Operation
    is_operational BOOLEAN DEFAULT TRUE,
    accepts_emergency BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Hospitals
CREATE INDEX idx_hospitals_user_id ON hospitals(user_id);
CREATE INDEX idx_hospitals_license_number ON hospitals(license_number);
CREATE INDEX idx_hospitals_verification_status ON hospitals(verification_status);
CREATE INDEX idx_hospitals_city_state ON hospitals(city, state);
CREATE INDEX idx_hospitals_is_operational ON hospitals(is_operational);
CREATE INDEX idx_hospitals_location ON hospitals(latitude, longitude);
CREATE INDEX idx_hospitals_has_emergency ON hospitals(has_emergency_unit);

-- ===================================
-- Triggers for updated_at
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- Comments
-- ===================================
COMMENT ON TABLE users IS 'Base table for all users in the system';
COMMENT ON TABLE patients IS 'Patient-specific information including package and subscription details';
COMMENT ON TABLE doctors IS 'Doctor profiles with license and specialty information';
COMMENT ON TABLE pharmacies IS 'Pharmacy locations and operational details';
COMMENT ON TABLE hospitals IS 'Hospital facilities and capabilities';
