const express = require('express');
const router = express.Router();
const EdgeHandlerController = require('../controllers/edgeHandlerController');
const authMiddleware = require('../middleware/auth');

const controller = new EdgeHandlerController();

// List all edge handlers
router.get('/', authMiddleware, controller.listHandlers);

// Get a specific edge handler
router.get('/:id', authMiddleware, controller.getHandler);

// Create a new edge handler
router.post('/', authMiddleware, controller.createHandler);

// Update an edge handler
router.put('/:id', authMiddleware, controller.updateHandler);

// Delete an edge handler
router.delete('/:id', authMiddleware, controller.deleteHandler);

// Deploy an edge handler
router.post('/:id/deploy', authMiddleware, controller.deployHandler);

// Test an edge handler
router.post('/:id/test', authMiddleware, controller.testHandler);

module.exports = router;