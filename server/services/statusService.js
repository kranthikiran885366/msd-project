const SystemStatus = require('../models/SystemStatus');
const ServiceMetric = require('../models/ServiceMetric');
const Incident = require('../models/Incident');
const NotificationService = require('./notificationService');

class StatusService {
  constructor() {
    this.notificationService = new NotificationService();
  }

  async getSystemStatus() {
    try {
      // Get current status of all services
      const services = await SystemStatus.find()
        .sort({ serviceName: 1 })
        .lean();

      // Get active incidents
      const activeIncidents = await Incident.find({
        status: { $nin: ['resolved', 'completed'] }
      }).sort({ startTime: -1 });

      // Calculate overall system status
      const overallStatus = this.calculateOverallStatus(services);

      // Get uptime statistics
      const uptimeStats = await this.calculateUptimeStats();

      return {
        timestamp: new Date(),
        overallStatus,
        services,
        activeIncidents,
        uptime: uptimeStats
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      throw error;
    }
  }

  async getHealthCheck() {
    const metrics = await ServiceMetric.findOne()
      .sort({ timestamp: -1 })
      .lean();

    return {
      status: metrics?.metrics.errorRate < 1 ? 'healthy' : 'degraded',
      timestamp: new Date(),
      services: {
        database: await this.checkDatabaseHealth(),
        redis: await this.checkCacheHealth(),
        api: await this.checkApiHealth()
      }
    };
  }

  async getServiceMetrics(serviceName, timeRange) {
    const endDate = new Date();
    const startDate = new Date(endDate - timeRange);

    const metrics = await ServiceMetric.find({
      serviceName,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    return this.aggregateMetrics(metrics);
  }

  async getIncidents(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.severity) {
      query.severity = filters.severity;
    }
    if (filters.dateRange) {
      query.startTime = {
        $gte: new Date(filters.dateRange.start),
        $lte: new Date(filters.dateRange.end)
      };
    }

    return await Incident.find(query)
      .sort({ startTime: -1 })
      .populate('affectedServices', 'serviceName status');
  }

  async createIncident(incidentData) {
    const incident = new Incident(incidentData);
    await incident.save();

    // Update affected services status
    if (incident.affectedServices?.length) {
      await SystemStatus.updateMany(
        { _id: { $in: incident.affectedServices } },
        { $set: { status: 'degraded', lastIncident: new Date() } }
      );
    }

    // Notify subscribers
    await this.notificationService.notifyIncident(incident);

    return incident;
  }

  async updateIncidentStatus(incidentId, update) {
    const incident = await Incident.findByIdAndUpdate(
      incidentId,
      { 
        $set: update,
        $push: { 
          updates: {
            message: update.message,
            status: update.status,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (update.status === 'resolved') {
      // Update affected services status back to operational
      await SystemStatus.updateMany(
        { _id: { $in: incident.affectedServices } },
        { $set: { status: 'operational' } }
      );
    }

    return incident;
  }

  calculateOverallStatus(services) {
    if (services.some(s => s.status === 'offline')) {
      return 'offline';
    }
    if (services.some(s => s.status === 'degraded')) {
      return 'degraded';
    }
    if (services.some(s => s.status === 'maintenance')) {
      return 'maintenance';
    }
    return 'operational';
  }

  async calculateUptimeStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const metrics = await ServiceMetric.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$serviceName',
          totalPoints: { $sum: 1 },
          operationalPoints: {
            $sum: {
              $cond: [
                { $lt: ['$metrics.errorRate', 1] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    return metrics.map(m => ({
      serviceName: m._id,
      uptime: ((m.operationalPoints / m.totalPoints) * 100).toFixed(2)
    }));
  }

  async checkDatabaseHealth() {
    try {
      await mongoose.connection.db.admin().ping();
      return 'up';
    } catch (error) {
      return 'down';
    }
  }

  async checkCacheHealth() {
    try {
      // Implement Redis health check
      return 'up';
    } catch (error) {
      return 'down';
    }
  }

  async checkApiHealth() {
    const recentMetrics = await ServiceMetric.findOne({
      serviceName: 'API Servers'
    }).sort({ timestamp: -1 });

    return recentMetrics?.metrics.errorRate < 1 ? 'up' : 'down';
  }

  aggregateMetrics(metrics) {
    return {
      latency: {
        avg: this.calculateAverage(metrics.map(m => m.metrics.latency)),
        max: Math.max(...metrics.map(m => m.metrics.latency)),
        min: Math.min(...metrics.map(m => m.metrics.latency))
      },
      errorRate: {
        avg: this.calculateAverage(metrics.map(m => m.metrics.errorRate)),
        max: Math.max(...metrics.map(m => m.metrics.errorRate))
      },
      requestCount: metrics.reduce((sum, m) => sum + m.metrics.requestCount, 0),
      timeline: metrics.map(m => ({
        timestamp: m.timestamp,
        latency: m.metrics.latency,
        errorRate: m.metrics.errorRate,
        requestCount: m.metrics.requestCount
      }))
    };
  }

  calculateAverage(numbers) {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
}

module.exports = new StatusService();