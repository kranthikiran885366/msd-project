const mongoose = require('mongoose');
const Deployment = require('../models/Deployment');
const Project = require('../models/Project');
const Build = require('../models/Build');
const buildService = require('./buildService');
const notificationService = require('./notificationService');
const webhookService = require('./webhookService');
const logService = require('./logService');

class DeploymentService {
    // FIX: was (projectId, environmentId, options) — controller passes a flat options object
    async createDeployment(options = {}) {
        const {
            projectId,
            gitCommit = null,
            gitBranch = 'main',
            gitAuthor = 'system',
            commitMessage = 'No message',
            environment = 'production',
            deploymentContext = 'production',
            canaryDeployment = false,
            triggeredBy = 'manual',
            userId = null,
        } = options;

        const project = await Project.findById(projectId);
        if (!project) throw new Error('Project not found');

        const deployment = await Deployment.create({
            projectId,
            gitCommit,
            gitBranch,
            gitAuthor,
            commitMessage,
            status: 'pending',
            environment,
            deploymentContext,
            canaryDeployment,
            triggeredBy,
            userId,
            logs: []
        });

        // Fire-and-forget — caller gets the pending deployment immediately
        this.processDeployment(deployment._id).catch(error => {
            console.error(`[deploy] Deployment ${deployment._id} failed:`, error);
        });

        return deployment;
    }

    async processDeployment(deploymentId) {
        const deployment = await Deployment.findById(deploymentId).populate('projectId');
        if (!deployment) throw new Error('Deployment not found');

        try {
            await this.updateDeploymentStatus(deploymentId, 'building');

            const build = await buildService.createBuild(deployment.projectId._id, {
                branch: deployment.gitBranch,
                commitSha: deployment.gitCommit,
                deploymentId: deployment._id,
            });

            deployment.buildId = build._id;
            await deployment.save();

            const completedBuild = await this.waitForBuild(build._id);
            if (completedBuild.status === 'failed') throw new Error('Build failed');

            await this.updateDeploymentStatus(deploymentId, 'deploying');

            // Attempt provider deployment if not custom
            const project = deployment.projectId;
            const provider = deployment.provider || project.deploymentSettings?.provider || 'custom';
            let deployUrl = null;

            if (provider !== 'custom') {
                try {
                    const deployerFactory = require('./deployers/deployerFactory');
                    // FIX: factory exposes getAdapter(), not getDeployer()
                    const adapter = deployerFactory.getAdapter(provider);
                    const deployResult = await adapter.createDeployment(project, {
                        branch: deployment.gitBranch,
                        framework: project.framework,
                        buildCommand: project.buildSettings?.buildCommand,
                        outputDirectory: project.buildSettings?.outputDirectory,
                    });
                    deployUrl = deployResult.url;
                } catch (adapterErr) {
                    console.warn(`[deploy] Provider adapter error (non-fatal): ${adapterErr.message}`);
                }
            }

            await this.updateDeploymentStatus(deploymentId, 'running', {
                productionUrl: deployUrl,
                deployTime: Date.now(),
            });

            try {
                await webhookService.triggerWebhook(deployment.projectId._id, 'deployment.success', {
                    deployment: deployment.toObject(),
                    url: deployUrl,
                });
                await notificationService.sendDeploymentNotification(deployment, 'success');
            } catch (notifyErr) {
                console.warn('[deploy] Post-deploy notification error (non-fatal):', notifyErr.message);
            }

        } catch (error) {
            await this.updateDeploymentStatus(deploymentId, 'failed', { rollbackReason: error.message });

            try {
                await webhookService.triggerWebhook(deployment.projectId._id, 'deployment.failed', {
                    deployment: deployment.toObject(),
                    error: error.message,
                });
                await notificationService.sendDeploymentNotification(deployment, 'failed', error.message);
            } catch (notifyErr) {
                console.warn('[deploy] Failure notification error (non-fatal):', notifyErr.message);
            }
            throw error;
        }
    }

    async waitForBuild(buildId, timeout = 600000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const build = await Build.findById(buildId);
            if (!build) throw new Error('Build not found');
            if (build.status === 'success' || build.status === 'failed') return build;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        throw new Error('Build timeout');
    }

