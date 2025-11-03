const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Dashboard
router.get('/dashboard', authMiddleware, requireRole(['admin']), adminController.getDashboard);

// Settings
router.get('/settings', authMiddleware, requireRole(['admin']), adminController.getAdminSettings);
router.put('/settings', authMiddleware, requireRole(['admin']), adminController.updateAdminSettings);

// Users & Team Management
router.get('/users', authMiddleware, requireRole(['admin']), adminController.getUsers);
router.get('/team', authMiddleware, requireRole(['admin']), adminController.getTeamMembers);
router.post('/team/invite', authMiddleware, requireRole(['admin']), adminController.inviteTeamMember);
router.delete('/team/:userId', authMiddleware, requireRole(['admin']), adminController.removeTeamMember);

// Analytics
router.get('/analytics/cost', authMiddleware, requireRole(['admin']), adminController.getCostAnalytics);
router.get('/analytics/performance', authMiddleware, requireRole(['admin']), adminController.getPerformanceAnalytics);
router.get('/analytics/security', authMiddleware, requireRole(['admin']), adminController.getSecurityAnalytics);
router.get('/analytics/compliance', authMiddleware, requireRole(['admin']), adminController.getComplianceAnalytics);

// Monitoring
router.get('/monitoring/health', authMiddleware, requireRole(['admin']), adminController.getSystemHealth);
router.get('/monitoring/services', authMiddleware, requireRole(['admin']), adminController.getServiceStatus);
router.get('/monitoring/alerts', authMiddleware, requireRole(['admin']), adminController.getSystemAlerts);
router.get('/monitoring/incidents', authMiddleware, requireRole(['admin']), adminController.getIncidents);
router.get('/monitoring/performance', authMiddleware, requireRole(['admin']), adminController.getPerformanceMetrics);

// System Info
router.get('/system', authMiddleware, requireRole(['admin']), adminController.getSystemInfo);

// API Management
router.get('/api/stats', authMiddleware, requireRole(['admin']), adminController.getApiStats);
router.get('/api/tokens', authMiddleware, requireRole(['admin']), adminController.getApiTokens);
router.post('/api/tokens', authMiddleware, requireRole(['admin']), adminController.createApiToken);
router.delete('/api/tokens/:tokenId', authMiddleware, requireRole(['admin']), adminController.revokeApiToken);

// Audit Logs
router.get('/audit', authMiddleware, requireRole(['admin']), adminController.getAuditLogs);

// CI/CD Management
router.get('/cicd/stats', authMiddleware, requireRole(['admin']), adminController.getCicdStats);
router.get('/cicd/pipelines', authMiddleware, requireRole(['admin']), adminController.getCicdPipelines);
router.get('/cicd/deployments', authMiddleware, requireRole(['admin']), adminController.getCicdDeployments);

// Auth Management
router.get('/auth/stats', authMiddleware, requireRole(['admin']), adminController.getAuthStats);
router.get('/auth/sessions', authMiddleware, requireRole(['admin']), adminController.getAuthSessions);
router.delete('/auth/sessions/:sessionId', authMiddleware, requireRole(['admin']), adminController.revokeAuthSession);

// Cost Management
router.get('/costs', authMiddleware, requireRole(['admin']), adminController.getCostManagement);
router.get('/costs/optimizations', authMiddleware, requireRole(['admin']), adminController.getCostOptimizations);
router.get('/costs/budgets', authMiddleware, requireRole(['admin']), adminController.getCostBudgets);

// Performance Management
router.get('/performance', authMiddleware, requireRole(['admin']), adminController.getPerformanceManagement);
router.get('/performance/optimizations', authMiddleware, requireRole(['admin']), adminController.getPerformanceOptimizations);

// Security Management
router.get('/security', authMiddleware, requireRole(['admin']), adminController.getSecurityManagement);
router.get('/security/vulnerabilities', authMiddleware, requireRole(['admin']), adminController.getSecurityVulnerabilities);
router.get('/security/policies', authMiddleware, requireRole(['admin']), adminController.getSecurityPolicies);

// Compliance Management
router.get('/compliance', authMiddleware, requireRole(['admin']), adminController.getComplianceManagement);
router.get('/compliance/reports', authMiddleware, requireRole(['admin']), adminController.getComplianceReports);
router.post('/compliance/reports/:type', authMiddleware, requireRole(['admin']), adminController.generateComplianceReport);

module.exports = router;