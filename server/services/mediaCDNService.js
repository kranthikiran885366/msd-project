const MediaAsset = require('../models/MediaAsset');
const sharp = require('sharp');
const { Storage } = require('@google-cloud/storage');
const AWS = require('aws-sdk');
const { BlobServiceClient } = require('@azure/storage-blob');
const { CloudflareClient } = require('@cloudflare/client');
const ffmpeg = require('fluent-ffmpeg');
const fetch = require('node-fetch');
const path = require('path');
const mime = require('mime-types');
const { promisify } = require('util');
const { createReadStream } = require('fs');

class MediaCDNService {
  constructor() {
    // Initialize storage providers
    this.providers = {
      gcp: {
        storage: new Storage(),
        bucket: null,
      },
      aws: {
        s3: new AWS.S3(),
        cloudfront: new AWS.CloudFront(),
        bucket: null,
      },
      azure: {
        storage: BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING),
        container: null,
      },
      cloudflare: new CloudflareClient({
        token: process.env.CLOUDFLARE_API_TOKEN,
      }),
    };

    // Initialize storage based on provider
    this.initializeStorage();

    // Configure image processing options
    this.imageOptions = {
      formats: ['jpeg', 'png', 'webp', 'avif'],
      sizes: [
        { width: 320, height: null, suffix: 'sm' },
        { width: 640, height: null, suffix: 'md' },
        { width: 1280, height: null, suffix: 'lg' },
        { width: 1920, height: null, suffix: 'xl' },
      ],
    };

