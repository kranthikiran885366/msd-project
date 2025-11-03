const ssoService = require('../services/ssoService');
const { successResponse, errorResponse } = require('../utils/response');

class SSOController {
  async getConfig(req, res, next) {
    try {
      const config = await ssoService.getConfig(req.params.organizationId);
      res.json(successResponse(config));
    } catch (error) {
      next(error);
    }
  }

  async createConfig(req, res, next) {
    try {
      const config = await ssoService.createConfig({
        ...req.body,
        organizationId: req.params.organizationId
      });
      res.status(201).json(successResponse(config));
    } catch (error) {
      next(error);
    }
  }

  async updateConfig(req, res, next) {
    try {
      const config = await ssoService.updateConfig(req.params.organizationId, req.body);
      res.json(successResponse(config));
    } catch (error) {
      next(error);
    }
  }

  async toggleSSO(req, res, next) {
    try {
      const config = await ssoService.toggleSSO(
        req.params.organizationId,
        req.body.enabled
      );
      res.json(successResponse(config));
    } catch (error) {
      next(error);
    }
  }

  async testConnection(req, res, next) {
    try {
      const result = await ssoService.testConnection(req.params.organizationId);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async deleteConfig(req, res, next) {
    try {
      await ssoService.deleteConfig(req.params.organizationId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SSOController();