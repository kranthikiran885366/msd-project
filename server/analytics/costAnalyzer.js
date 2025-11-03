const { Op } = require('sequelize');
const { BillingUsage, Project, Deployment, Metric } = require('../models');

class CostAnalyzer {
  constructor() {
    this.pricingRules = {
      compute: { base: 0.05, per: 'hour' },
      storage: { base: 0.023, per: 'gb-month' },
      bandwidth: { base: 0.09, per: 'gb' },
      builds: { base: 0.005, per: 'minute' },
      functions: { base: 0.0000002, per: 'invocation' }
    };
  }

  async generateCostReport(startDate, endDate, teamId = null, projectId = null) {
    const filters = {
      createdAt: { [Op.between]: [startDate, endDate] }
    };

    if (teamId) filters.teamId = teamId;
    if (projectId) filters.projectId = projectId;

    const [totalCosts, costBreakdown, trends, optimization] = await Promise.all([
      this.calculateTotalCosts(filters),
      this.getCostBreakdown(filters),
      this.getCostTrends(filters),
      this.generateOptimizationRecommendations(filters)
    ]);

    return {
      summary: {
        totalCost: totalCosts.total,
        previousPeriod: totalCosts.previous,
        change: totalCosts.change,
        changePercent: totalCosts.changePercent
      },
      breakdown: costBreakdown,
      trends,
      optimization,
      generatedAt: new Date()
    };
  }

  async calculateTotalCosts(filters) {
    const current = await BillingUsage.sum('amount', { where: filters });
    
    // Calculate previous period for comparison
    const periodLength = filters.createdAt[Op.between][1] - filters.createdAt[Op.between][0];
    const previousStart = new Date(filters.createdAt[Op.between][0] - periodLength);
    const previousEnd = filters.createdAt[Op.between][0];
    
    const previous = await BillingUsage.sum('amount', {
      where: {
        ...filters,
        createdAt: { [Op.between]: [previousStart, previousEnd] }
      }
    });

    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous * 100) : 0;

