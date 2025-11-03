const BaseController = require('./BaseController');
const gitIntegrationService = require('../services/gitIntegrationService');
const deploymentService = require('../services/deploymentService');
const Project = require('../models/Project');
const { validateGitSignature } = require('../utils/webhookManager');

class GitDeploymentController extends BaseController {
  constructor() {
    super();
    BaseController.bindMethods(this);
  }
  async configureRepository(req, res, next) {
    try {
      const { projectId } = req.params;
      const { provider, repoDetails } = req.body;
      const project = await gitIntegrationService.configureRepository(projectId, provider, repoDetails);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const { provider, projectId } = req.params;
      const signature = req.headers['x-hub-signature-256'] || req.headers['x-gitlab-token'] || req.headers['x-hook-signature'];
      
      // Validate webhook signature
      if (!validateGitSignature(provider, req.body, signature)) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check deploy lock
      if (project.deployLock?.enabled) {
        return res.status(403).json({
          error: 'Deployments are locked',
          reason: project.deployLock.reason
        });
      }

      const deployment = await gitIntegrationService.handleWebhook(provider, projectId, req.body);
      res.status(202).json(deployment);
    } catch (error) {
      next(error);
    }
  }

  async createPreviewDeploy(req, res, next) {
    try {
      const { projectId } = req.params;
      const { prDetails } = req.body;
      const deployment = await gitIntegrationService.createPreviewDeploy(projectId, prDetails);
      res.status(202).json(deployment);
    } catch (error) {
      next(error);
    }
  }

  async scheduleDeployment(req, res, next) {
    try {
      const { projectId } = req.params;
      const schedule = req.body;
      const project = await gitIntegrationService.scheduleDeployment(projectId, schedule);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  async toggleDeployLock(req, res, next) {
    try {
      const { projectId } = req.params;
      const { enabled, reason } = req.body;
      const project = await gitIntegrationService.toggleDeployLock(projectId, enabled, reason);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  async getBuildCache(req, res, next) {
    try {
      const { projectId } = req.params;
      const { cacheKey } = req.query;
      const cache = await deploymentService.checkBuildCache(projectId, cacheKey);
      res.json(cache);
    } catch (error) {
      next(error);
    }
  }

  async updateBuildCache(req, res, next) {
    try {
      const { projectId } = req.params;
      const { cacheKey, framework, buildSteps, size } = req.body;
      const cache = await deploymentService.saveBuildCache(projectId, cacheKey, framework, buildSteps, size);
      res.json(cache);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GitDeploymentController();