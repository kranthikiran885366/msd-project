const notificationService = require('../services/notificationService')

class NotificationController {
  async getPreferences(req, res) {
    try {
      const { userId } = req
      const prefs = await notificationService.getPreferences(userId)
      res.json(prefs || {})
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  async updatePreferences(req, res) {
    try {
      const { userId } = req
      const prefs = await notificationService.updatePreferences(userId, req.body)
      res.json(prefs)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  async sendTest(req, res) {
    try {
      const { userId } = req
      const { type = 'alert_triggered' } = req.body
      await notificationService.sendNotification(userId, type, { alertName: 'Test Alert', resource: 'Test' })
      res.json({ message: 'Test notification queued' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

module.exports = new NotificationController()
const BaseController = require('./BaseController');
const notificationService = require('../services/notificationService');
const NotificationPreference = require('../models/NotificationPreference');
const AuditLog = require('../models/AuditLog');

class NotificationController extends BaseController {
  constructor() {
    super();
    BaseController.bindMethods(this);
  }
  /**
   * Get notification preferences for user
   */
  async getPreferences(req, res) {
    try {
      const { userId } = req;
      const { projectId } = req.query;

      const preferences = await notificationService.getPreferences(userId, projectId);

      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(req, res) {
    try {
      const { userId } = req;
      const { projectId } = req.query;
      const { channels, notificationTypes, frequency, quiet, preferences: prefs } = req.body;

      const updates = {};
      if (channels) updates.channels = channels;
      if (notificationTypes) updates.notificationTypes = notificationTypes;
      if (frequency) updates.frequency = frequency;
      if (quiet) updates.quiet = quiet;
      if (prefs) updates.preferences = prefs;

      const updated = await notificationService.updatePreferences(userId, updates, projectId);

      await AuditLog.create({
        userId,
        action: 'NOTIFICATION_PREFERENCES_UPDATED',
        resourceType: 'NotificationPreference',
        metadata: { projectId, changes: Object.keys(updates) }
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Send test notification
   */
  async sendTest(req, res) {
    try {
      const { userId } = req;
      const { type = 'alert_triggered', channel = 'email' } = req.body;

      const testData = {
        alert_triggered: { alertName: 'Test Alert', resource: 'Test Resource', severity: 'info' },
        deployment_success: { projectName: 'Test Project', environment: 'staging', duration: '2m 45s' },
        build_failure: { projectName: 'Test Project', error: 'Test build error' },
        team_invitation: { teamName: 'Test Team', invitedBy: 'Test User', role: 'Developer' },
        billing_invoice: { amount: '99.99', period: 'November 2025' }
      };

      const data = testData[type] || testData.alert_triggered;

      if (channel === 'email') {
        const user = await require('../models/User').findById(userId);
        await notificationService.sendEmail(user.email, type, data);
      } else {
        await notificationService.sendNotification(userId, type, data);
      }

      res.json({ message: `Test ${type} notification sent to ${channel}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update email address
   */
  async updateEmail(req, res) {
    try {
      const { userId } = req;
      const { emailAddress } = req.body;

      if (!emailAddress || !emailAddress.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      const updated = await notificationService.updatePreferences(userId, { emailAddress });

      res.json({ message: 'Email address updated', emailAddress: updated.emailAddress });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update phone number
   */
  async updatePhone(req, res) {
    try {
      const { userId } = req;
      const { phoneNumber } = req.body;

      if (!phoneNumber || !phoneNumber.match(/^\+?[\d\s\-()]+$/)) {
        return res.status(400).json({ error: 'Invalid phone number' });
      }

      const updated = await notificationService.updatePreferences(userId, { phoneNumber });

      res.json({ message: 'Phone number updated', phoneNumber: updated.phoneNumber });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Unsubscribe token required' });
      }

      const preference = await NotificationPreference.findOne({ unsubscribeToken: token });

      if (!preference) {
        return res.status(404).json({ error: 'Invalid unsubscribe token' });
      }

      preference.channels.email = false;
      await preference.save();

      res.json({ message: 'Successfully unsubscribed from email notifications' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get notification history (admin only)
   */
  async getHistory(req, res) {
    try {
      const { userId, page = 1, limit = 50 } = req.query;

      const auditLogs = await AuditLog.find({
        action: { $regex: 'NOTIFICATION' }
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await AuditLog.countDocuments({
        action: { $regex: 'NOTIFICATION' }
      });

      res.json({
        logs: auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Batch send notifications (admin only)
   */
  async sendBatch(req, res) {
    try {
      const { userIds, type, data } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'User IDs array required' });
      }

      if (!type) {
        return res.status(400).json({ error: 'Notification type required' });
      }

      const result = await notificationService.sendBulkNotifications(userIds, type, data);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get notification preferences for a project (team lead)
   */
  async getTeamPreferences(req, res) {
    try {
      const { projectId } = req.params;
      const { userId } = req;

      const preferences = await NotificationPreference.find({ projectId })
        .select('-phoneNumber -emailAddress')
        .lean();

      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update quiet hours
   */
  async updateQuietHours(req, res) {
    try {
      const { userId } = req;
      const { enabled, startTime, endTime } = req.body;

      const updates = {
        quiet: {
          enabled,
          startTime,
          endTime
        }
      };

      const updated = await notificationService.updatePreferences(userId, updates);

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new NotificationController();
