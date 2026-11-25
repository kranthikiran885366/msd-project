const analyticsService = require("../services/analyticsService")
const Metric = require("../models/Metric")
const Alert = require("../models/Alert")

// Metrics
exports.createMetric = async (req, res) => {
  try {
    const { projectId, deploymentId, metricType, value, metadata } = req.body

    const metric = await analyticsService.recordMetric({
      projectId,
      deploymentId,
      metricType,
      value,
      metadata,
      timestamp: new Date(),
    })

    res.status(201).json(metric)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listMetrics = async (req, res) => {
  try {
    const { projectId, metricType, timeRange = 7, limit = 100 } = req.query

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeRange))

    const metrics = await Metric.find({
      projectId,
      ...(metricType && { metricType }),
      timestamp: { $gte: startDate },
    })
      .limit(parseInt(limit))
      .sort({ timestamp: -1 })

    res.json(metrics)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getMetricStats = async (req, res) => {
  try {
    const { projectId, metricType, timeRange = 7 } = req.query

    const stats = await analyticsService.getMetricStats(projectId, metricType, parseInt(timeRange))

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAggregatedMetrics = async (req, res) => {
  try {
    const { projectId, aggregation = "hourly", timeRange = 7 } = req.query

    const aggregated = await analyticsService.getAggregatedMetrics(projectId, aggregation, parseInt(timeRange))

    res.json(aggregated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getDeploymentMetrics = async (req, res) => {
  try {
    const { deploymentId } = req.params

    const metrics = await analyticsService.getDeploymentMetrics(deploymentId)

    res.json(metrics)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Alerts
exports.createAlert = async (req, res) => {
  try {
    const { projectId, name, metricType, threshold, operator, message, channels } = req.body
    const { userId } = req

    const alert = await analyticsService.createAlert({
      projectId,
      name,
      metricType,
      threshold,
      operator,
      message,
      channels,
      createdBy: userId,
    })

    res.status(201).json(alert)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listAlerts = async (req, res) => {
  try {
    const { projectId, active = true } = req.query

    const alerts = await Alert.find({
      projectId,
      ...(active !== undefined && { active: active === "true" }),
    })

    res.json(alerts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAlert = async (req, res) => {
  try {
    const { alertId } = req.params

    const alert = await Alert.findById(alertId)

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" })
    }

    res.json(alert)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateAlert = async (req, res) => {
  try {
    const { alertId } = req.params
    const { name, threshold, operator, message, channels, active } = req.body

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        name,
        threshold,
        operator,
        message,
        channels,
        active,
        updatedAt: new Date(),
      },
      { new: true }
    )

    res.json(alert)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params

    await Alert.findByIdAndDelete(alertId)

    res.json({ message: "Alert deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.triggerAlert = async (req, res) => {
  try {
    const { alertId } = req.params

    const alert = await analyticsService.triggerAlert(alertId)

    res.json(alert)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Reports
exports.generateReport = async (req, res) => {
  try {
    const { projectId, reportType, timeRange = 7, filters } = req.body

    const report = await analyticsService.generateReport({
      projectId,
      reportType,
      timeRange,
      filters,
      generatedAt: new Date(),
    })

    res.status(201).json(report)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listReports = async (req, res) => {
  try {
    const { projectId, reportType, limit = 50 } = req.query

    const reports = await analyticsService.listReports({
      projectId,
      ...(reportType && { reportType }),
      limit: parseInt(limit),
    })

    res.json(reports)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getReport = async (req, res) => {
  try {
    const { reportId } = req.params

    const report = await analyticsService.getReportById(reportId)

    if (!report) {
      return res.status(404).json({ error: "Report not found" })
    }

    res.json(report)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params

    await analyticsService.deleteReport(reportId)

    res.json({ message: "Report deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Dashboard Data
exports.getDashboardData = async (req, res) => {
  try {
    const { projectId, timeRange = 7 } = req.query

    const dashboard = await analyticsService.getDashboardData(projectId, parseInt(timeRange))

    res.json(dashboard)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getHealthcheck = async (req, res) => {
  try {
    const { projectId } = req.query

    const health = await analyticsService.getHealthStatus(projectId)

    res.json(health)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Metric Comparison
exports.compareMetrics = async (req, res) => {
  try {
    const { projectId, metricType, period1Start, period1End, period2Start, period2End } = req.body

    const comparison = await analyticsService.compareMetrics({
      projectId,
      metricType,
      period1: { start: new Date(period1Start), end: new Date(period1End) },
      period2: { start: new Date(period2Start), end: new Date(period2End) },
    })

    res.json(comparison)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Trend Analysis
exports.getTrendAnalysis = async (req, res) => {
  try {
    const { projectId, metricType, timeRange = 30 } = req.query

    const trends = await analyticsService.analyzeTrends(projectId, metricType, parseInt(timeRange))

    res.json(trends)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Alert History
exports.getAlertHistory = async (req, res) => {
  try {
    const { alertId, limit = 100 } = req.query

    const history = await analyticsService.getAlertHistory(alertId, parseInt(limit))

    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Metric Export
exports.exportMetrics = async (req, res) => {
  try {
    const { projectId, metricType, timeRange = 7, format = "json" } = req.query

    const metrics = await Metric.find({
      projectId,
      ...(metricType && { metricType }),
      timestamp: { $gte: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000) },
    })

    if (format === "csv") {
      // Convert to CSV format
      const csv = analyticsService.convertToCSV(metrics)
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", "attachment; filename=metrics.csv")
      res.send(csv)
    } else {
      res.json(metrics)
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Observed analytics: scope all aggregates to projects owned by the caller.
exports.getAnalyticsOverview = async (req, res, next) => {
 try {
  const result = await require('../services/observedAnalytics').read(req.userId, req.query.days || 30);
  res.json({success:true,data:result.overview,window:result.window,observedAt:result.observedAt,unavailableMetrics:result.unavailableMetrics});
 } catch(error) { next(error); }
};
exports.getAnalyticsHistory = async (req, res, next) => {
 try {
  const result = await require('../services/observedAnalytics').read(req.userId, req.query.days || 30);
  res.json({success:true,data:result.history,window:result.window,observedAt:result.observedAt,unavailableMetrics:result.unavailableMetrics});
 } catch(error) { next(error); }
};

// Analytics Metrics
exports.getAnalyticsMetrics = async (req, res) => {
  try {
    const metrics = []
    res.json({ success: true, data: metrics })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// Deployment Analytics
exports.getDeploymentAnalytics = async (req, res) => {
  try {
    const analytics = []
    res.json({ success: true, data: analytics })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// User Analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const analytics = []
    res.json({ success: true, data: analytics })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// Performance Analytics
exports.getPerformanceAnalytics = async (req, res) => {
  try {
    const analytics = []
    res.json({ success: true, data: analytics })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

