-- Service Requests table (queue/matching system)
-- Patients request services, system assigns providers by city via round-robin
CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN (
        'consultation', 'prescription', 'drug_dispensing',
        'minor_surgery', 'major_surgery', 'laboratory_test',
        'imaging', 'admission', 'emergency'
    )),
    provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('doctor', 'pharmacy', 'hospital')),
    assigned_provider_id TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'accepted', 'in_progress',
        'completed', 'cancelled', 'rejected', 'expired'
    )),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'emergency')),
    description TEXT,
    preferred_date DATETIME,
    assigned_at DATETIME,
    accepted_at DATETIME,
    completed_at DATETIME,
    cancelled_at DATETIME,
    cancellation_reason TEXT,
    rejection_reason TEXT,
    consultation_id TEXT REFERENCES consultations(id),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_requests_patient ON service_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider ON service_requests(assigned_provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_city ON service_requests(city);
CREATE INDEX IF NOT EXISTS idx_service_requests_type ON service_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_type ON service_requests(provider_type);

-- Provider assignment tracking for round-robin
CREATE TABLE IF NOT EXISTS provider_assignment_counters (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    provider_type VARCHAR(20) NOT NULL CHECK (provider_type IN ('doctor', 'pharmacy', 'hospital')),
    city VARCHAR(100) NOT NULL,
    assignment_count INTEGER DEFAULT 0,
    last_assigned_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider_id, provider_type, city)
);

CREATE INDEX IF NOT EXISTS idx_provider_counters_city ON provider_assignment_counters(city, provider_type);
