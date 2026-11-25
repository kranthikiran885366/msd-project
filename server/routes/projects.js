'use strict';
// Project Routes
const express = require('express');
const router  = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware    = require('../middleware/auth');
const projectConfigRoutes = require('./projectConfig');
const { authorizeProject } = require('../middleware/resourceOwnership');

// ── Standard project CRUD ─────────────────────────────────────────────────────
router.post('/',              authMiddleware, authorizeProject, projectController.createProject);
router.get('/',               authMiddleware, authorizeProject, projectController.getProjects);
router.get('/:id/health',     authMiddleware, authorizeProject, projectController.getProjectHealth);
router.get('/:id/stats',      authMiddleware, authorizeProject, projectController.getProjectStats);
router.get('/:id',            authMiddleware, authorizeProject, projectController.getProjectById);
router.patch('/:id/settings', authMiddleware, authorizeProject, projectController.updateProjectSettings);
router.patch('/:id',          authMiddleware, authorizeProject, projectController.updateProject);
router.delete('/:id',         authMiddleware, authorizeProject, projectController.deleteProject);

// ── Config & env var routes (mounted with mergeParams so :id is available) ────
router.use('/:id', authMiddleware, authorizeProject, projectConfigRoutes);

module.exports = router;
