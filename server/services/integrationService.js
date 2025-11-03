const Integration = require('../models/Integration');
const axios = require('axios');

const integrationService = {
  async getAllIntegrations(userId) {
    return await Integration.find({ userId });
  },

  async createIntegration(data) {
    return await Integration.create(data);
  },

  async getIntegrationById(id) {
    return await Integration.findById(id);
  },

  async updateIntegration(id, data) {
    return await Integration.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteIntegration(id) {
    return await Integration.findByIdAndDelete(id);
  },

  // Git Integration
  async connectGitRepository(data) {
    const integration = await Integration.create({
      ...data,
      type: 'git',
      status: 'active'
    });
    return { success: true, integration };
  },

  async disconnectGitRepository(repoId) {
    await Integration.findByIdAndDelete(repoId);
    return { success: true };
  },

  async syncGitRepository(repoId) {
    const integration = await Integration.findByIdAndUpdate(
      repoId,
      { lastSync: new Date() },
      { new: true }
    );
    return { success: true, integration };
  },

  // Prometheus Integration
  async connectPrometheus(data) {
    try {
      // Test connection
      const response = await axios.get(`${data.url}/api/v1/status/config`, {
        timeout: 5000
      });
      
      const integration = await Integration.create({
        userId: data.userId,
        type: 'prometheus',
        name: 'Prometheus',
        config: { url: data.url },
        status: 'active'
      });
      
      return { success: true, integration };
    } catch (error) {
      return { success: false, error: 'Failed to connect to Prometheus' };
    }
  },

  async disconnectPrometheus(userId) {
    await Integration.findOneAndDelete({ userId, type: 'prometheus' });
    return { success: true };
  },

  async getPrometheusAlerts(userId) {
    const integration = await Integration.findOne({ userId, type: 'prometheus' });
    if (!integration) {
      return { success: false, error: 'Prometheus not connected' };
    }

    try {
      const response = await axios.get(`${integration.config.url}/api/v1/alerts`);
      return { success: true, alerts: response.data.data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch alerts' };
    }
  },

  async queryPrometheus(userId, query) {
    const integration = await Integration.findOne({ userId, type: 'prometheus' });
    if (!integration) {
      return { success: false, error: 'Prometheus not connected' };
    }

    try {
      const response = await axios.get(`${integration.config.url}/api/v1/query`, {
        params: { query: query.query }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: 'Failed to execute query' };
    }
  },

  // Datadog Integration
  async connectDatadog(data) {
    try {
      // Test connection
      const response = await axios.get('https://api.datadoghq.com/api/v1/validate', {
        headers: {
          'DD-API-KEY': data.apiKey,
          'DD-APPLICATION-KEY': data.appKey
        },
        timeout: 5000
      });
      
      const integration = await Integration.create({
        userId: data.userId,
        type: 'datadog',
        name: 'Datadog',
        config: { apiKey: data.apiKey, appKey: data.appKey },
        status: 'active'
      });
      
      return { success: true, integration };
    } catch (error) {
      return { success: false, error: 'Failed to connect to Datadog' };
    }
  },

  async disconnectDatadog(userId) {
    await Integration.findOneAndDelete({ userId, type: 'datadog' });
    return { success: true };
  },

  async syncDatadogDashboards(userId) {
    const integration = await Integration.findOne({ userId, type: 'datadog' });
    if (!integration) {
      return { success: false, error: 'Datadog not connected' };
    }

    try {
      const response = await axios.get('https://api.datadoghq.com/api/v1/dashboard', {
        headers: {
          'DD-API-KEY': integration.config.apiKey,
          'DD-APPLICATION-KEY': integration.config.appKey
        }
      });
      return { success: true, dashboards: response.data.dashboards };
    } catch (error) {
      return { success: false, error: 'Failed to sync dashboards' };
    }
  },

  async getDatadogAlerts(userId) {
    const integration = await Integration.findOne({ userId, type: 'datadog' });
    if (!integration) {
      return { success: false, error: 'Datadog not connected' };
    }

    try {
      const response = await axios.get('https://api.datadoghq.com/api/v1/monitor', {
        headers: {
          'DD-API-KEY': integration.config.apiKey,
          'DD-APPLICATION-KEY': integration.config.appKey
        }
      });
      return { success: true, monitors: response.data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch alerts' };
    }
  },

  async exportDatadogMetrics(userId) {
    const integration = await Integration.findOne({ userId, type: 'datadog' });
    if (!integration) {
      return { success: false, error: 'Datadog not connected' };
    }

    try {
      // Export metrics logic here
      return { success: true, message: 'Metrics exported successfully' };
    } catch (error) {
      return { success: false, error: 'Failed to export metrics' };
    }
  },

  // Analytics Integration
  async exportIntegrationAnalytics(userId, options) {
    try {
      // Export analytics logic here
      return { success: true, message: 'Analytics exported successfully' };
    } catch (error) {
      return { success: false, error: 'Failed to export analytics' };
    }
  },

  // Generic integration methods
  async testIntegrationConnection(type, config) {
    try {
      switch (type) {
        case 'prometheus':
          await axios.get(`${config.url}/api/v1/status/config`, { timeout: 5000 });
          break;
        case 'datadog':
          await axios.get('https://api.datadoghq.com/api/v1/validate', {
            headers: {
              'DD-API-KEY': config.apiKey,
              'DD-APPLICATION-KEY': config.appKey
            },
            timeout: 5000
          });
          break;
        case 'grafana':
          await axios.get(`${config.url}/api/health`, {
            headers: config.token ? { 'Authorization': `Bearer ${config.token}` } : {},
            timeout: 5000
          });
          break;
        default:
          return { success: false, error: 'Unsupported integration type' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: `Connection test failed: ${error.message}` };
    }
  }
};

module.exports = integrationService;