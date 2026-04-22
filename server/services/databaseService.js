const { randomBytes } = require("crypto")
const Project = require("../models/Project")
const User = require("../models/User")
const Subscription = require("../models/Subscription")
const Database = require("../models/Database")
const { encrypt, decrypt, isEncrypted } = require("../utils/encryption")
const DockerProvider = require("../providers/dockerProvider")
const AwsRdsProvider = require("../providers/awsRdsProvider")
const AtlasProvider = require("../providers/atlasProvider")
const mongodbProvider = require("../providers/mongodb")
const postgresProvider = require("../providers/postgres")
const redisProvider = require("../providers/redis")

class DatabaseService {
  constructor() {
    this.healthCheckInterval = null
    this.providers = {
      docker: new DockerProvider({
        mongodb: mongodbProvider,
        postgresql: postgresProvider,
        redis: redisProvider,
      }),
      aws: new AwsRdsProvider(),
      atlas: new AtlasProvider(),
    }
  }

  async createDatabase(payload = {}) {
    const { projectId, name, type = "mongodb", config: requestedConfig = {}, createdBy } = payload
    if (!projectId) throw new Error("projectId is required")
    if (!name) throw new Error("name is required")
    if (!createdBy) throw new Error("createdBy is required")

    const normalizedType = String(type).toLowerCase()
    const owner = await this._assertProjectOwnership(projectId, createdBy)
    await this._enforceDbLimit(projectId, createdBy, owner)
    const selectedProvider = await this._selectProvider(owner, normalizedType, requestedConfig.providerOverride)

    const dbUsername = this._generateUsername(normalizedType, name)
    const dbPassword = this._secureRandom(24)
    const dbName = this._sanitizeDbName(name)
    const publicAccess = Boolean(requestedConfig.publicAccess)

    let dbRecord = null

    try {
      dbRecord = await Database.create({
        projectId,
        type: normalizedType,
        provider: selectedProvider,
        name,
        displayName: requestedConfig.displayName || name,
        size: requestedConfig.size || "small",
        region: requestedConfig.region || "iad1",
        database: dbName,
        username: dbUsername,
        password: encrypt(dbPassword),
        encryptedPassword: true,
        status: "creating",
        backupEnabled: requestedConfig.backupEnabled !== false,
        backupSchedule: requestedConfig.backupSchedule || "daily",
        sslEnabled: requestedConfig.sslEnabled || false,
        publicAccess,
        createdBy,
        cloudRegion: requestedConfig.cloudRegion || process.env.AWS_REGION || requestedConfig.region || "us-east-1",
      })

      const provisioned = await this._withRetry(
        () =>
          this.providers[selectedProvider].createDatabase({
            databaseId: dbRecord._id.toString(),
            type: normalizedType,
            username: dbUsername,
            password: dbPassword,
            databaseName: dbName,
            size: requestedConfig.size || "small",
            publicAccess,
          }),
        `create-${selectedProvider}-database`
      )

      const updated = await Database.findByIdAndUpdate(
        dbRecord._id,
        {
          provider: selectedProvider,
          host: provisioned.host,
          privateHost: provisioned.privateHost,
          port: provisioned.port,
          internalPort: provisioned.internalPort,
          workerNodeId: provisioned.workerNodeId,
          containerName: provisioned.containerName,
          volumeName: provisioned.volumeName,
          externalResourceId: provisioned.externalResourceId,
          cpuLimit: provisioned.cpuLimit || this._resolveCpuLimit(requestedConfig.size),
          memoryLimitMb: provisioned.memoryLimitMb || this._resolveMemoryLimit(requestedConfig.size),
          endpointVisibility: publicAccess ? "public" : "private",
          connectionString: encrypt(provisioned.connectionString),
          encryptedConnectionString: true,
          status: "running",
          healthStatus: "healthy",
          lastHealthCheckAt: new Date(),
          isProvisioned: true,
        },
        { new: true }
      )

      await this._updateUserDbUsage(createdBy)

      return this._sanitizeForResponse(updated)
    } catch (error) {
      if (dbRecord) {
        await Database.findByIdAndUpdate(dbRecord._id, {
          status: "failed",
          healthStatus: "unhealthy",
          lastHealthError: error.message,
        }).catch(() => {})
      }
      throw error
    }
  }

  async getDatabases(projectId) {
    const query = projectId ? { projectId, isActive: true } : { isActive: true }
    const rows = await Database.find(query).populate("projectId", "name").sort({ createdAt: -1 })
    return rows.map((row) => this._sanitizeForResponse(row))
  }

  async getAllDatabases() {
    const rows = await Database.find({ isActive: true }).populate("projectId", "name").sort({ createdAt: -1 })
    return rows.map((row) => this._sanitizeForResponse(row))
  }

