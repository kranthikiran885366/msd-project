const Region = require('../models/Region');
const Deployment = require('../models/Deployment');
const AWS = require('aws-sdk');
const { CloudBuild } = require('@google-cloud/cloud-build');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { CloudflareClient } = require('@cloudflare/client');

class MultiRegionService {
  constructor() {
    // Initialize cloud provider clients
    this.providers = {
      aws: {
        ecs: new AWS.ECS(),
        cloudfront: new AWS.CloudFront(),
        route53: new AWS.Route53(),
        elasticache: new AWS.ElastiCache(),
      },
      gcp: {
        build: new CloudBuild(),
        compute: new CloudBuild.ComputeClient(),
        cdn: new CloudBuild.CDNClient(),
        dns: new CloudBuild.DNSClient(),
      },
      azure: {
        compute: new ComputeManagementClient(),
        cdn: new ComputeManagementClient.CDNClient(),
        dns: new ComputeManagementClient.DNSClient(),
        cache: new ComputeManagementClient.CacheClient(),
      },
      cloudflare: new CloudflareClient(),
    };

    // Health check intervals in milliseconds
    this.healthCheckIntervals = {
      critical: 30000,  // 30 seconds
      degraded: 60000,  // 1 minute
      healthy: 300000,  // 5 minutes
    };
  }

  async createRegion(regionData) {
    const region = new Region(regionData);
    return region.save();
  }

  async listRegions() {
    return Region.find().sort({ name: 1 });
  }

  async getRegion(id) {
    return Region.findById(id).populate('deployments.deploymentId');
  }

  async toggleRegion(id) {
    const region = await Region.findById(id);
    if (!region) {
      throw new Error('Region not found');
    }

    region.isActive = !region.isActive;
    if (!region.isActive) {
      region.traffic.percentage = 0;
    }

    return region.save();
  }

  async updateTrafficDistribution(id, percentage) {
    const region = await Region.findById(id);
    if (!region) {
      throw new Error('Region not found');
    }

    // Ensure total traffic across regions doesn't exceed 100%
    const otherRegions = await Region.find({ _id: { $ne: id } });
    const totalOtherTraffic = otherRegions.reduce(
      (sum, r) => sum + (r.traffic.percentage || 0),
      0
    );

    if (totalOtherTraffic + percentage > 100) {
      throw new Error('Total traffic distribution cannot exceed 100%');
    }

    return region.updateTraffic(percentage);
  }

  async deployToRegion(regionId, deploymentId) {
    const [region, deployment] = await Promise.all([
      Region.findById(regionId),
      Deployment.findById(deploymentId),
    ]);

    if (!region || !deployment) {
      throw new Error('Region or deployment not found');
    }

    try {
      await region.addDeployment(deploymentId, deployment.version);

      // Deploy based on provider
      switch (region.provider) {
        case 'aws':
          await this._deployToAWS(region, deployment);
          break;
        case 'gcp':
          await this._deployToGCP(region, deployment);
          break;
        case 'azure':
          await this._deployToAzure(region, deployment);
          break;
        default:
          throw new Error('Unsupported provider');
      }

      await region.updateDeploymentStatus(deploymentId, 'running', {
        level: 'info',
        message: 'Deployment successful',
      });

      return region;
    } catch (error) {
      await region.updateDeploymentStatus(deploymentId, 'failed', {
        level: 'error',
        message: error.message,
      });
      throw error;
    }
  }

  async getHealthChecks() {
    const regions = await Region.find({ isActive: true });
    const healthChecks = {};

    await Promise.all(
      regions.map(async (region) => {
        try {
          const metrics = await this._checkRegionHealth(region);
          await region.updateHealth(metrics);
          
          healthChecks[region.id] = {
            health: this._calculateHealthScore(metrics),
            latency: metrics.latency,
            status: region.health.status,
          };
        } catch (error) {
          console.error(`Health check failed for region ${region.name}:`, error);
        }
      })
    );

    return healthChecks;
  }

