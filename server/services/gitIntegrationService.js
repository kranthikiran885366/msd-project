const axios = require('axios');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const deploymentService = require('./deploymentService');
const { createWebhook, removeWebhook } = require('../utils/webhookManager');

class GitIntegrationService {
  constructor() {
    this.providers = {
      github: {
        baseUrl: 'https://api.github.com',
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      },
      gitlab: {
        baseUrl: 'https://gitlab.com/api/v4',
      },
      bitbucket: {
        baseUrl: 'https://api.bitbucket.org/2.0',
      },
    };
  }

  async configureRepository(projectId, provider, repoDetails) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    // Configure webhook for continuous deployment
    const webhookUrl = `${process.env.API_URL}/api/webhooks/git/${provider}/${projectId}`;
    const webhook = await createWebhook(provider, repoDetails, webhookUrl);

    // Update project with repository details
    project.repository = {
      provider,
      name: repoDetails.name,
      owner: repoDetails.owner,
      branch: repoDetails.branch || 'main',
      webhookId: webhook.id,
      deployOnPush: true,
    };

    await project.save();
    return project;
  }

  async handleWebhook(provider, projectId, payload) {
    const project = await Project.findById(projectId);
    if (!project || !project.repository) {
      throw new Error('Project not configured for git integration');
    }

    // Extract commit info based on provider
    const commitInfo = this.extractCommitInfo(provider, payload);
    
    // Check if this is a PR/branch preview
    const isPreview = this.isPreviewDeploy(provider, payload);
    
    // Create deployment
    return await deploymentService.createDeployment({
      projectId,
      gitCommit: commitInfo.commit,
      gitBranch: commitInfo.branch,
      gitAuthor: commitInfo.author,
      commitMessage: commitInfo.message,
      environment: isPreview ? 'preview' : 'production',
      deploymentContext: isPreview ? 'preview' : project.repository.branch === commitInfo.branch ? 'production' : 'staging',
    });
  }

  async createPreviewDeploy(projectId, prDetails) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    return await deploymentService.createDeployment({
      projectId,
      gitCommit: prDetails.headCommit,
      gitBranch: prDetails.branch,
      gitAuthor: prDetails.author,
      commitMessage: prDetails.title,
      environment: 'preview',
      deploymentContext: 'preview',
      previewData: {
        prNumber: prDetails.number,
        prTitle: prDetails.title,
        sourceBranch: prDetails.branch,
        targetBranch: prDetails.targetBranch,
      },
    });
  }

  async scheduleDeployment(projectId, schedule) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    // Validate cron expression
    if (!this.isValidCronExpression(schedule.cronExpression)) {
      throw new Error('Invalid cron expression');
    }

    // Add scheduled deployment
    project.scheduledDeployments = project.scheduledDeployments || [];
    project.scheduledDeployments.push({
      cronExpression: schedule.cronExpression,
      branch: schedule.branch || project.repository.branch,
      environment: schedule.environment || 'production',
      enabled: true,
      nextRun: this.getNextRunTime(schedule.cronExpression),
    });

    await project.save();
    return project;
  }

  async toggleDeployLock(projectId, lock = true, reason = '') {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    project.deployLock = {
      enabled: lock,
      reason,
      lockedAt: lock ? new Date() : null,
      lockedBy: lock ? project.lastModifiedBy : null,
    };

    await project.save();
    return project;
  }

  _extractCommitInfo(provider, payload) {
    switch (provider) {
      case 'github':
        return {
          commit: payload.after,
          branch: payload.ref.replace('refs/heads/', ''),
          author: payload.pusher.name,
          message: payload.head_commit.message,
        };
      case 'gitlab':
        return {
          commit: payload.after,
          branch: payload.ref.replace('refs/heads/', ''),
          author: payload.user_username,
          message: payload.commits[0].message,
        };
      case 'bitbucket':
        return {
          commit: payload.push.changes[0].new.target.hash,
          branch: payload.push.changes[0].new.name,
          author: payload.actor.display_name,
          message: payload.push.changes[0].new.target.message,
        };
      default:
        throw new Error('Unsupported git provider');
    }
  }

  _isPreviewDeploy(provider, payload) {
    switch (provider) {
      case 'github':
        return payload.pull_request ? true : false;
      case 'gitlab':
        return payload.object_kind === 'merge_request';
      case 'bitbucket':
        return payload.pullrequest ? true : false;
      default:
        return false;
    }
  }

  _isValidCronExpression(cron) {
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|(\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))) (\*|([0-9]|1[0-9]|2[0-3])|(\*\/([0-9]|1[0-9]|2[0-3]))) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|(\*\/([1-9]|1[0-9]|2[0-9]|3[0-1]))) (\*|([1-9]|1[0-2])|(\*\/([1-9]|1[0-2]))) (\*|([0-6])|(\*\/([0-6])))$/;
    return cronRegex.test(cron);
  }

  _getNextRunTime(cronExpression) {
    const parser = require('cron-parser');
    return parser.parseExpression(cronExpression).next().toDate();
  }
}

module.exports = new GitIntegrationService();