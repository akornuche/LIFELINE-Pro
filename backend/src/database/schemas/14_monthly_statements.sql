-- Monthly Statements table
CREATE TABLE IF NOT EXISTS monthly_statements (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    statement_date DATE NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    subscription_fee DECIMAL(10,2) DEFAULT 0,
    consultation_charges DECIMAL(10,2) DEFAULT 0,
    prescription_charges DECIMAL(10,2) DEFAULT 0,
    lab_test_charges DECIMAL(10,2) DEFAULT 0,
    surgery_charges DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monthly_statements_patient ON monthly_statements(patient_id);
CREATE INDEX IF NOT EXISTS idx_monthly_statements_date ON monthly_statements(statement_date);
CREATE INDEX IF NOT EXISTS idx_monthly_statements_status ON monthly_statements(status);
