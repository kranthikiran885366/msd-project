const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');

router.get('/', helpController.getHelpArticles);
router.get('/:id', helpController.getHelpArticle);

module.exports = router;