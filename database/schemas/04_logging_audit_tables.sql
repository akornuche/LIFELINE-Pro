-- ===================================
-- LIFELINE PRO - Logging and Audit Tables
-- ===================================
-- Tables: ErrorLogs, AuditLogs, SystemLogs
-- Version: 1.0.0
-- Date: 2025-11-22

-- ===================================
-- 1. ERROR LOGS TABLE
-- ===================================
CREATE TABLE error_logs (
    id TEXT PRIMARY KEY,
    
    -- Error Classification
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50) NOT NULL, -- authentication, database, payment, entitlement, etc.
    error_code VARCHAR(50),
    
    -- Error Details
    error_message TEXT NOT NULL,
    error_stack TEXT,
    
    -- Context
    user_id TEXT, -- May be NULL if error occurs before authentication
    user_role VARCHAR(20),
    endpoint VARCHAR(255), -- API endpoint where error occurred
    http_method VARCHAR(10), -- GET, POST, PUT, DELETE
    request_body JSONB,
    request_params JSONB,
    
    -- System Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    server_name VARCHAR(100),
    
    -- Action Context
    action VARCHAR(100), -- e.g., "attempted_major_surgery_on_basic_plan"
    entity_type VARCHAR(50), -- patient, doctor, payment, etc.
    entity_id UUID,
    
    -- Resolution
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Error Logs
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_category ON error_logs(category);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_endpoint ON error_logs(endpoint);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_severity_created ON error_logs(severity, created_at DESC);

-- ===================================
-- 2. AUDIT LOGS TABLE (Track sensitive actions)
-- ===================================
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    
    -- User Context
    user_id TEXT NOT NULL REFERENCES users(id),
    user_role VARCHAR(20) NOT NULL,
    user_email VARCHAR(255),
    
    -- Action Details
    action VARCHAR(100) NOT NULL, -- login, logout, approve_provider, approve_payment, etc.
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'read', 'update', 'delete', 'approve', 'reject', 'login', 'logout')),
    
    -- Target Entity
    entity_type VARCHAR(50) NOT NULL, -- user, patient, doctor, payment_record, monthly_statement, etc.
    entity_id UUID,
    
    -- Changes (for update actions)
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    
    -- Result
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    
    -- Metadata
    description TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_action_created ON audit_logs(user_id, action, created_at DESC);

-- ===================================
-- 3. SYSTEM LOGS TABLE (General application logs)
-- ===================================
CREATE TABLE system_logs (
    id TEXT PRIMARY KEY,
    
    -- Log Level
    level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    
    -- Log Details
    message TEXT NOT NULL,
    category VARCHAR(50), -- database, cron_job, email, socket, payment_gateway, etc.
    
    -- Context
    service VARCHAR(100), -- Which service/module generated the log
    function_name VARCHAR(100),
    
    -- Additional Data
    data JSONB,
    stack_trace TEXT,
    
    -- System Info
    server_name VARCHAR(100),
    process_id INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for System Logs
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level_created ON system_logs(level, created_at DESC);

-- ===================================
-- 4. SESSION LOGS TABLE (Track user sessions)
-- ===================================
CREATE TABLE session_logs (
    id TEXT PRIMARY KEY,
    
    -- User
    user_id TEXT NOT NULL REFERENCES users(id),
    user_role VARCHAR(20) NOT NULL,
    
    -- Session Details
    session_token VARCHAR(255),
    refresh_token VARCHAR(255),
    
    -- Login Info
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Device & Location
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50), -- mobile, tablet, desktop
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- Geolocation (optional)
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- Session Status
    is_active BOOLEAN DEFAULT TRUE,
    logout_reason VARCHAR(50), -- manual, timeout, forced, security
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Session Logs
CREATE INDEX idx_session_logs_user_id ON session_logs(user_id);
CREATE INDEX idx_session_logs_session_token ON session_logs(session_token);
CREATE INDEX idx_session_logs_is_active ON session_logs(is_active);
CREATE INDEX idx_session_logs_login_at ON session_logs(login_at DESC);
CREATE INDEX idx_session_logs_last_activity ON session_logs(last_activity DESC);

-- ===================================
-- 5. API REQUEST LOGS TABLE (Monitor API usage)
-- ===================================
CREATE TABLE api_request_logs (
    id TEXT PRIMARY KEY,
    
    -- Request Info
    endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    
    -- User Context
    user_id TEXT,
    user_role VARCHAR(20),
    
    -- Request Details
    request_headers JSONB,
    request_body JSONB,
    request_params JSONB,
    query_string TEXT,
    
    -- Response
    status_code INTEGER,
    response_time_ms INTEGER, -- Response time in milliseconds
    response_size_bytes INTEGER,
    
    -- Client Info
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Error Info (if any)
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for API Request Logs
CREATE INDEX idx_api_request_logs_endpoint ON api_request_logs(endpoint);
CREATE INDEX idx_api_request_logs_user_id ON api_request_logs(user_id);
CREATE INDEX idx_api_request_logs_status_code ON api_request_logs(status_code);
CREATE INDEX idx_api_request_logs_created_at ON api_request_logs(created_at DESC);
CREATE INDEX idx_api_request_logs_response_time ON api_request_logs(response_time_ms DESC);

-- ===================================
-- 6. NOTIFICATION LOGS TABLE (Track all notifications sent)
-- ===================================
CREATE TABLE notification_logs (
    id TEXT PRIMARY KEY,
    
    -- Recipient
    user_id TEXT NOT NULL REFERENCES users(id),
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL, -- email, sms, push, socket
    channel VARCHAR(50) NOT NULL, -- approval, appointment, payment, alert
    
    -- Content
    title VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Delivery
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    failure_reason TEXT,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Notification Logs
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_read ON notification_logs(read);

-- ===================================
-- Partitioning Strategy (Optional - for large-scale deployments)
-- ===================================
-- For production, consider partitioning log tables by time (monthly/quarterly)
-- Example for error_logs:
-- CREATE TABLE error_logs_2025_11 PARTITION OF error_logs
--     FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- ===================================
-- Data Retention Policy (Implement via cron job)
-- ===================================
-- Suggested retention:
-- - error_logs: 90 days (critical: 365 days)
-- - audit_logs: 365 days (indefinite for critical actions)
-- - system_logs: 30 days
-- - session_logs: 90 days
-- - api_request_logs: 30 days
-- - notification_logs: 90 days

-- ===================================
-- Comments
-- ===================================
COMMENT ON TABLE error_logs IS 'Application errors with severity classification and context';
COMMENT ON TABLE audit_logs IS 'Audit trail for sensitive actions (approvals, payments, deletions)';
COMMENT ON TABLE system_logs IS 'General application logs for monitoring and debugging';
COMMENT ON TABLE session_logs IS 'User session tracking for security and analytics';
COMMENT ON TABLE api_request_logs IS 'API request monitoring for performance and usage analysis';
COMMENT ON TABLE notification_logs IS 'Track all notifications sent to users across all channels';
