const UptimeMetric = require('../models/UptimeMetric');
const Deployment = require('../models/Deployment');

class UptimeService {
  async recordUptimeMetric(data) {
    const metric = new UptimeMetric(data);
    await metric.save();
    return metric;
  }

  async getUptimeMetrics(projectId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    return await UptimeMetric.find({
      projectId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });
  }

  async calculateUptime(projectId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const metrics = await UptimeMetric.find({
      projectId,
      timestamp: { $gte: startDate }
    });

    if (metrics.length === 0) return { uptime: 100, totalChecks: 0, downtime: 0 };

    const totalChecks = metrics.length;
    const upChecks = metrics.filter(m => m.status === 'up').length;
    const downChecks = metrics.filter(m => m.status === 'down').length;

    const uptime = (upChecks / totalChecks) * 100;
    const downtime = this.calculateDowntime(metrics);

    return {
      uptime: parseFloat(uptime.toFixed(2)),
      totalChecks,
      upChecks,
      downChecks,
      downtime // in minutes
    };
  }

  calculateDowntime(metrics) {
    let totalDowntime = 0;
    let downStart = null;

    metrics.sort((a, b) => a.timestamp - b.timestamp);

    for (const metric of metrics) {
      if (metric.status === 'down' && !downStart) {
        downStart = metric.timestamp;
      } else if (metric.status === 'up' && downStart) {
        totalDowntime += (metric.timestamp - downStart) / (1000 * 60); // minutes
        downStart = null;
      }
    }

    // If still down at the end
    if (downStart) {
      totalDowntime += (new Date() - downStart) / (1000 * 60);
    }

    return Math.round(totalDowntime);
  }

  async getUptimeHistory(projectId, days = 7) {
    const history = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayMetrics = await UptimeMetric.find({
        projectId,
        timestamp: { $gte: date, $lt: nextDate }
      });

      const dayUptime = this.calculateUptime(projectId, 1, dayMetrics);
      
      history.push({
        date: date.toISOString().split('T')[0],
        uptime: dayUptime.uptime,
        totalChecks: dayUptime.totalChecks,
        downtime: dayUptime.downtime
      });
    }

    return history;
  }

  async getSLAStatus(projectId, targetUptime = 99.95) {
    const uptime30d = await this.calculateUptime(projectId, 30);
    const uptime7d = await this.calculateUptime(projectId, 7);
    const uptime24h = await this.calculateUptime(projectId, 1);

    const slaCompliant = uptime30d.uptime >= targetUptime;
    const remainingBuffer = uptime30d.uptime - targetUptime;

    return {
      targetUptime,
      currentUptime: uptime30d.uptime,
      uptime24h: uptime24h.uptime,
      uptime7d: uptime7d.uptime,
      uptime30d: uptime30d.uptime,
      slaCompliant,
      remainingBuffer: parseFloat(remainingBuffer.toFixed(2)),
      totalDowntime: uptime30d.downtime
    };
  }

  async getIncidentHistory(projectId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Get downtime periods
    const metrics = await UptimeMetric.find({
      projectId,
      timestamp: { $gte: startDate },
      status: { $in: ['down', 'degraded'] }
    }).sort({ timestamp: 1 });

    const incidents = [];
    let currentIncident = null;

    for (const metric of metrics) {
      if (!currentIncident) {
        currentIncident = {
          startTime: metric.timestamp,
          endTime: null,
          duration: 0,
          severity: metric.status === 'down' ? 'critical' : 'warning',
          cause: metric.errorMessage || 'Unknown'
        };
      } else if (metric.status === 'up') {
        currentIncident.endTime = metric.timestamp;
        currentIncident.duration = Math.round((currentIncident.endTime - currentIncident.startTime) / (1000 * 60));
        incidents.push(currentIncident);
        currentIncident = null;
      }
    }

    // Handle ongoing incident
    if (currentIncident) {
      currentIncident.endTime = new Date();
      currentIncident.duration = Math.round((currentIncident.endTime - currentIncident.startTime) / (1000 * 60));
      incidents.push(currentIncident);
    }

    return incidents;
  }

  async getResponseTimeStats(projectId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const metrics = await UptimeMetric.find({
      projectId,
      timestamp: { $gte: startDate },
      responseTime: { $exists: true, $ne: null }
    });

    if (metrics.length === 0) return { average: 0, min: 0, max: 0, p95: 0, p99: 0 };

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const sum = responseTimes.reduce((a, b) => a + b, 0);

    return {
      average: Math.round(sum / responseTimes.length),
      min: responseTimes[0],
      max: responseTimes[responseTimes.length - 1],
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)]
    };
  }
}

module.exports = new UptimeService();