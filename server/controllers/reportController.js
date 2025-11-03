const reportService = require('../services/reportService');

class ReportController {
  async generateReport(req, res, next) {
    try {
      const { projectId, type, timeRange } = req.body;
      const report = await reportService.generateReport(projectId, type, timeRange, req.userId);
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req, res, next) {
    try {
      const { projectId } = req.params;
      const { type, status } = req.query;
      
      const filters = {};
      if (type) filters.type = type;
      if (status) filters.status = status;

      const reports = await reportService.getReports(projectId, filters);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req, res, next) {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req, res, next) {
    try {
      const { id } = req.params;
      await reportService.deleteReport(id);
      res.json({ message: 'Report deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req, res, next) {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.query;
      
      const report = await reportService.getReportById(id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="report-${id}.${format}"`);
      res.json(report.data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();