  async _deployToAWS(region, deployment) {
    try {
      // 1. Update ECS Service
      const ecsParams = {
        cluster: region.name,
        service: deployment.name,
        taskDefinition: `${deployment.name}:${deployment.version}`,
        desiredCount: region.configuration.scalingMin,
        deploymentConfiguration: {
          maximumPercent: 200,
          minimumHealthyPercent: 100,
        },
      };
      await this.providers.aws.ecs.updateService(ecsParams).promise();

      // 2. Configure CloudFront distribution
      const distributionId = region.configuration.cdnConfig?.distributionId;
      if (distributionId) {
        const cfParams = {
          Id: distributionId,
          DistributionConfig: {
            Origins: {
              Items: [{
                DomainName: `${deployment.name}.${region.location}.amazonaws.com`,
                Id: deployment.name,
                CustomOriginConfig: {
                  HTTPPort: 80,
                  HTTPSPort: 443,
                  OriginProtocolPolicy: 'https-only',
                },
              }],
            },
            DefaultCacheBehavior: {
              TargetOriginId: deployment.name,
              ViewerProtocolPolicy: 'redirect-to-https',
              MinTTL: 0,
              DefaultTTL: 3600,
              MaxTTL: 86400,
            },
          },
        };
        await this.providers.aws.cloudfront.updateDistribution(cfParams).promise();
      }

      // 3. Update Route53 DNS
      if (region.configuration.dnsConfig?.zoneId) {
        const dnsParams = {
          ChangeBatch: {
            Changes: [{
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: `${deployment.name}.${region.location}`,
                Type: 'A',
                AliasTarget: {
                  DNSName: distributionId ? 
                    `${distributionId}.cloudfront.net` :
                    `${deployment.name}.${region.location}.amazonaws.com`,
                  EvaluateTargetHealth: true,
                  HostedZoneId: region.configuration.dnsConfig.zoneId,
                },
              },
            }],
          },
          HostedZoneId: region.configuration.dnsConfig.zoneId,
        };
        await this.providers.aws.route53.changeResourceRecordSets(dnsParams).promise();
      }

      // 4. Configure ElastiCache if needed
      if (region.configuration.cacheConfig?.enabled) {
        const cacheParams = {
          CacheClusterId: `${region.name}-${deployment.name}`,
          NumCacheNodes: region.configuration.cacheConfig.nodes || 1,
          CacheNodeType: region.configuration.cacheConfig.nodeType || 'cache.t3.micro',
          Engine: region.configuration.cacheConfig.engine || 'redis',
          Tags: [
            { Key: 'Deployment', Value: deployment.version },
            { Key: 'Region', Value: region.name },
          ],
        };
        await this.providers.aws.elasticache.createCacheCluster(cacheParams).promise();
      }

    } catch (error) {
      console.error('AWS deployment failed:', error);
      throw new Error(`AWS deployment failed: ${error.message}`);
    }
  }

  async _deployToGCP(region, deployment) {
    try {
      // 1. Build and deploy container
      const build = {
        steps: [
          {
            name: 'gcr.io/cloud-builders/docker',
            args: ['build', '-t', `${region.location}/${deployment.name}:${deployment.version}`, '.'],
          },
          {
            name: 'gcr.io/cloud-builders/gke-deploy',
            args: [
              'run',
              '--cluster', region.name,
              '--location', region.location,
              '--filename', 'k8s/deployment.yaml',
            ],
          },
        ],
        substitutions: {
          _VERSION: deployment.version,
          _REGION: region.location,
        },
        options: {
          machineType: 'N1_HIGHCPU_8',
          diskSizeGb: '100',
        },
      };

      await this.providers.gcp.build.createBuild(build);

      // 2. Configure CDN
      if (region.configuration.cdnConfig?.enabled) {
        const cdnConfig = {
          name: `${region.name}-cdn`,
          origin: `${deployment.name}-${region.location}.appspot.com`,
          cacheMode: 'USE_ORIGIN_HEADERS',
          defaultTtl: 3600,
        };
        await this.providers.gcp.cdn.createBackendService(cdnConfig);
      }

      // 3. Update DNS
      if (region.configuration.dnsConfig?.zone) {
        const dnsConfig = {
          name: `${deployment.name}.${region.location}`,
          type: 'A',
          ttl: 300,
          rrdatas: [`${deployment.name}-${region.location}.appspot.com`],
        };
        await this.providers.gcp.dns.changes.create(dnsConfig);
      }

    } catch (error) {
      console.error('GCP deployment failed:', error);
      throw new Error(`GCP deployment failed: ${error.message}`);
    }
  }

  async _deployToAzure(region, deployment) {
    try {
      // 1. Deploy to Azure Container Apps
      const deployParams = {
        location: region.location,
        tags: {
          version: deployment.version,
          environment: region.name,
        },
        properties: {
          configuration: {
            ingress: {
              external: true,
              targetPort: 80,
            },
            registries: [{
              server: region.configuration.registry,
              username: region.configuration.credentials.username,
              passwordSecretRef: 'registry-password',
            }],
          },
          template: {
            containers: [{
              name: deployment.name,
              image: `${region.configuration.registry}/${deployment.name}:${deployment.version}`,
              resources: {
                cpu: region.configuration.cpu || 1,
                memory: region.configuration.memory || '2Gi',
              },
            }],
            scale: {
              minReplicas: region.configuration.scalingMin,
              maxReplicas: region.configuration.scalingMax,
              rules: [{
                name: 'http-rule',
                http: {
                  metadata: {
                    concurrentRequests: '100',
                  },
                },
              }],
            },
          },
        },
      };

      await this.providers.azure.containerApps.createOrUpdate(
        region.name,
        deployment.name,
        deployParams
      );

      // 2. Configure Azure CDN
      if (region.configuration.cdnConfig?.enabled) {
        const cdnParams = {
          location: region.location,
          sku: {
            name: region.configuration.cdnConfig.sku || 'Standard_Microsoft',
          },
          properties: {
            originHostHeader: `${deployment.name}.azurecontainerapps.io`,
            origins: [{
              name: `${deployment.name}-origin`,
              properties: {
                hostName: `${deployment.name}.azurecontainerapps.io`,
              },
            }],
          },
        };
        await this.providers.azure.cdn.profiles.createOrUpdate(
          region.name,
          `${deployment.name}-cdn`,
          cdnParams
        );
      }

      // 3. Update DNS
      if (region.configuration.dnsConfig?.zone) {
        const dnsParams = {
          zone: region.configuration.dnsConfig.zone,
          relativeRecordSetName: deployment.name,
          recordType: 'A',
          parameters: {
            ttl: 3600,
            targetResource: {
              id: `/subscriptions/${region.configuration.subscriptionId}/resourceGroups/${region.name}/providers/Microsoft.Cdn/profiles/${deployment.name}-cdn`,
            },
          },
        };
        await this.providers.azure.dns.recordSets.createOrUpdate(dnsParams);
      }

    } catch (error) {
      console.error('Azure deployment failed:', error);
      throw new Error(`Azure deployment failed: ${error.message}`);
    }
  }

  async _checkRegionHealth(region) {
    try {
      const metrics = {
        cpuUsage: 0,
        memoryUsage: 0,
        latency: 0,
        errorRate: 0,
        availability: 0,
        responseTime: 0,
        throughput: 0,
      };

      switch (region.provider) {
        case 'aws':
          const [ecsMetrics, cloudFrontMetrics] = await Promise.all([
            this._getAWSECSMetrics(region),
            this._getAWSCloudFrontMetrics(region),
          ]);
          
          metrics.cpuUsage = ecsMetrics.cpuUtilization;
          metrics.memoryUsage = ecsMetrics.memoryUtilization;
          metrics.latency = cloudFrontMetrics.totalLatency;
          metrics.errorRate = cloudFrontMetrics.errorRate;
          metrics.availability = cloudFrontMetrics.availability;
          metrics.responseTime = cloudFrontMetrics.responseTime;
          metrics.throughput = cloudFrontMetrics.requests;
          break;

        case 'gcp':
          const gcpMetrics = await this._getGCPMetrics(region);
          metrics.cpuUsage = gcpMetrics.cpu;
          metrics.memoryUsage = gcpMetrics.memory;
          metrics.latency = gcpMetrics.latency;
          metrics.errorRate = gcpMetrics.errors;
          metrics.availability = gcpMetrics.uptime;
          metrics.responseTime = gcpMetrics.responseTime;
          metrics.throughput = gcpMetrics.requests;
          break;

        case 'azure':
          const azureMetrics = await this._getAzureMetrics(region);
          metrics.cpuUsage = azureMetrics.cpu;
          metrics.memoryUsage = azureMetrics.memory;
          metrics.latency = azureMetrics.latency;
          metrics.errorRate = azureMetrics.errors;
          metrics.availability = azureMetrics.availability;
          metrics.responseTime = azureMetrics.responseTime;
          metrics.throughput = azureMetrics.requests;
          break;
      }

      // Update health check interval based on metrics
      this._updateHealthCheckInterval(region, metrics);

      return metrics;
    } catch (error) {
      console.error(`Health check failed for region ${region.name}:`, error);
      throw error;
    }
  }

  async _getAWSECSMetrics(region) {
    const now = new Date();
    const metrics = await this.providers.aws.ecs.getMetricData({
      MetricDataQueries: [
        {
          Id: 'cpu',
          MetricStat: {
            Metric: {
              Namespace: 'AWS/ECS',
              MetricName: 'CPUUtilization',
              Dimensions: [{ Name: 'ClusterName', Value: region.name }],
            },
            Period: 300,
            Stat: 'Average',
          },
        },
        {
          Id: 'memory',
          MetricStat: {
            Metric: {
              Namespace: 'AWS/ECS',
              MetricName: 'MemoryUtilization',
              Dimensions: [{ Name: 'ClusterName', Value: region.name }],
            },
            Period: 300,
            Stat: 'Average',
          },
        },
      ],
      StartTime: new Date(now.getTime() - 5 * 60000),
      EndTime: now,
    }).promise();

    return {
      cpuUtilization: metrics.MetricDataResults[0].Values[0] || 0,
      memoryUtilization: metrics.MetricDataResults[1].Values[0] || 0,
    };
  }

  async _getAWSCloudFrontMetrics(region) {
    const distributionId = region.configuration.cdnConfig?.distributionId;
    if (!distributionId) return {};

    const now = new Date();
    const metrics = await this.providers.aws.cloudfront.getMetricData({
      MetricDataQueries: [
        {
          Id: 'latency',
          MetricStat: {
            Metric: {
              Namespace: 'AWS/CloudFront',
              MetricName: 'TotalLatency',
              Dimensions: [{ Name: 'DistributionId', Value: distributionId }],
            },
            Period: 300,
            Stat: 'Average',
          },
        },
        {
          Id: 'errors',
          MetricStat: {
            Metric: {
              Namespace: 'AWS/CloudFront',
              MetricName: 'TotalErrorRate',
              Dimensions: [{ Name: 'DistributionId', Value: distributionId }],
            },
            Period: 300,
            Stat: 'Average',
          },
        },
      ],
      StartTime: new Date(now.getTime() - 5 * 60000),
      EndTime: now,
    }).promise();

    return {
      totalLatency: metrics.MetricDataResults[0].Values[0] || 0,
      errorRate: metrics.MetricDataResults[1].Values[0] || 0,
    };
  }

  async _getGCPMetrics(region) {
    // Implement GCP metrics collection
    const metrics = await this.providers.gcp.compute.getMetrics({
      name: region.name,
      filter: 'metric.type = "compute.googleapis.com/instance/cpu/utilization"',
    });

    return {
      cpu: metrics.cpu || 0,
      memory: metrics.memory || 0,
      latency: metrics.latency || 0,
      errors: metrics.errors || 0,
      uptime: metrics.uptime || 100,
      responseTime: metrics.responseTime || 0,
      requests: metrics.requests || 0,
    };
  }

  async _getAzureMetrics(region) {
    // Implement Azure metrics collection
    const metrics = await this.providers.azure.compute.getMetrics({
      resourceGroupName: region.name,
      interval: 'PT5M',
    });

    return {
      cpu: metrics.cpu || 0,
      memory: metrics.memory || 0,
      latency: metrics.latency || 0,
      errors: metrics.errors || 0,
      availability: metrics.availability || 100,
      responseTime: metrics.responseTime || 0,
      requests: metrics.requests || 0,
    };
  }

  _updateHealthCheckInterval(region, metrics) {
    const score = this._calculateHealthScore(metrics);
    let interval;

    if (score < 0.5) {
      interval = this.healthCheckIntervals.critical;
    } else if (score < 0.8) {
      interval = this.healthCheckIntervals.degraded;
    } else {
      interval = this.healthCheckIntervals.healthy;
    }

    // Update the monitoring interval for this region
    region.configuration.monitoring = {
      ...region.configuration.monitoring,
      interval,
    };
  }

  _calculateHealthScore(metrics) {
    // Calculate health score between 0 and 1
    const weights = {
      cpu: 0.2,
      memory: 0.2,
      latency: 0.15,
      errorRate: 0.15,
      availability: 0.15,
      responseTime: 0.1,
      throughput: 0.05,
    };

    const scores = {
      cpu: 1 - (metrics.cpuUsage / 100),
      memory: 1 - (metrics.memoryUsage / 100),
      latency: 1 - Math.min(metrics.latency / 1000, 1),
      errorRate: 1 - Math.min(metrics.errorRate / 100, 1),
      availability: metrics.availability / 100,
      responseTime: 1 - Math.min(metrics.responseTime / 1000, 1),
      throughput: Math.min(metrics.throughput / 1000, 1),
    };

    return Object.entries(weights).reduce((total, [metric, weight]) => {
      return total + (scores[metric] * weight);
    }, 0);
  }
}

module.exports = new MultiRegionService();