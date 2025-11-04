/**
 * Email Service
 * Handles email sending functionality using Nodemailer
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = this._initializeTransporter();
    this.templates = {};
  }

  /**
   * Initialize email transporter
   */
  _initializeTransporter() {
    // Check if using Gmail (most common)
    if (process.env.EMAIL_SERVICE === 'gmail' || process.env.GMAIL_USER) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    }

    // Check if using SendGrid (via SMTP)
    if (process.env.SENDGRID_API_KEY) {
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    }

    // Check if using custom SMTP
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        } : undefined,
      });
    }

    // Return mock transporter for development
    return this._createMockTransporter();
  }

  /**
   * Create a mock transporter for development
   */
  _createMockTransporter() {
    logger.warn('Email service not configured. Using mock transporter.');
    return {
      sendMail: async (options) => {
        logger.info('Mock email sent', {
          to: options.to,
          subject: options.subject,
          from: options.from || process.env.EMAIL_FROM || 'noreply@app.com',
        });
        return { messageId: `mock-${Date.now()}@app.com` };
      },
    };
  }

  /**
   * Send a basic email
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: options.from || process.env.EMAIL_FROM || 'noreply@app.com',
        to: options.to,
        subject: options.subject,
        html: options.html || options.text,
        text: options.text,
        ...options,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to: options.to, subject: options.subject });
      return result;
    } catch (error) {
      logger.error('Failed to send email', { to: options.to, error: error.message });
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const html = `
      <h1>Welcome to ${process.env.APP_NAME || 'Our App'}!</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Thank you for signing up. We're excited to have you on board!</p>
      <p><a href="${process.env.APP_URL}/verify-email?token=${user.verificationToken}">Verify your email</a></p>
      <p>Best regards,<br>The Team</p>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Welcome to ${process.env.APP_NAME || 'Our App'}`,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html,
    });
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(user, invoice) {
    const html = `
      <h1>Invoice #${invoice.invoiceNumber}</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Please find your invoice attached.</p>
      <p>Amount Due: $${(invoice.total / 100).toFixed(2)}</p>
      <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      <p><a href="${process.env.APP_URL}/invoices/${invoice._id}">View Invoice</a></p>
      <p>Best regards,<br>The Team</p>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Invoice #${invoice.invoiceNumber}`,
      html,
    });
  }

  /**
   * Send billing contact update email
   */
  async sendBillingContactUpdate(options) {
    const html = `
      <h1>Billing Contact Update</h1>
      <p>Your billing contact information has been updated.</p>
      <p>Name: ${options.contactName}</p>
      <p>Email: ${options.contactEmail}</p>
      <p>If you didn't make this change, please contact support.</p>
      <p>Best regards,<br>The Team</p>
    `;

    return this.sendEmail({
      to: options.email,
      subject: 'Billing Contact Update',
      html,
    });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(user, verificationToken) {
    const verifyUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
    const html = `
      <h1>Verify Your Email</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
      <p>Best regards,<br>The Team</p>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Email Verification',
      html,
    });
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(user, notification) {
    const html = `
      <h1>${notification.title}</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>${notification.message}</p>
      ${notification.actionUrl ? `<p><a href="${notification.actionUrl}">View Details</a></p>` : ''}
      <p>Best regards,<br>The Team</p>
    `;

    return this.sendEmail({
      to: user.email,
      subject: notification.title,
      html,
    });
  }

  /**
   * Send deployment notification
   */
  async sendDeploymentNotification(user, deployment) {
    const html = `
      <h1>Deployment Notification</h1>
      <p>Hi ${user.name || user.email},</p>
      <p>Your deployment "<strong>${deployment.name}</strong>" has ${deployment.status}.</p>
      <p>Status: <strong>${deployment.status}</strong></p>
      <p>Time: ${new Date(deployment.completedAt).toLocaleString()}</p>
      ${deployment.logUrl ? `<p><a href="${deployment.logUrl}">View Logs</a></p>` : ''}
      <p>Best regards,<br>The Team</p>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Deployment ${deployment.status}: ${deployment.name}`,
      html,
    });
  }

  /**
   * Send bulk email
   */
  async sendBulkEmail(recipients, subject, html) {
    const promises = recipients.map(recipient =>
      this.sendEmail({
        to: recipient.email,
        subject,
        html: typeof html === 'function' ? html(recipient) : html,
      }).catch(error => {
        logger.error(`Failed to send bulk email to ${recipient.email}`, { error: error.message });
      })
    );

    await Promise.all(promises);
  }

  /**
   * Verify transporter connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email transporter verified successfully');
      return true;
    } catch (error) {
      logger.error('Email transporter verification failed', { error: error.message });
      return false;
    }
  }
}

module.exports = new EmailService();
