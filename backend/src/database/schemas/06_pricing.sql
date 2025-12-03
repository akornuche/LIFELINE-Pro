-- Pricing table
CREATE TABLE IF NOT EXISTS pricing_table (
    service_type VARCHAR(50) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    unit_cost INTEGER NOT NULL,
    applies_to_basic INTEGER DEFAULT 0,
    applies_to_medium INTEGER DEFAULT 0,
    applies_to_advanced INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_type, service_name)
);