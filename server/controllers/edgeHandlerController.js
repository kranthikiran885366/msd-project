const BaseController = require('./BaseController');
const edgeHandlerService = require('../services/edgeHandlerService');

class EdgeHandlerController extends BaseController {
  constructor() {
    super();
    BaseController.bindMethods(this);
  }

  async listHandlers(req, res) {
    try {
      const handlers = await edgeHandlerService.listHandlers();
      res.json(handlers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getHandler(req, res) {
    try {
      const handler = await edgeHandlerService.getHandler(req.params.id);
      if (!handler) {
        return res.status(404).json({ error: 'Handler not found' });
      }
      res.json(handler);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createHandler(req, res) {
    try {
      const handler = await edgeHandlerService.createHandler(req.body);
      res.status(201).json(handler);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Handler name already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async updateHandler(req, res) {
    try {
      const handler = await edgeHandlerService.updateHandler(req.params.id, req.body);
      if (!handler) {
        return res.status(404).json({ error: 'Handler not found' });
      }
      res.json(handler);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteHandler(req, res) {
    try {
      const handler = await edgeHandlerService.deleteHandler(req.params.id);
      if (!handler) {
        return res.status(404).json({ error: 'Handler not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deployHandler(req, res) {
    try {
      const handler = await edgeHandlerService.deployHandler(req.params.id);
      res.json(handler);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async testHandler(req, res) {
    try {
      const result = await edgeHandlerService.testHandler(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async listHandlers(req, res) {
    try {
      const handlers = await edgeHandlerService.listHandlers();
      res.json(handlers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = EdgeHandlerController;