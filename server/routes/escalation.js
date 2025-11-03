const express = require('express');
const router = express.Router();
const escalationController = require('../controllers/escalationController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, escalationController.createEscalationPolicy);
router.get('/project/:projectId', authMiddleware, escalationController.getEscalationPolicies);
router.get('/project/:projectId/teams', authMiddleware, escalationController.getAvailableTeams);
router.get('/project/:projectId/stats', authMiddleware, escalationController.getEscalationStats);
router.get('/:id', authMiddleware, escalationController.getEscalationPolicyById);
router.put('/:id', authMiddleware, escalationController.updateEscalationPolicy);
router.delete('/:id', authMiddleware, escalationController.deleteEscalationPolicy);
router.patch('/:id/toggle', authMiddleware, escalationController.toggleEscalationPolicy);
router.post('/:id/test', authMiddleware, escalationController.testEscalationPolicy);

module.exports = router;