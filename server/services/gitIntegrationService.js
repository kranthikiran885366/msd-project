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
    const webhookUrl = `${process.env.API_URL}/api/deployments/webhooks/git/${provider}/${projectId}`;
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

    if (provider !== 'github') throw Object.assign(new Error('Only GitHub push deployments are supported by this lifecycle'), { status: 501 });
    if (payload.pull_request) throw Object.assign(new Error('Protected pull-request preview automation is not implemented'), { status: 501 });
    const expectedRepository = `${project.repository.owner}/${project.repository.name}`.toLowerCase();
    if (String(payload.repository?.full_name || '').toLowerCase() !== expectedRepository) throw Object.assign(new Error('Webhook repository does not match this project'), { status: 403 });
    if (!project.repository.deployOnPush || payload.deleted || payload.ref !== `refs/heads/${project.repository.branch}`) return { ignored: true, reason: 'Push is outside the configured deployment branch' };
    if (!/^[a-f\d]{40}$/i.test(payload.after || '') || /^0+$/.test(payload.after)) throw Object.assign(new Error('Push lacks an immutable commit identity'), { status: 400 });
    return deploymentService.createDeployment({
      projectId, gitCommit: payload.after, gitBranch: project.repository.branch,
      gitAuthor: String(payload.pusher?.name || 'github').slice(0, 200),
      commitMessage: String(payload.head_commit?.message || 'GitHub push').slice(0, 2000),
      environment: 'production', deploymentContext: 'production', triggeredBy: 'github-push',
      triggerKey: `github-push:${payload.ref}:${payload.after}`,
      userId: project.userId,
    });
  }

  async createPreviewDeploy(projectId, prDetails) {
    throw Object.assign(new Error('Protected PR previews and cleanup must be implemented before enabling preview automation'), { status: 501 });
  }

  async scheduleDeployment() {
    throw Object.assign(new Error('A durable deployment scheduler is not configured'), { status: 501 });
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

  extractCommitInfo(provider, payload) {
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

  // Backward-compatible aliases for older call sites.
  _extractCommitInfo(provider, payload) {
    return this.extractCommitInfo(provider, payload);
  }

  isPreviewDeploy(provider, payload) {
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

  _isPreviewDeploy(provider, payload) {
    return this.isPreviewDeploy(provider, payload);
  }

  isValidCronExpression(cron) {
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|(\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))) (\*|([0-9]|1[0-9]|2[0-3])|(\*\/([0-9]|1[0-9]|2[0-3]))) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|(\*\/([1-9]|1[0-9]|2[0-9]|3[0-1]))) (\*|([1-9]|1[0-2])|(\*\/([1-9]|1[0-2]))) (\*|([0-6])|(\*\/([0-6])))$/;
    return cronRegex.test(cron);
  }

  _isValidCronExpression(cron) {
    return this.isValidCronExpression(cron);
  }

  getNextRunTime(cronExpression) {
    const parser = require('cron-parser');
    return parser.parseExpression(cronExpression).next().toDate();
  }

  _getNextRunTime(cronExpression) {
    return this.getNextRunTime(cronExpression);
  }
}

module.exports = new GitIntegrationService();