const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');
const userSettingsRoutes = require('./userSettingsRoutes');

// User-specific settings
router.use('/user', userSettingsRoutes);

// Environment variables
router.post('/env-vars', authMiddleware, settingsController.createEnvVar);
router.get('/env-vars', authMiddleware, settingsController.listEnvVars);
router.get('/env-vars/:varId', authMiddleware, settingsController.getEnvVar);
router.patch('/env-vars/:varId', authMiddleware, settingsController.updateEnvVar);
router.delete('/env-vars/:varId', authMiddleware, settingsController.deleteEnvVar);

// Domains
router.post("/domains", authMiddleware, settingsController.addDomain)
router.get("/domains", authMiddleware, settingsController.listDomains)
router.get("/domains/:domainId", authMiddleware, settingsController.getDomain)
router.patch("/domains/:domainId", authMiddleware, settingsController.updateDomain)
router.delete("/domains/:domainId", authMiddleware, settingsController.deleteDomain)

// Build settings
router.get("/build", authMiddleware, settingsController.getBuildSettings)
router.patch("/build", authMiddleware, settingsController.updateBuildSettings)

// General settings
router.get("/", authMiddleware, settingsController.getSettings)
router.patch("/", authMiddleware, settingsController.updateSettings)

// Bulk operations
router.post("/env-vars/bulk", authMiddleware, settingsController.bulkCreateEnvVars)

// Export
router.get("/export/:projectId", authMiddleware, settingsController.exportSettings)

module.exports = router
