const client = require('prom-client');
const logger = require('../utils/logger');

/**
 * Prometheus metrics for monitoring and observability
 */
class PrometheusService {
  static initialize() {
    // Default metrics (CPU, memory, etc.)
    client.collectDefaultMetrics();

    // Custom metrics
    this.deploymentCounter = new client.Counter({
      name: 'deployments_total',
      help: 'Total number of deployments',
      labelNames: ['provider', 'status'],
    });

    this.deploymentDuration = new client.Histogram({
      name: 'deployment_duration_seconds',
      help: 'Deployment duration in seconds',
      labelNames: ['provider'],
      buckets: [30, 60, 120, 300, 600, 1800, 3600],
    });

    this.buildDuration = new client.Histogram({
      name: 'build_duration_seconds',
      help: 'Build duration in seconds',
      labelNames: ['framework'],
      buckets: [15, 30, 60, 120, 300, 600],
    });

    this.buildSize = new client.Gauge({
      name: 'build_size_bytes',
      help: 'Build output size in bytes',
      labelNames: ['framework'],
    });

    this.bandwidth = new client.Gauge({
      name: 'bandwidth_bytes_total',
      help: 'Total bandwidth used',
      labelNames: ['region'],
    });

    this.activeDeployments = new client.Gauge({
      name: 'active_deployments',
      help: 'Number of active deployments',
    });

    this.cpuUsage = new client.Gauge({
      name: 'container_cpu_usage_seconds',
      help: 'CPU usage in seconds',
      labelNames: ['deployment_id'],
    });

    this.memoryUsage = new client.Gauge({
      name: 'container_memory_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['deployment_id'],
    });

    this.httpRequests = new client.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
    });

    this.errorRate = new client.Counter({
      name: 'errors_total',
      help: 'Total errors',
      labelNames: ['type', 'severity'],
    });

    this.apiLatency = new client.Histogram({
      name: 'api_latency_ms',
      help: 'API latency in milliseconds',
      labelNames: ['endpoint'],
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
    });

    this.subscriptionMetrics = new client.Gauge({
      name: 'subscriptions_active',
      help: 'Number of active subscriptions',
      labelNames: ['plan'],
    });

    this.usageMetrics = new client.Gauge({
      name: 'usage_total',
      help: 'Total usage by metric',
      labelNames: ['metric', 'userId'],
    });

    logger.info('Prometheus metrics initialized');
  }

  /**
   * Record deployment event
   */
  static recordDeployment(provider, status) {
    this.deploymentCounter.labels(provider, status).inc();
  }

  /**
   * Record deployment duration
   */
  static recordDeploymentDuration(provider, durationSeconds) {
    this.deploymentDuration.labels(provider).observe(durationSeconds);
  }

  /**
   * Record build metrics
   */
  static recordBuild(framework, durationSeconds, sizeBytes) {
    this.buildDuration.labels(framework).observe(durationSeconds);
    this.buildSize.labels(framework).set(sizeBytes);
  }

  /**
   * Record bandwidth usage
   */
  static recordBandwidth(region, bytes) {
    this.bandwidth.labels(region).inc(bytes);
  }

  /**
   * Set active deployments count
   */
  static setActiveDeployments(count) {
    this.activeDeployments.set(count);
  }

  /**
   * Record container resource usage
   */
  static recordContainerUsage(deploymentId, cpu, memory) {
    this.cpuUsage.labels(deploymentId).set(cpu);
    this.memoryUsage.labels(deploymentId).set(memory);
  }

  /**
   * Record HTTP request
   */
  static recordHttpRequest(method, path, status) {
    this.httpRequests.labels(method, path, status).inc();
  }

  /**
   * Record error
   */
  static recordError(type, severity = 'error') {
    this.errorRate.labels(type, severity).inc();
  }

  /**
   * Record API latency
   */
  static recordApiLatency(endpoint, latencyMs) {
    this.apiLatency.labels(endpoint).observe(latencyMs);
  }

  /**
   * Record subscription metrics
   */
  static recordSubscription(plan) {
    this.subscriptionMetrics.labels(plan).inc();
  }

  /**
   * Record usage metrics
   */
  static recordUsage(metric, userId, amount = 1) {
    this.usageMetrics.labels(metric, userId).set(amount);
  }

  /**
   * Get metrics in Prometheus format
   */
  static async getMetrics() {
    return client.register.metrics();
  }

  /**
   * Get metrics JSON format
   */
  static async getMetricsJson() {
    return client.register.getMetricsAsJSON();
  }
}

module.exports = PrometheusService;
