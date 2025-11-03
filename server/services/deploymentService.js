const mongoose = require('mongoose');
const Deployment = require('../models/Deployment');
const Project = require('../models/Project');
const Build = require('../models/Build');
const Environment = require('../models/Environment');
const buildService = require('./buildService');
const notificationService = require('./notificationService');
const webhookService = require('./webhookService');
const logService = require('./logService');

class DeploymentService {
    async createDeployment(projectId, environmentId, options = {}) {
        const {
            branch = 'main',
            commitSha = null,
            triggeredBy = 'manual',
            userId = null,
            buildConfig = {},
            environmentVariables = {},
            deploymentType = 'standard'
        } = options;

        const project = await Project.findById(projectId);
        if (!project) throw new Error('Project not found');

        const environment = await Environment.findById(environmentId);
        if (!environment) throw new Error('Environment not found');

        const deployment = await Deployment.create({
            projectId,
            environmentId,
            branch,
            commitSha,
            status: 'pending',
            triggeredBy,
            userId,
            buildConfig,
            environmentVariables,
            deploymentType,
            startTime: new Date(),
            logs: []
        });

        // Start deployment process
        this.processDeployment(deployment._id).catch(error => {
            console.error(`Deployment ${deployment._id} failed:`, error);
        });

        return deployment;
    }

    async processDeployment(deploymentId) {
        const deployment = await Deployment.findById(deploymentId).populate('projectId environmentId');
        if (!deployment) throw new Error('Deployment not found');

        try {
            await this.updateDeploymentStatus(deploymentId, 'building');
            
            // Create build
            const build = await buildService.createBuild(deployment.projectId._id, {
                branch: deployment.branch,
                commitSha: deployment.commitSha,
                deploymentId: deployment._id,
                buildConfig: deployment.buildConfig
            });

            deployment.buildId = build._id;
            await deployment.save();

            // Wait for build completion
            const completedBuild = await this.waitForBuild(build._id);
            
            if (completedBuild.status === 'failed') {
                throw new Error('Build failed');
            }

            await this.updateDeploymentStatus(deploymentId, 'deploying');

            // Deploy to environment
            const deployResult = await this.deployToEnvironment(deployment, completedBuild);
            
            await this.updateDeploymentStatus(deploymentId, 'success', {
                deployUrl: deployResult.url,
                deploymentSize: deployResult.size,
                endTime: new Date()
            });

            // Trigger webhooks
            await webhookService.triggerWebhook(deployment.projectId._id, 'deployment.success', {
                deployment: deployment.toObject(),
                environment: deployment.environmentId.name,
                url: deployResult.url
            });

            // Send notifications
            await notificationService.sendDeploymentNotification(deployment, 'success');

        } catch (error) {
            await this.updateDeploymentStatus(deploymentId, 'failed', {
                error: error.message,
                endTime: new Date()
            });

            await webhookService.triggerWebhook(deployment.projectId._id, 'deployment.failed', {
                deployment: deployment.toObject(),
                error: error.message
            });

            await notificationService.sendDeploymentNotification(deployment, 'failed', error.message);
            throw error;
        }
    }

    async deployToEnvironment(deployment, build) {
        const environment = deployment.environmentId;
        const project = deployment.projectId;

        // Get deployer adapter based on environment type
        const deployerFactory = require('./deployers/deployerFactory');
        const deployer = deployerFactory.getDeployer(environment.provider);

        const deployConfig = {
            projectName: project.name,
            environmentName: environment.name,
            buildArtifacts: build.artifacts,
            environmentVariables: {
                ...environment.variables,
                ...deployment.environmentVariables
            },
            domains: environment.domains || [],
            region: environment.region || 'us-east-1'
        };

        const result = await deployer.deploy(deployConfig);
        
        // Update environment with latest deployment info
        await Environment.findByIdAndUpdate(environment._id, {
            lastDeploymentId: deployment._id,
            lastDeployedAt: new Date(),
            currentUrl: result.url,
            status: 'active'
        });

        return result;
    }

    async waitForBuild(buildId, timeout = 600000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const build = await Build.findById(buildId);
            if (!build) throw new Error('Build not found');
            
            if (build.status === 'success' || build.status === 'failed') {
                return build;
            }
            
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
        const query = { ...filters };
        return await Deployment.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('projectId', 'name')
            .populate('environmentId', 'name type')
            .populate('buildId', 'status duration')
            .lean();
    }

