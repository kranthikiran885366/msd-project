const incidentService = require('../services/incidentService');

class IncidentController {
  async createIncident(req, res, next) {
    try {
      const { projectId, title, description, severity, component, assignee } = req.body;
      const incident = await incidentService.createIncident({
        projectId,
        title,
        description,
        severity,
        component,
        assignee,
        createdBy: req.userId,
        detectedBy: 'manual'
      });
      res.status(201).json(incident);
    } catch (error) {
      next(error);
    }
  }

  async getIncidents(req, res, next) {
    try {
      const { projectId } = req.params;
      const { status, severity, assignee } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (severity) filters.severity = severity;
      if (assignee) filters.assignee = assignee;

      const incidents = await incidentService.getIncidents(projectId, filters);
      res.json(incidents);
    } catch (error) {
      next(error);
    }
  }

  async getIncidentById(req, res, next) {
    try {
      const { id } = req.params;
      const incident = await incidentService.getIncidentById(id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }
      res.json(incident);
    } catch (error) {
      next(error);
    }
  }

  async updateIncidentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const incident = await incidentService.updateIncidentStatus(id, status, req.userId);
      res.json(incident);
    } catch (error) {
      next(error);
    }
  }

  async resolveIncident(req, res, next) {
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      const incident = await incidentService.resolveIncident(id, resolution, req.userId);
      res.json(incident);
    } catch (error) {
      next(error);
    }
  }

  async assignIncident(req, res, next) {
    try {
      const { id } = req.params;
      const { assigneeId } = req.body;
      const incident = await incidentService.assignIncident(id, assigneeId, req.userId);
      res.json(incident);
    } catch (error) {
      next(error);
    }
  }

  async getIncidentStats(req, res, next) {
    try {
      const { projectId } = req.params;
      const { timeRange = 30 } = req.query;
      const stats = await incidentService.getIncidentStats(projectId, parseInt(timeRange));
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IncidentController();