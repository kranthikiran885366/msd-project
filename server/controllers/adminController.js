const adminService = require('../services/adminService');
const analyticsService = require('../services/analyticsService');
const monitoringService = require('../services/monitoringService');
const teamService = require('../services/teamService');
const { successResponse, errorResponse } = require('../utils/response');

const adminController = {
  // Dashboard
  async getDashboard(req, res, next) {
    try {
      const dashboard = await adminService.getDashboardData();
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  },

  // Settings
  async getAdminSettings(req, res, next) {
    try {
      const settings = await adminService.getSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  },

  async updateAdminSettings(req, res, next) {
    try {
      const settings = await adminService.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      next(error);
    }
  },

  // Users & Team Management
  async getUsers(req, res, next) {
    try {
      const users = await adminService.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  async getTeamMembers(req, res, next) {
    try {
      const members = await teamService.getTeamMembers();
      res.json(members);
    } catch (error) {
      next(error);
    }
  },

  async inviteTeamMember(req, res, next) {
    try {
      const invitation = await teamService.inviteUser(req.body);
      res.json(invitation);
    } catch (error) {
      next(error);
    }
  },

  async removeTeamMember(req, res, next) {
    try {
      const { userId } = req.params;
      await teamService.removeUser(userId);
      res.json({ message: 'User removed successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Analytics
  async getCostAnalytics(req, res, next) {
    try {
      const { timeRange = '30' } = req.query;
      const analytics = await analyticsService.getCostAnalytics(timeRange);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  },

  async getPerformanceAnalytics(req, res, next) {
    try {
      const { timeRange = '30' } = req.query;
      const analytics = await analyticsService.getPerformanceAnalytics(timeRange);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  },

  async getSecurityAnalytics(req, res, next) {
    try {
      const analytics = await adminService.getSecurityAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  },

  async getComplianceAnalytics(req, res, next) {
    try {
      const analytics = await adminService.getComplianceAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  },

  // Monitoring
  async getSystemHealth(req, res, next) {
    try {
      const health = await monitoringService.getSystemHealth();
      res.json(health);
    } catch (error) {
      next(error);
    }
  },

  async getServiceStatus(req, res, next) {
    try {
      const services = await monitoringService.getServiceStatus();
      res.json(services);
    } catch (error) {
      next(error);
    }
  },

  async getSystemAlerts(req, res, next) {
    try {
      const alerts = await monitoringService.getSystemAlerts();
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  },

  async getIncidents(req, res, next) {
    try {
      const incidents = await monitoringService.getIncidents();
      res.json(incidents);
    } catch (error) {
      next(error);
    }
  },

  async getPerformanceMetrics(req, res, next) {
    try {
      const { timeRange = '24' } = req.query;
      const metrics = await monitoringService.getPerformanceMetrics(timeRange);
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  },

  // System Info
  async getSystemInfo(req, res, next) {
    try {
      const info = await adminService.getSystemInfo();
      res.json(info);
    } catch (error) {
      next(error);
    }
  },

  // API Management
  async getApiStats(req, res, next) {
    try {
      const stats = await adminService.getApiStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  async getApiTokens(req, res, next) {
    try {
      const tokens = await adminService.getApiTokens();
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  },

  async createApiToken(req, res, next) {
    try {
      const token = await adminService.createApiToken(req.body);
      res.json(token);
    } catch (error) {
      next(error);
    }
  },

  async revokeApiToken(req, res, next) {
    try {
      const { tokenId } = req.params;
      await adminService.revokeApiToken(tokenId);
      res.json({ message: 'Token revoked successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Audit Logs
  async getAuditLogs(req, res, next) {
    try {
      const { page = 1, limit = 50, userId, action } = req.query;
      const logs = await adminService.getAuditLogs({ page, limit, userId, action });
      res.json(logs);
    } catch (error) {
      next(error);
    }
  },

  // CI/CD Management
  async getCicdStats(req, res, next) {
    try {
      const stats = await adminService.getCicdStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  async getCicdPipelines(req, res, next) {
    try {
      const pipelines = await adminService.getCicdPipelines();
      res.json(pipelines);
    } catch (error) {
      next(error);
    }
  },

  async getCicdDeployments(req, res, next) {
    try {
      const deployments = await adminService.getCicdDeployments();
      res.json(deployments);
    } catch (error) {
      next(error);
    }
  },

  // Auth Management
  async getAuthStats(req, res, next) {
    try {
      const stats = await adminService.getAuthStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  async getAuthSessions(req, res, next) {
    try {
      const sessions = await adminService.getAuthSessions();
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  },

  async revokeAuthSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      await adminService.revokeAuthSession(sessionId);
      res.json({ message: 'Session revoked successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Cost Management
  async getCostManagement(req, res, next) {
    try {
      const costs = await adminService.getCostManagement();
      res.json(costs);
    } catch (error) {
      next(error);
    }
  },

  async getCostOptimizations(req, res, next) {
    try {
      const optimizations = await adminService.getCostOptimizations();
      res.json(optimizations);
    } catch (error) {
      next(error);
    }
  },

  async getCostBudgets(req, res, next) {
    try {
      const budgets = await adminService.getCostBudgets();
      res.json(budgets);
    } catch (error) {
      next(error);
    }
  },

  // Performance Management
  async getPerformanceManagement(req, res, next) {
    try {
      const performance = await adminService.getPerformanceManagement();
      res.json(performance);
    } catch (error) {
      next(error);
    }
  },

  async getPerformanceOptimizations(req, res, next) {
    try {
      const optimizations = await adminService.getPerformanceOptimizations();
      res.json(optimizations);
    } catch (error) {
      next(error);
    }
  },

  // Security Management
  async getSecurityManagement(req, res, next) {
    try {
      const security = await adminService.getSecurityManagement();
      res.json(security);
    } catch (error) {
      next(error);
    }
  },

  async getSecurityVulnerabilities(req, res, next) {
    try {
      const vulnerabilities = await adminService.getSecurityVulnerabilities();
      res.json(vulnerabilities);
    } catch (error) {
      next(error);
    }
  },

  async getSecurityPolicies(req, res, next) {
    try {
      const policies = await adminService.getSecurityPolicies();
      res.json(policies);
    } catch (error) {
      next(error);
    }
  },

  // Compliance Management
  async getComplianceManagement(req, res, next) {
    try {
      const compliance = await adminService.getComplianceManagement();
      res.json(compliance);
    } catch (error) {
      next(error);
    }
  },

  async getComplianceReports(req, res, next) {
    try {
      const reports = await adminService.getComplianceReports();
      res.json(reports);
    } catch (error) {
      next(error);
    }
  },

  async generateComplianceReport(req, res, next) {
    try {
      const { type } = req.params;
      const report = await adminService.generateComplianceReport(type);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;