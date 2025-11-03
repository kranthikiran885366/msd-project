const mediaCDNService = require('../services/mediaCDNService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

class MediaCDNController {
  async listAssets(req, res) {
    try {
      const assets = await mediaCDNService.listAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async uploadAsset(req, res) {
    try {
      const settings = JSON.parse(req.body.settings);
      const asset = await mediaCDNService.uploadAsset(req.file, settings);
      res.status(201).json(asset);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async optimizeAsset(req, res) {
    try {
      const asset = await mediaCDNService.optimizeAsset(req.params.id, req.body);
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async purgeCache(req, res) {
    try {
      const asset = await mediaCDNService.purgeCache(req.params.id);
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteAsset(req, res) {
    try {
      await mediaCDNService.deleteAsset(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MediaCDNController();