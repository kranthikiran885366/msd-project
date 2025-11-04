const billingService = require('../services/billingService');
const invoiceService = require('../services/invoiceService');
const paymentService = require('../services/paymentService');

// Safely require costOptimizationService with fallback
let costOptimizationService;
try {
  costOptimizationService = require('../services/costOptimizationService');
} catch (error) {
  console.warn('Warning: costOptimizationService not available, using mock implementation');
  // Provide a mock implementation
  costOptimizationService = {
    getRecommendations: async () => [],
    getCostBreakdown: async () => null,
    getCostProjections: async () => null,
    applyRecommendation: async () => ({ message: 'Not implemented', status: 'pending' }),
  };
}

class BillingController {
  // ==================== Plans ====================
  async getPlans(req, res) {
    try {
      const plans = await billingService.getPlans();
      res.json({ success: true, data: plans });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==================== Subscriptions ====================
  async getCurrentSubscription(req, res) {
    try {
      const subscription = await billingService.getSubscription(
        req.user.id,
        req.query.organizationId
      );
      res.json({ success: true, data: subscription });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createSubscription(req, res) {
    try {
      const subscription = await billingService.createSubscription(
        req.user.id,
        req.body.planId,
        req.body.paymentMethodId,
        req.body.options
      );
      res.status(201).json({ success: true, data: subscription });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateSubscription(req, res) {
    try {
      const subscription = await billingService.updateSubscription(
        req.params.id,
        req.body
      );
      res.json({ success: true, data: subscription });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async cancelSubscription(req, res) {
    try {
      const subscription = await billingService.cancelSubscription(
        req.params.id,
        req.body
      );
      res.json({ success: true, data: subscription });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==================== Usage & Analytics ====================
  async getCurrentUsage(req, res) {
    try {
      const usage = await billingService.getCurrentUsage(req.user.id);
      res.json({ success: true, data: usage });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUsageHistory(req, res) {
    try {
      const history = await billingService.getUsageHistory(req.user.id, req.query);
      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUsageAnalytics(req, res) {
    try {
      const analytics = await billingService.getUsageAnalytics(
        req.params.id,
        req.query
      );
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async recordUsage(req, res) {
    try {
      const subscription = await billingService.recordUsage(
        req.params.id,
        req.body
      );
      res.json({ success: true, data: subscription });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==================== Invoices ====================
  async getInvoices(req, res) {
    try {
      const invoices = await invoiceService.getInvoicesForUser(req.user.id, req.query);
      res.json({ success: true, data: invoices });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getInvoiceDetails(req, res) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id, req.user.id);
      res.json({ success: true, data: invoice });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async downloadInvoice(req, res) {
    try {
      const downloadUrl = await invoiceService.generateDownloadUrl(req.params.id, req.user.id);
      res.json({ success: true, data: { url: downloadUrl } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async resendInvoice(req, res) {
    try {
      await invoiceService.resendInvoice(req.params.id, req.user.id);
      res.json({ success: true, message: 'Invoice resent successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==================== Payment Methods ====================
  async getPaymentMethods(req, res) {
    try {
      const paymentMethods = await paymentService.getPaymentMethodsForUser(req.user.id);
      res.json({ success: true, data: paymentMethods });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async addPaymentMethod(req, res) {
    try {
      const paymentMethod = await paymentService.addPaymentMethod(req.user.id, req.body);
      res.status(201).json({ success: true, data: paymentMethod });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deletePaymentMethod(req, res) {
    try {
      await paymentService.deletePaymentMethod(req.params.id, req.user.id);
      res.json({ success: true, message: 'Payment method deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async setDefaultPaymentMethod(req, res) {
    try {
      const paymentMethod = await paymentService.setDefaultPaymentMethod(req.params.id, req.user.id);
      res.json({ success: true, data: paymentMethod });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==================== Cost Optimization ====================
  async getCostOptimizationRecommendations(req, res) {
    try {
      const recommendations = await costOptimizationService.getRecommendations(req.user.id);
      res.json({ success: true, data: recommendations });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCostBreakdown(req, res) {
    try {
      const breakdown = await costOptimizationService.getCostBreakdown(req.user.id);
      res.json({ success: true, data: breakdown });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCostProjections(req, res) {
    try {
      const projections = await costOptimizationService.getCostProjections(req.user.id);
      res.json({ success: true, data: projections });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async applyCostOptimizationRecommendation(req, res) {
    try {
      const result = await costOptimizationService.applyRecommendation(req.params.id, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ==================== Billing Analytics ====================
  async getBillingAnalytics(req, res) {
    try {
      const analytics = await billingService.getBillingAnalytics(req.user.id, req.query);
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getBillingTrends(req, res) {
    try {
      const trends = await billingService.getBillingTrends(req.user.id, req.query.timeframe);
      res.json({ success: true, data: trends });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getBillingForecast(req, res) {
    try {
      const forecast = await billingService.getBillingForecast(req.user.id);
      res.json({ success: true, data: forecast });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new BillingController();