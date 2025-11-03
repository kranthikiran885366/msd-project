// Monitoring Routes - comprehensive monitoring with business logic
const express = require("express")
const router = express.Router()
const monitoringService = require("../services/monitoringService")
const authMiddleware = require("../middleware/auth")
const { body, param, query, validationResult } = require("express-validator")
const mongoose = require("mongoose")

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    })
  }
  next()
}

// Business logic: Record metric with comprehensive validation
router.post("/metric",
  authMiddleware,
  [
    body("projectId").isMongoId().withMessage("Invalid project ID"),
    body("deploymentId").optional().isMongoId().withMessage("Invalid deployment ID"),
    body("metricType").isIn(["responseTime", "errorRate", "memoryUsage", "cpuUsage", "bandwidth"]).withMessage("Invalid metric type"),
    body("value").isNumeric().withMessage("Value must be numeric"),
    body("region").isLength({ min: 2, max: 20 }).withMessage("Region must be 2-20 characters"),
    body("environment").optional().isIn(["development", "staging", "production"]).withMessage("Invalid environment")
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { projectId, deploymentId, metricType, value, region, environment } = req.body
      
      // Business logic: Validate metric value ranges
      const validationRules = {
        responseTime: { min: 0, max: 60000 }, // 0-60 seconds
        errorRate: { min: 0, max: 100 }, // 0-100%
        memoryUsage: { min: 0, max: 100 }, // 0-100%
        cpuUsage: { min: 0, max: 100 }, // 0-100%
        bandwidth: { min: 0, max: 1000000000 } // 0-1GB
      }
      
      const rule = validationRules[metricType]
      if (value < rule.min || value > rule.max) {
        return res.status(400).json({
          success: false,
          message: `${metricType} value must be between ${rule.min} and ${rule.max}`
        })
      }
      
      // Business logic: Check for anomalies and alert thresholds
      const recentMetrics = await monitoringService.getMetrics(projectId, metricType, 1)
      let alertLevel = null
      
      if (recentMetrics.length > 0) {
        const avgValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
        const deviation = Math.abs(value - avgValue) / avgValue
        
        if (deviation > 0.5) alertLevel = "anomaly"
        if (metricType === "errorRate" && value > 10) alertLevel = "critical"
        if (metricType === "responseTime" && value > 5000) alertLevel = "warning"
        if ((metricType === "memoryUsage" || metricType === "cpuUsage") && value > 90) alertLevel = "critical"
      }
      
      const metric = await monitoringService.recordMetric(projectId, deploymentId, metricType, value, region, environment)
      
      res.status(201).json({
        success: true,
        data: metric,
        alertLevel,
        message: alertLevel ? `Alert: ${alertLevel} detected for ${metricType}` : "Metric recorded successfully"
      })
    } catch (error) {
      next(error)
    }
  }
)

