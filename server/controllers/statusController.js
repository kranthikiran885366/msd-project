const BaseController = require('./BaseController');
const statusService = require('../services/statusService');
const NotificationPreference = require('../models/NotificationPreference');

class StatusController extends BaseController {
  constructor() {
    super();
    BaseController.bindMethods(this);
  }

  async getSystemStatus(req, res, next) {
    try {
      const status = await statusService.getSystemStatus();
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  async getHealthCheck(req, res, next) {
    try {
      const health = await statusService.getHealthCheck();
      res.json(health);
    } catch (error) {
      next(error);
    }
  }

  async getServiceMetrics(req, res, next) {
    try {
      const { serviceName } = req.params;
      const { timeRange = 24 * 60 * 60 * 1000 } = req.query; // Default to 24h
      
      const metrics = await statusService.getServiceMetrics(serviceName, Number(timeRange));
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }

  async getIncidents(req, res, next) {
    try {
      const { status, severity, startDate, endDate } = req.query;
      const filters = {};

      if (status) filters.status = status;
      if (severity) filters.severity = severity;
      if (startDate || endDate) {
        filters.dateRange = {
          start: startDate ? new Date(startDate) : new Date(0),
          end: endDate ? new Date(endDate) : new Date()
        };
      }

      const incidents = await statusService.getIncidents(filters);
      res.json(incidents);
    } catch (error) {
      next(error);
    }
  }

  async createIncident(req, res, next) {
    try {
      const incident = await statusService.createIncident(req.body);
      res.status(201).json(incident);
    } catch (error) {
      next(error);
    }
  }

  async updateIncidentStatus(req, res, next) {
    try {
      const { incidentId } = req.params;
      const incident = await statusService.updateIncidentStatus(incidentId, req.body);
      res.json(incident);
    } catch (error) {
      next(error);
    }
  }

  async subscribeToUpdates(req, res, next) {
    try {
      const { userId, preferences } = req.body;
      await NotificationPreference.findOneAndUpdate(
        { userId },
        { 
          $set: {
            'notificationTypes.alerts': true,
            ...preferences
          }
        },
        { upsert: true }
      );
      res.json({ message: 'Successfully subscribed to status updates' });
    } catch (error) {
      next(error);
    }
  }
  async getSystemStatus(req, res, next) {
    try {
      const status = await statusService.getSystemStatus();
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  async getHealthCheck(req, res, next) {
    try {
      const health = await statusService.getHealthCheck();
      res.json(health);
    } catch (error) {
      next(error);
    }
  },

  async getServiceMetrics(req, res, next) {
    try {
      const { serviceName } = req.params;
      const { timeRange = 24 * 60 * 60 * 1000 } = req.query; // Default to 24h
      
      const metrics = await statusService.getServiceMetrics(serviceName, Number(timeRange));
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  },

  async getIncidents(req, res, next) {
    try {
      const { status, severity, startDate, endDate } = req.query;
      const filters = {};

      if (status) filters.status = status;
      if (severity) filters.severity = severity;
      if (startDate || endDate) {
        filters.dateRange = {
          start: startDate ? new Date(startDate) : new Date(0),
          end: endDate ? new Date(endDate) : new Date()
        };
      }

      const incidents = await statusService.getIncidents(filters);
      res.json(incidents);
    } catch (error) {
      next(error);
    }
  },

  async createIncident(req, res, next) {
    try {
      const incident = await statusService.createIncident(req.body);
      res.status(201).json(incident);
    } catch (error) {
      next(error);
    }
  },

  async updateIncidentStatus(req, res, next) {
    try {
      const { incidentId } = req.params;
      const incident = await statusService.updateIncidentStatus(incidentId, req.body);
      res.json(incident);
    } catch (error) {
      next(error);
    }
  },

  async subscribeToUpdates(req, res, next) {
    try {
      const { userId, preferences } = req.body;
      await NotificationPreference.findOneAndUpdate(
        { userId },
        { 
          $set: {
            'notificationTypes.alerts': true,
            ...preferences
          }
        },
        { upsert: true }
      );
      res.json({ message: 'Successfully subscribed to status updates' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = StatusController;