-- Monthly Statements table (provider-oriented for payout tracking)
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
