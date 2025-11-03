const axios = require('axios');
const { Region } = require('../models/Region');

class MultiRegionManager {
  constructor() {
    this.regions = new Map();
    this.initialize();
  }

  async initialize() {
    try {
      // Load regions from database
      const regions = await Region.find({ active: true });
      regions.forEach(region => {
        this.regions.set(region.id, {
          ...region.toObject(),
          status: 'ready',
          load: 0
        });
      });
    } catch (error) {
      console.error('Failed to initialize regions:', error);
    }
  }

  async deployToRegion(deployment, region) {
    const regionConfig = this.regions.get(region);
    if (!regionConfig) {
      throw new Error(`Region ${region} not found`);
    }

    try {
      // Call region-specific deployment endpoint
      const response = await axios.post(
        `${regionConfig.apiEndpoint}/v1/deployments`,
        {
          deployment,
          configuration: deployment.config,
          source: deployment.source
        },
        {
          headers: {
            'Authorization': `Bearer ${regionConfig.apiKey}`,
            'X-Region': region
          }
        }
      );

      return {
        regionId: region,
        deploymentId: response.data.deploymentId,
        url: response.data.url,
        status: 'deploying'
      };

    } catch (error) {
      console.error(`Deployment to region ${region} failed:`, error);
      throw new Error(`Region deployment failed: ${error.message}`);
    }
  }

  async deployToMultipleRegions(deployment, regions) {
    // Validate regions
    const invalidRegions = regions.filter(r => !this.regions.has(r));
    if (invalidRegions.length > 0) {
      throw new Error(`Invalid regions: ${invalidRegions.join(', ')}`);
    }

    // Deploy to all specified regions in parallel
    const deploymentPromises = regions.map(region => 
      this.deployToRegion(deployment, region)
    );

    const results = await Promise.allSettled(deploymentPromises);

    // Process results
    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          region: regions[index],
          error: result.reason.message
        });
      }
    });

    return { successful, failed };
  }

  async getRegionHealth(region) {
    const regionConfig = this.regions.get(region);
    if (!regionConfig) {
      throw new Error(`Region ${region} not found`);
    }

    try {
      const response = await axios.get(
        `${regionConfig.apiEndpoint}/v1/health`,
        {
          headers: {
            'Authorization': `Bearer ${regionConfig.apiKey}`,
            'X-Region': region
          }
        }
      );

      return {
        region,
        status: response.data.status,
        latency: response.data.latency,
        load: response.data.load,
        lastChecked: new Date()
      };

    } catch (error) {
      console.error(`Health check failed for region ${region}:`, error);
      return {
        region,
        status: 'error',
        error: error.message,
        lastChecked: new Date()
      };
    }
  }

  async getAllRegionsHealth() {
    const healthChecks = Array.from(this.regions.keys()).map(region => 
      this.getRegionHealth(region)
    );

    return Promise.all(healthChecks);
  }

  async getOptimalRegions(count = 1, preferredRegion = null) {
    // Get current health status of all regions
    const healthStatus = await this.getAllRegionsHealth();
    
    // Filter out unhealthy regions
    const healthyRegions = healthStatus.filter(r => r.status === 'healthy');
    
    // Sort by load and latency
    const sortedRegions = healthyRegions.sort((a, b) => {
      // If preferred region, prioritize it
      if (preferredRegion) {
        if (a.region === preferredRegion) return -1;
        if (b.region === preferredRegion) return 1;
      }
      
      // Otherwise sort by load, then latency
      if (a.load !== b.load) return a.load - b.load;
      return a.latency - b.latency;
    });

    return sortedRegions.slice(0, count).map(r => r.region);
  }

  async scaleRegion(region, replicas) {
    const regionConfig = this.regions.get(region);
    if (!regionConfig) {
      throw new Error(`Region ${region} not found`);
    }

    try {
      await axios.post(
        `${regionConfig.apiEndpoint}/v1/scale`,
        { replicas },
        {
          headers: {
            'Authorization': `Bearer ${regionConfig.apiKey}`,
            'X-Region': region
          }
        }
      );

      return {
        region,
        replicas,
        status: 'scaling'
      };

    } catch (error) {
      console.error(`Scaling region ${region} failed:`, error);
      throw new Error(`Region scaling failed: ${error.message}`);
    }
  }

  async updateRegionConfig(region, config) {
    const regionConfig = this.regions.get(region);
    if (!regionConfig) {
      throw new Error(`Region ${region} not found`);
    }

    try {
      // Update region configuration in database
      const updatedRegion = await Region.findByIdAndUpdate(
        region,
        { $set: config },
        { new: true }
      );

      // Update in-memory cache
      this.regions.set(region, {
        ...updatedRegion.toObject(),
        status: regionConfig.status,
        load: regionConfig.load
      });

      return updatedRegion;

    } catch (error) {
      console.error(`Updating region ${region} config failed:`, error);
      throw new Error(`Region config update failed: ${error.message}`);
    }
  }
}

module.exports = new MultiRegionManager();