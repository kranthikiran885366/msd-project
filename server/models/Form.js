const mongoose = require("mongoose")

const validationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['required', 'email', 'url', 'min', 'max', 'minLength', 'maxLength', 'pattern', 'custom'],
    required: true,
  },
  value: mongoose.Schema.Types.Mixed,
  message: String,
  customValidator: String, // For custom validations
});

const formFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  label: String,
  type: {
    type: String,
    enum: [
      'text', 'textarea', 'number', 'email', 'password', 'tel', 'url',
      'date', 'time', 'datetime-local', 'file', 'select', 'radio',
      'checkbox', 'hidden', 'range', 'color', 'signature', 'richtext',
      'repeater', 'matrix', 'rating', 'slider', 'captcha'
    ],
    default: 'text',
  },
  placeholder: String,
  helpText: String,
  defaultValue: mongoose.Schema.Types.Mixed,
  options: [{
    label: String,
    value: mongoose.Schema.Types.Mixed,
    disabled: Boolean,
  }],
  validations: [validationSchema],
  attributes: {
    required: Boolean,
    disabled: Boolean,
    readonly: Boolean,
    multiple: Boolean,
    min: Number,
    max: Number,
    step: Number,
    accept: String,
    pattern: String,
    autocomplete: String,
    cols: Number,
    rows: Number,
    maxlength: Number,
    minlength: Number,
  },
  conditions: {
    visible: String, // JavaScript condition
    enabled: String, // JavaScript condition
    required: String, // JavaScript condition
  },
  layout: {
    width: {
      type: String,
      enum: ['full', 'half', 'third', 'quarter'],
      default: 'full',
    },
    order: Number,
    cssClass: String,
    customCSS: String,
  },
  advanced: {
    mask: String,
    sanitization: String,
    transformation: String,
    calculation: String,
  },
});

const submissionSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
  },
  data: mongoose.Schema.Types.Mixed,
  files: [{
    fieldName: String,
    originalName: String,
    filename: String,
    mimetype: String,
    size: Number,
    url: String,
    metadata: mongoose.Schema.Types.Mixed,
  }],
  metadata: {
    ip: String,
    userAgent: String,
    referer: String,
    startTime: Date,
    endTime: Date,
    timeToComplete: Number,
    location: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'error'],
    default: 'pending',
  },
  processingLogs: [{
    timestamp: Date,
    type: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
  }],
  webhookDeliveries: [{
    url: String,
    status: String,
    attempts: Number,
    lastAttempt: Date,
    nextAttempt: Date,
    response: mongoose.Schema.Types.Mixed,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const formSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  description: String,
  fields: [formFieldSchema],
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  settings: {
    // Form appearance
    theme: {
      type: String,
      enum: ['default', 'modern', 'minimal', 'custom'],
      default: 'default',
    },
    layout: {
      type: String,
      enum: ['vertical', 'horizontal', 'wizard'],
      default: 'vertical',
    },
    submitButton: {
      text: {
        type: String,
        default: 'Submit',
      },
      position: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'center',
      },
      style: mongoose.Schema.Types.Mixed,
    },
    messages: {
      success: String,
      error: String,
      validation: String,
    },

    // Form behavior
    behavior: {
      submitOnce: {
        type: Boolean,
        default: false,
      },
      saveProgress: {
        type: Boolean,
        default: false,
      },
      redirectUrl: String,
      resetOnSubmit: {
        type: Boolean,
        default: true,
      },
      confirmBeforeSubmit: {
        type: Boolean,
        default: false,
      },
    },

    // Security
    security: {
      reCaptcha: {
        enabled: Boolean,
        version: {
          type: String,
          enum: ['v2', 'v3'],
          default: 'v3',
        },
        siteKey: String,
        secretKey: String,
        score: Number,
      },
      honeypot: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },
      cors: {
        enabled: Boolean,
        allowedOrigins: [String],
      },
      rateLimiting: {
        enabled: Boolean,
        maxSubmissions: Number,
        timeWindow: Number,
        blockDuration: Number,
      },
    },

    // Notifications
    notifications: {
      email: {
        enabled: Boolean,
        recipients: [String],
        cc: [String],
        bcc: [String],
        subject: String,
        template: String,
        attachFiles: Boolean,
      },
      slack: {
        enabled: Boolean,
        webhook: String,
        channel: String,
        template: String,
      },
      discord: {
        enabled: Boolean,
        webhook: String,
        template: String,
      },
      webhooks: [{
        url: String,
        method: {
          type: String,
          enum: ['POST', 'PUT', 'PATCH'],
          default: 'POST',
        },
        headers: mongoose.Schema.Types.Mixed,
        template: String,
        retry: {
          enabled: Boolean,
          maxAttempts: Number,
          backoff: {
            type: String,
            enum: ['linear', 'exponential'],
            default: 'exponential',
          },
        },
      }],
    },

    // File uploads
    fileUploads: {
      enabled: Boolean,
      maxSize: Number,
      allowedTypes: [String],
      storage: {
        provider: {
          type: String,
          enum: ['local', 's3', 'gcs', 'azure'],
          default: 'local',
        },
        config: mongoose.Schema.Types.Mixed,
      },
      imageProcessing: {
        enabled: Boolean,
        maxWidth: Number,
        maxHeight: Number,
        quality: Number,
        format: String,
      },
    },

    // Integrations
    integrations: {
      crm: [{
        type: {
          type: String,
          enum: ['salesforce', 'hubspot', 'zoho'],
        },
        config: mongoose.Schema.Types.Mixed,
        mapping: mongoose.Schema.Types.Mixed,
      }],
      spreadsheet: {
        enabled: Boolean,
        type: {
          type: String,
          enum: ['google', 'excel'],
        },
        config: mongoose.Schema.Types.Mixed,
      },
      zapier: {
        enabled: Boolean,
        webhook: String,
      },
    },

    // Analytics
    analytics: {
      enabled: {
        type: Boolean,
        default: true,
      },
      googleAnalytics: {
        enabled: Boolean,
        trackingId: String,
        events: [{
          name: String,
          trigger: String,
        }],
      },
      goals: [{
        name: String,
        conditions: String,
        value: Number,
      }],
    },
  },

  // Form analytics
  analytics: {
    views: {
      total: { type: Number, default: 0 },
      unique: { type: Number, default: 0 },
    },
    submissions: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      abandoned: { type: Number, default: 0 },
    },
    conversionRate: Number,
    averageTimeToComplete: Number,
    fieldAnalytics: [{
      fieldName: String,
      interactions: Number,
      timeSpent: Number,
      errorRate: Number,
      dropoffRate: Number,
    }],
    errors: [{
      fieldName: String,
      type: String,
      count: Number,
      lastOccurred: Date,
    }],
    sources: [{
      name: String,
      submissions: Number,
      conversionRate: Number,
    }],
    devices: [{
      type: String,
      count: Number,
      percentage: Number,
    }],
  },

  // Versioning
  version: {
    type: Number,
    default: 1,
  },
  versions: [{
    number: Number,
    changes: String,
    createdAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  publishedAt: Date,
  archivedAt: Date,
})

