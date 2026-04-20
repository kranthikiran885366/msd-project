'use strict';
// Project Routes
const express = require('express');
const router  = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware    = require('../middleware/auth');
const projectConfigRoutes = require('./projectConfig');

// ── Standard project CRUD ─────────────────────────────────────────────────────
router.post('/',              authMiddleware, projectController.createProject);
router.get('/',               authMiddleware, projectController.getProjects);
router.get('/:id/health',     authMiddleware, projectController.getProjectHealth);
router.get('/:id/stats',      authMiddleware, projectController.getProjectStats);
router.get('/:id',            authMiddleware, projectController.getProjectById);
router.patch('/:id/settings', authMiddleware, projectController.updateProjectSettings);
router.patch('/:id',          authMiddleware, projectController.updateProject);
router.delete('/:id',         authMiddleware, projectController.deleteProject);

// ── Config & env var routes (mounted with mergeParams so :id is available) ────
router.use('/:id', projectConfigRoutes);

module.exports = router;
