const multiRegionService = require('../services/multiRegionService');

class MultiRegionController {
  async listRegions(req, res) {
    try {
      const regions = await multiRegionService.listRegions();
      res.json(regions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createRegion(req, res) {
    try {
      const region = await multiRegionService.createRegion(req.body);
      res.status(201).json(region);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async toggleRegion(req, res) {
    try {
      const region = await multiRegionService.toggleRegion(req.params.id);
      res.json(region);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTrafficDistribution(req, res) {
    try {
      const region = await multiRegionService.updateTrafficDistribution(
        req.params.id,
        req.body.percentage
      );
      res.json(region);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deployToRegion(req, res) {
    try {
      const region = await multiRegionService.deployToRegion(
        req.body.regionId,
        req.body.deploymentId
      );
      res.json(region);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getHealthChecks(req, res) {
    try {
      const healthChecks = await multiRegionService.getHealthChecks();
      res.json(healthChecks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MultiRegionController();