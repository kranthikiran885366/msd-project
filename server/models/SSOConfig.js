const mongoose = require('mongoose');

const ssoConfigSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  provider: {
    type: String,
    enum: ['okta', 'azure-ad', 'google', 'onelogin', 'custom-saml'],
    required: true
  },
  config: {
    clientId: String,
    clientSecret: String,
    tenantId: String,
    issuer: String,
    entryPoint: String,
    cert: String,
    metadataUrl: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'configured', 'error'],
    default: 'inactive'
  },
  domains: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastSync: Date,
  enabled: {
    type: Boolean,
    default: false
  }
});

ssoConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SSOConfig', ssoConfigSchema);