const { Metric, Alert } = require("../models/Metric")

class AnalyticsService {
  async recordMetric(projectId, resourceType, metricType, value, resourceId, tags) {
    const metric = new Metric({
      projectId,
      resourceType,
      resourceId,
      metricType,
      value,
      tags: tags || {},
      timestamp: new Date(),
    })
    return await metric.save()
  }

  async recordBatchMetrics(metrics) {
    return await Metric.insertMany(metrics)
  }

  async getMetricsByType(projectId, resourceType, metricType, { days = 7, limit = 100 }) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return await Metric.find({
      projectId,
      resourceType,
      metricType,
      timestamp: { $gte: startDate },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
  }

  async calculateAggregate(projectId, resourceType, metricType, aggregation, { days = 7 }) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const pipeline = [
      {
        $match: {
          projectId,
          resourceType,
          metricType,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          sum: { $sum: "$value" },
          avg: { $avg: "$value" },
          min: { $min: "$value" },
          max: { $max: "$value" },
          stdDev: { $stdDevPop: "$value" },
        },
      },
    ]

    const result = await Metric.aggregate(pipeline)
    return result[0] || {}
  }

  async getDashboardMetrics(projectId, { days = 7 }) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const pipeline = [
      {
        $match: {
          projectId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            metricType: "$metricType",
          },
          value: { $sum: "$value" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": -1 },
      },
    ]

    return await Metric.aggregate(pipeline)
  }

  async createAlert(projectId, name, condition, notifications) {
    const alert = new Alert({
      projectId,
      name,
      condition,
      notifications,
      isActive: true,
    })
    return await alert.save()
  }

  async getAlerts(projectId, { isActive = true, limit = 50, offset = 0 }) {
    const query = { projectId }
    if (isActive !== undefined) query.isActive = isActive

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)

