-- ===================================
-- LIFELINE PRO - Core Tables Schema
-- ===================================
-- Tables: Users, Patients, Doctors, Pharmacies, Hospitals
-- Version: 2.0.0  (aligned with runtime schemas)
-- Database: SQLite
-- ===================================

-- 1. USERS TABLE (Base table for all user types)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    lifeline_id VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'pharmacy', 'hospital', 'admin')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    email_verified INTEGER DEFAULT 0,
    phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    profile_image_url VARCHAR(500),
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lifeline_id VARCHAR(20) UNIQUE NOT NULL,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    blood_type VARCHAR(10),
    allergies TEXT,
    medical_conditions TEXT,
    current_medications TEXT,
    insurance_provider VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    current_package VARCHAR(50),
    subscription_status VARCHAR(20) DEFAULT 'inactive',
    subscription_start_date DATE,
    subscription_end_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_lifeline ON patients(lifeline_id);
CREATE INDEX IF NOT EXISTS idx_patients_subscription ON patients(subscription_status);

-- 3. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    years_of_experience INTEGER,
    medical_school VARCHAR(200),
    graduation_year INTEGER,
    certifications TEXT,
    languages_spoken TEXT,
    consultation_fee DECIMAL(10,2),
    availability_schedule TEXT,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents TEXT,
    rejection_reason TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_consultations INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. PHARMACIES TABLE
CREATE TABLE IF NOT EXISTS pharmacies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    pharmacy_name VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    operating_hours TEXT,
    services_offered TEXT,
    open_24_hours BOOLEAN DEFAULT false,
    delivery_available BOOLEAN DEFAULT false,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents TEXT,
    rejection_reason TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_prescriptions INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    hospital_name VARCHAR(200) NOT NULL,
    hospital_type VARCHAR(100) DEFAULT 'general',
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    bed_capacity INTEGER,
    available_beds INTEGER DEFAULT 0,
    specialties TEXT,
    services_offered TEXT,
    operating_hours TEXT,
    emergency_services BOOLEAN DEFAULT false,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents TEXT,
    rejection_reason TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_surgeries INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
