const Report = require('../models/Report');
const incidentService = require('./incidentService');
const uptimeService = require('./uptimeService');
const Metric = require('../models/Metric');
const Alert = require('../models/Alert');

class ReportService {
  async generateReport(projectId, type, timeRange, userId) {
    const report = new Report({
      projectId,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      type,
      timeRange: this.parseTimeRange(timeRange),
      generatedBy: userId,
      status: 'generating'
    });

    await report.save();

    try {
      let data;
      let summary;

      switch (type) {
        case 'incident':
          ({ data, summary } = await this.generateIncidentReport(projectId, timeRange));
          break;
        case 'sla':
          ({ data, summary } = await this.generateSLAReport(projectId, timeRange));
          break;
        case 'metrics':
          ({ data, summary } = await this.generateMetricsReport(projectId, timeRange));
          break;
        case 'trend':
          ({ data, summary } = await this.generateTrendReport(projectId, timeRange));
          break;
        case 'alert':
          ({ data, summary } = await this.generateAlertReport(projectId, timeRange));
          break;
        case 'uptime':
          ({ data, summary } = await this.generateUptimeReport(projectId, timeRange));
          break;
        default:
          throw new Error('Invalid report type');
      }

      report.data = data;
      report.summary = summary;
      report.status = 'completed';
      await report.save();

      return report;
    } catch (error) {
      report.status = 'failed';
      await report.save();
      throw error;
    }
  }

  async generateIncidentReport(projectId, timeRange) {
    const days = this.parseDays(timeRange);
    const stats = await incidentService.getIncidentStats(projectId, days);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const incidents = await incidentService.getIncidents(projectId, {
      createdAt: { $gte: startDate }
    });

    const data = {
      period: `Last ${days} days`,
      totalIncidents: stats.total,
      byStatus: stats.byStatus,
      bySeverity: stats.bySeverity,
      incidents: incidents.map(i => ({
        id: i._id,
        title: i.title,
        severity: i.severity,
        status: i.status,
        createdAt: i.createdAt,
        resolvedAt: i.resolvedAt,
        component: i.component
      }))
    };

    const summary = {
      totalIncidents: stats.total,
      averageResolutionTime: stats.averageResolutionTime,
      criticalIncidents: stats.bySeverity.critical || 0,
      resolvedIncidents: stats.resolvedCount
    };

    return { data, summary };
  }

  async generateSLAReport(projectId, timeRange) {
    const days = this.parseDays(timeRange);
    const slaStatus = await uptimeService.getSLAStatus(projectId);
    const uptimeHistory = await uptimeService.getUptimeHistory(projectId, days);

    const data = {
      period: `Last ${days} days`,
      targetUptime: 99.95,
      actualUptime: slaStatus.currentUptime,
      slaCompliant: slaStatus.slaCompliant,
      uptimeHistory,
      breaches: slaStatus.slaCompliant ? 0 : 1
    };

    const summary = {
      uptime: slaStatus.currentUptime,
      slaCompliance: slaStatus.slaCompliant,
      totalDowntime: slaStatus.totalDowntime
    };

    return { data, summary };
  }

  async generateMetricsReport(projectId, timeRange) {
    const days = this.parseDays(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await Metric.find({
      projectId,
      timestamp: { $gte: startDate }
    });

    const responseTimeStats = await uptimeService.getResponseTimeStats(projectId, days);

    const data = {
      period: `Last ${days} days`,
      responseTime: responseTimeStats,
      totalMetrics: metrics.length,
      metricsByType: this.groupMetricsByType(metrics)
    };

    const summary = {
      averageResponseTime: responseTimeStats.average,
      p95ResponseTime: responseTimeStats.p95,
      totalMetrics: metrics.length
    };

    return { data, summary };
  }

  async generateTrendReport(projectId, timeRange) {
    const days = this.parseDays(timeRange);
    const months = Math.ceil(days / 30);
    
    const trendData = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthStats = await incidentService.getIncidentStats(projectId, 30);
      const monthUptime = await uptimeService.calculateUptime(projectId, 30);

      trendData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        incidents: monthStats.total,
        uptime: monthUptime.uptime,
        downtime: monthUptime.downtime,
        averageResolutionTime: monthStats.averageResolutionTime
      });
    }

    const data = {
      period: `Last ${months} months`,
      trendData
    };

    const summary = {
      totalPeriods: months,
      trendDirection: this.calculateTrend(trendData)
    };

    return { data, summary };
  }

  async generateAlertReport(projectId, timeRange) {
    const days = this.parseDays(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const alerts = await Alert.find({
      projectId,
      lastTriggered: { $gte: startDate }
    });

    const data = {
      period: `Last ${days} days`,
      totalAlerts: alerts.length,
      triggeredAlerts: alerts.filter(a => a.lastTriggered).length,
      activeAlerts: alerts.filter(a => a.active).length,
      alertsByType: this.groupAlertsByType(alerts)
    };

    const summary = {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.active).length,
      triggerRate: alerts.length > 0 ? (alerts.filter(a => a.lastTriggered).length / alerts.length * 100) : 0
    };

    return { data, summary };
  }

  async generateUptimeReport(projectId, timeRange) {
    const days = this.parseDays(timeRange);
    const uptimeStats = await uptimeService.calculateUptime(projectId, days);
    const incidents = await uptimeService.getIncidentHistory(projectId, days);
    const responseTimeStats = await uptimeService.getResponseTimeStats(projectId, days);

    const data = {
      period: `Last ${days} days`,
      uptime: uptimeStats.uptime,
      totalDowntime: uptimeStats.downtime,
      incidents: incidents.length,
      responseTime: responseTimeStats
    };

    const summary = {
      uptime: uptimeStats.uptime,
      totalDowntime: uptimeStats.downtime,
      incidents: incidents.length
    };

    return { data, summary };
  }

  async getReports(projectId, filters = {}) {
    const query = { projectId, ...filters };
    return await Report.find(query)
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async getReportById(reportId) {
    return await Report.findById(reportId)
      .populate('generatedBy', 'name email');
  }

  async deleteReport(reportId) {
    return await Report.findByIdAndDelete(reportId);
  }

  parseTimeRange(timeRange) {
    const days = this.parseDays(timeRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      startDate,
      endDate,
      period: timeRange
    };
  }

  parseDays(timeRange) {
    const match = timeRange.match(/(\d+)([dwmy])/);
    if (!match) return 30;

    const [, num, unit] = match;
    const number = parseInt(num);

    switch (unit) {
      case 'd': return number;
      case 'w': return number * 7;
      case 'm': return number * 30;
      case 'y': return number * 365;
      default: return 30;
    }
  }

  groupMetricsByType(metrics) {
    return metrics.reduce((acc, metric) => {
      acc[metric.metricType] = (acc[metric.metricType] || 0) + 1;
      return acc;
    }, {});
  }

  groupAlertsByType(alerts) {
    return alerts.reduce((acc, alert) => {
      acc[alert.metricType] = (acc[alert.metricType] || 0) + 1;
      return acc;
    }, {});
  }

  calculateTrend(data) {
    if (data.length < 2) return 'stable';
    
    const first = data[0];
    const last = data[data.length - 1];
    
    if (last.incidents > first.incidents) return 'increasing';
    if (last.incidents < first.incidents) return 'decreasing';
    return 'stable';
  }
}

module.exports = new ReportService();