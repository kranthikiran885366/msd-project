// Project Service
const Project = require("../models/Project")
const Deployment = require("../models/Deployment")
const Function = require("../models/Function")
const Environment = require("../models/Environment")

class ProjectService {
  async createProject(userId, data) {
    const project = new Project({
      userId,
      name: data.name,
      description: data.description,
      framework: data.framework,
      region: data.region || "iad1",
      githubRepo: data.githubRepo,
      gitlabRepo: data.gitlabRepo,
      buildCommand: data.buildCommand,
      startCommand: data.startCommand,
      rootDirectory: data.rootDirectory || "/",
      autoDeploy: data.autoDeploy !== false,
    })

    await project.save()
    return project
  }

  async getProjects(userId) {
    try {
      const projects = await Project.find({ userId }).sort({ createdAt: -1 })
      
      if (!projects || !Array.isArray(projects)) {
        console.warn('No projects found or invalid response for userId:', userId);
        return [];
      }
      
      // Enrich projects with deployment statistics
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          try {
            const stats = await this.getProjectStats(project._id)
            const recentDeployments = await Deployment.find({ projectId: project._id })
              .sort({ createdAt: -1 })
              .limit(5)
              .populate('environmentId', 'name')
            
            return {
              ...project.toObject(),
              stats,
              recentDeployments,
              lastDeployment: recentDeployments[0] || null
            }
          } catch (error) {
            console.error(`Error enriching project ${project._id}:`, error);
            // Return project without enrichment rather than failing completely
            return {
              ...project.toObject(),
              stats: {},
              recentDeployments: [],
              lastDeployment: null
            }
          }
        })
      )
      
      return enrichedProjects
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  async getProjectById(id) {
    return await Project.findById(id)
  }

  async updateProject(id, data) {
    return await Project.findByIdAndUpdate(id, data, { new: true })
  }

  async deleteProject(id) {
    await Deployment.deleteMany({ projectId: id })
    await Function.deleteMany({ projectId: id })
    await Environment.deleteMany({ projectId: id })
    return await Project.findByIdAndDelete(id)
  }

  async getProjectStats(projectId) {
    const allDeployments = await Deployment.find({ projectId }).sort({ createdAt: -1 })
    const deployments = allDeployments.length
    const failedDeployments = allDeployments.filter((d) => d.status === "failed").length
    const runningDeployments = allDeployments.filter((d) => ["pending", "building", "deploying"].includes(d.status)).length
    const successfulDeployments = allDeployments.filter((d) => d.status === "success").length
    const cancelledDeployments = allDeployments.filter((d) => d.status === "cancelled").length

    // Calculate build times from deployment data
    const completedDeployments = allDeployments.filter(d => d.endTime && d.startTime)
    const avgBuildTime = completedDeployments.length > 0 
      ? completedDeployments.reduce((sum, d) => {
          const duration = new Date(d.endTime) - new Date(d.startTime)
          return sum + (duration / 1000) // Convert to seconds
        }, 0) / completedDeployments.length
      : 0

    // Calculate monthly bandwidth (mock data for now)
    const monthlyBandwidth = Math.random() * 5 + 1 // 1-6 GB
    
    // Get environments count
    const environments = await Environment.countDocuments({ projectId })
    
    return {
      totalDeployments: deployments,
      successfulDeployments,
      failedDeployments,
      runningDeployments,
      cancelledDeployments,
      successRate: deployments > 0 ? ((successfulDeployments / deployments) * 100).toFixed(1) : "100.0",
      avgBuildTime: Math.round(avgBuildTime),
      monthlyBandwidth: `${monthlyBandwidth.toFixed(1)} GB`,
      environments,
      lastDeployment: allDeployments[0],
      isActive: runningDeployments > 0,
      healthStatus: this.calculateHealthStatus(successfulDeployments, failedDeployments, runningDeployments)
    }
  }

  async getProjectHealth(projectId) {
    const stats = await this.getProjectStats(projectId)
    const recentDeployments = await Deployment.find({ projectId }).limit(10)

    const failureRate = 100 - Number(stats.successRate)
    let health = "healthy"

    if (failureRate > 50) health = "critical"
    else if (failureRate > 20) health = "warning"
    else if (failureRate > 5) health = "degraded"

    return {
      status: health,
      metrics: stats,
      recentDeployments,
    }
  }

  async updateProjectSettings(projectId, settings) {
    return await Project.findByIdAndUpdate(projectId, settings, { new: true })
  }

  calculateHealthStatus(successful, failed, running) {
    const total = successful + failed
    if (total === 0) return 'healthy'
    
    const failureRate = (failed / total) * 100
    if (running > 0) return 'deploying'
    if (failureRate > 50) return 'critical'
    if (failureRate > 20) return 'warning'
    if (failureRate > 5) return 'degraded'
    return 'healthy'
  }

  async getProjectsOverview(userId) {
    const projects = await this.getProjects(userId)
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'active').length
    const totalDeployments = projects.reduce((sum, p) => sum + (p.stats?.totalDeployments || 0), 0)
    const avgSuccessRate = projects.length > 0 
      ? projects.reduce((sum, p) => sum + parseFloat(p.stats?.successRate || 0), 0) / projects.length
      : 100
    const totalBandwidth = projects.reduce((sum, p) => {
      const bandwidth = parseFloat(p.stats?.monthlyBandwidth?.replace(' GB', '') || 0)
      return sum + bandwidth
    }, 0)
    
    const frameworks = [...new Set(projects.map(p => p.framework))]
    const teams = [...new Set(projects.map(p => 'Development Team'))] // Mock team data
    
    return {
      totalProjects,
      activeProjects,
      totalDeployments,
      avgSuccessRate: avgSuccessRate.toFixed(1),
      totalBandwidth: `${totalBandwidth.toFixed(1)} GB`,
      frameworks,
      teams,
      projects
    }
  }
}

module.exports = new ProjectService()
