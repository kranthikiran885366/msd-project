// Build Optimization Utilities - Frontend version
export class BuildOptimizer {
  static estimateBuildTime(framework, cacheHitRate = 0) {
    const baseTime = {
      "Next.js": 120,
      Express: 30,
      React: 90,
      Vue: 60,
      Svelte: 45,
    }

    const time = baseTime[framework] || 60
    return Math.round(time * (1 - cacheHitRate / 100))
  }

  static formatBuildTime(milliseconds) {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`
    const seconds = Math.round(milliseconds / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.round(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  static formatSize(bytes) {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  static getOptimizationScore(metrics) {
    let score = 100

    if (metrics.buildCacheHitRate < 50) score -= 20
    if (metrics.buildTime > 300000) score -= 15
    if (metrics.buildSize > 100 * 1024 * 1024) score -= 15
    if (metrics.deployTime > 120000) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  static getHealthStatus(score) {
    if (score >= 85) return { status: "excellent", color: "green" }
    if (score >= 70) return { status: "good", color: "blue" }
    if (score >= 50) return { status: "fair", color: "yellow" }
    return { status: "poor", color: "red" }
  }

  static recommendOptimizations(metrics) {
    const recommendations = []

    if (metrics.buildCacheHitRate < 50) {
      recommendations.push({
        type: "cache",
        priority: "high",
        title: "Improve Build Cache",
        description: "Build cache hit rate is below 50%. Optimize your build steps to improve caching.",
      })
    }

    if (metrics.buildSize > 100 * 1024 * 1024) {
      recommendations.push({
        type: "size",
        priority: "high",
        title: "Reduce Build Size",
        description: "Build size exceeds 100MB. Remove unnecessary dependencies and assets.",
      })
    }

    if (metrics.buildTime > 300000) {
      recommendations.push({
        type: "performance",
        priority: "medium",
        title: "Optimize Build Performance",
        description: "Build time exceeds 5 minutes. Consider enabling parallel builds.",
      })
    }

    if (metrics.deployTime > 120000) {
      recommendations.push({
        type: "deployment",
        priority: "medium",
        title: "Reduce Deployment Time",
        description: "Deployment time exceeds 2 minutes. Optimize server resources.",
      })
    }

    return recommendations
  }
}

export default BuildOptimizer
