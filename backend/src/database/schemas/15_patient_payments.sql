-- Patient Payments table (for tracking payment breakdowns)
CREATE TABLE IF NOT EXISTS patient_payments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    statement_id TEXT REFERENCES monthly_statements(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(200),
    payment_date DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_payments_patient ON patient_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_payments_statement ON patient_payments(statement_id);
CREATE INDEX IF NOT EXISTS idx_patient_payments_date ON patient_payments(payment_date);