// Business logic: Get metrics with advanced filtering and aggregation
router.get("/metrics/:projectId",
  authMiddleware,
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    query("metricType").optional().isIn(["responseTime", "errorRate", "memoryUsage", "cpuUsage", "bandwidth"]),
    query("timeRange").optional().isInt({ min: 1, max: 365 }).withMessage("Time range must be 1-365 days"),
    query("region").optional().isLength({ min: 2, max: 20 }),
    query("aggregation").optional().isIn(["raw", "hourly", "daily"]).withMessage("Invalid aggregation type")
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { projectId } = req.params
      const { metricType, timeRange = 7, region, aggregation = "raw", limit = 1000 } = req.query
      
      // Business logic: Get metrics with optional aggregation
      let metrics
      if (aggregation === "raw") {
        metrics = await monitoringService.getMetrics(projectId, metricType, Number.parseInt(timeRange), region, Number.parseInt(limit))
      } else {
        metrics = await monitoringService.getAggregatedMetrics(projectId, metricType, Number.parseInt(timeRange), aggregation, region)
      }
      
      // Business logic: Calculate trends and insights
      const insights = await monitoringService.calculateTrends(metrics, metricType)
      
      res.json({
        success: true,
        data: metrics,
        insights,
        meta: {
          count: metrics.length,
          timeRange: Number.parseInt(timeRange),
          aggregation,
          projectId
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// Business logic: Comprehensive project metrics summary with SLA tracking
router.get("/summary/:projectId",
  authMiddleware,
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    query("timeRange").optional().isInt({ min: 1, max: 365 }),
    query("includeSLA").optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { projectId } = req.params
      const { timeRange = 7, includeSLA = true } = req.query
      
      const summary = await monitoringService.getProjectMetricsSummary(projectId, Number.parseInt(timeRange))
      
      // Business logic: Calculate SLA compliance
      let slaCompliance = null
      if (includeSLA === "true" || includeSLA === true) {
        slaCompliance = await monitoringService.calculateSLACompliance(projectId, Number.parseInt(timeRange))
      }
      
      // Business logic: Generate recommendations
      const recommendations = await monitoringService.generateRecommendations(summary)
      
      res.json({
        success: true,
        data: {
          summary,
          slaCompliance,
          recommendations,
          generatedAt: new Date().toISOString()
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// Business logic: Enhanced health check with detailed diagnostics
router.get("/health/:projectId",
  authMiddleware,
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    query("detailed").optional().isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { projectId } = req.params
      const { detailed = false } = req.query
      
      const health = await monitoringService.getServiceHealth(projectId)
      
      // Business logic: Add detailed diagnostics if requested
      if (detailed === "true" || detailed === true) {
        health.diagnostics = await monitoringService.runDiagnostics(projectId)
        health.dependencies = await monitoringService.checkDependencies(projectId)
      }
      
      // Business logic: Set appropriate HTTP status based on health
      const statusCode = health.status === "critical" ? 503 : 
                        health.status === "warning" ? 206 : 200
      
      res.status(statusCode).json({
        success: true,
        data: health
      })
    } catch (error) {
      next(error)
    }
  }
)

// Business logic: Enhanced error logs with filtering and analysis
router.get("/errors/:projectId",
  authMiddleware,
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    query("timeRange").optional().isInt({ min: 1, max: 30 }),
    query("level").optional().isIn(["error", "fatal", "warn"]),
    query("service").optional().isLength({ min: 1, max: 50 })
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { projectId } = req.params
      const { timeRange = 1, level, service, limit = 100 } = req.query
      
      const errors = await monitoringService.getErrorLogs(projectId, Number.parseInt(timeRange), level, service, Number.parseInt(limit))
      
      // Business logic: Analyze error patterns
      const analysis = await monitoringService.analyzeErrorPatterns(errors)
      
      res.json({
        success: true,
        data: errors,
        analysis,
        meta: {
          count: errors.length,
          timeRange: Number.parseInt(timeRange),
          filters: { level, service }
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// Business logic: Real-time alerts configuration
router.post("/alerts/:projectId",
  authMiddleware,
  [
    param("projectId").isMongoId().withMessage("Invalid project ID"),
    body("metricType").isIn(["responseTime", "errorRate", "memoryUsage", "cpuUsage", "bandwidth"]),
    body("threshold").isNumeric(),
    body("condition").isIn(["above", "below"]),
    body("enabled").isBoolean()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { projectId } = req.params
      const alertConfig = req.body
      
      const alert = await monitoringService.configureAlert(projectId, alertConfig)
      
      res.status(201).json({
        success: true,
        data: alert,
        message: "Alert configuration saved successfully"
      })
    } catch (error) {
      next(error)
    }
  }
)

// Business logic: Get Prometheus metrics endpoint
router.get("/prometheus", async (req, res, next) => {
  try {
    await monitoringService.getMetricsHandler(req, res)
  } catch (error) {
    next(error)
  }
})

// Business logic: Bulk metric recording for high-throughput scenarios
router.post("/metrics/bulk",
  authMiddleware,
  [
    body("metrics").isArray({ min: 1, max: 100 }).withMessage("Metrics array must contain 1-100 items"),
    body("metrics.*.projectId").isMongoId(),
    body("metrics.*.metricType").isIn(["responseTime", "errorRate", "memoryUsage", "cpuUsage", "bandwidth"]),
    body("metrics.*.value").isNumeric()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { metrics } = req.body
      
      const results = await monitoringService.recordBulkMetrics(metrics)
      
      res.status(201).json({
        success: true,
        data: results,
        message: `Successfully recorded ${results.length} metrics`
      })
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
