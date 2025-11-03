const helpService = require('../services/helpService');

const helpController = {
  async getHelpArticles(req, res, next) {
    try {
      const { category } = req.query;
      const articles = await helpService.getAllArticles(category);
      res.json(articles);
    } catch (error) {
      next(error);
    }
  },

  async getHelpArticle(req, res, next) {
    try {
      const article = await helpService.getArticleById(req.params.id);
      
      // Get related articles
      const relatedArticles = await helpService.getRelatedArticles(req.params.id);
      
      res.json({
        article,
        relatedArticles
      });
    } catch (error) {
      next(error);
    }
  },

  async searchHelpContent(req, res, next) {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const results = await helpService.searchArticles(query);
      res.json(results);
    } catch (error) {
      next(error);
    }
  },

  async getFAQs(req, res, next) {
    try {
      const { category } = req.query;
      const faqs = await helpService.getFAQs(category);
      res.json(faqs);
    } catch (error) {
      next(error);
    }
  },

  async getTutorials(req, res, next) {
    try {
      const { difficulty } = req.query;
      const tutorials = await helpService.getTutorials(difficulty);
      res.json(tutorials);
    } catch (error) {
      next(error);
    }
  },

  async submitSupportRequest(req, res, next) {
    try {
      const { userId } = req.auth; // Assuming auth middleware sets this
      const ticket = await helpService.submitSupportRequest(userId, req.body);
      res.status(201).json(ticket);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = helpController;