    async updateDeploymentStatus(deploymentId, status, updates = {}) {
        const deployment = await Deployment.findByIdAndUpdate(
            deploymentId,
            { status, ...updates },
            { new: true }
        );
        await logService.addDeploymentLog(deploymentId, `Deployment status changed to: ${status}`);
        return deployment;
    }

    async getAllDeployments(limit = 50, filters = {}) {
        return await Deployment.find(filters)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('projectId', 'name')
            .lean();
    }

    // FIX: was (projectId, options{}) — controller calls (projectId, limit, filters)
    async getDeployments(projectId, limit = 20, filters = {}) {
        return await Deployment.find({ projectId, ...filters })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }

    // FIX: method was missing — controller calls getDeploymentById()
    async getDeploymentById(deploymentId) {
        return await Deployment.findById(deploymentId)
            .populate('projectId', 'name framework')
            .populate('deployedBy', 'name email')
            .lean();
    }

    async getDeploymentLogs(deploymentId) {
        const deployment = await Deployment.findById(deploymentId).select('logs');
        if (!deployment) throw new Error('Deployment not found');
        return deployment.logs;
    }

    // FIX: method was missing — controller calls getDeploymentMetrics()
    async getDeploymentMetrics(deploymentId) {
        const deployment = await Deployment.findById(deploymentId)
            .select('status buildTime deployTime buildSize deploymentSize canaryPercentage createdAt')
            .lean();
        if (!deployment) throw new Error('Deployment not found');
        return deployment;
    }

    // FIX: method was missing — controller calls getDeploymentAnalytics()
    // FIX: deprecated mongoose.Types.ObjectId() constructor replaced with new keyword
    async getDeploymentAnalytics(projectId, timeRange = 7) {
        const since = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
        const stats = await Deployment.aggregate([
            {
                $match: {
                    projectId: new mongoose.Types.ObjectId(projectId),
                    createdAt: { $gte: since }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    successful: { $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    avgBuildTime: { $avg: '$buildTime' }
                }
            }
        ]);
        const result = stats[0] || { total: 0, successful: 0, failed: 0, avgBuildTime: 0 };
        result.successRate = result.total > 0 ? (result.successful / result.total) * 100 : 0;
        return result;
    }

    async rollbackDeployment(deploymentId, reason = 'User initiated rollback') {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) throw new Error('Deployment not found');

        const previous = await Deployment.findOne({
            projectId: deployment.projectId,
            status: 'running',
            _id: { $ne: deploymentId },
            createdAt: { $lt: deployment.createdAt }
        }).sort({ createdAt: -1 });

        if (!previous) throw new Error('No previous successful deployment found to rollback to');

        return await this.createDeployment({
            projectId: deployment.projectId,
            gitCommit: previous.gitCommit,
            gitBranch: previous.gitBranch,
            gitAuthor: previous.gitAuthor,
            commitMessage: `Rollback: ${reason}`,
            triggeredBy: 'rollback',
        });
    }

    async cancelDeployment(deploymentId) {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) throw new Error('Deployment not found');

        if (!['pending', 'building', 'deploying'].includes(deployment.status)) {
            throw new Error('Cannot cancel deployment in current status');
        }

        await this.updateDeploymentStatus(deploymentId, 'failed', { rollbackReason: 'Cancelled by user' });
        try {
            await notificationService.sendDeploymentNotification(deployment, 'cancelled');
        } catch (_) {}
        return deployment;
    }

    async addDeploymentLog(deploymentId, message, level = 'info') {
        await Deployment.findByIdAndUpdate(deploymentId, {
            $push: { logs: { timestamp: new Date(), level, message } }
        });
    }

    async checkBuildCache(projectId, cacheKey, framework) {
        return null; // Cache lookup stub — extend with Redis if needed
    }

    async saveBuildCache(projectId, cacheKey, framework, buildSteps, size) {
        return { projectId, cacheKey, framework, size, savedAt: new Date() };
    }

    async getDeploymentStats(projectId, timeRange = 30) {
        return this.getDeploymentAnalytics(projectId, timeRange);
    }
}

module.exports = new DeploymentService();
