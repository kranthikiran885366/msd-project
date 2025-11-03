const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const controller = new NotificationController();

// Get user notification preferences
router.get('/preferences', authenticate, controller.getPreferences);

// Update user notification preferences
router.patch('/preferences', authenticate, controller.updatePreferences);

// Send test notification
router.post('/test', authenticate, controller.sendTest);

// Update email address for notifications
router.patch('/email', authenticate, controller.updateEmail);

// Update phone number for SMS notifications
router.patch('/phone', authenticate, controller.updatePhone);

// Unsubscribe from email notifications (public)
router.post('/unsubscribe', controller.unsubscribe);

// Update quiet hours
router.patch('/quiet-hours', authenticate, controller.updateQuietHours);

// Get notification history (admin)
router.get('/history', authenticate, controller.getHistory);

// Send batch notifications (admin)
router.post('/batch', authenticate, controller.sendBatch);

// Get team notification preferences (project lead)
router.get('/team/:projectId', authenticate, controller.getTeamPreferences);

module.exports = router;
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

/**
 * Notification Routes
 * Manages user notification preferences and settings
 */

// Get user notification preferences
router.get('/preferences', authMiddleware, async (req, res, next) => {
  try {
    await notificationController.getPreferences(req, res);
  } catch (error) {
    next(error);
  }
});

// Update user notification preferences
router.patch('/preferences', authMiddleware, async (req, res, next) => {
  try {
    await notificationController.updatePreferences(req, res);
  } catch (error) {
    next(error);
  }
});

// Send test notification
router.post('/test', authMiddleware, async (req, res, next) => {
  try {
    await notificationController.sendTest(req, res);
  } catch (error) {
    next(error);
  }
});

// Update email address for notifications
router.patch('/email', authMiddleware, async (req, res, next) => {
  try {
    await notificationController.updateEmail(req, res);
  } catch (error) {
    next(error);
  }
});

// Update phone number for SMS notifications
router.patch('/phone', authMiddleware, async (req, res, next) => {
  try {
    await notificationController.updatePhone(req, res);
  } catch (error) {
    next(error);
  }
});

// Unsubscribe from email notifications
router.post('/unsubscribe', async (req, res, next) => {
  try {
    await notificationController.unsubscribe(req, res);
  } catch (error) {
    next(error);
  }
});

// Update quiet hours
router.patch('/quiet-hours', authMiddleware, async (req, res, next) => {
  try {
    await notificationController.updateQuietHours(req, res);
  } catch (error) {
    next(error);
  }
});

// Get notification history (admin)
router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    // Add admin check middleware here
    await notificationController.getHistory(req, res);
  } catch (error) {
    next(error);
  }
});

// Send batch notifications (admin)
router.post('/batch', authMiddleware, async (req, res, next) => {
  try {
    // Add admin check middleware here
    await notificationController.sendBatch(req, res);
  } catch (error) {
    next(error);
  }
});

// Get team notification preferences (project lead)
router.get('/team/:projectId', authMiddleware, async (req, res, next) => {
  try {
    await notificationController.getTeamPreferences(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
