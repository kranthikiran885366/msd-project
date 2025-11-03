/**
 * Marketplace & Plugin System
 * Third-party integrations, extensions, and add-ons
 */

const postgres = require('../db/postgres');
const redis = require('../cache/redis');
const axios = require('axios');
const crypto = require('crypto');

class MarketplaceService {
  /**
   * REGISTRY - List available plugins/extensions
   */
  async listPlugins(filters = {}) {
    try {
      let query = `SELECT * FROM marketplace_plugins WHERE status = 'published'`;
      const params = [];
      let paramCount = 1;

      if (filters.category) {
        query += ` AND category = $${paramCount}`;
        params.push(filters.category);
        paramCount++;
      }

      if (filters.search) {
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters.minRating) {
        query += ` AND rating >= $${paramCount}`;
        params.push(filters.minRating);
        paramCount++;
      }

      query += ` ORDER BY downloads DESC LIMIT 100`;

      const result = await postgres.query(query, params);

      // Add download counts from Redis
      for (const plugin of result.rows) {
        const downloads = await redis.get(`plugin:downloads:${plugin.id}`);
        plugin.downloads = parseInt(downloads) || 0;
      }

      return result.rows;
    } catch (error) {
      console.error('List plugins error:', error);
      throw error;
    }
  }

  /**
   * INSTALL PLUGIN
   * Install extension to user's account
   */
  async installPlugin(userId, pluginId, config = {}) {
    try {
      const plugin = await postgres.query(
        `SELECT * FROM marketplace_plugins WHERE id = $1`,
        [pluginId]
      );

      if (!plugin.rows[0]) {
        throw new Error('Plugin not found');
      }

      // Validate configuration schema
      if (plugin.rows[0].config_schema) {
        const schema = JSON.parse(plugin.rows[0].config_schema);
        this._validateConfig(config, schema);
      }

      // Encrypt sensitive config values
      const encryptedConfig = this._encryptConfig(config);

      // Create installation record
      const installation = await postgres.query(
        `INSERT INTO plugin_installations 
        (user_id, plugin_id, config, status, installed_at)
        VALUES ($1, $2, $3, 'active', NOW())
        RETURNING *`,
        [userId, pluginId, JSON.stringify(encryptedConfig)]
      );

      // Trigger webhook to plugin (if it has an installation hook)
      if (plugin.rows[0].webhook_url) {
        try {
          await axios.post(`${plugin.rows[0].webhook_url}/install`, {
            installationId: installation.rows[0].id,
            userId,
            config
          }, { timeout: 5000 });
        } catch (error) {
          console.warn('Plugin installation webhook failed:', error.message);
        }
      }

      // Increment download counter
      await redis.incr(`plugin:downloads:${pluginId}`);

      return {
        installationId: installation.rows[0].id,
        plugin: plugin.rows[0].name,
        status: 'active',
        installedAt: new Date()
      };
    } catch (error) {
      console.error('Install plugin error:', error);
      throw error;
    }
  }

  /**
   * CONFIGURE PLUGIN
   * Update plugin configuration
   */
  async configurePlugin(installationId, config) {
    try {
      const installation = await postgres.query(
        `SELECT * FROM plugin_installations WHERE id = $1`,
        [installationId]
      );

      if (!installation.rows[0]) {
        throw new Error('Installation not found');
      }

      const plugin = await postgres.query(
        `SELECT * FROM marketplace_plugins WHERE id = $1`,
        [installation.rows[0].plugin_id]
      );

      // Validate new config
      if (plugin.rows[0].config_schema) {
        const schema = JSON.parse(plugin.rows[0].config_schema);
        this._validateConfig(config, schema);
      }

      const encryptedConfig = this._encryptConfig(config);

      // Update configuration
      const updated = await postgres.query(
        `UPDATE plugin_installations 
        SET config = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *`,
        [JSON.stringify(encryptedConfig), installationId]
      );

      // Notify plugin of configuration change
      if (plugin.rows[0].webhook_url) {
        try {
          await axios.post(`${plugin.rows[0].webhook_url}/configure`, {
            installationId,
            config
          }, { timeout: 5000 });
        } catch (error) {
          console.warn('Plugin configuration webhook failed:', error.message);
        }
      }

      return { status: 'updated', installation: updated.rows[0] };
    } catch (error) {
      console.error('Configure plugin error:', error);
      throw error;
    }
  }

