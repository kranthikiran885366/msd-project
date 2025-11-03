const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, reportController.generateReport);
router.get('/project/:projectId', authMiddleware, reportController.getReports);
router.get('/:id', authMiddleware, reportController.getReportById);
router.get('/:id/export', authMiddleware, reportController.exportReport);
router.delete('/:id', authMiddleware, reportController.deleteReport);

module.exports = router;