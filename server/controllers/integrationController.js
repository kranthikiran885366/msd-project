const Integration = require('../models/Integration');
const AuditLog = require('../models/AuditLog');

class IntegrationController {
  async getIntegrations(req, res) {
    try {
      const { userId } = req;
      const integrations = await Integration.find({ userId });
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createIntegration(req, res) {
    try {
      const { userId } = req;
      const { type, name, config } = req.body;
      
      const integration = await Integration.create({
        userId,
        type,
        name,
        config,
        status: 'active'
      });

      await AuditLog.create({
        userId,
        action: 'INTEGRATION_CREATED',
        resourceType: 'Integration',
        resourceId: integration._id,
        metadata: { type, name }
      });

      res.status(201).json(integration);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getIntegration(req, res) {
    try {
      const { id } = req.params;
      const integration = await Integration.findById(id);
      
      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      
      res.json(integration);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateIntegration(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const integration = await Integration.findByIdAndUpdate(id, updates, { new: true });
      res.json(integration);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteIntegration(req, res) {
    try {
      const { id } = req.params;
      await Integration.findByIdAndDelete(id);
      res.json({ message: 'Integration deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async connectDatadog(req, res) {
    try {
      const { userId } = req;
      const { apiKey, appKey } = req.body;
      
      const integration = await Integration.create({
        userId,
        type: 'datadog',
        name: 'Datadog',
        config: { apiKey, appKey },
        status: 'active'
      });
      
      res.status(201).json(integration);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async connectGrafana(req, res) {
    try {
      const { userId } = req;
      const { url, token } = req.body;
      
      const integration = await Integration.create({
        userId,
        type: 'grafana',
        name: 'Grafana',
        config: { url, token },
        status: 'active'
      });
      
      res.status(201).json(integration);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async connectNewRelic(req, res) {
    try {
      const { userId } = req;
      const { apiKey, accountId } = req.body;
      
      const integration = await Integration.create({
        userId,
        type: 'newrelic',
        name: 'New Relic',
        config: { apiKey, accountId },
        status: 'active'
      });
      
      res.status(201).json(integration);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async connectPrometheus(req, res) {
    try {
      const { userId } = req;
      const { url, username, password } = req.body;
      
      const integration = await Integration.create({
        userId,
        type: 'prometheus',
        name: 'Prometheus',
        config: { url, username, password },
        status: 'active'
      });
      
      res.status(201).json(integration);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new IntegrationController();