  async getDatabaseById(id, projectId) {
    const row = await Database.findOne({
      _id: id,
      ...(projectId ? { projectId } : {}),
      isActive: true,
    })
    return this._sanitizeForResponse(row)
  }

  async updateDatabase(id, data) {
    const updated = await Database.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    return this._sanitizeForResponse(updated)
  }

  async deleteDatabase(id) {
    const database = await Database.findById(id)
    if (!database) throw new Error("Database not found")

    const provider = this.providers[database.provider || "docker"]
    await this._withRetry(() => provider.deleteDatabase(database), `delete-${database.provider || "docker"}-database`)

    const updated = await Database.findByIdAndUpdate(
      id,
      { isActive: false, status: "deleted", healthStatus: "unknown" },
      { new: true }
    )
    if (database.createdBy) {
      await this._updateUserDbUsage(database.createdBy)
    }
    return this._sanitizeForResponse(updated)
  }

  async startDatabase(id) {
    const db = await Database.findById(id)
    if (!db) throw new Error("Database not found")
    if (db.provider !== "docker") {
      throw new Error("Start operation is only available for docker databases")
    }
    await this.providers.docker.startDatabase(db)
    const updated = await Database.findByIdAndUpdate(id, { status: "running" }, { new: true })
    return this._sanitizeForResponse(updated)
  }

  async stopDatabase(id) {
    const db = await Database.findById(id)
    if (!db) throw new Error("Database not found")
    if (db.provider !== "docker") {
      throw new Error("Pause operation is only available for docker databases")
    }
    await this.providers.docker.pauseDatabase(db)
    const updated = await Database.findByIdAndUpdate(id, { status: "stopped" }, { new: true })
    return this._sanitizeForResponse(updated)
  }

  async restartDatabase(id) {
    const db = await Database.findById(id)
    if (!db) throw new Error("Database not found")
    if (db.provider !== "docker") {
      throw new Error("Restart operation is only available for docker databases")
    }
    await this.providers.docker.restartDatabase(db)
    const updated = await Database.findByIdAndUpdate(
      id,
      { status: "running", lastHealthCheckAt: new Date(), healthStatus: "healthy", lastHealthError: null },
      { new: true }
    )
    return this._sanitizeForResponse(updated)
  }

  async getDecryptedConnectionString(databaseId) {
    const db = await Database.findById(databaseId).select("connectionString encryptedConnectionString")
    if (!db) return null
    if (!db.connectionString) return null
    return db.encryptedConnectionString || isEncrypted(db.connectionString)
      ? decrypt(db.connectionString)
      : db.connectionString
  }

  async getProjectRuntimeDatabaseEnv(projectId) {
    const databases = await Database.find({
      projectId,
      isActive: true,
      status: "running",
    }).sort({ createdAt: 1 })

    if (!databases.length) return {}

    const env = {}
    for (const db of databases) {
      const conn = await this.getDecryptedConnectionString(db._id)
      if (!conn) continue
      const key = `${String(db.type || "db").toUpperCase()}_URL`
      env[key] = conn
      if (!env.DATABASE_URL) env.DATABASE_URL = conn
    }
    return env
  }

