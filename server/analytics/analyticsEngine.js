const { Op } = require('sequelize');
const { 
  User, Team, Project, Deployment, Build, 
  Metric, AuditLog, BillingUsage, Alert 
} = require('../models');

class AnalyticsEngine {
  constructor() {
    this.metricsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getDashboardMetrics(timeRange = '7d', teamId = null) {
    const cacheKey = `dashboard_${timeRange}_${teamId}`;
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const endDate = new Date();
    const startDate = this.getStartDate(timeRange);
    
    const metrics = await Promise.all([
      this.getDeploymentMetrics(startDate, endDate, teamId),
      this.getBuildMetrics(startDate, endDate, teamId),
      this.getCostMetrics(startDate, endDate, teamId),
      this.getPerformanceMetrics(startDate, endDate, teamId),
      this.getSecurityMetrics(startDate, endDate, teamId),
      this.getUserActivityMetrics(startDate, endDate, teamId)
    ]);

    const result = {
      deployments: metrics[0],
      builds: metrics[1],
      costs: metrics[2],
      performance: metrics[3],
      security: metrics[4],
      userActivity: metrics[5],
      generatedAt: new Date()
    };

    this.metricsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  async getDeploymentMetrics(startDate, endDate, teamId) {
    const whereClause = {
      createdAt: { [Op.between]: [startDate, endDate] }
    };

    if (teamId) {
      const teamProjects = await Project.findAll({
        where: { teamId },
        attributes: ['id']
      });
      whereClause.projectId = { [Op.in]: teamProjects.map(p => p.id) };
    }

    const [total, successful, failed, inProgress] = await Promise.all([
      Deployment.count({ where: whereClause }),
      Deployment.count({ where: { ...whereClause, status: 'success' } }),
      Deployment.count({ where: { ...whereClause, status: 'failed' } }),
      Deployment.count({ where: { ...whereClause, status: 'deploying' } })
    ]);

    const dailyDeployments = await this.getDailyDeployments(startDate, endDate, teamId);
    const topProjects = await this.getTopProjectsByDeployments(startDate, endDate, teamId);
    const avgDeployTime = await this.getAverageDeploymentTime(startDate, endDate, teamId);

    return {
      total,
      successful,
      failed,
      inProgress,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
      dailyTrend: dailyDeployments,
      topProjects,
      avgDeployTime
    };
  }

  async getBuildMetrics(startDate, endDate, teamId) {
    const whereClause = {
      createdAt: { [Op.between]: [startDate, endDate] }
    };

    if (teamId) {
      const teamProjects = await Project.findAll({
        where: { teamId },
        attributes: ['id']
      });
      whereClause.projectId = { [Op.in]: teamProjects.map(p => p.id) };
    }

    const [total, successful, failed, building] = await Promise.all([
      Build.count({ where: whereClause }),
      Build.count({ where: { ...whereClause, status: 'success' } }),
      Build.count({ where: { ...whereClause, status: 'failed' } }),
      Build.count({ where: { ...whereClause, status: 'building' } })
    ]);

    const avgBuildTime = await Build.findAll({
      where: { ...whereClause, status: 'success' },
      attributes: [
        [Build.sequelize.fn('AVG', Build.sequelize.col('duration')), 'avgDuration']
      ]
    });

    const buildTrends = await this.getDailyBuilds(startDate, endDate, teamId);

    return {
      total,
      successful,
      failed,
      building,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
      avgBuildTime: avgBuildTime[0]?.dataValues.avgDuration || 0,
      dailyTrend: buildTrends
    };
  }

  async getCostMetrics(startDate, endDate, teamId) {
    const whereClause = {
      createdAt: { [Op.between]: [startDate, endDate] }
    };

    if (teamId) {
      whereClause.teamId = teamId;
    }

    const totalCost = await BillingUsage.sum('amount', { where: whereClause });
    
    const costByService = await BillingUsage.findAll({
      where: whereClause,
      attributes: [
        'service',
        [BillingUsage.sequelize.fn('SUM', BillingUsage.sequelize.col('amount')), 'total']
      ],
      group: ['service'],
      order: [[BillingUsage.sequelize.literal('total'), 'DESC']]
    });

    const dailyCosts = await this.getDailyCosts(startDate, endDate, teamId);
    const forecast = await this.generateCostForecast(startDate, endDate, teamId);

    return {
      totalCost: totalCost || 0,
      costByService: costByService.map(item => ({
        service: item.service,
        amount: item.dataValues.total,
        percentage: totalCost > 0 ? (item.dataValues.total / totalCost * 100).toFixed(2) : 0
      })),
      dailyTrend: dailyCosts,
      forecast
    };
  }

  async getPerformanceMetrics(startDate, endDate, teamId) {
    const whereClause = {
      timestamp: { [Op.between]: [startDate, endDate] }
    };

    if (teamId) {
      whereClause.teamId = teamId;
    }

    const [avgResponseTime, avgCpuUsage, avgMemoryUsage, errorRate] = await Promise.all([
      Metric.findAll({
        where: { ...whereClause, metricName: 'response_time' },
        attributes: [[Metric.sequelize.fn('AVG', Metric.sequelize.col('value')), 'avg']]
      }),
      Metric.findAll({
        where: { ...whereClause, metricName: 'cpu_usage' },
        attributes: [[Metric.sequelize.fn('AVG', Metric.sequelize.col('value')), 'avg']]
      }),
      Metric.findAll({
        where: { ...whereClause, metricName: 'memory_usage' },
        attributes: [[Metric.sequelize.fn('AVG', Metric.sequelize.col('value')), 'avg']]
      }),
      this.calculateErrorRate(startDate, endDate, teamId)
    ]);

    const performanceTrends = await this.getPerformanceTrends(startDate, endDate, teamId);

    return {
      avgResponseTime: avgResponseTime[0]?.dataValues.avg || 0,
      avgCpuUsage: avgCpuUsage[0]?.dataValues.avg || 0,
      avgMemoryUsage: avgMemoryUsage[0]?.dataValues.avg || 0,
      errorRate,
      trends: performanceTrends
    };
  }

  async getSecurityMetrics(startDate, endDate, teamId) {
    const whereClause = {
      createdAt: { [Op.between]: [startDate, endDate] }
    };

    if (teamId) {
      whereClause.teamId = teamId;
    }

    const [totalEvents, criticalEvents, securityAlerts, complianceScore] = await Promise.all([
      AuditLog.count({ where: whereClause }),
      AuditLog.count({ where: { ...whereClause, severity: 'critical' } }),
      Alert.count({ where: { ...whereClause, type: 'security' } }),
      this.calculateComplianceScore(teamId)
    ]);

    const securityTrends = await this.getSecurityTrends(startDate, endDate, teamId);
    const topThreats = await this.getTopSecurityThreats(startDate, endDate, teamId);

    return {
      totalEvents,
      criticalEvents,
      securityAlerts,
      complianceScore,
      trends: securityTrends,
      topThreats
    };
  }

  async getUserActivityMetrics(startDate, endDate, teamId) {
    const whereClause = {
      lastLogin: { [Op.between]: [startDate, endDate] }
    };

    if (teamId) {
      const teamMembers = await Team.findByPk(teamId, {
        include: [{ model: User, attributes: ['id'] }]
      });
      if (teamMembers) {
        whereClause.id = { [Op.in]: teamMembers.Users.map(u => u.id) };
      }
    }

    const [activeUsers, totalLogins, newUsers] = await Promise.all([
      User.count({ where: whereClause }),
      AuditLog.count({
        where: {
          action: { [Op.in]: ['LOGIN', 'SAML_LOGIN', 'LDAP_LOGIN', 'WEBAUTHN_LOGIN'] },
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }),
      User.count({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          ...(teamId && { id: whereClause.id })
        }
      })
    ]);

    const activityTrends = await this.getUserActivityTrends(startDate, endDate, teamId);

    return {
      activeUsers,
      totalLogins,
      newUsers,
      trends: activityTrends
    };
  }

  async generateComplianceReport(teamId = null) {
    const [soc2Status, gdprStatus, hipaaStatus, pciStatus, iso27001Status] = await Promise.all([
      this.checkSOC2Compliance(teamId),
      this.checkGDPRCompliance(teamId),
      this.checkHIPAACompliance(teamId),
      this.checkPCICompliance(teamId),
      this.checkISO27001Compliance(teamId)
    ]);

    const overallScore = (
      soc2Status.score + gdprStatus.score + hipaaStatus.score + 
      pciStatus.score + iso27001Status.score
    ) / 5;

    return {
      overallScore: overallScore.toFixed(2),
      frameworks: {
        soc2: soc2Status,
        gdpr: gdprStatus,
        hipaa: hipaaStatus,
        pci: pciStatus,
        iso27001: iso27001Status
      },
      generatedAt: new Date(),
      recommendations: this.generateComplianceRecommendations([
        soc2Status, gdprStatus, hipaaStatus, pciStatus, iso27001Status
      ])
    };
  }

  async checkSOC2Compliance(teamId) {
    const controls = [
      { id: 'CC6.1', name: 'Logical Access Controls', weight: 20 },
      { id: 'CC6.2', name: 'Authentication', weight: 15 },
      { id: 'CC6.3', name: 'Authorization', weight: 15 },
      { id: 'CC7.1', name: 'System Boundaries', weight: 10 },
      { id: 'CC7.2', name: 'Data Classification', weight: 10 },
      { id: 'A1.1', name: 'Availability Monitoring', weight: 15 },
      { id: 'A1.2', name: 'Capacity Management', weight: 15 }
    ];

    let totalScore = 0;
    const results = [];

    for (const control of controls) {
      const score = await this.evaluateSOC2Control(control.id, teamId);
      totalScore += score * (control.weight / 100);
      results.push({
        ...control,
        score,
        status: score >= 80 ? 'compliant' : score >= 60 ? 'partial' : 'non-compliant'
      });
    }

    return {
      score: totalScore,
      status: totalScore >= 80 ? 'compliant' : totalScore >= 60 ? 'partial' : 'non-compliant',
      controls: results
    };
  }

  async checkGDPRCompliance(teamId) {
    const requirements = [
      { id: 'Art6', name: 'Lawful Basis', weight: 20 },
      { id: 'Art7', name: 'Consent', weight: 15 },
      { id: 'Art17', name: 'Right to Erasure', weight: 20 },
      { id: 'Art20', name: 'Data Portability', weight: 15 },
      { id: 'Art25', name: 'Data Protection by Design', weight: 15 },
      { id: 'Art32', name: 'Security of Processing', weight: 15 }
    ];

    let totalScore = 0;
    const results = [];

    for (const req of requirements) {
      const score = await this.evaluateGDPRRequirement(req.id, teamId);
      totalScore += score * (req.weight / 100);
      results.push({
        ...req,
        score,
        status: score >= 80 ? 'compliant' : score >= 60 ? 'partial' : 'non-compliant'
      });
    }

    return {
      score: totalScore,
      status: totalScore >= 80 ? 'compliant' : totalScore >= 60 ? 'partial' : 'non-compliant',
      requirements: results
    };
  }

  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '24h': return new Date(now - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
  }

  async getDailyDeployments(startDate, endDate, teamId) {
    const whereClause = {
      createdAt: { [Op.between]: [startDate, endDate] }
    };

    if (teamId) {
      const teamProjects = await Project.findAll({
        where: { teamId },
        attributes: ['id']
      });
      whereClause.projectId = { [Op.in]: teamProjects.map(p => p.id) };
    }

    return await Deployment.findAll({
      where: whereClause,
      attributes: [
        [Deployment.sequelize.fn('DATE', Deployment.sequelize.col('createdAt')), 'date'],
        [Deployment.sequelize.fn('COUNT', '*'), 'count'],
        [Deployment.sequelize.fn('SUM', 
          Deployment.sequelize.literal("CASE WHEN status = 'success' THEN 1 ELSE 0 END")
        ), 'successful']
      ],
      group: [Deployment.sequelize.fn('DATE', Deployment.sequelize.col('createdAt'))],
      order: [[Deployment.sequelize.fn('DATE', Deployment.sequelize.col('createdAt')), 'ASC']]
    });
  }

  clearCache() {
    this.metricsCache.clear();
  }
}

module.exports = new AnalyticsEngine();