// Pre-save middleware
formSchema.pre('save', function(next) {
  if (!this.isModified('name')) return next();
  
  // Generate slug from name
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Increment version on field changes
  if (this.isModified('fields')) {
    this.version++;
    this.versions.push({
      number: this.version,
      changes: 'Updated form fields',
      createdAt: new Date(),
    });
  }

  next();
});

// Virtuals
formSchema.virtual('formUrl').get(function() {
  return `/f/${this.slug || this._id}`;
});

formSchema.virtual('embedCode').get(function() {
  return `<iframe src="${this.formUrl}" frameborder="0" style="width:100%;min-height:500px"></iframe>`;
});

formSchema.virtual('submissionCount').get(function() {
  return this.analytics.submissions.total;
});

// Methods
formSchema.methods.validateSubmission = async function(data) {
  const errors = [];
  
  for (const field of this.fields) {
    const value = data[field.name];
    
    // Skip validation for conditionally hidden fields
    if (field.conditions.visible) {
      try {
        const isVisible = new Function('data', `return ${field.conditions.visible}`)(data);
        if (!isVisible) continue;
      } catch (error) {
        console.error(`Invalid visibility condition for field ${field.name}:`, error);
      }
    }

    // Required field validation
    if (field.attributes.required) {
      let isRequired = true;
      
      // Check conditional requirement
      if (field.conditions.required) {
        try {
          isRequired = new Function('data', `return ${field.conditions.required}`)(data);
        } catch (error) {
          console.error(`Invalid requirement condition for field ${field.name}:`, error);
        }
      }

      if (isRequired && !value) {
        errors.push({
          field: field.name,
          message: `${field.label || field.name} is required`,
        });
        continue;
      }
    }

    // Skip further validation if empty
    if (!value) continue;

    // Field-specific validation
    switch (field.type) {
      case 'email':
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          errors.push({
            field: field.name,
            message: 'Invalid email address',
          });
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push({
            field: field.name,
            message: 'Invalid URL',
          });
        }
        break;

      case 'file':
        if (field.attributes.accept) {
          const allowedTypes = field.attributes.accept.split(',');
          if (!allowedTypes.some(type => value.type.match(new RegExp(type.replace('*', '.*'))))) {
            errors.push({
              field: field.name,
              message: 'Invalid file type',
            });
          }
        }
        break;
    }

    // Custom validations
    for (const validation of field.validations || []) {
      switch (validation.type) {
        case 'pattern':
          if (!String(value).match(new RegExp(validation.value))) {
            errors.push({
              field: field.name,
              message: validation.message || 'Invalid format',
            });
          }
          break;

        case 'min':
          if (Number(value) < validation.value) {
            errors.push({
              field: field.name,
              message: validation.message || `Must be at least ${validation.value}`,
            });
          }
          break;

        case 'max':
          if (Number(value) > validation.value) {
            errors.push({
              field: field.name,
              message: validation.message || `Must not exceed ${validation.value}`,
            });
          }
          break;

        case 'minLength':
          if (String(value).length < validation.value) {
            errors.push({
              field: field.name,
              message: validation.message || `Must be at least ${validation.value} characters`,
            });
          }
          break;

        case 'maxLength':
          if (String(value).length > validation.value) {
            errors.push({
              field: field.name,
              message: validation.message || `Must not exceed ${validation.value} characters`,
            });
          }
          break;

        case 'custom':
          try {
            const validatorFn = new Function('value', validation.customValidator);
            if (!validatorFn(value)) {
              errors.push({
                field: field.name,
                message: validation.message || 'Validation failed',
              });
            }
          } catch (error) {
            console.error(`Custom validator error for field ${field.name}:`, error);
            errors.push({
              field: field.name,
              message: 'Invalid custom validator',
            });
          }
          break;
      }
    }
  }

  return errors;
};

