/**
 * Compliance Controller
 * Handles compliance reporting and audit endpoints
 */

const ComplianceAuditService = require('../services/compliance/auditService');
const { successResponse, errorResponse } = require('../utils/response');

class ComplianceController {
  constructor() {
    this.auditService = new ComplianceAuditService();
  }

  /**
   * Generate SOC2 compliance report
   */
  async generateSOC2Report(req, res) {
    try {
      const { month, year } = req.query;
      
      if (!month || !year) {
        return errorResponse(res, 'Month and year parameters are required', 400);
      }

      const report = await this.auditService.generateSOC2Report(
        parseInt(month), 
        parseInt(year)
      );

      return successResponse(res, report, 'SOC2 report generated successfully');
    } catch (error) {
      console.error('SOC2 report generation error:', error);
      return errorResponse(res, 'Failed to generate SOC2 report', 500);
    }
  }

  /**
   * Check HIPAA compliance status
   */
  async checkHIPAACompliance(req, res) {
    try {
      const compliance = await this.auditService.checkHIPAACompliance();
      return successResponse(res, compliance, 'HIPAA compliance check completed');
    } catch (error) {
      console.error('HIPAA compliance check error:', error);
      return errorResponse(res, 'Failed to check HIPAA compliance', 500);
    }
  }

  /**
   * Check PCI-DSS compliance status
   */
  async checkPCIDSSCompliance(req, res) {
    try {
      const compliance = await this.auditService.checkPCIDSSCompliance();
      return successResponse(res, compliance, 'PCI-DSS compliance check completed');
    } catch (error) {
      console.error('PCI-DSS compliance check error:', error);
      return errorResponse(res, 'Failed to check PCI-DSS compliance', 500);
    }
  }

  /**
   * Initiate GDPR data deletion
   */
  async initiateGDPRDeletion(req, res) {
    try {
      const { userId } = req.params;
      
      // Verify user can request deletion (self or admin)
      if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return errorResponse(res, 'Unauthorized to request deletion for this user', 403);
      }

      const result = await this.auditService.initiateGDPRDeletion(parseInt(userId));
      
      // Log the audit event
      await this.auditService.logAuditEvent(
        req.user.id,
        'gdpr_deletion_requested',
        'user',
        userId,
        { requestedBy: req.user.id },
        req.ip,
        req.get('User-Agent')
      );

      return successResponse(res, result, 'GDPR deletion request initiated');
    } catch (error) {
      console.error('GDPR deletion initiation error:', error);
      return errorResponse(res, 'Failed to initiate GDPR deletion', 500);
    }
  }

  /**
   * Get audit logs (admin only)
   */
  async getAuditLogs(req, res) {
    try {
      const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
      
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (userId) {
        query += ` AND user_id = $${++paramCount}`;
        params.push(userId);
      }

      if (action) {
        query += ` AND action = $${++paramCount}`;
        params.push(action);
      }

      if (startDate) {
        query += ` AND created_at >= $${++paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND created_at <= $${++paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, (page - 1) * limit);

      const postgres = require('../db/postgres');
      const result = await postgres.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM audit_logs WHERE 1=1';
      const countParams = params.slice(0, -2); // Remove limit and offset

      if (userId) countQuery += ' AND user_id = $1';
      if (action) countQuery += ` AND action = $${userId ? 2 : 1}`;
      if (startDate) countQuery += ` AND created_at >= $${countParams.length + 1}`;
      if (endDate) countQuery += ` AND created_at <= $${countParams.length + 1}`;

      const countResult = await postgres.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      return successResponse(res, {
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }, 'Audit logs retrieved successfully');
    } catch (error) {
      console.error('Audit logs retrieval error:', error);
      return errorResponse(res, 'Failed to retrieve audit logs', 500);
    }
  }

  /**
   * Log custom audit event
   */
  async logAuditEvent(req, res) {
    try {
      const { action, resourceType, resourceId, changes } = req.body;

      if (!action || !resourceType) {
        return errorResponse(res, 'Action and resourceType are required', 400);
      }

      const auditLog = await this.auditService.logAuditEvent(
        req.user.id,
        action,
        resourceType,
        resourceId,
        changes || {},
        req.ip,
        req.get('User-Agent')
      );

      return successResponse(res, auditLog, 'Audit event logged successfully');
    } catch (error) {
      console.error('Audit event logging error:', error);
      return errorResponse(res, 'Failed to log audit event', 500);
    }
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(req, res) {
    try {
      const postgres = require('../db/postgres');
      
      // Get recent audit activity
      const recentAudits = await postgres.query(
        'SELECT action, COUNT(*) as count FROM audit_logs WHERE created_at >= NOW() - INTERVAL \'7 days\' GROUP BY action ORDER BY count DESC LIMIT 10'
      );

      // Get security incidents
      const securityIncidents = await postgres.query(
        'SELECT severity, COUNT(*) as count FROM security_incidents WHERE status != \'closed\' GROUP BY severity'
      );

      // Get system alerts
      const systemAlerts = await postgres.query(
        'SELECT severity, COUNT(*) as count FROM system_alerts WHERE acknowledged = false GROUP BY severity'
      );

      // Get GDPR deletion requests
      const gdprRequests = await postgres.query(
        'SELECT status, COUNT(*) as count FROM gdpr_deletion_requests GROUP BY status'
      );

      const dashboard = {
        recentAuditActivity: recentAudits.rows,
        securityIncidents: securityIncidents.rows,
        systemAlerts: systemAlerts.rows,
        gdprRequests: gdprRequests.rows,
        lastUpdated: new Date()
      };

      return successResponse(res, dashboard, 'Compliance dashboard data retrieved');
    } catch (error) {
      console.error('Compliance dashboard error:', error);
      return errorResponse(res, 'Failed to retrieve compliance dashboard', 500);
    }
  }
}

module.exports = new ComplianceController();