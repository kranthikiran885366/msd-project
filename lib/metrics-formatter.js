// Metrics Formatting Utilities
export class MetricsFormatter {
  static formatMetric(metricType, value) {
    const formatters = {
      response_time: (v) => `${Math.round(v)}ms`,
      error_rate: (v) => `${v.toFixed(2)}%`,
      memory_usage: (v) => `${Math.round(v)}MB`,
      cpu_usage: (v) => `${Math.round(v)}%`,
      bandwidth: (v) => `${(v / 1024).toFixed(2)}GB`,
    }

    return formatters[metricType] ? formatters[metricType](value) : value
  }

  static getMetricThresholds(metricType) {
    const thresholds = {
      response_time: { warning: 500, critical: 1000 },
      error_rate: { warning: 1, critical: 5 },
      memory_usage: { warning: 70, critical: 90 },
      cpu_usage: { warning: 70, critical: 90 },
      bandwidth: { warning: 80, critical: 100 },
    }

    return thresholds[metricType] || { warning: 70, critical: 90 }
  }

  static getMetricStatus(metricType, value) {
    const thresholds = this.getMetricThresholds(metricType)

    if (value >= thresholds.critical) return { status: "critical", color: "red" }
    if (value >= thresholds.warning) return { status: "warning", color: "yellow" }
    return { status: "healthy", color: "green" }
  }

  static aggregateMetrics(metricsArray, metricType) {
    if (!metricsArray.length) return null

    const values = metricsArray.map((m) => m.value)
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    return {
      avg: Math.round(avg * 100) / 100,
      max: Math.round(max * 100) / 100,
      min: Math.round(min * 100) / 100,
      count: values.length,
    }
  }

  static generateMetricsChart(metricsArray) {
    return metricsArray
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map((m) => ({
        timestamp: new Date(m.timestamp).toLocaleTimeString(),
        value: m.value,
      }))
  }
}

export default MetricsFormatter
