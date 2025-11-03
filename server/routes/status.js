const express = require('express');
const router = express.Router();
const StatusController = require('../controllers/statusController');

const controller = new StatusController();

router.get('/', controller.getSystemStatus);
router.get('/health', controller.getHealthCheck);

module.exports = router;