-- Hospital Beds table for individual bed management
CREATE TABLE IF NOT EXISTS beds (
    id TEXT PRIMARY KEY,
    hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    bed_number VARCHAR(20) NOT NULL,
    ward VARCHAR(50) NOT NULL DEFAULT 'General Ward',
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance')),
    patient_name VARCHAR(100),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hospital_id, bed_number)
);

CREATE INDEX IF NOT EXISTS idx_beds_hospital ON beds(hospital_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_beds_ward ON beds(ward);
