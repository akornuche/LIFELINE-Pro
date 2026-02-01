-- Payment Webhooks table
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
