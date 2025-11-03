// Build Optimization Utilities - new utility file
class BuildOptimizer {
  static generateCacheKey(framework, dependencies, buildConfig) {
    const hash = require("crypto")
    const content = `${framework}:${JSON.stringify(dependencies)}:${JSON.stringify(buildConfig)}`
    return hash.createHash("sha256").update(content).digest("hex")
  }

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

  static optimizeBuildConfig(framework, customConfig = {}) {
    const defaults = {
      "Next.js": {
        precompile: true,
        imageOptimization: true,
        swcCompiler: true,
        enableCaching: true,
      },
      Express: {
        minify: true,
        prune: true,
        enableCaching: true,
      },
      React: {
        minify: true,
        sourceMap: false,
        enableCaching: true,
      },
    }

    return {
      ...defaults[framework],
      ...customConfig,
    }
  }

  static calculateDeploymentSize(buildArtifacts) {
    let totalSize = 0
    for (const artifact of buildArtifacts) {
      totalSize += artifact.size || 0
    }
    return totalSize
  }

  static recommendOptimizations(metrics) {
    const recommendations = []

    if (metrics.buildCacheHitRate < 50) {
      recommendations.push({
        type: "cache",
        priority: "high",
        message: "Build cache hit rate is below 50%. Consider optimizing your build steps.",
      })
    }

    if (metrics.buildSize > 100 * 1024 * 1024) {
      recommendations.push({
        type: "size",
        priority: "high",
        message: "Build size exceeds 100MB. Consider removing unnecessary dependencies.",
      })
    }

    if (metrics.buildTime > 300) {
      recommendations.push({
        type: "performance",
        priority: "medium",
        message: "Build time exceeds 5 minutes. Consider enabling parallel builds.",
      })
    }

    return recommendations
  }
}

module.exports = BuildOptimizer
