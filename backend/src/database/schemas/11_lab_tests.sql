-- Lab Tests table
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