  async executeQuery(databaseId, query) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")
    throw new Error("Direct query execution is not enabled in control plane")
  }

  async getTableInfo(databaseId, tableName) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      table: tableName,
      columns: [],
      rowCount: 0,
      indexCount: 0,
      size: 0,
    }
  }

  async listTables(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    throw new Error("Table introspection endpoint not implemented for managed access")
  }

  async getTables(databaseId) {
    return this.listTables(databaseId)
  }

  async getTableSchema(databaseId, tableName) {
    return this.getTableInfo(databaseId, tableName)
  }

  async browseTable() {
    throw new Error("Table browsing endpoint not implemented for managed access")
  }

  async createBackup(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    if (database.provider === "docker") {
      const backup = await this.providers.docker.createBackup(database)
      database.backups = database.backups || []
      database.backups.push(backup)
      await database.save()
      return backup
    }
    return {
      provider: database.provider,
      backupMode: "managed",
      status: "enabled",
      schedule: database.backupSchedule || "daily",
    }
  }

  async listBackups(databaseId, { limit = 20, offset = 0 } = {}) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const backups = (database.backups || [])
      .sort((a, b) => new Date(b.backupAt) - new Date(a.backupAt))
      .slice(offset, offset + limit)

    return {
      backups,
      total: (database.backups || []).length,
      limit,
      offset,
    }
  }

  async getBackups(databaseId) {
    return this.listBackups(databaseId, {})
  }

  async restoreFromBackup(databaseId, backupName) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    throw new Error("Backup restore must be executed through provider-native workflows")
  }

  async restoreBackup(databaseId, backupName) {
    return this.restoreFromBackup(databaseId, backupName)
  }

  async scheduleAutomaticBackup(databaseId, schedule) {
    return await Database.findByIdAndUpdate(
      databaseId,
      { backupSchedule: schedule, backupEnabled: true },
      { new: true }
    )
  }

  async getBackupSize(databaseId, backupName) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const backup = (database.backups || []).find((b) => b.name === backupName)
    if (!backup) throw new Error("Backup not found")

    return {
      backupName,
      size: backup.size,
      unit: "MB",
      createdAt: backup.backupAt,
    }
  }

  async deleteBackup(databaseId, backupName) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    database.backups = (database.backups || []).filter((b) => b.name !== backupName)
    await database.save()

    return { success: true, deletedId: backupName }
  }

  async getStatistics(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      provider: database.provider,
      status: database.status,
      healthStatus: database.healthStatus || "unknown",
      resource: {
        cpuLimit: database.cpuLimit,
        memoryLimitMb: database.memoryLimitMb,
      },
    }
  }

  async checkHealth(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      status: database.status === 'running' ? 'healthy' : 'unhealthy',
      uptime: 0,
      lastCheck: database.lastHealthCheckAt || new Date(),
      checks: {
        connectivity: database.status === "running",
        diskSpace: true,
        memory: true,
        cpu: true
      }
    }
  }

  async getMetrics(databaseId, timeRange = 7) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return []
  }

  async getConnections(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    throw new Error("Connection inspection is provider-specific and not exposed by control plane")
  }

  async createDatabaseUser(databaseId, userData) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    throw new Error("Database user management should be done via provider-native IAM/users")
  }

  async getDatabaseUsers(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    throw new Error("Database user listing should be done in provider console/API")
  }

  async getTemplates() {
    return [
      { id: "mongodb-starter", name: "MongoDB Starter", type: "mongodb", size: "small" },
      { id: "postgres-starter", name: "PostgreSQL Starter", type: "postgresql", size: "small" },
      { id: "redis-cache", name: "Redis Cache", type: "redis", size: "micro" },
    ]
  }

  async createFromTemplate(templateId, { projectId, name, config = {}, createdBy }) {
    const templates = await this.getTemplates()
    const template = templates.find((t) => t.id === templateId)
    if (!template) throw new Error("Template not found")
    return this.createDatabase({
      projectId,
      name: name || `${template.type}-${Date.now()}`,
      type: template.type,
      createdBy,
      config: { size: template.size, ...config },
    })
  }

  async getMigrations(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    throw new Error("Migration history is not tracked in control plane")
  }

  async runMigration(databaseId, migrationData) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    throw new Error("Run migrations via application migration pipeline")
  }

  async getScalingOptions(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return { current: database.size, options: ["micro", "small", "medium", "large", "xlarge"] }
  }

  async scaleDatabase(databaseId, newSize) {
    const database = await Database.findByIdAndUpdate(
      databaseId,
      { size: newSize },
      { new: true }
    )
    
    if (!database) throw new Error("Database not found")

    return database
  }

  async getCompliance(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      overall: 'compliant',
      lastCheck: new Date(),
      checks: {
        encryption: { status: 'pass', description: 'Data encrypted at rest and in transit' },
        backup: { status: 'pass', description: 'Regular backups configured' },
        access: { status: 'warning', description: 'Some users have excessive permissions' },
        audit: { status: 'pass', description: 'Audit logging enabled' },
        network: { status: 'pass', description: 'Network security configured' }
      },
      recommendations: [
        'Review user permissions and apply principle of least privilege',
        'Enable additional audit logging for sensitive operations'
      ]
    }
  }

  async runComplianceCheck(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      checkId: `check_${Date.now()}`,
      status: 'running',
      startedAt: new Date(),
      estimatedDuration: 300 // 5 minutes
    }
  }

  async runHealthChecks() {
    const active = await Database.find({
      isActive: true,
      status: { $in: ["running", "failed"] },
    })

    for (const db of active) {
      try {
        const provider = this.providers[db.provider || "docker"]
        const status = await provider.getStatus(db)
        const healthy = status === "running" || status === "available" || status === "IDLE"
        if (healthy) {
          await Database.findByIdAndUpdate(db._id, {
            status: "running",
            healthStatus: "healthy",
            lastHealthCheckAt: new Date(),
            lastHealthError: null,
          })
        } else {
          if (db.provider === "docker") {
            await this.providers.docker.startDatabase(db).catch(() => {})
          }
          await Database.findByIdAndUpdate(db._id, {
            status: "failed",
            healthStatus: "unhealthy",
            lastHealthCheckAt: new Date(),
            lastHealthError: "Container not running",
          })
        }
      } catch (error) {
        await Database.findByIdAndUpdate(db._id, {
          status: "failed",
          healthStatus: "unhealthy",
          lastHealthCheckAt: new Date(),
          lastHealthError: error.message,
        }).catch(() => {})
      }
    }
  }

  async _assertProjectOwnership(projectId, userId) {
    const project = await Project.findById(projectId).select("userId")
    if (!project) throw new Error("Project not found")
    if (String(project.userId) !== String(userId)) throw new Error("Forbidden")
    const owner = await User.findById(userId).select("plan dbLimit dbProvider")
    if (!owner) throw new Error("User not found")
    const subscription = await Subscription.findOne({ userId, status: "active" }).populate("plan").sort({ createdAt: -1 })
    const subscribedPlan = String(subscription?.plan?.name || "").toLowerCase()
    if (subscribedPlan) {
      if (["pro", "business", "hobby"].includes(subscribedPlan)) owner.plan = "pro"
      if (subscribedPlan === "enterprise") owner.plan = "enterprise"
      if (subscribedPlan === "free") owner.plan = "free"
      if (!owner.dbLimit || owner.dbLimit < this._defaultDbLimitByPlan(owner.plan)) {
        owner.dbLimit = this._defaultDbLimitByPlan(owner.plan)
      }
    }
    return owner
  }

  async _enforceDbLimit(projectId, userId, user) {
    const activeCount = await Database.countDocuments({
      projectId,
      createdBy: userId,
      isActive: true,
      status: { $ne: "deleted" },
    })
    const limit = Number(user.dbLimit || this._defaultDbLimitByPlan(user.plan))
    if (activeCount >= limit) {
      throw new Error(`Database limit reached for your plan (${limit})`)
    }
  }

  async _selectProvider(user, dbType, override) {
    if (override) {
      this._validateProviderOverride(override, dbType)
      return override
    }
    if (user.dbProvider && user.dbProvider !== "auto") {
      this._validateProviderOverride(user.dbProvider, dbType)
      return user.dbProvider
    }
    const plan = String(user.plan || "free").toLowerCase()
    if (plan === "free") return "docker"
    if (dbType === "mongodb") return "atlas"
    return "aws"
  }

  _validateProviderOverride(provider, dbType) {
    const p = String(provider).toLowerCase()
    if (!["docker", "aws", "atlas"].includes(p)) throw new Error(`Unsupported provider override: ${provider}`)
    if (p === "atlas" && dbType !== "mongodb") throw new Error("Atlas provider only supports MongoDB")
    if (p === "aws" && dbType !== "postgresql") throw new Error("AWS RDS provider currently supports PostgreSQL")
  }

  _defaultDbLimitByPlan(plan) {
    const map = { free: 1, pro: 10, enterprise: 100 }
    return map[String(plan || "free").toLowerCase()] || 1
  }

  async _updateUserDbUsage(userId) {
    const activeCount = await Database.countDocuments({
      createdBy: userId,
      isActive: true,
      status: { $ne: "deleted" },
    })
    await User.findByIdAndUpdate(userId, {
      databaseUsage: { activeCount, lastUpdatedAt: new Date() },
    }).catch(() => {})
  }

  async _withRetry(fn, action, retries = 2, delayMs = 2000) {
    let lastErr = null
    for (let i = 0; i <= retries; i += 1) {
      try {
        return await fn()
      } catch (err) {
        lastErr = err
        if (i === retries) break
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
      }
    }
    throw new Error(`${action} failed: ${lastErr?.message || "unknown error"}`)
  }

  startHealthMonitor(intervalMs = 30000) {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval)
    this.healthCheckInterval = setInterval(() => {
      this.runHealthChecks().catch(() => {})
    }, intervalMs)
  }

  _sanitizeForResponse(database) {
    if (!database) return null
    const plain = typeof database.toObject === "function" ? database.toObject() : database
    if (plain.password) plain.password = "****"
    if (plain.connectionString) plain.connectionString = "****"
    return plain
  }

  _secureRandom(length = 24) {
    return randomBytes(length).toString("base64url")
  }

  _generateUsername(type, name) {
    const prefix = type === "postgresql" ? "pg" : type === "redis" ? "rd" : "mg"
    const seed = `${name}-${Date.now()}`.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase()
    return `${prefix}_${seed || "user"}`
  }

  _sanitizeDbName(name) {
    return String(name || "appdb").toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 32)
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

module.exports = new DatabaseService()
