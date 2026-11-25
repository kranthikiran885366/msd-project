'use strict';
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const Database = require('../models/Database');
const FunctionModel = require('../models/Function');
const CronJob = require('../models/CronJob');

class DashboardService {
  calculateProjectStats(projects, deployments, functions) {
    const successful = deployments.filter(d => d.status === 'running').length;
    const measured = deployments.filter(d => Number.isFinite(d.buildTime) && d.buildTime > 0);
    return {
      totalProjects: projects.length, totalDeployments: deployments.length,
      successfulDeployments: successful,
      successRate: deployments.length ? Math.round(successful / deployments.length * 100) : null,
      activeFunctions: functions.filter(f => f.enabled).length,
      uptime: null,
      avgBuildTimeSeconds: measured.length ? Math.round(measured.reduce((sum, d) => sum + d.buildTime, 0) / measured.length) : null,
    };
  }
  async getDashboardData(userId) {
    const projects = await Project.find({ userId }).select('name slug framework status repository.owner repository.name repository.branch updatedAt createdAt').lean();
    const scope = { projectId: { $in: projects.map(p => p._id) } };
    const [deployments, databases, functions, cronjobs] = await Promise.all([
      Deployment.find(scope).sort({ createdAt: -1 }).limit(50).select('-providerConfig -logs').populate('projectId', 'name').lean(),
      Database.find(scope).select('name type status projectId').lean(),
      FunctionModel.find(scope).select('name enabled projectId').lean(),
      CronJob.find(scope).select('name enabled projectId').lean(),
    ]);
    return { projects, deployments, databases, functions, cronjobs,
      projectStats: this.calculateProjectStats(projects, deployments, functions),
      systemHealth: [
        { label: 'Database', status: mongoose.connection.readyState === 1 ? 'good' : 'error', value: mongoose.connection.readyState === 1 ? 'Connected' : 'Unavailable' },
        { label: 'Build queue', status: require('./jobQueueService').isConnected ? 'good' : 'error', value: require('./jobQueueService').isConnected ? 'Connected' : 'Unavailable' },
      ], recentActivity: this.formatRecentActivity(deployments), metrics: null, observedAt: new Date().toISOString() };
  }
  formatRecentActivity(deployments) {
    return deployments.slice(0, 10).map(d => ({ id: d._id, message: `${d.projectId?.name || 'Project'} deployment ${d.status}`, when: d.createdAt, status: d.status }));
  }
  async getStats(userId) { return (await this.getDashboardData(userId)).projectStats; }
  async getRecentActivity(userId) { return (await this.getDashboardData(userId)).recentActivity; }
}
module.exports = new DashboardService();
