const HelpArticle = require('../models/HelpArticle');
const NotificationPreference = require('../models/NotificationPreference');
const mongoose = require('mongoose');

class HelpService {
  async getAllArticles(category) {
    const query = { published: true };
    if (category) {
      query.category = category;
    }
    return await HelpArticle.find(query).sort({ viewCount: -1 });
  }

  async getArticleById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid article ID');
    }
    
    const article = await HelpArticle.findById(id);
    if (!article) {
      throw new Error('Article not found');
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    return article;
  }

  async searchArticles(searchTerm) {
    if (!searchTerm) {
      return [];
    }

    return await HelpArticle.find(
      { $text: { $search: searchTerm }, published: true },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(10);
  }

  async getFAQs(category) {
    const query = { 
      category: category || 'General',
      published: true
    };
    
    const faqs = await HelpArticle.find(query)
      .select('title content category')
      .sort({ viewCount: -1 })
      .limit(10);

    return faqs.map(faq => ({
      question: faq.title,
      answer: faq.content,
      category: faq.category
    }));
  }

  async getTutorials(difficulty) {
    const query = {
      published: true,
      'metadata.difficulty': difficulty || { $exists: true }
    };

    return await HelpArticle.find(query)
      .select('title metadata.difficulty metadata.estimatedTime viewCount')
      .sort({ viewCount: -1 });
  }

  async submitSupportRequest(userId, request) {
    // Get user notification preferences
    const preferences = await NotificationPreference.findOne({ userId });

    // Create support ticket (implement based on your ticketing system)
    const ticket = await this.createSupportTicket(request);

    // Notify user based on preferences
    if (preferences?.channels.email) {
      await this.notifyUserByEmail(preferences.emailAddress, ticket);
    }

    return ticket;
  }

  async getRelatedArticles(articleId) {
    const article = await HelpArticle.findById(articleId);
    if (!article) {
      return [];
    }

    return await HelpArticle.find({
      _id: { $ne: articleId },
      category: article.category,
      published: true
    })
    .limit(3)
    .sort({ viewCount: -1 });
  }

  async createSupportTicket(request) {
    // TODO: Implement ticket creation in your preferred ticketing system
    return {
      id: new mongoose.Types.ObjectId(),
      status: 'created',
      ...request
    };
  }

  async notifyUserByEmail(email, ticket) {
    // TODO: Implement email notification using your notification service
  }
}

module.exports = new HelpService();