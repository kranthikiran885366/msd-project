/**
 * PostgreSQL Schema Migration
 * Complete enterprise database schema for deployment platform
 */

const postgres = require('../../db/postgres');

class SchemaMigration {
  /**
   * RUN MIGRATION
   */
  static async up() {
    console.log('Starting database migration...');

    try {
      // Enable extensions
      await postgres.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      await postgres.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
      await postgres.query(`CREATE EXTENSION IF NOT EXISTS "btree_gin"`);

      // Core Tables
      await this.createUsersTables();
      await this.createTeamsTables();
      await this.createProjectsTables();
      await this.createDeploymentsTables();
      await this.createBuildsTables();
      await this.createBillingTables();
      await this.createMonitoringTables();
      await this.createAuditTables();
      await this.createEdgeFunctionsTables();
      await this.createMarketplaceTables();
      await this.createComplianceTables();

      // Create indexes
      await this.createIndexes();

      // Create triggers
      await this.createTriggers();

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * USERS & AUTHENTICATION TABLES
   */
  static async createUsersTables() {
    // Users table
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        avatar_url VARCHAR(500),
        provider VARCHAR(50) DEFAULT 'local', -- local, google, github, auth0, okta
        provider_id VARCHAR(255),
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_secret VARCHAR(255),
        sso_enabled BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verified_at TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP,
        
        CONSTRAINT email_verified_check CHECK (email_verified = FALSE OR email_verified_at IS NOT NULL)
      );
    `);

    // API Keys table
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        scopes TEXT[] DEFAULT '{}',
        rate_limit INT DEFAULT 1000,
        last_used TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        rotated_at TIMESTAMP,
        
        UNIQUE(user_id, name)
      );
    `);

    // Session tokens
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS session_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        revoked_at TIMESTAMP,
        
        CHECK (expires_at > created_at)
      );
    `);
  }

  /**
   * TEAMS & RBAC TABLES
   */
  static async createTeamsTables() {
    // Teams table
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        slug VARCHAR(255) UNIQUE NOT NULL,
        logo_url VARCHAR(500),
        description TEXT,
        billing_contact VARCHAR(255),
        subscription_id VARCHAR(255),
        stripe_customer_id VARCHAR(255),
        webhook_url VARCHAR(500),
        features JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);

    // Team members
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'developer', -- admin, developer, viewer
        permissions JSONB DEFAULT '{}',
        joined_at TIMESTAMP DEFAULT NOW(),
        removed_at TIMESTAMP,
        
        UNIQUE(team_id, user_id),
        CHECK (role IN ('admin', 'developer', 'viewer'))
      );
    `);

    // RBAC Policies
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS rbac_policies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        resource_type VARCHAR(100) NOT NULL, -- project, deployment, billing
        actions TEXT[] NOT NULL,
        conditions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  /**
   * PROJECTS & ENVIRONMENTS TABLES
   */
  static async createProjectsTables() {
    // Projects table
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT,
        git_url VARCHAR(500) NOT NULL,
        git_branch VARCHAR(255) DEFAULT 'main',
        framework VARCHAR(100), -- nextjs, react, nodejs, python, go, rust
        build_command TEXT,
        start_command TEXT,
        output_dir VARCHAR(255),
        env_vars JSONB DEFAULT '{}',
        secrets JSONB DEFAULT '{}',
        region VARCHAR(100) DEFAULT 'us-east-1',
        multi_region BOOLEAN DEFAULT FALSE,
        auto_deploy BOOLEAN DEFAULT TRUE,
        preview_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP,
        
        UNIQUE(team_id, slug)
      );
    `);

    // Environment variables (encrypted)
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS environment_variables (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        env_name VARCHAR(100), -- development, staging, production
        key VARCHAR(255) NOT NULL,
        value_encrypted TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(project_id, env_name, key)
      );
    `);

    // Custom domains
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS custom_domains (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        domain VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) DEFAULT 'pending', -- pending, verified, active
        apex_domain BOOLEAN DEFAULT FALSE,
        cname_target VARCHAR(500),
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // SSL Certificates
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS ssl_certificates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        domain_id UUID NOT NULL REFERENCES custom_domains(id) ON DELETE CASCADE,
        cert_content TEXT NOT NULL,
        key_content TEXT NOT NULL,
        issuer VARCHAR(255) DEFAULT 'Let''s Encrypt',
        expires_at TIMESTAMP NOT NULL,
        auto_renew BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        
        CHECK (expires_at > created_at)
      );
    `);

    // DNS Records
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS dns_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        domain_id UUID NOT NULL REFERENCES custom_domains(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- A, AAAA, CNAME, MX, TXT
        name VARCHAR(255),
        value TEXT NOT NULL,
        ttl INT DEFAULT 3600,
        managed BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        
        CHECK (type IN ('A', 'AAAA', 'CNAME', 'MX', 'TXT'))
      );
    `);
  }

  /**
   * DEPLOYMENTS TABLE
   */
  static async createDeploymentsTables() {
    // Deployments table
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        version VARCHAR(50) NOT NULL, -- semantic version
        status VARCHAR(50) DEFAULT 'pending', -- pending, building, deploying, active, failed, rolled_back
        git_commit VARCHAR(255),
        git_branch VARCHAR(255),
        git_author VARCHAR(255),
        triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
        deployment_strategy VARCHAR(50) DEFAULT 'rolling', -- rolling, blue-green, canary
        current_traffic_percentage INT DEFAULT 0,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CHECK (status IN ('pending', 'building', 'deploying', 'active', 'failed', 'rolled_back'))
      );
    `);

    // Deployment logs (real-time streaming)
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS deployment_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
        line_number INT,
        level VARCHAR(20) DEFAULT 'info', -- debug, info, warn, error
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(deployment_id, line_number)
      );
    `);

    // Deployment preview URLs
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS deployment_previews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
        preview_url VARCHAR(500) UNIQUE NOT NULL,
        expiry_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Rollback history
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS rollback_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
        rolled_back_to_version VARCHAR(50) NOT NULL,
        reason TEXT,
        rolled_back_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  /**
   * BUILDS TABLE
   */
  static async createBuildsTables() {
    // Builds table
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS builds (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        deployment_id UUID REFERENCES deployments(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending', -- pending, running, success, failed, cancelled
        git_commit VARCHAR(255),
        duration_seconds INT,
        artifact_size INT, -- bytes
        cache_hit_rate NUMERIC(3, 2), -- 0.00 - 1.00
        created_at TIMESTAMP DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    // Build analysis
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS build_analysis (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        analysis_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Build invocations (metrics)
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS build_invocations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        build_id UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
        duration_ms INT,
        status INT, -- HTTP status code
        result_size INT, -- bytes
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  /**
   * BILLING & SUBSCRIPTION TABLES
   */
  static async createBillingTables() {
    // Subscription plans
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE, -- free, pro, enterprise
        monthly_price NUMERIC(10, 2),
        annual_price NUMERIC(10, 2),
        limits JSONB DEFAULT '{}',
        features TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Subscriptions
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        status VARCHAR(50) DEFAULT 'active', -- active, trialing, past_due, cancelled, ended
        stripe_subscription_id VARCHAR(255) UNIQUE,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Usage records
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS usage_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        metric_type VARCHAR(100), -- cpu_hours, bandwidth_gb, storage_gb, builds, functions
        quantity NUMERIC(12, 4),
        billed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Invoices
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, failed
        invoice_date DATE,
        due_date DATE,
        stripe_invoice_id VARCHAR(255) UNIQUE,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Billing events
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS billing_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        event_type VARCHAR(100), -- upgrade, downgrade, addon, cancellation
        old_value JSONB,
        new_value JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  /**
   * MONITORING & METRICS TABLES
   */
  static async createMonitoringTables() {
    // Deployment metrics (time-series)
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS deployment_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
        cpu_usage NUMERIC(5, 2), -- percentage
        memory_usage NUMERIC(5, 2), -- percentage
        bandwidth NUMERIC(12, 2), -- bytes
        error_count INT DEFAULT 0,
        response_time_ms INT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // Alerts
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
        alert_type VARCHAR(100), -- cpu_high, memory_high, error_rate_high, latency_high
        severity VARCHAR(50), -- warning, critical
        message TEXT,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Cost analytics
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS cost_analytics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        month INT,
        year INT,
        region VARCHAR(100),
        service_type VARCHAR(100), -- compute, storage, bandwidth, functions
        cost_amount NUMERIC(10, 2),
        usage_unit NUMERIC(12, 4),
        created_at TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(team_id, month, year, region, service_type)
      );
    `);
  }

  /**
   * AUDIT TABLES
   */
  static async createAuditTables() {
    // Audit logs
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_id UUID UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100),
        resource_id VARCHAR(255),
        changes JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        hash VARCHAR(255) NOT NULL, -- SHA256 for chain verification
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Security events
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_type VARCHAR(100), -- unauthorized_access, suspicious_activity, brute_force
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        details JSONB,
        severity VARCHAR(50), -- low, medium, high, critical
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // GDPR deletion requests
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, deleted, cancelled
        requested_at TIMESTAMP DEFAULT NOW(),
        scheduled_deletion_at TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);

    // GDPR data exports
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS gdpr_exports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        export_data JSONB NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Compliance events
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS compliance_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_type VARCHAR(100), -- gdpr_deletion_executed, soc2_audit, hipaa_check
        subject_id VARCHAR(255),
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  /**
   * EDGE FUNCTIONS TABLES
   */
  static async createEdgeFunctionsTables() {
    // Edge functions
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS edge_functions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        runtime VARCHAR(50), -- node18, python311, go121, rust
        memory INT DEFAULT 128, -- MB
        timeout INT DEFAULT 30, -- seconds
        concurrency INT DEFAULT 100,
        endpoint VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        autoscaling_config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP,
        
        UNIQUE(project_id, name)
      );
    `);

    // Function invocations (metrics)
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS function_invocations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        function_id UUID NOT NULL REFERENCES edge_functions(id) ON DELETE CASCADE,
        duration_ms INT,
        status INT,
        result_size INT,
        invoked_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Multi-region functions
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS multi_region_functions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        function_name VARCHAR(255),
        regions TEXT[],
        deployment_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  /**
   * MARKETPLACE TABLES
   */
  static async createMarketplaceTables() {
    // Marketplace plugins
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS marketplace_plugins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        version VARCHAR(20),
        category VARCHAR(100),
        icon_url VARCHAR(500),
        repository_url VARCHAR(500),
        webhook_url VARCHAR(500),
        webhook_secret VARCHAR(255),
        config_schema JSONB DEFAULT '{}',
        documentation TEXT,
        pricing VARCHAR(50) DEFAULT 'free', -- free, paid, freemium
        rating NUMERIC(2, 1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending_review', -- pending_review, published, deprecated, removed
        hooks TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Plugin installations
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS plugin_installations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plugin_id UUID NOT NULL REFERENCES marketplace_plugins(id) ON DELETE CASCADE,
        config JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'active', -- active, disabled, uninstalled
        monthly_fee NUMERIC(10, 2) DEFAULT 0,
        installed_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        uninstalled_at TIMESTAMP,
        
        UNIQUE(user_id, plugin_id)
      );
    `);

    // Plugin reviews
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS plugin_reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plugin_id UUID NOT NULL REFERENCES marketplace_plugins(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(plugin_id, user_id)
      );
    `);
  }

  /**
   * COMPLIANCE TABLES
   */
  static async createComplianceTables() {
    // Scheduled jobs
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS scheduled_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_type VARCHAR(100) NOT NULL,
        scheduled_at TIMESTAMP NOT NULL,
        executed_at TIMESTAMP,
        parameters JSONB,
        status VARCHAR(50) DEFAULT 'pending', -- pending, executing, success, failed
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Vulnerabilities
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS vulnerabilities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        cve_id VARCHAR(50),
        severity VARCHAR(50), -- low, medium, high, critical
        description TEXT,
        discovered_at TIMESTAMP DEFAULT NOW(),
        patched_at TIMESTAMP
      );
    `);

    // Outages (for availability tracking)
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS outages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        service VARCHAR(100),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        reason TEXT,
        impact TEXT,
        occurred_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  /**
   * CREATE INDEXES
   */
  static async createIndexes() {
    // User indexes
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at)`);

    // Team indexes
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id)`);
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id)`);

    // Project indexes
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id)`);
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_projects_git_url ON projects(git_url)`);

    // Deployment indexes
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id)`);
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status)`);
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments(created_at DESC)`);

    // Logs indexes
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_deployment_logs_deployment_id ON deployment_logs(deployment_id)`);
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_deployment_logs_timestamp ON deployment_logs(timestamp DESC)`);

    // Metrics indexes (time-series)
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_deployment_metrics_deployment_id_timestamp 
      ON deployment_metrics(deployment_id, timestamp DESC)`);

    // Audit indexes
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`);
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`);

    // Subscription indexes
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_team_id ON subscriptions(team_id)`);
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_usage_records_team_id_billed_at 
      ON usage_records(team_id, billed_at DESC)`);

    // GIN indexes for JSONB
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_env_vars_gin ON environment_variables USING GIN(key)`);
    await postgres.query(`CREATE INDEX IF NOT EXISTS idx_changes_gin ON audit_logs USING GIN(changes)`);
  }

  /**
   * CREATE TRIGGERS
   */
  static async createTriggers() {
    // Update updated_at timestamp
    await postgres.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Apply to tables
    const tablesToUpdate = ['users', 'teams', 'projects', 'deployments', 'subscriptions'];
    for (const table of tablesToUpdate) {
      await postgres.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    // Function to check if deleted_at is set
    await postgres.query(`
      CREATE OR REPLACE FUNCTION check_soft_delete()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.deleted_at IS NOT NULL THEN
          RAISE NOTICE 'Record % marked as deleted', NEW.id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await postgres.query(`
      DROP TRIGGER IF EXISTS check_soft_delete_on_projects ON projects;
      CREATE TRIGGER check_soft_delete_on_projects AFTER UPDATE ON projects
      FOR EACH ROW WHEN (NEW.deleted_at IS DISTINCT FROM OLD.deleted_at)
      EXECUTE FUNCTION check_soft_delete();
    `);
  }

  /**
   * ROLLBACK MIGRATION
   */
  static async down() {
    console.log('Rolling back migration...');
    // Drop all tables in reverse order
    const tables = [
      'scheduled_jobs', 'vulnerabilities', 'outages',
      'plugin_reviews', 'plugin_installations', 'marketplace_plugins',
      'multi_region_functions', 'function_invocations', 'edge_functions',
      'compliance_events', 'gdpr_exports', 'gdpr_deletion_requests', 'security_events', 'audit_logs',
      'cost_analytics', 'alerts', 'deployment_metrics',
      'billing_events', 'invoices', 'usage_records', 'subscriptions', 'subscription_plans',
      'build_invocations', 'build_analysis', 'builds',
      'rollback_history', 'deployment_previews', 'deployment_logs', 'deployments',
      'dns_records', 'ssl_certificates', 'custom_domains', 'environment_variables', 'projects',
      'rbac_policies', 'team_members', 'teams',
      'session_tokens', 'api_keys', 'users'
    ];

    for (const table of tables) {
      await postgres.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    console.log('Rollback completed');
  }
}

module.exports = SchemaMigration;