    return {
      total: current || 0,
      previous: previous || 0,
      change,
      changePercent: changePercent.toFixed(2)
    };
  }

  async getCostBreakdown(filters) {
    const [byService, byProject, byRegion, byTeam] = await Promise.all([
      this.getCostsByService(filters),
      this.getCostsByProject(filters),
      this.getCostsByRegion(filters),
      this.getCostsByTeam(filters)
    ]);

    return {
      byService,
      byProject,
      byRegion,
      byTeam
    };
  }

  async getCostsByService(filters) {
    const costs = await BillingUsage.findAll({
      where: filters,
      attributes: [
        'service',
        [BillingUsage.sequelize.fn('SUM', BillingUsage.sequelize.col('amount')), 'total'],
        [BillingUsage.sequelize.fn('COUNT', '*'), 'transactions']
      ],
      group: ['service'],
      order: [[BillingUsage.sequelize.literal('total'), 'DESC']]
    });

    const total = costs.reduce((sum, item) => sum + parseFloat(item.dataValues.total), 0);

    return costs.map(item => ({
      service: item.service,
      amount: parseFloat(item.dataValues.total),
      transactions: item.dataValues.transactions,
      percentage: total > 0 ? (item.dataValues.total / total * 100).toFixed(2) : 0
    }));
  }

  async getCostsByProject(filters) {
    const costs = await BillingUsage.findAll({
      where: filters,
      include: [{
        model: Project,
        attributes: ['name', 'id']
      }],
      attributes: [
        'projectId',
        [BillingUsage.sequelize.fn('SUM', BillingUsage.sequelize.col('amount')), 'total']
      ],
      group: ['projectId', 'Project.id', 'Project.name'],
      order: [[BillingUsage.sequelize.literal('total'), 'DESC']],
      limit: 10
    });

    return costs.map(item => ({
      projectId: item.projectId,
      projectName: item.Project?.name || 'Unknown',
      amount: parseFloat(item.dataValues.total)
    }));
  }

  async getCostsByRegion(filters) {
    const costs = await BillingUsage.findAll({
      where: filters,
      attributes: [
        'region',
        [BillingUsage.sequelize.fn('SUM', BillingUsage.sequelize.col('amount')), 'total']
      ],
      group: ['region'],
      order: [[BillingUsage.sequelize.literal('total'), 'DESC']]
    });

    return costs.map(item => ({
      region: item.region,
      amount: parseFloat(item.dataValues.total)
    }));
  }

  async getCostsByTeam(filters) {
    const costs = await BillingUsage.findAll({
      where: filters,
      attributes: [
        'teamId',
        [BillingUsage.sequelize.fn('SUM', BillingUsage.sequelize.col('amount')), 'total']
      ],
      group: ['teamId'],
      order: [[BillingUsage.sequelize.literal('total'), 'DESC']]
    });

    return costs.map(item => ({
      teamId: item.teamId,
      amount: parseFloat(item.dataValues.total)
    }));
  }

  async getCostTrends(filters) {
    const dailyCosts = await BillingUsage.findAll({
      where: filters,
      attributes: [
        [BillingUsage.sequelize.fn('DATE', BillingUsage.sequelize.col('createdAt')), 'date'],
        [BillingUsage.sequelize.fn('SUM', BillingUsage.sequelize.col('amount')), 'total'],
        'service'
      ],
      group: [
        BillingUsage.sequelize.fn('DATE', BillingUsage.sequelize.col('createdAt')),
        'service'
      ],
      order: [[BillingUsage.sequelize.fn('DATE', BillingUsage.sequelize.col('createdAt')), 'ASC']]
    });

    // Group by date
    const trendData = {};
    dailyCosts.forEach(item => {
      const date = item.dataValues.date;
      if (!trendData[date]) {
        trendData[date] = { date, total: 0, services: {} };
      }
      trendData[date].total += parseFloat(item.dataValues.total);
      trendData[date].services[item.service] = parseFloat(item.dataValues.total);
    });

    return Object.values(trendData);
  }

  async generateOptimizationRecommendations(filters) {
    const recommendations = [];

    // Check for idle resources
    const idleResources = await this.findIdleResources(filters);
    if (idleResources.length > 0) {
      recommendations.push({
        type: 'idle_resources',
        severity: 'high',
        title: 'Idle Resources Detected',
        description: `Found ${idleResources.length} idle resources consuming costs`,
        potentialSavings: idleResources.reduce((sum, r) => sum + r.monthlyCost, 0),
        resources: idleResources
      });
    }

    // Check for oversized instances
    const oversizedInstances = await this.findOversizedInstances(filters);
    if (oversizedInstances.length > 0) {
      recommendations.push({
        type: 'oversized_instances',
        severity: 'medium',
        title: 'Oversized Instances',
        description: `${oversizedInstances.length} instances may be oversized`,
        potentialSavings: oversizedInstances.reduce((sum, i) => sum + i.potentialSavings, 0),
        instances: oversizedInstances
      });
    }

    // Check for unused storage
    const unusedStorage = await this.findUnusedStorage(filters);
    if (unusedStorage.totalSize > 0) {
      recommendations.push({
        type: 'unused_storage',
        severity: 'medium',
        title: 'Unused Storage',
        description: `${unusedStorage.totalSize}GB of unused storage detected`,
        potentialSavings: unusedStorage.totalSize * this.pricingRules.storage.base,
        storage: unusedStorage.items
      });
    }

    // Check for build optimization opportunities
    const buildOptimization = await this.analyzeBuildCosts(filters);
    if (buildOptimization.potentialSavings > 0) {
      recommendations.push({
        type: 'build_optimization',
        severity: 'low',
        title: 'Build Time Optimization',
        description: 'Build times can be optimized to reduce costs',
        potentialSavings: buildOptimization.potentialSavings,
        suggestions: buildOptimization.suggestions
      });
    }

    return recommendations;
  }

  async findIdleResources(filters) {
    // Find deployments with low CPU usage
    const idleDeployments = await Deployment.findAll({
      where: {
        createdAt: { [Op.between]: [filters.createdAt[Op.between][0], filters.createdAt[Op.between][1]] },
        status: 'success'
      },
      include: [{
        model: Metric,
        where: {
          metricName: 'cpu_usage',
          value: { [Op.lt]: 5 } // Less than 5% CPU usage
        },
        required: true
      }]
    });

    return idleDeployments.map(deployment => ({
      deploymentId: deployment.id,
      projectId: deployment.projectId,
      avgCpuUsage: deployment.Metrics.reduce((sum, m) => sum + m.value, 0) / deployment.Metrics.length,
      monthlyCost: 50 // Estimated monthly cost
    }));
  }

  async findOversizedInstances(filters) {
    // Find instances with consistently high memory but low CPU
    const instances = await Metric.findAll({
      where: {
        timestamp: { [Op.between]: [filters.createdAt[Op.between][0], filters.createdAt[Op.between][1]] },
        metricName: { [Op.in]: ['cpu_usage', 'memory_usage'] }
      },
      attributes: [
        'deploymentId',
        'metricName',
        [Metric.sequelize.fn('AVG', Metric.sequelize.col('value')), 'avgValue']
      ],
      group: ['deploymentId', 'metricName']
    });

    const deploymentMetrics = {};
    instances.forEach(metric => {
      if (!deploymentMetrics[metric.deploymentId]) {
        deploymentMetrics[metric.deploymentId] = {};
      }
      deploymentMetrics[metric.deploymentId][metric.metricName] = metric.dataValues.avgValue;
    });

    return Object.entries(deploymentMetrics)
      .filter(([id, metrics]) => 
        metrics.memory_usage > 80 && metrics.cpu_usage < 30
      )
      .map(([deploymentId, metrics]) => ({
        deploymentId,
        avgCpuUsage: metrics.cpu_usage,
        avgMemoryUsage: metrics.memory_usage,
        potentialSavings: 25 // Estimated monthly savings
      }));
  }

  async findUnusedStorage(filters) {
    // This would integrate with cloud provider APIs to find unused volumes
    // For now, return mock data
    return {
      totalSize: 0,
      items: []
    };
  }

  async analyzeBuildCosts(filters) {
    const builds = await BillingUsage.findAll({
      where: {
        ...filters,
        service: 'builds'
      },
      attributes: [
        'projectId',
        [BillingUsage.sequelize.fn('AVG', BillingUsage.sequelize.col('quantity')), 'avgDuration'],
        [BillingUsage.sequelize.fn('SUM', BillingUsage.sequelize.col('amount')), 'totalCost']
      ],
      group: ['projectId']
    });

    const longBuilds = builds.filter(build => build.dataValues.avgDuration > 10); // > 10 minutes
    const potentialSavings = longBuilds.reduce((sum, build) => {
      const optimizedDuration = build.dataValues.avgDuration * 0.7; // 30% improvement
      const savings = (build.dataValues.avgDuration - optimizedDuration) * this.pricingRules.builds.base;
      return sum + savings;
    }, 0);

    return {
      potentialSavings,
      suggestions: [
        'Enable build caching',
        'Optimize Docker layers',
        'Use parallel build steps',
        'Remove unnecessary dependencies'
      ]
    };
  }

  async generateCostForecast(startDate, endDate, teamId = null) {
    const filters = {
      createdAt: { [Op.between]: [startDate, endDate] }
    };
    if (teamId) filters.teamId = teamId;

    const historicalData = await this.getCostTrends(filters);
    
    // Simple linear regression for forecasting
    const forecast = this.calculateLinearForecast(historicalData);
    
    return {
      nextMonth: forecast.nextMonth,
      nextQuarter: forecast.nextQuarter,
      confidence: forecast.confidence,
      factors: [
        'Historical usage patterns',
        'Seasonal variations',
        'Growth trends'
      ]
    };
  }

  calculateLinearForecast(data) {
    if (data.length < 2) {
      return { nextMonth: 0, nextQuarter: 0, confidence: 0 };
    }

    // Calculate trend
    const x = data.map((_, i) => i);
    const y = data.map(d => d.total);
    
    const n = data.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Forecast next 30 and 90 days
    const nextMonth = intercept + slope * (n + 30);
    const nextQuarter = intercept + slope * (n + 90);
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = intercept + slope * x[i];
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return {
      nextMonth: Math.max(0, nextMonth),
      nextQuarter: Math.max(0, nextQuarter),
      confidence: Math.max(0, Math.min(100, rSquared * 100))
    };
  }
}

module.exports = new CostAnalyzer();