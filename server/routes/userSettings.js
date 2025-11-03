const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const UserSettingsService = require("../services/userSettingsService")
const { validateRequest } = require("../middleware/validation")

// Get all user settings
router.get("/", auth, async (req, res, next) => {
  try {
    const settings = await UserSettingsService.getUserSettings(req.user.id)
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Update general settings
router.patch("/general", auth, async (req, res, next) => {
  try {
    const settings = await UserSettingsService.updateGeneralSettings(req.user.id, req.body)
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Update deployment settings
router.patch("/deployment", auth, async (req, res, next) => {
  try {
    const settings = await UserSettingsService.updateDeploymentSettings(req.user.id, req.body)
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Update notification settings
router.patch("/notifications", auth, async (req, res, next) => {
  try {
    const settings = await UserSettingsService.updateNotificationSettings(req.user.id, req.body)
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Update security settings
router.patch("/security", auth, async (req, res, next) => {
  try {
    const settings = await UserSettingsService.updateSecuritySettings(req.user.id, req.body)
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Update profile settings
router.patch("/profile", auth, async (req, res, next) => {
  try {
    const settings = await UserSettingsService.updateProfileSettings(req.user.id, req.body)
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Update appearance settings
router.patch("/appearance", auth, async (req, res, next) => {
  try {
    const settings = await UserSettingsService.updateAppearanceSettings(req.user.id, req.body)
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Update integration settings
router.patch("/integrations/:integration", auth, async (req, res, next) => {
  try {
    const settings = await UserSettingsService.updateIntegrationSettings(
      req.user.id,
      req.params.integration,
      req.body
    )
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Delete account
router.delete("/account", auth, async (req, res, next) => {
  try {
    await UserSettingsService.deleteAccount(req.user.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

module.exports = router