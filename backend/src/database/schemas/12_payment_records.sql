-- Payment Records table
CREATE TABLE IF NOT EXISTS payment_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id TEXT,
    provider_type VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(200) UNIQUE,
    gateway_response TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    metadata TEXT,
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_records_patient ON payment_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_provider ON payment_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_reference ON payment_records(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_type ON payment_records(payment_type);
