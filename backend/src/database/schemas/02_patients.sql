-- Patients table
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);