    const total = await Alert.countDocuments(query)
    return { alerts, total }
  }

  async checkAlerts(projectId) {
    const alerts = await Alert.find({ projectId, isActive: true })

    const triggeredAlerts = []

    for (const alert of alerts) {
      const lastMetric = await Metric.findOne({
        projectId,
        metricType: alert.condition.metric,
      }).sort({ timestamp: -1 })

      if (lastMetric) {
        const shouldTrigger = this._evaluateCondition(lastMetric.value, alert.condition)

        if (shouldTrigger && (!alert.lastTriggeredAt || this._shouldRetrigger(alert.lastTriggeredAt))) {
          triggeredAlerts.push(alert)
          alert.lastTriggeredAt = new Date()
          alert.status = "active"
          await alert.save()
        }
      }
    }

    return triggeredAlerts
  }

  _evaluateCondition(value, condition) {
    switch (condition.operator) {
      case "gt":
        return value > condition.threshold
      case "lt":
        return value < condition.threshold
      case "eq":
        return value === condition.threshold
      case "gte":
        return value >= condition.threshold
      case "lte":
        return value <= condition.threshold
      default:
        return false
    }
  }

  _shouldRetrigger(lastTriggeredAt) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return lastTriggeredAt < fiveMinutesAgo
  }

  async generateReport(projectId, reportType, { startDate, endDate }) {
    const metrics = await Metric.find({
      projectId,
      timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: -1 })

    return {
      reportType,
      period: { startDate, endDate },
      totalMetrics: metrics.length,
      byResourceType: this._groupByResourceType(metrics),
      byMetricType: this._groupByMetricType(metrics),
      summary: this._generateSummary(metrics),
    }
  }

  _groupByResourceType(metrics) {
    return metrics.reduce((acc, m) => {
      if (!acc[m.resourceType]) acc[m.resourceType] = []
      acc[m.resourceType].push(m)
      return acc
    }, {})
  }

  _groupByMetricType(metrics) {
    return metrics.reduce((acc, m) => {
      if (!acc[m.metricType]) acc[m.metricType] = []
      acc[m.metricType].push(m)
      return acc
    }, {})
  }

  _generateSummary(metrics) {
    return {
      total: metrics.length,
      byType: Object.keys(this._groupByMetricType(metrics)).reduce((acc, type) => {
        acc[type] = this._groupByMetricType(metrics)[type].length
        return acc
      }, {}),
    }
  }

  async deleteAlert(alertId) {
    return await Alert.findByIdAndRemove(alertId)
  }

  async updateAlert(alertId, updates) {
    return await Alert.findByIdAndUpdate(alertId, updates, { new: true })
  }

  async resolveAlert(alertId) {
    return await Alert.findByIdAndUpdate(alertId, { status: "resolved" }, { new: true })
  }

  async muteAlert(alertId, duration) {
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { status: "muted" },
      { new: true }
    )

    if (duration) {
      setTimeout(() => {
        Alert.findByIdAndUpdate(alertId, { status: "active" })
      }, duration)
    }

    return alert
  }

  // Cost Analytics
  async getCostAnalytics(timeRange = '30') {
    // This would integrate with cloud provider APIs for real cost data
    const days = parseInt(timeRange);
    
    return {
      summary: {
        totalCost: 10450,
        dailyAverage: 348,
        forecast: 11200,
        monthlyChange: '+8.5%',
        dailyChange: '-2%',
        computeCost: 4500,
        computePercentage: 43,
        forecastChange: '+7%'
      },
      trends: [
        { month: 'Jan', compute: 1200, storage: 400, bandwidth: 300, database: 500 },
        { month: 'Feb', compute: 1500, storage: 450, bandwidth: 350, database: 600 },
        { month: 'Mar', compute: 1800, storage: 500, bandwidth: 400, database: 700 },
        { month: 'Apr', compute: 2100, storage: 550, bandwidth: 450, database: 800 },
        { month: 'May', compute: 1900, storage: 480, bandwidth: 420, database: 750 },
        { month: 'Jun', compute: 2200, storage: 600, bandwidth: 500, database: 900 },
      ],
      breakdown: [
        { name: 'Compute', value: 45, cost: '$4,500' },
        { name: 'Storage', value: 20, cost: '$2,000' },
        { name: 'Bandwidth', value: 18, cost: '$1,800' },
        { name: 'Database', value: 17, cost: '$1,700' },
      ],
      projects: [
        { name: 'Production API', cost: 2500, trend: 'up', percentage: 12 },
        { name: 'Website Hosting', cost: 1800, trend: 'down', percentage: 5 },
        { name: 'Data Pipeline', cost: 1200, trend: 'up', percentage: 8 },
        { name: 'Mobile Backend', cost: 950, trend: 'down', percentage: 3 },
        { name: 'Analytics Service', cost: 800, trend: 'up', percentage: 15 },
        { name: 'Dev Environment', cost: 450, trend: 'down', percentage: 2 },
      ],
      drivers: [
        { resource: 'Large Database Instance', cost: 1500, percentage: 15, status: 'high' },
        { resource: 'GPU Compute Instances', cost: 1200, percentage: 12, status: 'high' },
        { resource: 'CDN Usage', cost: 800, percentage: 8, status: 'medium' },
        { resource: 'API Gateway', cost: 650, percentage: 6.5, status: 'medium' },
        { resource: 'Storage Buckets', cost: 500, percentage: 5, status: 'low' },
      ]
    };
  }

  // Performance Analytics
  async getPerformanceAnalytics(timeRange = '30') {
    const days = parseInt(timeRange);
    
    return {
      summary: {
        avgResponseTime: 145,
        errorRate: 0.02,
        uptime: 99.98,
        throughput: 2400
      },
      trends: [
        { time: '00:00', latency: 120, errors: 0.5, throughput: 2200 },
        { time: '04:00', latency: 95, errors: 0.3, throughput: 1800 },
        { time: '08:00', latency: 180, errors: 1.2, throughput: 2800 },
        { time: '12:00', latency: 210, errors: 0.8, throughput: 3200 },
        { time: '16:00', latency: 165, errors: 0.4, throughput: 2900 },
        { time: '20:00', latency: 140, errors: 0.6, throughput: 2400 }
      ],
      services: [
        { name: 'API Server', avgLatency: 120, errorRate: 0.01, uptime: 99.99 },
        { name: 'Database', avgLatency: 45, errorRate: 0.001, uptime: 99.98 },
        { name: 'Cache', avgLatency: 12, errorRate: 0.005, uptime: 99.97 },
        { name: 'Storage', avgLatency: 850, errorRate: 0.1, uptime: 99.85 }
      ]
    };
  }
}

module.exports = new AnalyticsService()
