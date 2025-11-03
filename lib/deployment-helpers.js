// Deployment Helper Functions
export class DeploymentHelpers {
  static getStatusBadgeColor(status) {
    const colors = {
      pending: "gray",
      building: "blue",
      deploying: "cyan",
      running: "green",
      failed: "red",
      "rolled-back": "orange",
    }
    return colors[status] || "gray"
  }

  static getStatusLabel(status) {
    const labels = {
      pending: "Pending",
      building: "Building",
      deploying: "Deploying",
      running: "Running",
      failed: "Failed",
      "rolled-back": "Rolled Back",
    }
    return labels[status] || status
  }

  static canRollback(deployment) {
    return deployment.status === "running" || deployment.status === "failed"
  }

  static formatDeploymentInfo(deployment) {
    return {
      id: deployment._id,
      commit: deployment.gitCommit?.substring(0, 7),
      branch: deployment.gitBranch,
      author: deployment.gitAuthor,
      status: this.getStatusLabel(deployment.status),
      time: new Date(deployment.createdAt).toLocaleDateString(),
      buildTime: deployment.buildTime,
      deployTime: deployment.deployTime,
      cacheHitRate: deployment.buildCacheHitRate,
    }
  }

  static shouldRefreshDeployment(deployment) {
    return deployment.status === "pending" || deployment.status === "building" || deployment.status === "deploying"
  }

  static getDeploymentProgress(deployment) {
    const statusProgress = {
      pending: 10,
      building: 30,
      deploying: 70,
      running: 100,
      failed: 0,
      "rolled-back": 0,
    }
    return statusProgress[deployment.status] || 0
  }

  static calculateSuccessRate(deployments) {
    if (!deployments.length) return 0
    const successful = deployments.filter((d) => d.status === "running").length
    return Math.round((successful / deployments.length) * 100)
  }

  static sortDeploymentsByTime(deployments) {
    return [...deployments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  static filterDeploymentsByStatus(deployments, status) {
    return deployments.filter((d) => d.status === status)
  }

  static groupDeploymentsByDate(deployments) {
    const grouped = {}
    deployments.forEach((d) => {
      const date = new Date(d.createdAt).toLocaleDateString()
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(d)
    })
    return grouped
  }
}

export default DeploymentHelpers
