const express = require('express');
const router = express.Router();
const multiRegionController = require('../controllers/multiRegionController');
const { authenticate } = require('../middleware/auth');

// List all regions
router.get('/regions', authenticate, multiRegionController.listRegions);

// Create a new region
router.post('/regions', authenticate, multiRegionController.createRegion);

// Toggle region status
router.post('/regions/:id/toggle', authenticate, multiRegionController.toggleRegion);

// Update traffic distribution
router.put('/traffic/:id', authenticate, multiRegionController.updateTrafficDistribution);

// Deploy to region
router.post('/deploy', authenticate, multiRegionController.deployToRegion);

// Get health checks
router.get('/health', authenticate, multiRegionController.getHealthChecks);

module.exports = router;