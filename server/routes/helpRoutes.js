const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/articles', helpController.getHelpArticles);
router.get('/articles/:id', helpController.getHelpArticle);
router.get('/search', helpController.searchHelpContent);
router.get('/faqs', helpController.getFAQs);
router.get('/tutorials', helpController.getTutorials);

// Protected routes
router.use(authenticate);
router.post('/support', helpController.submitSupportRequest);

module.exports = router;