    async getDeployments(projectId, options = {}) {
        const {
            page = 1,
            limit = 20,
            environment = null,
            status = null,
            branch = null
        } = options;

        const query = { projectId };
        if (environment) query.environmentId = environment;
        if (status) query.status = status;
        if (branch) query.branch = branch;

        const deployments = await Deployment.find(query)
            .populate('environmentId', 'name type')
            .populate('buildId', 'status duration')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

        const total = await Deployment.countDocuments(query);

        return {
            deployments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getDeployment(deploymentId) {
        const deployment = await Deployment.findById(deploymentId)
            .populate('projectId', 'name')
            .populate('environmentId', 'name type provider')
            .populate('buildId')
            .populate('userId', 'name email');

        if (!deployment) throw new Error('Deployment not found');
        return deployment;
    }

    async rollbackDeployment(deploymentId, targetDeploymentId) {
        const currentDeployment = await this.getDeployment(deploymentId);
        const targetDeployment = await this.getDeployment(targetDeploymentId);

        if (currentDeployment.environmentId._id.toString() !== targetDeployment.environmentId._id.toString()) {
            throw new Error('Deployments must be in the same environment');
        }

        // Create rollback deployment
        const rollbackDeployment = await this.createDeployment(
            currentDeployment.projectId._id,
            currentDeployment.environmentId._id,
            {
                branch: targetDeployment.branch,
                commitSha: targetDeployment.commitSha,
                triggeredBy: 'rollback',
                deploymentType: 'rollback',
                rollbackFromId: deploymentId,
                rollbackToId: targetDeploymentId
            }
        );

        return rollbackDeployment;
    }

    async cancelDeployment(deploymentId) {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) throw new Error('Deployment not found');

        if (!['pending', 'building', 'deploying'].includes(deployment.status)) {
            throw new Error('Cannot cancel deployment in current status');
        }

        const cancelPromises = [];

        // Cancel build if in progress
        if (deployment.buildId) {
            cancelPromises.push(buildService.cancelBuild(deployment.buildId));
        }

        cancelPromises.push(
            this.updateDeploymentStatus(deploymentId, 'cancelled', {
                endTime: new Date()
            }),
            notificationService.sendDeploymentNotification(deployment, 'cancelled')
        );

        await Promise.all(cancelPromises);
        return deployment;
    }

    async getDeploymentLogs(deploymentId) {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) throw new Error('Deployment not found');
        return deployment.logs;
    }

    async getEnvironmentStatus(environmentId) {
        const environment = await Environment.findById(environmentId)
            .populate('lastDeploymentId');
        
        if (!environment) throw new Error('Environment not found');
        
        const activeDeployments = await Deployment.countDocuments({
            environmentId,
            status: { $in: ['pending', 'building', 'deploying'] }
        });

        return {
            environment: environment.name,
            status: environment.status,
            lastDeployment: environment.lastDeploymentId,
            activeDeployments,
            currentUrl: environment.currentUrl
        };
    }

    async getDeploymentStats(projectId, timeRange = 30) {
        const since = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

        const stats = await Deployment.aggregate([
            {
                $match: {
                    projectId: mongoose.Types.ObjectId(projectId),
                    createdAt: { $gte: since }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    successful: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    avgDuration: { $avg: { $subtract: ['$endTime', '$startTime'] } }
                }
            }
        ]);

        const result = stats[0] || { total: 0, successful: 0, failed: 0, avgDuration: 0 };
        result.successRate = result.total > 0 ? (result.successful / result.total) * 100 : 0;
        result.avgDuration = Math.round(result.avgDuration / 1000); // Convert to seconds

        return result;
    }

    async getDeploymentsByEnvironment(projectId) {
        return Deployment.aggregate([
            {
                $match: { projectId: mongoose.Types.ObjectId(projectId) }
            },
            {
                $lookup: {
                    from: 'environments',
                    localField: 'environmentId',
                    foreignField: '_id',
                    as: 'environment'
                }
            },
            {
                $unwind: '$environment'
            },
            {
                $group: {
                    _id: '$environmentId',
                    environmentName: { $first: '$environment.name' },
                    total: { $sum: 1 },
                    successful: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
                    lastDeployment: { $max: '$createdAt' }
                }
            }
        ]);
    }

    async promoteDeployment(deploymentId, targetEnvironmentId) {
        const sourceDeployment = await this.getDeployment(deploymentId);
        const targetEnvironment = await Environment.findById(targetEnvironmentId);

        if (!targetEnvironment) throw new Error('Target environment not found');
        if (sourceDeployment.status !== 'success') {
            throw new Error('Can only promote successful deployments');
        }

        const promotionDeployment = await this.createDeployment(
            sourceDeployment.projectId._id,
            targetEnvironmentId,
            {
                branch: sourceDeployment.branch,
                commitSha: sourceDeployment.commitSha,
                triggeredBy: 'promotion',
                deploymentType: 'promotion',
                promotedFromId: deploymentId,
                buildConfig: sourceDeployment.buildConfig,
                environmentVariables: sourceDeployment.environmentVariables
            }
        );

        return promotionDeployment;
    }

    async addDeploymentLog(deploymentId, message, level = 'info') {
        await Deployment.findByIdAndUpdate(deploymentId, {
            $push: {
                logs: {
                    timestamp: new Date(),
                    level,
                    message
                }
            }
        });
    }
}

module.exports = new DeploymentService();