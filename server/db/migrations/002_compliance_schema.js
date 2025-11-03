/**
 * Compliance & Audit Database Schema
 * SOC2, GDPR, HIPAA, PCI-DSS compliance tables
 */

const { Pool } = require('pg');

const up = async (client) => {
  // Audit logs table - immutable audit trail
  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      event_id UUID UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50) NOT NULL,
      resource_id VARCHAR(100),
      changes JSONB,
      ip_address INET,
      user_agent TEXT,
      hash VARCHAR(64) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      CONSTRAINT audit_logs_immutable CHECK (created_at <= NOW())
    );
  `);

  // GDPR deletion requests
  await client.query(`
    CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
      requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      scheduled_deletion_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      cancellation_reason TEXT
    );
  `);

  // GDPR data exports
  await client.query(`
    CREATE TABLE IF NOT EXISTS gdpr_exports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      export_data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      downloaded_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Scheduled jobs for automated compliance tasks
  await client.query(`
    CREATE TABLE IF NOT EXISTS scheduled_jobs (
      id SERIAL PRIMARY KEY,
      job_type VARCHAR(50) NOT NULL,
      scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
      parameters JSONB,
      result JSONB,
      error_message TEXT
    );
  `);

  // Compliance events tracking
  await client.query(`
    CREATE TABLE IF NOT EXISTS compliance_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      subject_id VARCHAR(100),
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Security incidents
  await client.query(`
    CREATE TABLE IF NOT EXISTS security_incidents (
      id SERIAL PRIMARY KEY,
      incident_type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      description TEXT NOT NULL,
      affected_resources JSONB,
      status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
      assigned_to INTEGER REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      resolved_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // System alerts
  await client.query(`
    CREATE TABLE IF NOT EXISTS system_alerts (
      id SERIAL PRIMARY KEY,
      alert_type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'error', 'critical')),
      message TEXT NOT NULL,
      source VARCHAR(100),
      metadata JSONB,
      acknowledged BOOLEAN DEFAULT FALSE,
      acknowledged_by INTEGER REFERENCES users(id),
      acknowledged_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // System status tracking
  await client.query(`
    CREATE TABLE IF NOT EXISTS system_status (
      id SERIAL PRIMARY KEY,
      service_name VARCHAR(100) NOT NULL,
      status VARCHAR(20) CHECK (status IN ('up', 'down', 'degraded')),
      duration INTERVAL,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      metadata JSONB
    );
  `);

  // Security vulnerabilities
  await client.query(`
    CREATE TABLE IF NOT EXISTS security_vulnerabilities (
      id SERIAL PRIMARY KEY,
      cve_id VARCHAR(20),
      severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      description TEXT NOT NULL,
      affected_component VARCHAR(100),
      discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      patched_at TIMESTAMP WITH TIME ZONE,
      patch_version VARCHAR(50),
      status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'patching', 'patched', 'accepted_risk'))
    );
  `);

  // System settings for compliance configuration
  await client.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) UNIQUE NOT NULL,
      value TEXT,
      description TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_by INTEGER REFERENCES users(id)
    );
  `);

  // Add MFA and password tracking to users table
  await client.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;
  `);

  // Add rotation tracking to API keys
  await client.query(`
    ALTER TABLE api_keys 
    ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS rotation_required_at TIMESTAMP WITH TIME ZONE;
  `);

  // Create indexes for performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_status ON gdpr_deletion_requests(status);
    CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
    CREATE INDEX IF NOT EXISTS idx_system_alerts_acknowledged ON system_alerts(acknowledged);
    CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON scheduled_jobs(status);
  `);

  // Insert default system settings
  await client.query(`
    INSERT INTO system_settings (key, value, description) VALUES
    ('mfa_required', 'false', 'Require MFA for all users'),
    ('password_min_length', '12', 'Minimum password length'),
    ('password_complexity', 'true', 'Require complex passwords'),
    ('session_timeout', '3600', 'Session timeout in seconds'),
    ('api_key_rotation_days', '90', 'API key rotation period in days'),
    ('audit_retention_days', '2555', 'Audit log retention period (7 years)'),
    ('backup_retention_days', '90', 'Backup retention period'),
    ('vulnerability_scan_enabled', 'true', 'Enable automated vulnerability scanning')
    ON CONFLICT (key) DO NOTHING;
  `);

  console.log('Compliance schema migration completed');
};

const down = async (client) => {
  await client.query('DROP TABLE IF EXISTS system_settings CASCADE;');
  await client.query('DROP TABLE IF EXISTS security_vulnerabilities CASCADE;');
  await client.query('DROP TABLE IF EXISTS system_status CASCADE;');
  await client.query('DROP TABLE IF EXISTS system_alerts CASCADE;');
  await client.query('DROP TABLE IF EXISTS security_incidents CASCADE;');
  await client.query('DROP TABLE IF EXISTS compliance_events CASCADE;');
  await client.query('DROP TABLE IF EXISTS scheduled_jobs CASCADE;');
  await client.query('DROP TABLE IF EXISTS gdpr_exports CASCADE;');
  await client.query('DROP TABLE IF EXISTS gdpr_deletion_requests CASCADE;');
  await client.query('DROP TABLE IF EXISTS audit_logs CASCADE;');
  
  await client.query(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS mfa_enabled,
    DROP COLUMN IF EXISTS password_updated_at,
    DROP COLUMN IF EXISTS last_login_at,
    DROP COLUMN IF EXISTS failed_login_attempts,
    DROP COLUMN IF EXISTS account_locked_until;
  `);
  
  await client.query(`
    ALTER TABLE api_keys 
    DROP COLUMN IF EXISTS last_rotated_at,
    DROP COLUMN IF EXISTS rotation_required_at;
  `);

  console.log('Compliance schema rollback completed');
};

module.exports = { up, down };