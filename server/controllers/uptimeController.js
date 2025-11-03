const uptimeService = require('../services/uptimeService');

class UptimeController {
  async getUptimeStats(req, res, next) {
    try {
      const { projectId } = req.params;
      const { timeRange = 30 } = req.query;
      const stats = await uptimeService.calculateUptime(projectId, parseInt(timeRange));
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getSLAStatus(req, res, next) {
    try {
      const { projectId } = req.params;
      const { targetUptime = 99.95 } = req.query;
      const slaStatus = await uptimeService.getSLAStatus(projectId, parseFloat(targetUptime));
      res.json(slaStatus);
    } catch (error) {
      next(error);
    }
  }

  async getUptimeHistory(req, res, next) {
    try {
      const { projectId } = req.params;
      const { days = 7 } = req.query;
      const history = await uptimeService.getUptimeHistory(projectId, parseInt(days));
      res.json(history);
    } catch (error) {
      next(error);
    }
  }

  async getIncidentHistory(req, res, next) {
    try {
      const { projectId } = req.params;
      const { timeRange = 30 } = req.query;
      const incidents = await uptimeService.getIncidentHistory(projectId, parseInt(timeRange));
      res.json(incidents);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UptimeController();