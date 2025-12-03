-- ===================================
-- LIFELINE PRO - Payment Tables
-- ===================================
-- Tables: PaymentRecords, MonthlyStatements, PricingTable, PatientPayments
-- Version: 1.0.0
-- Date: 2025-11-22

-- ===================================
-- 1. PRICING TABLE (Admin-controlled service costs)
-- ===================================
CREATE TABLE pricing_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Service Definition
    service_type VARCHAR(50) NOT NULL, -- consultation, drug_dispensing, minor_surgery, etc.
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    
    -- Pricing
    unit_cost DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    
    -- Package Applicability
    applies_to_basic BOOLEAN DEFAULT TRUE,
    applies_to_medium BOOLEAN DEFAULT TRUE,
    applies_to_advanced BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(service_type, service_name)
);

-- Indexes for Pricing Table
CREATE INDEX idx_pricing_service_type ON pricing_table(service_type);
CREATE INDEX idx_pricing_is_active ON pricing_table(is_active);

-- ===================================
-- 2. PAYMENT RECORDS TABLE (Provider Compensation Tracking)
-- ===================================
CREATE TABLE payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Provider Information
    provider_id UUID NOT NULL, -- References users(id) - can be doctor, pharmacy, or hospital
    provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('doctor', 'pharmacy', 'hospital')),
    
    -- Patient Information
    patient_id UUID NOT NULL REFERENCES patients(id),
    dependent_id UUID REFERENCES dependents(id),
    
    -- Service Information
    service_type VARCHAR(50) NOT NULL, -- consultation, drugs, minor_surgery, major_surgery, lab_test
    service_description TEXT NOT NULL,
    service_reference_id UUID, -- References consultation_id, prescription_id, surgery_id, etc.
    date_of_service TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Pricing
    unit_cost DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_cost DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    
    -- Status & Approval
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'paid')),
    reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Monthly Statement Reference
    statement_id UUID, -- Will be set when monthly statement is generated
    
    -- Metadata
    metadata JSONB, -- Additional service-specific data
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Payment Records
CREATE INDEX idx_payment_records_provider_id ON payment_records(provider_id);
CREATE INDEX idx_payment_records_provider_type ON payment_records(provider_type);
CREATE INDEX idx_payment_records_patient_id ON payment_records(patient_id);
CREATE INDEX idx_payment_records_service_type ON payment_records(service_type);
CREATE INDEX idx_payment_records_date_of_service ON payment_records(date_of_service DESC);
CREATE INDEX idx_payment_records_status ON payment_records(status);
CREATE INDEX idx_payment_records_statement_id ON payment_records(statement_id);
CREATE INDEX idx_payment_records_created_at ON payment_records(created_at DESC);

-- ===================================
-- 3. MONTHLY STATEMENTS TABLE (Provider Monthly Compensation)
-- ===================================
CREATE TABLE monthly_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Provider Information
    provider_id UUID NOT NULL,
    provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('doctor', 'pharmacy', 'hospital')),
    
    -- Statement Period
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2025),
    statement_period VARCHAR(20) NOT NULL, -- "2025-11" format for easy reading
    
    -- Financial Summary
    total_services INTEGER NOT NULL DEFAULT 0, -- Count of services
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'NGN',
    
    -- Payment IDs (array of payment_record IDs)
    payment_record_ids UUID[] NOT NULL DEFAULT '{}',
    
    -- Status & Settlement
    status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'approved', 'paid', 'disputed')),
    approved_by UUID REFERENCES users(id), -- Admin who approved
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    payment_reference VARCHAR(100), -- Bank transaction reference
    payment_method VARCHAR(50), -- Bank Transfer, Cheque, etc.
    
    -- Document
    statement_document_url TEXT, -- PDF statement
    
    -- Metadata
    date_generated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider_id, provider_type, month, year)
);

-- Indexes for Monthly Statements
CREATE INDEX idx_monthly_statements_provider_id ON monthly_statements(provider_id);
CREATE INDEX idx_monthly_statements_provider_type ON monthly_statements(provider_type);
CREATE INDEX idx_monthly_statements_period ON monthly_statements(statement_period);
CREATE INDEX idx_monthly_statements_status ON monthly_statements(status);
CREATE INDEX idx_monthly_statements_month_year ON monthly_statements(month, year);
CREATE INDEX idx_monthly_statements_date_generated ON monthly_statements(date_generated DESC);

-- ===================================
-- 4. PATIENT PAYMENTS TABLE (Patient Subscriptions)
-- ===================================
CREATE TABLE patient_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Patient Information
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Payment Details
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('subscription', 'upgrade', 'renewal', 'penalty')),
    package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('BASIC', 'MEDIUM', 'ADVANCED')),
    
    -- Amount
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    
    -- Payment Gateway
    payment_method VARCHAR(50), -- Paystack, Flutterwave, Bank Transfer, Card
    payment_gateway VARCHAR(50),
    transaction_reference VARCHAR(100) UNIQUE,
    gateway_reference VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled', 'refunded')),
    
    -- Subscription Period
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    
    -- Gateway Response
    gateway_response JSONB,
    failure_reason TEXT,
    
    -- Receipts
    receipt_url TEXT,
    
    -- Metadata
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Patient Payments
CREATE INDEX idx_patient_payments_patient_id ON patient_payments(patient_id);
CREATE INDEX idx_patient_payments_payment_type ON patient_payments(payment_type);
CREATE INDEX idx_patient_payments_status ON patient_payments(status);
CREATE INDEX idx_patient_payments_transaction_ref ON patient_payments(transaction_reference);
CREATE INDEX idx_patient_payments_created_at ON patient_payments(created_at DESC);
CREATE INDEX idx_patient_payments_subscription_period ON patient_payments(subscription_start_date, subscription_end_date);

-- ===================================
-- 5. PAYMENT WEBHOOKS TABLE (Track webhook events from payment gateways)
-- ===================================
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Webhook Details
    gateway VARCHAR(50) NOT NULL, -- paystack, flutterwave
    event_type VARCHAR(100) NOT NULL, -- charge.success, subscription.disable, etc.
    
    -- Payload
    payload JSONB NOT NULL,
    headers JSONB,
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    processing_error TEXT,
    
    -- Reference
    transaction_reference VARCHAR(100),
    patient_payment_id UUID REFERENCES patient_payments(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Payment Webhooks
CREATE INDEX idx_payment_webhooks_gateway ON payment_webhooks(gateway);
CREATE INDEX idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX idx_payment_webhooks_transaction_ref ON payment_webhooks(transaction_reference);
CREATE INDEX idx_payment_webhooks_created_at ON payment_webhooks(created_at DESC);

-- ===================================
-- Triggers for updated_at
-- ===================================
CREATE TRIGGER update_pricing_table_updated_at BEFORE UPDATE ON pricing_table
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON payment_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_statements_updated_at BEFORE UPDATE ON monthly_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_payments_updated_at BEFORE UPDATE ON patient_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- Foreign Key Constraints for provider_id
-- ===================================
-- Note: provider_id references users(id) but we can't create a traditional FK
-- because it can reference different provider types. We'll handle validation in application logic.

-- ===================================
-- Comments
-- ===================================
COMMENT ON TABLE pricing_table IS 'Admin-controlled pricing for all services';
COMMENT ON TABLE payment_records IS 'Individual service records for provider compensation';
COMMENT ON TABLE monthly_statements IS 'Monthly aggregated statements for provider payment';
COMMENT ON TABLE patient_payments IS 'Patient subscription payments and transactions';
COMMENT ON TABLE payment_webhooks IS 'Payment gateway webhook events for processing';
