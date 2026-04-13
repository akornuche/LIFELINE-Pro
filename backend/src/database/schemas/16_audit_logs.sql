-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_role TEXT DEFAULT 'anonymous',
    event_type TEXT NOT NULL,
    event_category TEXT DEFAULT 'general',
    resource_type TEXT,
    resource_id TEXT,
    action TEXT,
    changes TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_event_category ON audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
