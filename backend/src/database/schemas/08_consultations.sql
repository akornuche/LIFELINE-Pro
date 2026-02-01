-- Consultations table
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_hospital ON consultations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(appointment_date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