    // Configure video processing options
    this.videoOptions = {
      formats: ['mp4', 'webm'],
      qualities: [
        { resolution: '480p', bitrate: '1000k' },
        { resolution: '720p', bitrate: '2500k' },
        { resolution: '1080p', bitrate: '5000k' },
      ],
    };
  }

  async initializeStorage() {
    const provider = process.env.CDN_STORAGE_PROVIDER || 'gcp';
    
    switch (provider) {
      case 'gcp':
        this.providers.gcp.bucket = this.providers.gcp.storage.bucket(process.env.GCP_BUCKET_NAME);
        break;
      case 'aws':
        this.providers.aws.bucket = process.env.AWS_BUCKET_NAME;
        break;
      case 'azure':
        this.providers.azure.container = this.providers.azure.storage.getContainerClient(
          process.env.AZURE_CONTAINER_NAME
        );
        break;
    }

    this.activeProvider = provider;
  }

  async uploadAsset(file, settings = {}) {
    const fileName = `${Date.now()}-${path.basename(file.originalname)}`;
    const contentType = file.mimetype || mime.lookup(fileName) || 'application/octet-stream';
    
    // Create asset record
    const asset = new MediaAsset({
      name: fileName,
      type: contentType,
      size: file.size,
      originalUrl: await this._getAssetUrl(fileName),
      cdnUrl: await this._getCdnUrl(fileName),
      region: settings.region || 'auto',
      compressionLevel: settings.compressionLevel || 'medium',
      cacheControl: settings.cacheControl || 'public, max-age=31536000',
    });

    try {
      // Extract metadata
      await this._extractMetadata(file, asset);

      // Upload original file
      await this._uploadToStorage(fileName, file.buffer, {
        contentType,
        cacheControl: asset.cacheControl,
        metadata: {
          originalName: file.originalname,
          contentType,
          ...asset.metadata,
        },
      });

      // Generate optimized versions based on content type
      if (contentType.startsWith('image/')) {
        await this._processImage(file, fileName, asset, settings);
      } else if (contentType.startsWith('video/')) {
        await this._processVideo(file, fileName, asset, settings);
      }

      // Update asset status
      asset.status = 'active';
      await asset.save();

      // Warm up CDN caches
      await this._warmupCaches(asset);

      return asset;
    } catch (error) {
      asset.status = 'error';
      await asset.save();
      throw error;
    }
  }

  async _extractMetadata(file, asset) {
    if (file.mimetype.startsWith('image/')) {
      const metadata = await sharp(file.buffer).metadata();
      asset.metadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      };
    } else if (file.mimetype.startsWith('video/')) {
      const getMetadata = promisify(ffmpeg.ffprobe);
      const metadata = await getMetadata(file.buffer);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      
      asset.metadata = {
        width: videoStream.width,
        height: videoStream.height,
        duration: metadata.format.duration,
        bitrate: metadata.format.bit_rate,
        codec: videoStream.codec_name,
      };
    }
  }

  async _processImage(file, fileName, asset, settings) {
    const tasks = [];
    const baseImage = sharp(file.buffer);

    // Generate different sizes
    for (const size of this.imageOptions.sizes) {
      // Generate each format for this size
      for (const format of this.imageOptions.formats) {
        const resizedBuffer = await baseImage
          .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
          [format]({
            quality: this._getQualityForCompression(settings.compressionLevel),
            effort: 6,
          })
          .toBuffer();

        const variantName = `${path.basename(fileName, path.extname(fileName))}-${size.suffix}.${format}`;
        
        tasks.push(
          this._uploadToStorage(variantName, resizedBuffer, {
            contentType: `image/${format}`,
            cacheControl: asset.cacheControl,
          })
        );

        asset.variants = asset.variants || [];
        asset.variants.push({
          url: await this._getCdnUrl(variantName),
          size: resizedBuffer.length,
          width: size.width,
          format,
          suffix: size.suffix,
        });
      }
    }

    await Promise.all(tasks);
  }

  async _processVideo(file, fileName, asset, settings) {
    const tasks = [];
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-'));

    try {
      for (const quality of this.videoOptions.qualities) {
        for (const format of this.videoOptions.formats) {
          const outputPath = path.join(tempDir, `${fileName}-${quality.resolution}.${format}`);
          
          await new Promise((resolve, reject) => {
            ffmpeg(file.buffer)
              .size(quality.resolution)
              .videoBitrate(quality.bitrate)
              .format(format)
              .on('end', resolve)
              .on('error', reject)
              .save(outputPath);
          });

          const variantName = `${path.basename(fileName, path.extname(fileName))}-${quality.resolution}.${format}`;
          const variantBuffer = await fs.readFile(outputPath);

          tasks.push(
            this._uploadToStorage(variantName, variantBuffer, {
              contentType: `video/${format}`,
              cacheControl: asset.cacheControl,
            })
          );

          asset.variants = asset.variants || [];
          asset.variants.push({
            url: await this._getCdnUrl(variantName),
            size: variantBuffer.length,
            resolution: quality.resolution,
            format,
            bitrate: quality.bitrate,
          });
        }
      }

      await Promise.all(tasks);
    } finally {
      await fs.rm(tempDir, { recursive: true });
    }
  }

  async optimizeAsset(id, settings) {
    const asset = await MediaAsset.findById(id);
    if (!asset) throw new Error('Asset not found');

    try {
      // Re-fetch and re-process the asset with new settings
      const response = await fetch(asset.originalUrl);
      const buffer = await response.buffer();
      
      if (asset.type.startsWith('image/')) {
        await this._processImage(
          { buffer, mimetype: asset.type },
          asset.name,
          asset,
          settings
        );
      } else if (asset.type.startsWith('video/')) {
        await this._processVideo(
          { buffer, mimetype: asset.type },
          asset.name,
          asset,
          settings
        );
      }

      // Update optimization history
      await asset.optimize(settings);

      // Purge CDN caches to serve new versions
      await this.purgeCache(id);

      return asset;
    } catch (error) {
      console.error('Optimization failed:', error);
      throw error;
    }
  }

  async purgeCache(id) {
    const asset = await MediaAsset.findById(id);
    if (!asset) throw new Error('Asset not found');

    const paths = [
      asset.cdnUrl,
      ...(asset.variants || []).map(v => v.url)
    ];

    try {
      switch (this.activeProvider) {
        case 'aws':
          await this._purgeCloudFrontCache(paths);
          break;
        case 'gcp':
          await this._purgeGCPCache(paths);
          break;
        case 'azure':
          await this._purgeAzureCache(paths);
          break;
      }

      // Always purge Cloudflare cache if configured
      if (process.env.CLOUDFLARE_ENABLED === 'true') {
        await this._purgeCloudflareCache(paths);
      }

      await asset.purgeCache();
      return asset;
    } catch (error) {
      console.error('Cache purge failed:', error);
      throw error;
    }
  }

  async _purgeCloudFrontCache(paths) {
    await this.providers.aws.cloudfront.createInvalidation({
      DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `purge-${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths.map(p => new URL(p).pathname),
        },
      },
    }).promise();
  }

  async _purgeGCPCache(paths) {
    await this.providers.gcp.storage.bucket(process.env.GCP_BUCKET_NAME).deleteFiles({
      prefix: paths.map(p => new URL(p).pathname),
      force: true,
    });
  }

  async _purgeAzureCache(paths) {
    const purgeEndpoint = `https://management.azure.com/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${process.env.AZURE_RESOURCE_GROUP}/providers/Microsoft.Cdn/profiles/${process.env.AZURE_CDN_PROFILE}/endpoints/${process.env.AZURE_CDN_ENDPOINT}/purge?api-version=2019-04-15`;
    
    await fetch(purgeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AZURE_TOKEN}`,
      },
      body: JSON.stringify({
        contentPaths: paths.map(p => new URL(p).pathname),
      }),
    });
  }

  async _purgeCloudflareCache(paths) {
    await this.providers.cloudflare.zones.purgeCache(process.env.CLOUDFLARE_ZONE_ID, {
      files: paths,
    });
  }

  async listAssets(query = {}) {
    const { page = 1, limit = 20, type, status } = query;
    const filter = {};

    if (type) filter.type = new RegExp(`^${type}/`);
    if (status) filter.status = status;

    return MediaAsset.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async getAsset(id) {
    const asset = await MediaAsset.findById(id);
    if (!asset) throw new Error('Asset not found');

    // Add real-time CDN metrics if available
    asset.cdnMetrics = await this._getCDNMetrics(asset);
    return asset;
  }

  async deleteAsset(id) {
    const asset = await MediaAsset.findById(id);
    if (!asset) throw new Error('Asset not found');

    try {
      // Delete all variants
      const deletePromises = [asset.name, ...(asset.variants || []).map(v => v.url)]
        .map(url => this._deleteFromStorage(new URL(url).pathname));
      
      await Promise.all(deletePromises);

      // Purge CDN caches
      await this.purgeCache(id);

      // Delete from database
      await asset.delete();
    } catch (error) {
      console.error('Asset deletion failed:', error);
      throw error;
    }
  }

  async _uploadToStorage(fileName, buffer, options = {}) {
    switch (this.activeProvider) {
      case 'gcp':
        const file = this.providers.gcp.bucket.file(fileName);
        await file.save(buffer, {
          metadata: options,
        });
        break;

      case 'aws':
        await this.providers.aws.s3.upload({
          Bucket: this.providers.aws.bucket,
          Key: fileName,
          Body: buffer,
          ContentType: options.contentType,
          CacheControl: options.cacheControl,
          Metadata: options.metadata,
        }).promise();
        break;

      case 'azure':
        const blockBlobClient = this.providers.azure.container.getBlockBlobClient(fileName);
        await blockBlobClient.upload(buffer, buffer.length, {
          blobHTTPHeaders: {
            blobContentType: options.contentType,
            blobCacheControl: options.cacheControl,
          },
          metadata: options.metadata,
        });
        break;
    }
  }

  async _deleteFromStorage(fileName) {
    switch (this.activeProvider) {
      case 'gcp':
        await this.providers.gcp.bucket.file(fileName).delete();
        break;

      case 'aws':
        await this.providers.aws.s3.deleteObject({
          Bucket: this.providers.aws.bucket,
          Key: fileName,
        }).promise();
        break;

      case 'azure':
        const blockBlobClient = this.providers.azure.container.getBlockBlobClient(fileName);
        await blockBlobClient.delete();
        break;
    }
  }

  _getQualityForCompression(level) {
    switch (level) {
      case 'low': return 80;
      case 'medium': return 60;
      case 'high': return 40;
      default: return 70;
    }
  }

  async _getAssetUrl(fileName) {
    switch (this.activeProvider) {
      case 'gcp':
        return `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${fileName}`;
      case 'aws':
        return `https://${this.providers.aws.bucket}.s3.amazonaws.com/${fileName}`;
      case 'azure':
        return `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AZURE_CONTAINER_NAME}/${fileName}`;
      default:
        throw new Error('Invalid storage provider');
    }
  }

  async _getCdnUrl(fileName) {
    const cdnDomain = process.env.CDN_DOMAIN;
    return `https://${cdnDomain}/${fileName}`;
  }

  async _warmupCaches(asset) {
    const urls = [
      asset.cdnUrl,
      ...(asset.variants || []).map(v => v.url)
    ];

    try {
      await Promise.all(urls.map(url => 
        fetch(url, { method: 'HEAD' })
      ));
    } catch (error) {
      console.warn('Cache warmup partially failed:', error);
    }
  }

  async _getCDNMetrics(asset) {
    try {
      const metrics = {
        bandwidth: 0,
        requests: 0,
        cacheHitRate: 0,
        errorRate: 0,
        latency: 0,
      };

      switch (this.activeProvider) {
        case 'aws':
          const cloudFrontMetrics = await this._getCloudFrontMetrics(asset);
          Object.assign(metrics, cloudFrontMetrics);
          break;

        case 'gcp':
          const gcpMetrics = await this._getGCPCDNMetrics(asset);
          Object.assign(metrics, gcpMetrics);
          break;

        case 'azure':
          const azureMetrics = await this._getAzureCDNMetrics(asset);
          Object.assign(metrics, azureMetrics);
          break;
      }

      return metrics;
    } catch (error) {
      console.warn('Failed to fetch CDN metrics:', error);
      return null;
    }
  }
}

module.exports = new MediaCDNService();