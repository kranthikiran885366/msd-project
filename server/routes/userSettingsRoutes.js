const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const UserSettingsService = require('../services/userSettingsService');
const { validateUpdateSettings } = require('../middleware/validation');

// Profile settings endpoints
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const settings = await UserSettingsService.getUserSettings(req.user.id);
    res.json(settings.profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/profile', authMiddleware, validateUpdateSettings, async (req, res) => {
  try {
    const settings = await UserSettingsService.updateProfileSettings(req.user.id, req.body);
    res.json(settings.profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Appearance settings endpoints
router.get('/appearance', authMiddleware, async (req, res) => {
  try {
    const settings = await UserSettingsService.getUserSettings(req.user.id);
    res.json(settings.appearance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/appearance', authMiddleware, validateUpdateSettings, async (req, res) => {
  try {
    const settings = await UserSettingsService.updateAppearanceSettings(req.user.id, req.body);
    res.json(settings.appearance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security settings endpoints
router.get('/security', authMiddleware, async (req, res) => {
  try {
    const settings = await UserSettingsService.getUserSettings(req.user.id);
    res.json(settings.security);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/security', authMiddleware, validateUpdateSettings, async (req, res) => {
  try {
    const settings = await UserSettingsService.updateSecuritySettings(req.user.id, req.body);
    res.json(settings.security);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notification settings endpoints
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const settings = await UserSettingsService.getUserSettings(req.user.id);
    res.json(settings.notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/notifications', authMiddleware, validateUpdateSettings, async (req, res) => {
  try {
    const settings = await UserSettingsService.updateNotificationSettings(req.user.id, req.body);
    res.json(settings.notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Account deletion
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    await UserSettingsService.deleteAccount(req.user.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;