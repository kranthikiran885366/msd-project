const SSOConfig = require('../models/SSOConfig');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { validateSAMLConfig, validateOAuthConfig } = require('../utils/validation');

class SSOService {
  async getConfig(organizationId) {
    const config = await SSOConfig.findOne({ organizationId });
    if (!config) {
      throw new NotFoundError('SSO configuration not found');
    }
    return config;
  }

  async createConfig(data) {
    // Validate config based on provider
    if (data.provider === 'custom-saml') {
      await validateSAMLConfig(data.config);
    } else {
      await validateOAuthConfig(data.config);
    }

    const config = new SSOConfig(data);
    await config.save();
    return config;
  }

  async updateConfig(organizationId, updates) {
    const config = await SSOConfig.findOne({ organizationId });
    if (!config) {
      throw new NotFoundError('SSO configuration not found');
    }

    // Validate updates based on provider
    if (updates.provider === 'custom-saml') {
      await validateSAMLConfig(updates.config);
    } else if (updates.config) {
      await validateOAuthConfig(updates.config);
    }

    Object.assign(config, updates);
    await config.save();
    return config;
  }

  async toggleSSO(organizationId, enabled) {
    const config = await SSOConfig.findOne({ organizationId });
    if (!config) {
      throw new NotFoundError('SSO configuration not found');
    }

    config.enabled = enabled;
    config.status = enabled ? 'active' : 'inactive';
    await config.save();
    return config;
  }

  async testConnection(organizationId) {
    const config = await SSOConfig.findOne({ organizationId });
    if (!config) {
      throw new NotFoundError('SSO configuration not found');
    }

    // Implement provider-specific connection testing
    try {
      if (config.provider === 'custom-saml') {
        // Test SAML connection
        await this._testSAMLConnection(config);
      } else {
        // Test OAuth connection
        await this._testOAuthConnection(config);
      }
      
      config.status = 'active';
      await config.save();
      return { success: true, message: 'Connection test successful' };
    } catch (error) {
      config.status = 'error';
      await config.save();
      throw error;
    }
  }

  async deleteConfig(organizationId) {
    const config = await SSOConfig.findOne({ organizationId });
    if (!config) {
      throw new NotFoundError('SSO configuration not found');
    }
    await config.remove();
  }

  // Private methods for testing connections
  async _testSAMLConnection(config) {
    // Implement SAML-specific connection test
    // This would typically involve making a test SAML request
    throw new Error('Not implemented');
  }

  async _testOAuthConnection(config) {
    // Implement OAuth-specific connection test
    // This would typically involve validating credentials with the provider
    throw new Error('Not implemented');
  }
}

module.exports = new SSOService();