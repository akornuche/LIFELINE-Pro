-- Pricing table (matches pricingRepository.js expectations)
-- Maps service_type + package_type to pricing breakdown

CREATE TABLE IF NOT EXISTS pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type VARCHAR(50) NOT NULL,
    package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('GENERAL', 'BASIC', 'STANDARD', 'PREMIUM')),
    patient_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    provider_share DECIMAL(10,2) NOT NULL DEFAULT 0,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_type, package_type)
);

CREATE INDEX IF NOT EXISTS idx_pricing_service ON pricing(service_type);
CREATE INDEX IF NOT EXISTS idx_pricing_package ON pricing(package_type);

-- Seed pricing data for all 4 tiers × service types
-- GENERAL tier: doctor consultations only (pharmacy/hospital blocked by entitlementChecker)
INSERT OR IGNORE INTO pricing (service_type, package_type, patient_price, provider_share, platform_fee, description) VALUES
  ('consultation',    'GENERAL',  0,     1200, 300,  'Doctor consultation - General plan (covered)'),
  ('prescription',    'GENERAL',  0,     800,  200,  'Prescription - General plan (covered)'),

-- BASIC tier: common illnesses, all providers
  ('consultation',    'BASIC',    0,     1500, 500,  'Doctor consultation - Basic Insurance'),
  ('prescription',    'BASIC',    0,     1000, 300,  'Prescription - Basic Insurance'),
  ('drug_dispensing',  'BASIC',    0,     1200, 300,  'Drug dispensing - Basic Insurance'),
  ('laboratory_test', 'BASIC',    0,     2000, 500,  'Lab test - Basic Insurance'),
  ('imaging',         'BASIC',    0,     3000, 500,  'Imaging (X-ray/Ultrasound) - Basic Insurance'),
  ('emergency',       'BASIC',    0,     5000, 1000, 'Emergency care - Basic Insurance'),

-- STANDARD tier: + minor surgeries
  ('consultation',    'STANDARD', 0,     1800, 700,  'Doctor consultation - Standard Insurance'),
  ('prescription',    'STANDARD', 0,     1200, 300,  'Prescription - Standard Insurance'),
  ('drug_dispensing',  'STANDARD', 0,     1500, 500,  'Drug dispensing - Standard Insurance'),
  ('minor_surgery',   'STANDARD', 0,     15000, 3000, 'Minor surgery - Standard Insurance'),
  ('laboratory_test', 'STANDARD', 0,     2500, 500,  'Lab test - Standard Insurance'),
  ('imaging',         'STANDARD', 0,     4000, 1000, 'Imaging - Standard Insurance'),
  ('admission',       'STANDARD', 0,     8000, 2000, 'Hospital admission - Standard Insurance'),
  ('emergency',       'STANDARD', 0,     8000, 2000, 'Emergency care - Standard Insurance'),

-- PREMIUM tier: full coverage including major surgery, childbirth
  ('consultation',    'PREMIUM',  0,     2500, 1000, 'Doctor consultation - Premium Insurance'),
  ('prescription',    'PREMIUM',  0,     1500, 500,  'Prescription - Premium Insurance'),
  ('drug_dispensing',  'PREMIUM',  0,     2000, 500,  'Drug dispensing - Premium Insurance'),
  ('minor_surgery',   'PREMIUM',  0,     20000, 5000, 'Minor surgery - Premium Insurance'),
  ('major_surgery',   'PREMIUM',  0,     50000, 10000, 'Major surgery - Premium Insurance'),
  ('laboratory_test', 'PREMIUM',  0,     3000, 1000, 'Lab test - Premium Insurance'),
  ('imaging',         'PREMIUM',  0,     5000, 1000, 'Imaging - Premium Insurance'),
  ('admission',       'PREMIUM',  0,     10000, 3000, 'Hospital admission - Premium Insurance'),
  ('emergency',       'PREMIUM',  0,     10000, 3000, 'Emergency care - Premium Insurance');