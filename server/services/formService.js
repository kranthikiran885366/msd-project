const Form = require("../models/Form");
const Submission = require("../models/Submission");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const AWS = require("aws-sdk");
const { BlobServiceClient } = require("@azure/storage-blob");
const axios = require("axios");
const sharp = require("sharp");
const { Salesforce } = require("@salesforce/core");
const { Client: HubSpotClient } = require("@hubspot/api-client");
const { google } = require("googleapis");
const Excel = require("exceljs");

class FormService {
  constructor() {
    // Initialize storage providers
    this.storageProviders = {
      gcs: new Storage(),
      s3: new AWS.S3(),
      azure: BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING),
    };

    // Initialize email transport
    this.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Initialize CRM clients
    this.crmClients = {
      salesforce: new Salesforce({
        clientId: process.env.SALESFORCE_CLIENT_ID,
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
        redirectUri: process.env.SALESFORCE_REDIRECT_URI,
      }),
      hubspot: new HubSpotClient({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN }),
    };

    // Initialize spreadsheet clients
    this.spreadsheetClients = {
      google: google.sheets({ version: 'v4' }),
      excel: new Excel.Workbook(),
    };

    // Rate limiting configuration
    this.rateLimits = new Map();
  }

  async getForms(projectId, options = {}) {
    const { status, page = 1, limit = 20, sort = '-createdAt' } = options;
    const query = { projectId };
    
    if (status) query.status = status;

    return Form.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(options.fields);
  }

  async createForm(formData) {
    const form = new Form(formData);
    await form.save();

    // Initialize analytics
    form.analytics = {
      views: { total: 0, unique: 0 },
      submissions: { total: 0, completed: 0, abandoned: 0 },
      conversionRate: 0,
      fieldAnalytics: [],
      errors: [],
      sources: [],
      devices: [],
    };

    return form.save();
  }

  async updateForm(id, updates) {
    const form = await Form.findById(id);
    if (!form) throw new Error('Form not found');

    // Handle field updates
    if (updates.fields) {
      // Preserve field analytics when updating fields
      const existingAnalytics = form.analytics.fieldAnalytics;
      updates.fields.forEach(field => {
        const existingField = existingAnalytics.find(fa => fa.fieldName === field.name);
        if (existingField) {
          field.analytics = existingField;
        }
      });
    }

    Object.assign(form, updates);
    return form.save();
  }

  async deleteForm(id) {
    const form = await Form.findById(id);
    if (!form) throw new Error('Form not found');

    // Delete all file uploads
    if (form.settings.fileUploads.enabled) {
      const submissions = await Submission.find({ formId: id });
      for (const submission of submissions) {
        for (const file of submission.files) {
          await this._deleteFile(file, form.settings.fileUploads.storage);
        }
      }
    }

    // Delete all submissions
    await Submission.deleteMany({ formId: id });

    // Delete the form
    return Form.findByIdAndDelete(id);
  }

  async getSubmissions(formId, options = {}) {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = options;

    const query = { formId };
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return Submission.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(options.fields);
  }

  async handleSubmission(formId, data, files, metadata) {
    const form = await Form.findById(formId);
    if (!form) throw new Error('Form not found');

    // Check rate limiting
    if (form.settings.security.rateLimiting.enabled) {
      const canSubmit = await this._checkRateLimit(form, metadata.ip);
      if (!canSubmit) {
        throw new Error('Rate limit exceeded');
      }
    }

    // Validate reCAPTCHA
    if (form.settings.security.reCaptcha.enabled) {
      const isValid = await this._validateReCaptcha(
        data.recaptchaToken,
        form.settings.security.reCaptcha
      );
      if (!isValid) {
        throw new Error('reCAPTCHA validation failed');
      }
    }

    // Validate honeypot
    if (form.settings.security.honeypot.enabled && data._honeypot) {
      throw new Error('Spam submission detected');
    }

    // Validate form data
    const validationErrors = await form.validateSubmission(data);
    if (validationErrors.length > 0) {
      throw new Error('Validation failed: ' + JSON.stringify(validationErrors));
    }

    // Handle file uploads
    const uploadedFiles = [];
    if (files && form.settings.fileUploads.enabled) {
      for (const file of files) {
        const processedFile = await this._processFile(file, form.settings.fileUploads);
        uploadedFiles.push(processedFile);
      }
    }

    // Create submission
    const submission = new Submission({
      formId,
      data,
      files: uploadedFiles,
      metadata: {
        ...metadata,
        startTime: data._startTime,
        endTime: new Date(),
        timeToComplete: data._startTime ? new Date() - new Date(data._startTime) : null,
      },
    });

    // Process submission
    await this._processSubmission(form, submission);

    return submission;
  }

  async _processSubmission(form, submission) {
    try {
      // Save submission
      await submission.save();

      // Update form analytics
      await form.processSubmission(submission);

      // Send notifications
      await Promise.all([
        this._sendEmailNotifications(form, submission),
        this._sendSlackNotification(form, submission),
        this._sendDiscordNotification(form, submission),
        this._sendWebhookNotifications(form, submission),
      ]);

      // Process integrations
      await Promise.all([
        this._processCRMIntegrations(form, submission),
        this._processSpreadsheetIntegration(form, submission),
        this._processZapierIntegration(form, submission),
      ]);

      // Track analytics
      if (form.settings.analytics.enabled) {
        await this._trackAnalytics(form, submission);
      }

      submission.status = 'processed';
      await submission.save();

    } catch (error) {
      submission.status = 'error';
      submission.processingLogs.push({
        timestamp: new Date(),
        type: 'error',
        message: error.message,
        details: error,
      });
      await submission.save();
      throw error;
    }
  }

  async _sendEmailNotifications(form, submission) {
    if (!form.settings.notifications.email.enabled) return;

    const { recipients, cc, bcc, subject, template, attachFiles } = form.settings.notifications.email;
    
    // Prepare attachments
    const attachments = [];
    if (attachFiles && submission.files.length > 0) {
      for (const file of submission.files) {
        attachments.push({
          filename: file.originalName,
          path: file.url,
        });
      }
    }

    // Prepare email content
    const templateData = {
      form: {
        name: form.name,
        description: form.description,
      },
      submission: {
        data: submission.data,
        files: submission.files,
        metadata: submission.metadata,
      },
    };

    const htmlContent = template ?
      await this._renderTemplate(template, templateData) :
      this._generateDefaultEmailTemplate(templateData);

    // Send email
    await this.mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: recipients.join(','),
      cc: cc?.join(','),
      bcc: bcc?.join(','),
      subject: subject || `New submission - ${form.name}`,
      html: htmlContent,
      attachments,
    });
  }

  async _sendSlackNotification(form, submission) {
    if (!form.settings.notifications.slack.enabled) return;

    const { webhook, channel, template } = form.settings.notifications.slack;
    
    const message = template ?
      await this._renderTemplate(template, { form, submission }) :
      this._generateDefaultSlackMessage(form, submission);

    await axios.post(webhook, {
      channel,
      ...message,
    });
  }

  async _sendDiscordNotification(form, submission) {
    if (!form.settings.notifications.discord.enabled) return;

    const { webhook, template } = form.settings.notifications.discord;
    
    const message = template ?
      await this._renderTemplate(template, { form, submission }) :
      this._generateDefaultDiscordMessage(form, submission);

    await axios.post(webhook, message);
  }

  async _sendWebhookNotifications(form, submission) {
    if (!form.settings.notifications.webhooks?.length) return;

    const deliveryPromises = form.settings.notifications.webhooks.map(async webhook => {
      const payload = webhook.template ?
        await this._renderTemplate(webhook.template, { form, submission }) :
        { form: form.toJSON(), submission: submission.toJSON() };

      const delivery = {
        url: webhook.url,
        status: 'pending',
        attempts: 0,
      };

      try {
        const response = await axios({
          method: webhook.method,
          url: webhook.url,
          headers: webhook.headers,
          data: payload,
        });

        delivery.status = 'delivered';
        delivery.response = {
          status: response.status,
          data: response.data,
        };

      } catch (error) {
        delivery.status = 'failed';
        delivery.response = {
          error: error.message,
          details: error.response?.data,
        };

        // Schedule retry if enabled
        if (webhook.retry?.enabled && delivery.attempts < webhook.retry.maxAttempts) {
          delivery.attempts++;
          const backoffTime = this._calculateBackoffTime(
            delivery.attempts,
            webhook.retry.backoff
          );
          delivery.nextAttempt = new Date(Date.now() + backoffTime);
        }
      }

      submission.webhookDeliveries.push(delivery);
    });

    await Promise.all(deliveryPromises);
    await submission.save();
  }

  async _processCRMIntegrations(form, submission) {
    if (!form.settings.integrations.crm?.length) return;

    const integrationPromises = form.settings.integrations.crm.map(async integration => {
      try {
        switch (integration.type) {
          case 'salesforce':
            await this._createSalesforceRecord(integration, submission);
            break;
          case 'hubspot':
            await this._createHubSpotRecord(integration, submission);
            break;
          case 'zoho':
            await this._createZohoRecord(integration, submission);
            break;
        }
      } catch (error) {
        console.error(`CRM integration failed for ${integration.type}:`, error);
        throw error;
      }
    });

    await Promise.all(integrationPromises);
  }

  async _processSpreadsheetIntegration(form, submission) {
    if (!form.settings.integrations.spreadsheet?.enabled) return;

    const { type, config } = form.settings.integrations.spreadsheet;
    
    try {
      switch (type) {
        case 'google':
          await this._appendToGoogleSheet(config, submission);
          break;
        case 'excel':
          await this._appendToExcelSheet(config, submission);
          break;
      }
    } catch (error) {
      console.error('Spreadsheet integration failed:', error);
      throw error;
    }
  }

  async _processZapierIntegration(form, submission) {
    if (!form.settings.integrations.zapier?.enabled) return;

    try {
      await axios.post(form.settings.integrations.zapier.webhook, {
        form: form.toJSON(),
        submission: submission.toJSON(),
      });
    } catch (error) {
      console.error('Zapier integration failed:', error);
      throw error;
    }
  }

  async _processFile(file, settings) {
    const { maxSize, allowedTypes, storage, imageProcessing } = settings;

    // Validate file
    if (maxSize && file.size > maxSize) {
      throw new Error(`File size exceeds limit of ${maxSize} bytes`);
    }
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }

    // Process image if enabled and file is an image
    let processedBuffer = file.buffer;
    if (imageProcessing.enabled && file.mimetype.startsWith('image/')) {
      processedBuffer = await sharp(file.buffer)
        .resize(imageProcessing.maxWidth, imageProcessing.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat(imageProcessing.format || 'jpeg', {
          quality: imageProcessing.quality || 80,
        })
        .toBuffer();
    }

    // Upload file
    const fileName = `${Date.now()}-${file.originalname}`;
    const url = await this._uploadFile(fileName, processedBuffer, file.mimetype, storage);

    return {
      fieldName: file.fieldname,
      originalName: file.originalname,
      filename: fileName,
      mimetype: file.mimetype,
      size: processedBuffer.length,
      url,
      metadata: {
        processed: imageProcessing.enabled,
        originalSize: file.size,
        processedSize: processedBuffer.length,
      },
    };
  }

  async _uploadFile(fileName, buffer, contentType, storageConfig) {
    switch (storageConfig.provider) {
      case 'local':
        // Implementation for local storage
        break;

      case 's3':
        const s3Result = await this.storageProviders.s3.upload({
          Bucket: storageConfig.config.bucket,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read',
        }).promise();
        return s3Result.Location;

      case 'gcs':
        const file = this.storageProviders.gcs
          .bucket(storageConfig.config.bucket)
          .file(fileName);
        
        await file.save(buffer, {
          metadata: { contentType },
        });
        
        return `https://storage.googleapis.com/${storageConfig.config.bucket}/${fileName}`;

      case 'azure':
        const blockBlobClient = this.storageProviders.azure
          .getContainerClient(storageConfig.config.container)
          .getBlockBlobClient(fileName);
        
        await blockBlobClient.upload(buffer, buffer.length, {
          blobHTTPHeaders: { blobContentType: contentType },
        });
        
        return blockBlobClient.url;

      default:
        throw new Error('Unsupported storage provider');
    }
  }

  async _deleteFile(file, storageConfig) {
    switch (storageConfig.provider) {
      case 'local':
        // Implementation for local storage
        break;

      case 's3':
        await this.storageProviders.s3.deleteObject({
          Bucket: storageConfig.config.bucket,
          Key: file.filename,
        }).promise();
        break;

      case 'gcs':
        await this.storageProviders.gcs
          .bucket(storageConfig.config.bucket)
          .file(file.filename)
          .delete();
        break;

      case 'azure':
        await this.storageProviders.azure
          .getContainerClient(storageConfig.config.container)
          .getBlockBlobClient(file.filename)
          .delete();
        break;

      default:
        throw new Error('Unsupported storage provider');
    }
  }

  async exportSubmissions(formId, options = {}) {
    const {
      format = 'csv',
      dateRange,
      fields,
      includeFiles = false,
    } = options;

    const form = await Form.findById(formId);
    if (!form) throw new Error('Form not found');

    const query = { formId };
    if (dateRange) {
      query.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end),
      };
    }

    const submissions = await Submission.find(query).sort('createdAt');

    switch (format.toLowerCase()) {
      case 'csv':
        return this._generateCSV(form, submissions, fields);
      case 'json':
        return this._generateJSON(form, submissions, fields);
      case 'excel':
        return this._generateExcel(form, submissions, fields);
      default:
        throw new Error('Unsupported export format');
    }
  }

  async _generateCSV(form, submissions, selectedFields) {
    const fields = selectedFields || form.fields.map(f => f.name);
    const rows = [fields.join(',')];

    for (const submission of submissions) {
      const row = fields.map(field => {
        const value = submission.data[field];
        return this._formatCsvValue(value);
      });
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  async _generateExcel(form, submissions, selectedFields) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Submissions');

    const fields = selectedFields || form.fields.map(f => f.name);
    worksheet.columns = fields.map(field => ({
      header: field,
      key: field,
      width: 20,
    }));

    for (const submission of submissions) {
      const row = {};
      fields.forEach(field => {
        row[field] = submission.data[field];
      });
      worksheet.addRow(row);
    }

    return workbook.xlsx.writeBuffer();
  }

  _generateJSON(form, submissions, selectedFields) {
    return JSON.stringify(
      submissions.map(s => {
        const data = selectedFields ?
          selectedFields.reduce((acc, field) => {
            acc[field] = s.data[field];
            return acc;
          }, {}) :
          s.data;

        return {
          id: s._id,
          data,
          files: s.files,
          metadata: s.metadata,
          createdAt: s.createdAt,
        };
      }),
      null,
      2
    );
  }

  _formatCsvValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') value = JSON.stringify(value);
    value = String(value);
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async _checkRateLimit(form, ip) {
    const { maxSubmissions, timeWindow, blockDuration } = form.settings.security.rateLimiting;
    const key = `${form._id}:${ip}`;
    
    const now = Date.now();
    const record = this.rateLimits.get(key) || { count: 0, timestamp: now };

    // Reset if time window has passed
    if (now - record.timestamp > timeWindow * 60 * 1000) {
      record.count = 0;
      record.timestamp = now;
    }

    // Check if blocked
    if (record.blocked && now - record.blockedAt < blockDuration * 60 * 1000) {
      return false;
    }

    // Increment count and check limit
    record.count++;
    if (record.count > maxSubmissions) {
      record.blocked = true;
      record.blockedAt = now;
      this.rateLimits.set(key, record);
      return false;
    }

    this.rateLimits.set(key, record);
    return true;
  }

  async _validateReCaptcha(token, config) {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: config.secretKey,
          response: token,
        },
      }
    );

    if (!response.data.success) return false;
    if (config.version === 'v3' && response.data.score < config.score) return false;
    
    return true;
  }

  _calculateBackoffTime(attempt, backoffType) {
    const baseDelay = 30000; // 30 seconds
    
    switch (backoffType) {
      case 'linear':
        return baseDelay * attempt;
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      default:
        return baseDelay;
    }
  }

  async _trackAnalytics(form, submission) {
    if (!form.settings.analytics.googleAnalytics?.enabled) return;

    const { trackingId, events } = form.settings.analytics.googleAnalytics;
    
    // Track form submission
    await axios.post(
      'https://www.google-analytics.com/collect',
      null,
      {
        params: {
          v: '1',
          tid: trackingId,
          cid: submission.metadata.ip,
          t: 'event',
          ec: 'Form',
          ea: 'submit',
          el: form.name,
        },
      }
    );

    // Track custom events
    if (events?.length) {
      for (const event of events) {
        try {
          const shouldTrack = new Function(
            'data',
            'metadata',
            `return ${event.trigger}`
          )(submission.data, submission.metadata);

          if (shouldTrack) {
            await axios.post(
              'https://www.google-analytics.com/collect',
              null,
              {
                params: {
                  v: '1',
                  tid: trackingId,
                  cid: submission.metadata.ip,
                  t: 'event',
                  ec: 'Form',
                  ea: event.name,
                  el: form.name,
                },
              }
            );
          }
        } catch (error) {
          console.error(`Failed to evaluate event trigger for ${event.name}:`, error);
        }
      }
    }
  }
}

module.exports = new FormService()