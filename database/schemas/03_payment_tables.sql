-- ===================================
-- LIFELINE PRO - Payment Tables
-- ===================================
-- Tables: Payment Records, Payment Webhooks, Monthly Statements, Patient Payments
-- Version: 2.0.0  (aligned with runtime schemas)
-- Database: SQLite
-- ===================================

-- 1. PAYMENT RECORDS TABLE
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

-- 2. PAYMENT WEBHOOKS TABLE
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id TEXT PRIMARY KEY,
    payment_id TEXT REFERENCES payment_records(id),
    webhook_type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(200),
    payload TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    processed_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_payment ON payment_webhooks(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_status ON payment_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event ON payment_webhooks(event_id);

-- 3. MONTHLY STATEMENTS TABLE (provider-oriented for payout tracking)
CREATE TABLE IF NOT EXISTS monthly_statements (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    provider_type VARCHAR(20) NOT NULL CHECK(provider_type IN ('doctor', 'pharmacy', 'hospital')),
    month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK(year >= 2020),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by TEXT,
    approved_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider_id, provider_type, month, year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_statements_provider ON monthly_statements(provider_id);
CREATE INDEX IF NOT EXISTS idx_monthly_statements_period ON monthly_statements(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_statements_status ON monthly_statements(status);

-- 4. PATIENT PAYMENTS TABLE (for tracking payment breakdowns)
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
