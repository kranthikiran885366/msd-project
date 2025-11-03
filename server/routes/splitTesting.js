const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const splitTestingController = require('../controllers/splitTestingController');

router.get('/', checkAuth, splitTestingController.getAllTests);
router.post('/', checkAuth, splitTestingController.createTest);
router.get('/:id', checkAuth, splitTestingController.getTest);
router.put('/:id', checkAuth, splitTestingController.updateTest);
router.delete('/:id', checkAuth, splitTestingController.deleteTest);
router.post('/:id/metrics', checkAuth, splitTestingController.recordMetrics);

module.exports = router;