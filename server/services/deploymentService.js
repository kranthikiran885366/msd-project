const mongoose = require('mongoose');
const axios = require('axios');
const Deployment = require('../models/Deployment');
const Project = require('../models/Project');
const Build = require('../models/Build');
const buildService = require('./buildService');
const notificationService = require('./notificationService');
const webhookService = require('./webhookService');
const logService = require('./logService');
const deployerFactory = require('./deployers/deployerFactory');
const lifecycle = require('./deploymentLifecycle').createLifecycle(Deployment);

class DeploymentService {
    // FIX: was (projectId, environmentId, options) — controller passes a flat options object
    async createDeployment(options = {}) {
        const {
            projectId,
            gitCommit = null,
            gitBranch = null,
            customDomain = null,
            gitAuthor = 'system',
            commitMessage = 'No message',
            environment = 'production',
            deploymentContext = 'production',
            canaryDeployment = false,
            triggeredBy = 'manual',
            userId = null,
            noCache = false,
        } = options;

        const project = await Project.findById(projectId);
        if (!project) throw new Error('Project not found');
        if (userId && String(project.userId) !== String(userId)) throw Object.assign(new Error('Project not found'), { status: 404 });
        if (project.status !== 'active' || project.deployLock?.enabled) throw Object.assign(new Error('Deployments are paused for this project'), { status: 409 });

        if (!['preview', 'production', 'staging'].includes(environment)) throw Object.assign(new Error('Invalid deployment environment'), { status: 400 });
        if (gitCommit && !/^[a-f\d]{40}$/i.test(gitCommit)) throw Object.assign(new Error('A full commit SHA is required'), { status: 400 });
        if (canaryDeployment) throw Object.assign(new Error('Canary routing is not supported by this executor'), { status: 501 });
        if (customDomain) throw Object.assign(new Error('Managed custom-domain routing is not configured'), { status: 501 });
        const resolvedBranch = await this.resolveDeploymentBranch(project, gitBranch);

        if (options.triggerKey) {
            const prior = await Deployment.findOne({ projectId, triggerKey: options.triggerKey });
            if (prior) return prior;
        }
        let deployment;
        try { deployment = await Deployment.create({
            projectId,
            healthCheckPath: project.runtimeConfig?.healthCheckPath || '/',
            triggerKey: options.triggerKey || undefined,
            gitCommit,
            gitBranch: resolvedBranch,
            customDomain,
            gitAuthor,
            commitMessage,
            status: 'pending',
            environment,
            deploymentContext,
            canaryDeployment,
            triggeredBy,
            deployedBy: userId,
            provider: options.provider || project.deploymentSettings?.provider || 'custom',
            providerConfig: { ...(options.providerConfig || {}), noCache },
            logs: []
        }); } catch (error) {
            if (error.code === 11000 && options.triggerKey) {
                const prior = await Deployment.findOne({ projectId, triggerKey: options.triggerKey });
                if (prior) return prior;
            }
            throw error;
        }

        // Acknowledge only after configuration validation and durable queue insertion.
        await this.processDeployment(deployment._id);

        return await Deployment.findById(deployment._id);
    }

    async resolveDeploymentBranch(project, requestedBranch) {
        if (requestedBranch && String(requestedBranch).trim()) {
            return String(requestedBranch).trim();
        }

        const configuredBranch = project?.repository?.branch;
        if (configuredBranch && String(configuredBranch).trim()) return String(configuredBranch).trim();
        const { provider, owner, name } = project.repository || {};
        if (provider === 'github' && owner && name) {
            const branch = await this.fetchGitHubDefaultBranch(owner, name);
            if (branch) return branch;
        }

        return 'main';
    }

