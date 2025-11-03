const escalationService = require('../services/escalationService');

class EscalationController {
  async createEscalationPolicy(req, res, next) {
    try {
      const { projectId, name, description, severity, escalationRules } = req.body;
      
      const validation = await escalationService.validateEscalationPolicy(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors });
      }

      const policy = await escalationService.createEscalationPolicy({
        projectId,
        name,
        description,
        severity,
        escalationRules,
        createdBy: req.userId
      });
      
      res.status(201).json(policy);
    } catch (error) {
      next(error);
    }
  }

  async getEscalationPolicies(req, res, next) {
    try {
      const { projectId } = req.params;
      const { enabled, severity } = req.query;
      
      const filters = {};
      if (enabled !== undefined) filters.enabled = enabled === 'true';
      if (severity) filters.severity = severity;

      const policies = await escalationService.getEscalationPolicies(projectId, filters);
      res.json(policies);
    } catch (error) {
      next(error);
    }
  }

  async getEscalationPolicyById(req, res, next) {
    try {
      const { id } = req.params;
      const policy = await escalationService.getEscalationPolicyById(id);
      if (!policy) {
        return res.status(404).json({ error: 'Escalation policy not found' });
      }
      res.json(policy);
    } catch (error) {
      next(error);
    }
  }

  async updateEscalationPolicy(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const validation = await escalationService.validateEscalationPolicy(updates);
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors });
      }

      const policy = await escalationService.updateEscalationPolicy(id, updates);
      res.json(policy);
    } catch (error) {
      next(error);
    }
  }

  async deleteEscalationPolicy(req, res, next) {
    try {
      const { id } = req.params;
      await escalationService.deleteEscalationPolicy(id);
      res.json({ message: 'Escalation policy deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleEscalationPolicy(req, res, next) {
    try {
      const { id } = req.params;
      const policy = await escalationService.toggleEscalationPolicy(id);
      res.json(policy);
    } catch (error) {
      next(error);
    }
  }

  async testEscalationPolicy(req, res, next) {
    try {
      const { id } = req.params;
      const testResult = await escalationService.testEscalationPolicy(id, req.body);
      res.json(testResult);
    } catch (error) {
      next(error);
    }
  }

  async getAvailableTeams(req, res, next) {
    try {
      const { projectId } = req.params;
      const teams = await escalationService.getAvailableTeams(projectId);
      res.json(teams);
    } catch (error) {
      next(error);
    }
  }

  async getEscalationStats(req, res, next) {
    try {
      const { projectId } = req.params;
      const { timeRange = 30 } = req.query;
      const stats = await escalationService.getEscalationStats(projectId, parseInt(timeRange));
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EscalationController();