const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middleware/auth');

// Integration management
router.get('/', authMiddleware, integrationController.getIntegrations);
router.post('/', authMiddleware, integrationController.createIntegration);
router.get('/:id', authMiddleware, integrationController.getIntegration);
router.put('/:id', authMiddleware, integrationController.updateIntegration);
router.delete('/:id', authMiddleware, integrationController.deleteIntegration);

// Specific integrations
router.post('/datadog', authMiddleware, integrationController.connectDatadog);
router.post('/grafana', authMiddleware, integrationController.connectGrafana);
router.post('/newrelic', authMiddleware, integrationController.connectNewRelic);
router.post('/prometheus', authMiddleware, integrationController.connectPrometheus);

module.exports = router;