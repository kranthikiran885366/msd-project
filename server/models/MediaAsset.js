const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  width: Number,
  height: Number,
  format: String,
  resolution: String,
  bitrate: String,
  suffix: String,
  quality: String,
});

const edgeMetricsSchema = new mongoose.Schema({
  region: String,
  status: {
    type: String,
    enum: ['active', 'purging', 'error'],
    default: 'active',
  },
  lastUpdated: Date,
  metrics: {
    bandwidth: Number,
    requests: Number,
    cacheHits: Number,
    cacheMisses: Number,
    errors: Number,
    latency: Number,
  },
});

const mediaAssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  originalUrl: {
    type: String,
    required: true,
  },
  cdnUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['processing', 'optimizing', 'active', 'error', 'deleting'],
    default: 'processing',
  },
  compressionLevel: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'medium',
  },
  cacheControl: {
    type: String,
    default: 'public, max-age=31536000',
  },
  region: {
    type: String,
    default: 'auto',
  },
  provider: {
    type: String,
    enum: ['aws', 'gcp', 'azure'],
    required: true,
  },
  metadata: {
    width: Number,
    height: Number,
    format: String,
    duration: Number,
    bitrate: Number,
    codec: String,
    fileSize: Number,
    lastModified: Date,
    mimeType: String,
    orientation: Number,
    colorSpace: String,
    hasAlpha: Boolean,
    isAnimated: Boolean,
    frames: Number,
  },
  optimizationHistory: [{
    timestamp: Date,
    action: String,
    originalSize: Number,
    optimizedSize: Number,
    savings: Number,
    settings: {
      compressionLevel: String,
      quality: Number,
      format: String,
      width: Number,
      height: Number,
      codec: String,
      bitrate: String,
    },
  }],
  variants: [variantSchema],
  cacheStatus: {
    lastPurged: Date,
    nextPurgeScheduled: Date,
    globalCacheHitRate: Number,
    edges: [edgeMetricsSchema],
  },
  security: {
    accessControl: {
      type: String,
      enum: ['public', 'private', 'signed'],
      default: 'public',
    },
    signedUrlExpiry: Number,
    allowedReferers: [String],
    allowedIPs: [String],
    corsSettings: {
      allowedOrigins: [String],
      allowedMethods: [String],
      maxAge: Number,
    },
  },
  transformations: {
    resize: {
      width: Number,
      height: Number,
      fit: String,
      position: String,
    },
    crop: {
      width: Number,
      height: Number,
      x: Number,
      y: Number,
    },
    watermark: {
      enabled: Boolean,
      image: String,
      position: String,
      opacity: Number,
    },
  },
  analytics: {
    totalBandwidth: Number,
    totalRequests: Number,
    averageLatency: Number,
    peakBandwidth: Number,
    lastAccessedAt: Date,
    popularRegions: [{
      region: String,
      requests: Number,
      bandwidth: Number,
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

mediaAssetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

mediaAssetSchema.methods.optimize = async function(settings) {
  const originalSize = this.variants.reduce((total, v) => total + v.size, 0);
  
  // Calculate optimization metrics
  const optimizedSize = this.variants.reduce((total, v) => total + v.size, 0);
  const savings = ((originalSize - optimizedSize) / originalSize) * 100;

  // Record optimization history
  this.optimizationHistory.push({
    timestamp: new Date(),
    action: 'optimize',
    originalSize,
    optimizedSize,
    savings,
    settings: {
      compressionLevel: settings.compressionLevel,
      quality: settings.quality,
      format: settings.format,
      width: settings.width,
      height: settings.height,
      codec: settings.codec,
      bitrate: settings.bitrate,
    },
  });

  return this.save();
};

mediaAssetSchema.methods.purgeCache = async function() {
  this.cacheStatus.lastPurged = new Date();
  this.cacheStatus.nextPurgeScheduled = new Date(Date.now() + 24 * 60 * 60 * 1000); // Schedule next purge in 24h
  
  this.cacheStatus.edges.forEach(edge => {
    edge.status = 'purging';
    edge.lastUpdated = new Date();
    
    // Reset edge metrics
    edge.metrics = {
      bandwidth: 0,
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      latency: 0,
    };
  });

  return this.save();
};

mediaAssetSchema.methods.updateEdgeMetrics = async function(edgeMetrics) {
  edgeMetrics.forEach(metric => {
    const edge = this.cacheStatus.edges.find(e => e.region === metric.region);
    if (edge) {
      edge.metrics = {
        ...edge.metrics,
        ...metric.metrics,
      };
      edge.lastUpdated = new Date();
    }
  });

  // Calculate global cache hit rate
  const totalRequests = this.cacheStatus.edges.reduce((sum, edge) => 
    sum + edge.metrics.cacheHits + edge.metrics.cacheMisses, 0);
  const totalHits = this.cacheStatus.edges.reduce((sum, edge) => 
    sum + edge.metrics.cacheHits, 0);
  
  this.cacheStatus.globalCacheHitRate = totalRequests > 0 ? 
    (totalHits / totalRequests) * 100 : 0;

  return this.save();
};

mediaAssetSchema.methods.updateAnalytics = async function(metrics) {
  this.analytics = {
    ...this.analytics,
    totalBandwidth: (this.analytics.totalBandwidth || 0) + metrics.bandwidth,
    totalRequests: (this.analytics.totalRequests || 0) + metrics.requests,
    averageLatency: metrics.latency,
    lastAccessedAt: new Date(),
  };

  // Update peak bandwidth if current bandwidth is higher
  if (!this.analytics.peakBandwidth || metrics.bandwidth > this.analytics.peakBandwidth) {
    this.analytics.peakBandwidth = metrics.bandwidth;
  }

  // Update popular regions
  const regionIndex = this.analytics.popularRegions.findIndex(r => r.region === metrics.region);
  if (regionIndex >= 0) {
    this.analytics.popularRegions[regionIndex].requests += metrics.requests;
    this.analytics.popularRegions[regionIndex].bandwidth += metrics.bandwidth;
  } else {
    this.analytics.popularRegions.push({
      region: metrics.region,
      requests: metrics.requests,
      bandwidth: metrics.bandwidth,
    });
  }

  // Sort popular regions by requests
  this.analytics.popularRegions.sort((a, b) => b.requests - a.requests);
  
  return this.save();
};

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);