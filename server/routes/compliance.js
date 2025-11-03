/**
 * Compliance Routes
 * SOC2, GDPR, HIPAA, PCI-DSS compliance endpoints
 */

const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All compliance routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/compliance/dashboard
 * @desc Get compliance dashboard overview
 * @access Admin only
 */
router.get('/dashboard', 
  requireRole(['admin']), 
  complianceController.getComplianceDashboard
);

/**
 * @route GET /api/compliance/soc2/report
 * @desc Generate SOC2 compliance report
 * @access Admin only
 * @query month - Report month (1-12)
 * @query year - Report year (YYYY)
 */
router.get('/soc2/report', 
  requireRole(['admin']), 
  complianceController.generateSOC2Report
);

/**
 * @route GET /api/compliance/hipaa/check
 * @desc Check HIPAA compliance status
 * @access Admin only
 */
router.get('/hipaa/check', 
  requireRole(['admin']), 
  complianceController.checkHIPAACompliance
);

/**
 * @route GET /api/compliance/pci-dss/check
 * @desc Check PCI-DSS compliance status
 * @access Admin only
 */
router.get('/pci-dss/check', 
  requireRole(['admin']), 
  complianceController.checkPCIDSSCompliance
);

/**
 * @route POST /api/compliance/gdpr/deletion/:userId
 * @desc Initiate GDPR data deletion request
 * @access User (self) or Admin
 */
router.post('/gdpr/deletion/:userId', 
  complianceController.initiateGDPRDeletion
);

/**
 * @route GET /api/compliance/audit-logs
 * @desc Get audit logs with filtering
 * @access Admin only
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 50)
 * @query userId - Filter by user ID
 * @query action - Filter by action type
 * @query startDate - Filter from date (ISO string)
 * @query endDate - Filter to date (ISO string)
 */
router.get('/audit-logs', 
  requireRole(['admin']), 
  complianceController.getAuditLogs
);

/**
 * @route POST /api/compliance/audit-logs
 * @desc Log custom audit event
 * @access Authenticated users
 * @body action - Action performed
 * @body resourceType - Type of resource affected
 * @body resourceId - ID of resource (optional)
 * @body changes - Changes made (optional)
 */
router.post('/audit-logs', 
  complianceController.logAuditEvent
);

module.exports = router;