formSchema.methods.processSubmission = async function(submissionData) {
  // Update analytics
  this.analytics.submissions.total++;
  this.analytics.submissions.completed++;
  this.analytics.conversionRate = (
    this.analytics.submissions.completed / this.analytics.views.total
  ) * 100;

  // Update field analytics
  for (const field of this.fields) {
    let fieldAnalytics = this.analytics.fieldAnalytics.find(
      fa => fa.fieldName === field.name
    );

    if (!fieldAnalytics) {
      fieldAnalytics = {
        fieldName: field.name,
        interactions: 0,
        timeSpent: 0,
        errorRate: 0,
        dropoffRate: 0,
      };
      this.analytics.fieldAnalytics.push(fieldAnalytics);
    }

    if (submissionData.fieldInteractions?.[field.name]) {
      fieldAnalytics.interactions++;
      fieldAnalytics.timeSpent = (
        (fieldAnalytics.timeSpent * (fieldAnalytics.interactions - 1) +
          submissionData.fieldInteractions[field.name].timeSpent) /
        fieldAnalytics.interactions
      );
    }
  }

  // Update device analytics
  const deviceType = submissionData.metadata.device;
  let deviceStat = this.analytics.devices.find(d => d.type === deviceType);
  if (!deviceStat) {
    deviceStat = { type: deviceType, count: 0, percentage: 0 };
    this.analytics.devices.push(deviceStat);
  }
  deviceStat.count++;

  // Recalculate device percentages
  const totalSubmissions = this.analytics.devices.reduce((sum, d) => sum + d.count, 0);
  this.analytics.devices.forEach(d => {
    d.percentage = (d.count / totalSubmissions) * 100;
  });

  await this.save();
  return this;
};

formSchema.methods.publish = async function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

formSchema.methods.archive = async function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

formSchema.methods.duplicate = async function(newName) {
  const duplicate = new this.constructor(this.toObject());
  duplicate._id = mongoose.Types.ObjectId();
  duplicate.name = newName || `${this.name} (Copy)`;
  duplicate.status = 'draft';
  duplicate.analytics = {
    views: { total: 0, unique: 0 },
    submissions: { total: 0, completed: 0, abandoned: 0 },
    fieldAnalytics: [],
    errors: [],
    sources: [],
    devices: [],
  };
  duplicate.version = 1;
  duplicate.versions = [{
    number: 1,
    changes: 'Initial version (duplicated)',
    createdAt: new Date(),
  }];
  duplicate.createdAt = new Date();
  duplicate.updatedAt = new Date();
  duplicate.publishedAt = null;
  duplicate.archivedAt = null;

  return duplicate.save();
};

// Static methods
formSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug });
};

formSchema.statics.findPublished = function() {
  return this.find({ status: 'published' });
};

module.exports = mongoose.model('Form', formSchema);