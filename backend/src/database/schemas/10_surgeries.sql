-- Surgeries table
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
