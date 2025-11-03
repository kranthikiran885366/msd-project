const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');
const { MFAConfig } = require('../models');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { auditLog } = require('../middleware/auditLogger');

class MFAService {
  constructor() {
    this.twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;

    this.emailTransporter = process.env.SMTP_HOST
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })
      : null;
  }

  async setupTOTP(userId) {
    try {
      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: process.env.APP_NAME || 'Enterprise Platform'
      });

      // Create QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      // Save configuration
      await MFAConfig.create({
        userId,
        type: 'totp',
        secret: secret.base32,
        isEnabled: false // Requires verification before enabling
      });

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl
      };
    } catch (error) {
      throw new Error(`TOTP setup failed: ${error.message}`);
    }
  }

  async verifyTOTP(userId, token) {
    try {
      const config = await MFAConfig.findOne({
        where: { userId, type: 'totp' }
      });

      if (!config) throw new Error('TOTP not configured');

      const isValid = speakeasy.totp.verify({
        secret: config.secret,
        encoding: 'base32',
        token: token,
        window: 1 // Allow 30 seconds window
      });

      if (isValid) {
        await config.update({
          isEnabled: true,
          lastUsed: new Date()
        });
      }

      return isValid;
    } catch (error) {
      throw new Error(`TOTP verification failed: ${error.message}`);
    }
  }

  async setupSMS(userId, phoneNumber) {
    try {
      if (!this.twilioClient) {
        throw new Error('SMS service not configured');
      }

      // Validate phone number format
      const validatedNumber = await this.twilioClient.lookups.v1
        .phoneNumbers(phoneNumber)
        .fetch();

      await MFAConfig.create({
        userId,
        type: 'sms',
        phoneNumber: validatedNumber.phoneNumber,
        isEnabled: true
      });

      return true;
    } catch (error) {
      throw new Error(`SMS setup failed: ${error.message}`);
    }
  }

  async sendSMSCode(userId) {
    try {
      if (!this.twilioClient) {
        throw new Error('SMS service not configured');
      }

      const config = await MFAConfig.findOne({
        where: { userId, type: 'sms' }
      });

      if (!config) throw new Error('SMS MFA not configured');

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = await bcrypt.hash(code, 10);

      // Store hashed code temporarily (expires in 5 minutes)
      await config.update({
        secret: hashedCode,
        lastUsed: new Date()
      });

      // Send SMS
      await this.twilioClient.messages.create({
        body: `Your verification code is: ${code}`,
        to: config.phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER
      });

      return true;
    } catch (error) {
      throw new Error(`SMS code sending failed: ${error.message}`);
    }
  }

  async verifySMSCode(userId, code) {
    try {
      const config = await MFAConfig.findOne({
        where: { userId, type: 'sms' }
      });

      if (!config) throw new Error('SMS MFA not configured');

      // Verify code was sent within last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (config.lastUsed < fiveMinutesAgo) {
        throw new Error('Code expired');
      }

      const isValid = await bcrypt.compare(code, config.secret);

      if (isValid) {
        // Clear the used code
        await config.update({
          secret: null,
          lastUsed: new Date()
        });
      }

      return isValid;
    } catch (error) {
      throw new Error(`SMS verification failed: ${error.message}`);
    }
  }

  async setupEmailMFA(userId, email) {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email service not configured');
      }

      await MFAConfig.create({
        userId,
        type: 'email',
        isEnabled: true
      });

      return true;
    } catch (error) {
      throw new Error(`Email MFA setup failed: ${error.message}`);
    }
  }

  async sendEmailCode(userId, email) {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email service not configured');
      }

      const config = await MFAConfig.findOne({
        where: { userId, type: 'email' }
      });

      if (!config) throw new Error('Email MFA not configured');

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = await bcrypt.hash(code, 10);

      // Store hashed code temporarily
      await config.update({
        secret: hashedCode,
        lastUsed: new Date()
      });

      // Send email
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Your Authentication Code',
        text: `Your verification code is: ${code}`,
        html: `<p>Your verification code is: <strong>${code}</strong></p>`
      });

      return true;
    } catch (error) {
      throw new Error(`Email code sending failed: ${error.message}`);
    }
  }

  async verifyEmailCode(userId, code) {
    try {
      const config = await MFAConfig.findOne({
        where: { userId, type: 'email' }
      });

      if (!config) throw new Error('Email MFA not configured');

      // Verify code was sent within last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (config.lastUsed < fiveMinutesAgo) {
        throw new Error('Code expired');
      }

      const isValid = await bcrypt.compare(code, config.secret);

      if (isValid) {
        await config.update({
          secret: null,
          lastUsed: new Date()
        });
      }

      return isValid;
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  async generateBackupCodes(userId) {
    try {
      const config = await MFAConfig.findOne({
        where: { userId }
      });

      if (!config) throw new Error('MFA not configured');

      // Generate 8 random backup codes
      const codes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );

      // Hash the codes
      const hashedCodes = await Promise.all(
        codes.map(code => bcrypt.hash(code, 10))
      );

      await config.update({ backupCodes: hashedCodes });

      return codes; // Return plain codes to show to user
    } catch (error) {
      throw new Error(`Backup codes generation failed: ${error.message}`);
    }
  }

  async verifyBackupCode(userId, code) {
    try {
      const config = await MFAConfig.findOne({
        where: { userId }
      });

      if (!config || !config.backupCodes.length) {
        throw new Error('No backup codes available');
      }

      // Find matching code
      for (let i = 0; i < config.backupCodes.length; i++) {
        const isValid = await bcrypt.compare(code, config.backupCodes[i]);
        if (isValid) {
          // Remove used code
          const newCodes = [...config.backupCodes];
          newCodes.splice(i, 1);
          await config.update({ backupCodes: newCodes });
          return true;
        }
      }

      return false;
    } catch (error) {
      throw new Error(`Backup code verification failed: ${error.message}`);
    }
  }

  async disableMFA(userId, type) {
    try {
      const result = await MFAConfig.destroy({
        where: { userId, type }
      });

      return result > 0;
    } catch (error) {
      throw new Error(`MFA disable failed: ${error.message}`);
    }
  }

  async getMFAStatus(userId) {
    try {
      const configs = await MFAConfig.findAll({
        where: { userId }
      });

      return {
        totp: configs.find(c => c.type === 'totp')?.isEnabled || false,
        sms: configs.find(c => c.type === 'sms')?.isEnabled || false,
        email: configs.find(c => c.type === 'email')?.isEnabled || false,
        hasBackupCodes: configs.some(c => c.backupCodes?.length > 0)
      };
    } catch (error) {
      throw new Error(`MFA status check failed: ${error.message}`);
    }
  }
}

module.exports = new MFAService();