  /**
   * UNINSTALL PLUGIN
   * Remove plugin from user account
   */
  async uninstallPlugin(installationId) {
    try {
      const installation = await postgres.query(
        `SELECT * FROM plugin_installations WHERE id = $1`,
        [installationId]
      );

      if (!installation.rows[0]) {
        throw new Error('Installation not found');
      }

      // Get plugin details
      const plugin = await postgres.query(
        `SELECT * FROM marketplace_plugins WHERE id = $1`,
        [installation.rows[0].plugin_id]
      );

      // Notify plugin of uninstallation
      if (plugin.rows[0].webhook_url) {
        try {
          await axios.post(`${plugin.rows[0].webhook_url}/uninstall`, {
            installationId
          }, { timeout: 5000 });
        } catch (error) {
          console.warn('Plugin uninstall webhook failed:', error.message);
        }
      }

      // Mark as uninstalled
      await postgres.query(
        `UPDATE plugin_installations 
        SET status = 'uninstalled', uninstalled_at = NOW()
        WHERE id = $1`,
        [installationId]
      );

      return { status: 'uninstalled', installationId };
    } catch (error) {
      console.error('Uninstall plugin error:', error);
      throw error;
    }
  }

  /**
   * PLUGIN WEBHOOK HANDLER
   * Receive events from plugins
   */
  async handlePluginWebhook(pluginId, eventType, payload, signature) {
    try {
      // Verify webhook signature
      const plugin = await postgres.query(
        `SELECT * FROM marketplace_plugins WHERE id = $1`,
        [pluginId]
      );

      if (!plugin.rows[0]) {
        throw new Error('Plugin not found');
      }

      const expectedSignature = crypto
        .createHmac('sha256', plugin.rows[0].webhook_secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      // Process event
      const eventHandlers = {
        'deployment:triggered': this._onDeploymentTriggered,
        'build:completed': this._onBuildCompleted,
        'error:occurred': this._onErrorOccurred,
        'metric:threshold': this._onMetricThreshold
      };

      const handler = eventHandlers[eventType];
      if (!handler) {
        console.warn(`Unknown webhook event: ${eventType}`);
        return { status: 'ignored' };
      }

      await handler.call(this, pluginId, payload);

      return { status: 'processed' };
    } catch (error) {
      console.error('Plugin webhook error:', error);
      throw error;
    }
  }

  /**
   * PUBLISH PLUGIN
   * Submit plugin to marketplace (vendor submission)
   */
  async publishPlugin(vendorId, pluginData) {
    try {
      const {
        name,
        description,
        version,
        category,
        iconUrl,
        repositoryUrl,
        webhookUrl,
        configSchema,
        documentation,
        pricing // 'free', 'paid', 'freemium'
      } = pluginData;

      // Validate plugin metadata
      if (!name || !description || !version || !category) {
        throw new Error('Missing required plugin fields');
      }

      // Create plugin record (pending review)
      const plugin = await postgres.query(
        `INSERT INTO marketplace_plugins 
        (vendor_id, name, description, version, category, icon_url, repository_url, 
         webhook_url, config_schema, documentation, pricing, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending_review')
        RETURNING *`,
        [vendorId, name, description, version, category, iconUrl, repositoryUrl,
         webhookUrl, JSON.stringify(configSchema), documentation, pricing]
      );

      // Trigger marketplace review
      await this._requestPluginReview(plugin.rows[0].id);

      return {
        pluginId: plugin.rows[0].id,
        status: 'pending_review',
        message: 'Plugin submitted for review. Approval typically takes 1-3 business days.'
      };
    } catch (error) {
      console.error('Publish plugin error:', error);
      throw error;
    }
  }

  /**
   * PLUGIN MARKETPLACE ANALYTICS
   */
  async getPluginAnalytics(pluginId) {
    try {
      const plugin = await postgres.query(
        `SELECT * FROM marketplace_plugins WHERE id = $1`,
        [pluginId]
      );

      if (!plugin.rows[0]) {
        throw new Error('Plugin not found');
      }

      // Get usage statistics
      const usage = await postgres.query(
        `SELECT 
          COUNT(*) as total_installations,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_installations,
          AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END) as avg_rating,
          COUNT(DISTINCT DATE(installed_at)) as installation_days
        FROM plugin_installations
        WHERE plugin_id = $1
        AND installed_at > NOW() - INTERVAL '90 days'`,
        [pluginId]
      );

      const downloads = await redis.get(`plugin:downloads:${pluginId}`);

      const reviews = await postgres.query(
        `SELECT rating, comment, created_at FROM plugin_reviews
        WHERE plugin_id = $1
        ORDER BY created_at DESC
        LIMIT 10`,
        [pluginId]
      );

      return {
        plugin: plugin.rows[0].name,
        statistics: usage.rows[0],
        downloads: parseInt(downloads) || 0,
        recentReviews: reviews.rows,
        trend: {
          activeUsers: await this._getInstallationTrend(pluginId, 7),
          usageGrowth: 'trending_up'
        }
      };
    } catch (error) {
      console.error('Get plugin analytics error:', error);
      throw error;
    }
  }

  /**
   * REVENUE SHARING
   * Calculate earnings for plugin developers
   */
  async calculateRevenue(vendorId, period = 'monthly') {
    try {
      let dateFilter = `created_at > NOW() - INTERVAL '1 month'`;
      if (period === 'yearly') dateFilter = `created_at > NOW() - INTERVAL '1 year'`;

      const paidInstalls = await postgres.query(
        `SELECT 
          p.id,
          p.name,
          COUNT(pi.id) as installations,
          COALESCE(SUM(pi.monthly_fee), 0) as revenue
        FROM marketplace_plugins p
        LEFT JOIN plugin_installations pi ON p.id = pi.plugin_id AND pi.status = 'active'
        WHERE p.vendor_id = $1
        AND p.pricing = 'paid'
        AND ${dateFilter}
        GROUP BY p.id, p.name`,
        [vendorId]
      );

      const totalRevenue = paidInstalls.rows.reduce((sum, row) => sum + row.revenue, 0);
      const vendorEarnings = totalRevenue * 0.7; // 70% for vendor, 30% platform cut

      return {
        vendorId,
        period,
        plugins: paidInstalls.rows,
        totalRevenue: totalRevenue.toFixed(2),
        vendorEarnings: vendorEarnings.toFixed(2),
        platformCut: (totalRevenue * 0.3).toFixed(2),
        nextPayout: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };
    } catch (error) {
      console.error('Calculate revenue error:', error);
      throw error;
    }
  }

  /**
   * BUILD HOOKS - Allow plugins to execute custom logic
   */
  async executeHook(hookName, context) {
    try {
      // Find all active plugins that subscribe to this hook
      const subscriptions = await postgres.query(
        `SELECT pi.id, pi.config, mp.webhook_url
        FROM plugin_installations pi
        JOIN marketplace_plugins mp ON pi.plugin_id = mp.id
        WHERE mp.hooks @> $1 AND pi.status = 'active'`,
        [JSON.stringify([hookName])]
      );

      const results = [];
      for (const sub of subscriptions.rows) {
        try {
          const response = await axios.post(`${sub.webhook_url}/hooks/${hookName}`, context, {
            timeout: 10000
          });
          results.push({
            installationId: sub.id,
            status: 'success',
            response: response.data
          });
        } catch (error) {
          results.push({
            installationId: sub.id,
            status: 'failed',
            error: error.message
          });
        }
      }

      return { hookName, results };
    } catch (error) {
      console.error('Execute hook error:', error);
      throw error;
    }
  }

  /**
   * PRIVATE HELPER METHODS
   */

  _validateConfig(config, schema) {
    for (const [key, requirement] of Object.entries(schema)) {
      if (requirement.required && !(key in config)) {
        throw new Error(`Missing required configuration: ${key}`);
      }

      if (config[key] && requirement.type) {
        if (typeof config[key] !== requirement.type) {
          throw new Error(`Invalid type for ${key}: expected ${requirement.type}`);
        }
      }

      if (requirement.enum && config[key] && !requirement.enum.includes(config[key])) {
        throw new Error(`Invalid value for ${key}: must be one of ${requirement.enum.join(', ')}`);
      }
    }
  }

  _encryptConfig(config) {
    const encrypted = {};
    for (const [key, value] of Object.entries(config)) {
      // Encrypt sensitive fields (API keys, secrets)
      if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
        encrypted[key] = this._encryptField(value);
      } else {
        encrypted[key] = value;
      }
    }
    return encrypted;
  }

  _encryptField(value) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  async _requestPluginReview(pluginId) {
    // Queue review task
    console.log(`Requesting review for plugin ${pluginId}`);
  }

  async _getInstallationTrend(pluginId, days) {
    const result = await postgres.query(
      `SELECT DATE(installed_at) as day, COUNT(*) as count
      FROM plugin_installations
      WHERE plugin_id = $1 AND installed_at > NOW() - INTERVAL $2
      GROUP BY DATE(installed_at)
      ORDER BY day DESC`,
      [pluginId, `${days} days`]
    );
    return result.rows;
  }

  async _onDeploymentTriggered(pluginId, payload) {
    console.log(`Plugin ${pluginId} notified of deployment`, payload);
  }

  async _onBuildCompleted(pluginId, payload) {
    console.log(`Plugin ${pluginId} notified of build completion`, payload);
  }

  async _onErrorOccurred(pluginId, payload) {
    console.log(`Plugin ${pluginId} notified of error`, payload);
  }

  async _onMetricThreshold(pluginId, payload) {
    console.log(`Plugin ${pluginId} notified of metric threshold`, payload);
  }
}

module.exports = new MarketplaceService();
