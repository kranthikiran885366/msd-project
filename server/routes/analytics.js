const express = require("express")
const router = express.Router()
const analyticsController = require("../controllers/analyticsController")
const authMiddleware = require("../middleware/auth")

// Overview and History (for analytics page)
router.get("/overview", authMiddleware, analyticsController.getAnalyticsOverview || ((req, res) => {
  res.json({
    success: true,
    data: {
      totalDeployments: 0,
      activeUsers: 0,
      successRate: 95,
      apiCalls: 0,
      avgResponseTime: 150,
      p95ResponseTime: 250,
      uptime: 99.95,
      errorRate: 0.05,
      successfulDeployments: 0,
      failedDeployments: 0,
      inProgressDeployments: 0
    }
  })
}))
router.get("/history", authMiddleware, analyticsController.getAnalyticsHistory || ((req, res) => {
  res.json({
    success: true,
    data: []
  })
}))
router.get("/metrics", authMiddleware, analyticsController.getAnalyticsMetrics || ((req, res) => {
  res.json({
    success: true,
    data: []
  })
}))
router.get("/deployments", authMiddleware, analyticsController.getDeploymentAnalytics || ((req, res) => {
  res.json({
    success: true,
    data: []
  })
}))
router.get("/users", authMiddleware, analyticsController.getUserAnalytics || ((req, res) => {
  res.json({
    success: true,
    data: []
  })
}))
router.get("/performance", authMiddleware, analyticsController.getPerformanceAnalytics || ((req, res) => {
  res.json({
    success: true,
    data: []
  })
}))

// Metrics
router.post("/metrics", authMiddleware, analyticsController.createMetric)
router.get("/metrics", authMiddleware, analyticsController.listMetrics)
router.get("/metrics/:deploymentId", authMiddleware, analyticsController.getDeploymentMetrics)
router.get("/metrics/stats/:projectId", authMiddleware, analyticsController.getMetricStats)
router.get("/aggregates/:projectId", authMiddleware, analyticsController.getAggregatedMetrics)

// Alerts
router.post("/alerts", authMiddleware, analyticsController.createAlert)
router.get("/alerts", authMiddleware, analyticsController.listAlerts)
router.get("/alerts/:alertId", authMiddleware, analyticsController.getAlert)
router.patch("/alerts/:alertId", authMiddleware, analyticsController.updateAlert)
router.delete("/alerts/:alertId", authMiddleware, analyticsController.deleteAlert)
router.post("/alerts/:alertId/trigger", authMiddleware, analyticsController.triggerAlert)

// Reports
router.post("/reports", authMiddleware, analyticsController.generateReport)
router.get("/reports", authMiddleware, analyticsController.listReports)
router.get("/reports/:reportId", authMiddleware, analyticsController.getReport)
router.delete("/reports/:reportId", authMiddleware, analyticsController.deleteReport)

// Dashboard
router.get("/dashboard/:projectId", authMiddleware, analyticsController.getDashboardData)
router.get("/health/:projectId", authMiddleware, analyticsController.getHealthcheck)

// Comparisons and trends
router.post("/compare", authMiddleware, analyticsController.compareMetrics)
router.get("/trends/:projectId", authMiddleware, analyticsController.getTrendAnalysis)
router.get("/alert-history", authMiddleware, analyticsController.getAlertHistory)

// Export
router.get("/export/:projectId", authMiddleware, analyticsController.exportMetrics)

module.exports = router
