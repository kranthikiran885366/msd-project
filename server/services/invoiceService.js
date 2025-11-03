const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { generatePDF } = require('../utils/pdfGenerator');
const { sendEmail } = require('../utils/emailService');

class InvoiceService {
  async getInvoicesForUser(userId, options = {}) {
    const { status, dateFrom, dateTo, limit = 50, offset = 0 } = options;
    
    const query = { userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('subscriptionId', 'plan')
      .lean();
    
    return invoices;
  }

  async getInvoiceById(invoiceId, userId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, userId })
      .populate('subscriptionId', 'plan')
      .populate('userId', 'name email');
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    return invoice;
  }

  async createInvoice(subscriptionId, billingPeriod, items) {
    const subscription = await Subscription.findById(subscriptionId).populate('userId');
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = this.calculateTaxRate(subscription.billingAddress?.country);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const invoice = new Invoice({
      userId: subscription.userId._id,
      subscriptionId,
      billingPeriod,
      items,
      subtotal,
      tax: {
        rate: taxRate,
        amount: taxAmount
      },
      total,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      billingAddress: subscription.billingAddress
    });

    await invoice.save();
    return invoice;
  }

  async generateDownloadUrl(invoiceId, userId) {
    const invoice = await this.getInvoiceById(invoiceId, userId);
    
    // Generate PDF and return download URL
    const pdfBuffer = await generatePDF(invoice);
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    
    // In a real implementation, you would upload to S3 or similar and return the URL
    // For now, we'll return a mock URL
    return `${process.env.API_URL}/billing/invoices/${invoiceId}/download?token=${this.generateDownloadToken(invoiceId)}`;
  }

  async resendInvoice(invoiceId, userId) {
    const invoice = await this.getInvoiceById(invoiceId, userId);
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Send email with invoice
    await sendEmail({
      to: user.email,
      subject: `Invoice ${invoice.invoiceNumber}`,
      template: 'invoice',
      data: {
        user: user.name,
        invoice,
        downloadUrl: await this.generateDownloadUrl(invoiceId, userId)
      }
    });

    return true;
  }

  async markInvoiceAsPaid(invoiceId, paymentMethod) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice.markAsPaid(paymentMethod);
  }

  async markInvoiceAsFailed(invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice.markAsFailed();
  }

  calculateTaxRate(country) {
    // Simple tax calculation - in reality, this would be more complex
    const taxRates = {
      'US': 8.5,
      'CA': 13.0,
      'GB': 20.0,
      'DE': 19.0,
      'FR': 20.0,
      'AU': 10.0
    };
    
    return taxRates[country] || 0;
  }

  generateDownloadToken(invoiceId) {
    // Generate a secure token for download access
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(`${invoiceId}-${Date.now()}-${process.env.JWT_SECRET}`)
      .digest('hex');
  }

  async getInvoiceStatistics(userId, timeRange = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - timeRange);

    const stats = await Invoice.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0]
            }
          },
          unpaidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$total', 0]
            }
          },
          totalInvoices: { $sum: 1 },
          paidInvoices: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, 1, 0]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      totalInvoices: 0,
      paidInvoices: 0
    };
  }
}

module.exports = new InvoiceService();