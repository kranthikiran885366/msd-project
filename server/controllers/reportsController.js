const Report = require('../models/Report');
const Incident = require('../models/Incident');
const UptimeMetric = require('../models/UptimeMetric');
const Alert = require('../models/Alert');
const Metric = require('../models/Metric');

class ReportsController {
  async getReports(req, res, next) {
    try {
      const { projectId } = req.params;
      const reports = await Report.find({ projectId })
        .sort({ createdAt: -1 });
      
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  async generateReport(req, res, next) {
    try {
      const { projectId } = req.params;
      const { type, timeRange } = req.body;
      
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let reportData = {};
      
      switch (type) {
        case 'incident':
          reportData = await this.generateIncidentReport(projectId, startDate);
          break;
        case 'sla':
          reportData = await this.generateSLAReport(projectId, startDate);
          break;
        case 'metrics':
          reportData = await this.generateMetricsReport(projectId, startDate);
          break;
        case 'trend':
          reportData = await this.generateTrendReport(projectId, startDate);
          break;
        case 'alert':
          reportData = await this.generateAlertReport(projectId, startDate);
          break;
        default:
          return res.status(400).json({ success: false, error: 'Invalid report type' });
      }
      
      const report = new Report({
        projectId,
        type,
        timeRange,
        data: reportData,
        generatedBy: req.user.id
      });
      
      await report.save();
      res.status(201).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req, res, next) {
    try {
      const { projectId } = req.params;
      const { type, timeRange, format } = req.body;
      
      // Generate report data
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let reportData = {};
      
      switch (type) {
        case 'incident':
          reportData = await this.generateIncidentReport(projectId, startDate);
          break;
        case 'sla':
          reportData = await this.generateSLAReport(projectId, startDate);
          break;
        case 'metrics':
          reportData = await this.generateMetricsReport(projectId, startDate);
          break;
        case 'trend':
          reportData = await this.generateTrendReport(projectId, startDate);
          break;
        case 'alert':
          reportData = await this.generateAlertReport(projectId, startDate);
          break;
        default:
          return res.status(400).json({ success: false, error: 'Invalid report type' });
      }
      
      // For now, just return the data. In a real implementation, you would generate PDF/CSV
      res.json({ 
        success: true, 
        message: `Report exported as ${format.toUpperCase()}`,
        data: reportData 
      });
    } catch (error) {
      next(error);
    }
  }

  async generateIncidentReport(projectId, startDate) {
    const incidents = await Incident.find({
      projectId,
      createdAt: { $gte: startDate }
    });
    
    const totalIncidents = incidents.length;
    const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
    const warningIncidents = incidents.filter(i => i.severity === 'warning').length;
    const infoIncidents = incidents.filter(i => i.severity === 'info').length;
    
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved');
    const avgResolutionTime = resolvedIncidents.length > 0 
      ? resolvedIncidents.reduce((sum, i) => {
          if (i.resolvedAt && i.createdAt) {
            return sum + (new Date(i.resolvedAt) - new Date(i.createdAt));
          }
          return sum;
        }, 0) / resolvedIncidents.length / (1000 * 60) // Convert to minutes
      : 0;
    
    return {
      period: `Last ${Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24))} Days`,
      totalIncidents,
      criticalIncidents,
      warningIncidents,
      infoIncidents,
      averageResolutionTime: Math.round(avgResolutionTime),
      incidents: incidents.slice(0, 10) // Top 10 recent incidents
    };
  }

  async generateSLAReport(projectId, startDate) {
    const uptimeData = await UptimeMetric.find({
      projectId,
      timestamp: { $gte: startDate }
    });
    
    const totalChecks = uptimeData.length;
    const upChecks = uptimeData.filter(m => m.status === 'up').length;
    const currentUptime = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 100;
    
    const targetUptime = 99.95;
    const slaCompliant = currentUptime >= targetUptime;
    
    return {
      period: `Last ${Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24))} Days`,
      targetUptime,
      actualUptime: parseFloat(currentUptime.toFixed(2)),
      compliant: slaCompliant,
      creditIssued: slaCompliant ? 0 : 850
    };
  }

  async generateMetricsReport(projectId, startDate) {
    const metrics = await Metric.find({
      projectId,
      timestamp: { $gte: startDate }
    });
    
    const responseTimeMetrics = metrics.filter(m => m.metricType === 'latency');
    const errorMetrics = metrics.filter(m => m.metricType === 'errors');
    const requestMetrics = metrics.filter(m => m.metricType === 'requests');
    
    const avgResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;
    
    const errorRate = errorMetrics.length > 0 && requestMetrics.length > 0
      ? (errorMetrics.reduce((sum, m) => sum + m.value, 0) / requestMetrics.reduce((sum, m) => sum + m.value, 0)) * 100
      : 0;
    
    return {
      period: `Last ${Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24))} Days`,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: parseFloat(errorRate.toFixed(2)),
      totalRequests: requestMetrics.reduce((sum, m) => sum + m.value, 0)
    };
  }

  async generateTrendReport(projectId, startDate) {
    const incidents = await Incident.find({
      projectId,
      createdAt: { $gte: startDate }
    });
    
    const uptimeData = await UptimeMetric.find({
      projectId,
      timestamp: { $gte: startDate }
    });
    
    const totalChecks = uptimeData.length;
    const upChecks = uptimeData.filter(m => m.status === 'up').length;
    const uptime = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 100;
    
    return {
      period: `Last ${Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24))} Days`,
      incidentTrend: incidents.length > 10 ? 'increasing' : 'stable',
      uptimeTrend: uptime > 99 ? 'stable' : 'declining',
      totalIncidents: incidents.length,
      averageUptime: parseFloat(uptime.toFixed(2))
    };
  }

  async generateAlertReport(projectId, startDate) {
    const alerts = await Alert.find({ projectId });
    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter(a => a.active).length;
    const triggeredAlerts = alerts.filter(a => a.lastTriggered && a.lastTriggered >= startDate).length;
    
    return {
      period: `Last ${Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24))} Days`,
      totalAlerts,
      activeAlerts,
      triggeredAlerts,
      alerts: alerts.slice(0, 10)
    };
  }
}

module.exports = new ReportsController();