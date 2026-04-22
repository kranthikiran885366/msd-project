const { spawn } = require("child_process")
const config = require("../config/env")
const portManagementService = require("../services/portManagementService")
const path = require("path")
const fs = require("fs").promises

class DockerProvider {
  constructor(typeProviders) {
    this.typeProviders = typeProviders
  }

  async createDatabase({ databaseId, type, username, password, databaseName, size, publicAccess }) {
    const mapping = await portManagementService.allocatePort(databaseId)
    const port = mapping.containerPort
    const provider = this.typeProviders[type]
    if (!provider) throw new Error(`Unsupported docker type: ${type}`)

    const cpuLimit = this._resolveCpuLimit(size)
    const memoryLimitMb = this._resolveMemoryLimit(size)
    const spec = provider.buildSpec({
      id: databaseId,
      port,
      username,
      password,
      databaseName,
      cpuLimit,
      memoryLimitMb,
      publicAccess,
    })

    try {
      await this._docker(spec.args)
      const host = publicAccess ? this._resolvePublicHost() : this._resolvePrivateHost()
      return {
        provider: "docker",
        host,
        privateHost: this._resolvePrivateHost(),
        port,
        internalPort: spec.internalPort,
        workerNodeId: config.nodeId,
        containerName: spec.containerName,
        volumeName: spec.volumeName,
        cpuLimit,
        memoryLimitMb,
        externalResourceId: spec.containerName,
        connectionString: provider.buildConnectionString({
          username,
          password,
          host,
          port,
          databaseName,
        }),
      }
    } catch (error) {
      await portManagementService.releasePort(databaseId).catch(() => {})
      throw error
    }
  }

  async deleteDatabase(meta) {
    if (meta.containerName) {
      await this._docker(["rm", "-f", meta.containerName]).catch(() => {})
    }
    await portManagementService.releasePort(meta._id.toString()).catch(() => {})
    return { deleted: true }
  }

  async restartDatabase(meta) {
    await this._docker(["restart", meta.containerName])
    return { status: "running" }
  }

  async pauseDatabase(meta) {
    await this._docker(["stop", meta.containerName])
    return { status: "stopped" }
  }

  async startDatabase(meta) {
    await this._docker(["start", meta.containerName])
    return { status: "running" }
  }

  async getStatus(meta) {
    const running = await this._isContainerRunning(meta.containerName)
    return running ? "running" : "failed"
  }

  async createBackup(meta) {
    if (!meta.volumeName) throw new Error("Missing docker volume for backup")
    const backupDir = process.env.DBAAS_BACKUP_DIR || path.resolve(process.cwd(), "backups")
    await fs.mkdir(backupDir, { recursive: true })
    const fileName = `${meta._id}-${Date.now()}.tgz`
    const hostPath = path.join(backupDir, fileName)
    const hostPathUnix = hostPath.replace(/\\/g, "/")
    await this._docker([
      "run",
      "--rm",
      "-v",
      `${meta.volumeName}:/volume:ro`,
      "-v",
      `${hostPathUnix}:/backup.tgz`,
      "alpine:3.20",
      "sh",
      "-c",
      "tar -czf /backup.tgz -C /volume .",
    ])
    const stat = await fs.stat(hostPath)
    return {
      name: fileName,
      size: Math.ceil(stat.size / (1024 * 1024)),
      status: "completed",
      storageLocation: hostPath,
      backupAt: new Date(),
    }
  }

  async _docker(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] })
      let stderr = ""
      proc.stderr.on("data", (d) => { stderr += d.toString() })
      proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`docker ${args[0]} failed: ${stderr.trim()}`))))
      proc.on("error", reject)
    })
  }

  async _isContainerRunning(containerName) {
    return new Promise((resolve) => {
      const proc = spawn("docker", ["inspect", "--format", "{{.State.Running}}", containerName], { stdio: ["ignore", "pipe", "ignore"] })
      let out = ""
      proc.stdout.on("data", (d) => { out += d.toString() })
      proc.on("close", () => resolve(out.trim() === "true"))
      proc.on("error", () => resolve(false))
    })
  }

  _resolvePublicHost() {
    return process.env.NODE_PUBLIC_IP || config.nodeIp || "127.0.0.1"
  }

  _resolvePrivateHost() {
    return process.env.NODE_PRIVATE_IP || config.privateIp || "127.0.0.1"
  }

  _resolveCpuLimit(size = "small") {
    const map = { micro: 0.25, small: 0.5, medium: 1, large: 2, xlarge: 4 }
    return map[size] || 0.5
  }

  _resolveMemoryLimit(size = "small") {
    const map = { micro: 256, small: 512, medium: 1024, large: 2048, xlarge: 4096 }
    return map[size] || 512
  }
}

module.exports = DockerProvider