    async fetchGitHubDefaultBranch(owner, repo) {
        try {
            const url = `https://api.github.com/repos/${owner}/${repo}`;
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'clouddeck-deployer',
                },
            });
            return response?.data?.default_branch || null;
        } catch (_) {
            return null;
        }
    }

    async processDeployment(deploymentId) {
        const deployment = await Deployment.findById(deploymentId).populate('projectId');
        if (!deployment) throw new Error('Deployment not found');

        const project  = deployment.projectId;
        const provider = deployment.provider || project.deploymentSettings?.provider || 'custom';

        try {
            // ── Internal Docker-based deployment (AWS EC2 worker nodes) ──────────
            if (provider === 'custom') {
                await this.updateDeploymentStatus(deploymentId, 'building');

                const jobQueueService       = require('./jobQueueService');
                const projectConfigService  = require('./projectConfigService');
                const databaseService = require('./databaseService');
                const GitHubIntegration = require('../models/GitHubIntegration');

                if (!jobQueueService.isConnected) {
                    throw new Error('Job queue not available — ensure Redis is running');
                }

                // Resolve build/runtime config (with auto-detection fallbacks)
                let deployConfig;
                try {
                    deployConfig = await projectConfigService.resolveDeployConfig(project._id);
                } catch (error) { throw new Error(`Project configuration is invalid: ${error.message}`); }

                // Decrypt env variables
                let mergedEnv = {};
                try {
                    const envMap = await projectConfigService.getDecryptedEnvMap(project._id);
                    const databaseEnv = await databaseService.getProjectRuntimeDatabaseEnv(project._id);
                    mergedEnv = { ...envMap, ...databaseEnv };
                } catch (error) { throw new Error(`Environment configuration could not be decrypted: ${error.message}`); }

                // Get GitHub access token — try by project owner, then repo owner username, then any available
                const ghIntegration =
                    await GitHubIntegration.findOne({ userId: project.userId }).lean();
                const accessToken = ghIntegration?.accessToken || project.repository?.accessToken;

                await jobQueueService.queueDeployment(deploymentId.toString(), {
                    repositoryUrl: project.repository?.url ||
                        (project.repository?.owner && project.repository?.name
                            ? `https://github.com/${project.repository.owner}/${project.repository.name}.git`
                            : null),
                    gitCommit:       deployment.gitCommit,
                    healthCheckPath: deployment.healthCheckPath,
                    branch:          deployment.gitBranch || project.repository?.branch || 'main',
                    environment:     deployment.environment || 'production',
                    noCache:         Boolean(deployment.providerConfig?.noCache || false),
                    // Build settings from project
                    runtime:         deployConfig.runtime,
                    installCommand:  project.runtimeConfig?.installCommand || project.buildSettings?.installCommand || '',
                    buildCommand:    project.runtimeConfig?.buildCommand || project.buildSettings?.buildCommand || '',
                    startCommand:    project.runtimeConfig?.startCommand || project.buildSettings?.startCommand || '',
                    outputDirectory: project.buildSettings?.outputDirectory|| deployConfig.outputDirectory || '',
                    rootDirectory:   project.buildSettings?.rootDirectory  || '/',
                    appPort:         project.runtimeConfig?.port || null,
                    envVariables:    mergedEnv,
                    region:          project.deploymentSettings?.region || 'us-east-1',
                    accessToken,
                    // Domain assignment for routing
                    customDomain: deployment.customDomain || null,
                    domainVerified: !!(deployment.customDomain),
                });

                console.log(`[deploy] Deployment ${deploymentId} queued — runtime=${deployConfig.runtime} port=${deployConfig.port}`);
                return;
            }

            // ── External provider deployment (Vercel / Netlify / Render) ─────────
            await this.updateDeploymentStatus(deploymentId, 'building');

            const build = await buildService.createBuild(project._id, {
                branch:    deployment.gitBranch,
                commitSha: deployment.gitCommit,
                deploymentId: deployment._id,
            });
            deployment.buildId = build._id;
            await deployment.save();

            const completedBuild = await this.waitForBuild(build._id);
            if (completedBuild.status === 'failed') throw new Error('Build failed');

            await this.updateDeploymentStatus(deploymentId, 'deploying');

            let deployUrl = null;
            try {
                const adapter = deployerFactory.getAdapter(provider);
                const deployResult = await adapter.createDeployment(project, {
                    branch:          deployment.gitBranch,
                    framework:       project.framework,
                    buildCommand:    project.buildSettings?.buildCommand,
                    outputDirectory: project.buildSettings?.outputDirectory,
                });
                deployUrl = deployResult.url;
            } catch (adapterErr) {
                throw adapterErr;
            }

            if (!deployUrl) throw new Error('Provider did not return a deployment URL');
            const urlField = (deployment.environment === 'preview' || deployment.environment === 'staging') ? { previewUrl: deployUrl } : { productionUrl: deployUrl };
            await this.updateDeploymentStatus(deploymentId, 'running', {
                ...urlField,
                deployTime: Date.now(),
            });

            try {
                await webhookService.triggerWebhook(project._id, 'deployment.success', {
                    deployment: deployment.toObject(), url: deployUrl,
                });
                await notificationService.sendDeploymentNotification(deployment, 'success');
            } catch (notifyErr) {
                console.warn('[deploy] Post-deploy notification error (non-fatal):', notifyErr.message);
            }

        } catch (error) {
            await this.updateDeploymentStatus(deploymentId, 'failed', { rollbackReason: error.message });
            try {
                await webhookService.triggerWebhook(project._id, 'deployment.failed', {
                    deployment: deployment.toObject(), error: error.message,
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
        return lifecycle.transition(deploymentId, status, updates);
    }

    async getAllDeployments(limit = 50, filters = {}) {
        // Sanitize filters: only allow known safe string fields
        const safeFilters = {};
        if (!filters.userId) throw Object.assign(new Error('Authentication required'), { status: 401 });
        const owned = await Project.find({ userId: filters.userId }).select('_id').lean();
        safeFilters.projectId = { $in: owned.map(project => project._id) };
        if (filters.status)      safeFilters.status      = String(filters.status);
        if (filters.environment) safeFilters.environment = String(filters.environment);
        return await Deployment.find(safeFilters)
            .sort({ createdAt: -1 })
            .limit(Math.min(100, Math.max(1, Number(limit) || 50)))
            .populate('projectId', 'name')
            .lean();
    }

    async getDeployments(projectId, limit = 20, filters = {}) {
        if (!mongoose.Types.ObjectId.isValid(projectId)) throw new Error('Invalid projectId');
        return await Deployment.find({ projectId: new mongoose.Types.ObjectId(projectId), ...filters })
            .sort({ createdAt: -1 })
            .limit(Math.min(100, Math.max(1, Number(limit) || 50)))
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

    async rollbackDeployment(deploymentId, reason = 'User initiated rollback', userId = null) {
        if (!mongoose.Types.ObjectId.isValid(deploymentId)) throw new Error('Invalid deploymentId');
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) throw new Error('Deployment not found');

        const previous = await Deployment.findOne({
            projectId: new mongoose.Types.ObjectId(String(deployment.projectId)),
            status: 'running',
            environment: deployment.environment,
            _id: { $ne: new mongoose.Types.ObjectId(String(deploymentId)) },
            createdAt: { $lt: deployment.createdAt }
        }).sort({ createdAt: -1 });

        if (!previous) throw Object.assign(new Error('No previous successful deployment exists in this environment'), { status: 409 });
        if (!/^[a-f\d]{40}$/i.test(previous.gitCommit || '')) throw Object.assign(new Error('Previous deployment has no immutable commit identity'), { status: 409 });

        return await this.createDeployment({
            projectId: deployment.projectId,
            gitCommit: previous.gitCommit,
            gitBranch: previous.gitBranch,
            gitAuthor: previous.gitAuthor,
            commitMessage: `Rollback: ${reason}`,
            triggeredBy: 'rollback',
            environment: deployment.environment,
            userId: userId || deployment.deployedBy || null,
        });
    }

    async assignDomain(deploymentId, domainId, userId = null) {
        if (!mongoose.Types.ObjectId.isValid(deploymentId)) throw new Error('Invalid deploymentId');
        throw Object.assign(new Error('Managed custom-domain routing and TLS must be configured before assigning a domain'), { status: 501 });
    }

    async cancelDeployment(deploymentId) {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) throw Object.assign(new Error('Deployment not found'), { status: 404 });
        if (deployment.status === 'cancelled') return deployment;
        if (!['pending', 'building', 'deploying'].includes(deployment.status)) throw Object.assign(new Error('Cannot cancel deployment in current status'), { status: 409 });
        // Provider cancellation errors must not be reported as successful cancellation.
        if (deployment.provider !== 'custom' && deployment.providerDeploymentId) await deployerFactory.cancelDeployment(deployment.provider, deployment.providerDeploymentId);
        if (deployment.buildId) await buildService.cancelBuild(deployment.buildId);
        const changed = await this.updateDeploymentStatus(deploymentId, 'cancelled', { rollbackReason: 'Cancelled by user' });
        // An active BullMQ job remains locked until its worker observes cancellation.
        const queue = require('./jobQueueService');
        try {
            const job = await queue.getJob(`deployment-${deploymentId}`);
            if (job && ['waiting', 'delayed', 'prioritized', 'waiting-children'].includes(await job.getState())) await job.remove();
        } catch (error) { console.warn('[deploy] Cancelled record retained; queue cleanup requires reconciliation:', error.message); }
        return changed;
    }

    // Compatibility method used by blueprint service.
    async startDeployment(deploymentId) {
        await this.processDeployment(deploymentId);

        return await Deployment.findById(deploymentId).lean();
    }

    // Provider-first deployment flow used by providers controller.
    async startDeploymentWithProvider(deploymentId, project, config = {}) {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) throw new Error('Deployment not found');

        const provider = String(config.provider || deployment.provider || project?.deploymentSettings?.provider || 'custom').toLowerCase();
        deployment.provider = provider;
        deployment.providerConfig = {
            ...(deployment.providerConfig || {}),
            ...config,
        };
        await deployment.save();

        if (provider === 'custom') {
            await this.startDeployment(deploymentId);
            return {
                providerDeploymentId: null,
                status: 'queued',
                url: deployment.productionUrl || null,
            };
        }

        const result = await deployerFactory.createDeployment(provider, project, {
            ...config,
            branch: config.gitBranch || deployment.gitBranch,
            framework: config.framework || project?.framework,
            buildCommand: config.buildCommand || project?.buildSettings?.buildCommand,
            outputDirectory: config.outputDirectory || project?.buildSettings?.outputDirectory,
        });

        await this.updateDeploymentStatus(deploymentId, result.status || 'deploying', {
            provider,
            providerDeploymentId: result.providerDeploymentId,
            providerMetadata: result.metadata || {},
            productionUrl: result.url || deployment.productionUrl,
        });

        return {
            providerDeploymentId: result.providerDeploymentId,
            status: result.status || 'deploying',
            url: result.url || null,
        };
    }

    async pollDeploymentStatus(deploymentId) {
        const deployment = await Deployment.findById(deploymentId).populate('projectId');
        if (!deployment) throw new Error('Deployment not found');

        if (!deployment.providerDeploymentId || deployment.provider === 'custom') {
            return {
                deploymentId: deployment._id,
                provider: deployment.provider || 'custom',
                status: deployment.status,
                url: deployment.productionUrl || deployment.previewUrl || null,
            };
        }

        const providerStatus = await deployerFactory.getDeploymentStatus(
            deployment.provider,
            deployment.providerDeploymentId,
        );

        const updates = {
            providerMetadata: {
                ...(deployment.providerMetadata || {}),
                ...(providerStatus.metadata || {}),
            },
        };

        if (providerStatus.url) {
            if (deployment.environment === 'preview') {
                updates.previewUrl = providerStatus.url;
            } else {
                updates.productionUrl = providerStatus.url;
            }
        }

        if (providerStatus.metadata?.buildTime) {
            updates.buildTime = providerStatus.metadata.buildTime;
        }
        if (providerStatus.metadata?.deployTime) {
            updates.deployTime = providerStatus.metadata.deployTime;
        }

        await this.updateDeploymentStatus(deploymentId, providerStatus.status || deployment.status, updates);

        return {
            deploymentId: deployment._id,
            provider: deployment.provider,
            providerDeploymentId: deployment.providerDeploymentId,
            status: providerStatus.status || deployment.status,
            progress: providerStatus.progress ?? null,
            url: providerStatus.url || deployment.productionUrl || deployment.previewUrl || null,
            metadata: providerStatus.metadata || {},
        };
    }

    async getProviderLogs(deploymentId, options = {}) {
        const deployment = await Deployment.findById(deploymentId).select('provider providerDeploymentId logs');
        if (!deployment) throw new Error('Deployment not found');

        if (deployment.provider && deployment.provider !== 'custom' && deployment.providerDeploymentId) {
            return await deployerFactory.getDeploymentLogs(
                deployment.provider,
                deployment.providerDeploymentId,
                options,
            );
        }

        const offset = Number(options.offset || 0);
        const limit = Number(options.limit || 50);
        const logs = Array.isArray(deployment.logs) ? deployment.logs : [];
        return {
            logs: logs.slice(offset, offset + limit),
            hasMore: logs.length > offset + limit,
        };
    }

    async cancelDeploymentViaProvider(deploymentId) {
        return this.cancelDeployment(deploymentId);
    }

    async addDeploymentLog(deploymentId, message, level = 'info') {
        await Deployment.findByIdAndUpdate(deploymentId, {
            $push: { logs: { timestamp: new Date(), level, message } }
        });
    }

    async checkBuildCache() {
        throw Object.assign(new Error('Cache metadata is unavailable; Docker manages its actual local build cache'), { status: 501 });
    }

    async saveBuildCache() {
        throw Object.assign(new Error('Synthetic build-cache records are not supported'), { status: 501 });
    }

    async getDeploymentStats(projectId, timeRange = 30) {
        return this.getDeploymentAnalytics(projectId, timeRange);
    }
}

module.exports = new DeploymentService();
