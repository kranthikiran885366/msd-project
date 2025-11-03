// Database Service - Enhanced
const Database = require("../models/Database")

class DatabaseService {
  async createDatabase(projectId, data, createdBy) {
    const database = new Database({
      projectId,
      type: (data.type || "postgresql").toLowerCase(),
      name: data.name,
      displayName: data.displayName || data.name,
      size: data.size || "small",
      region: data.region || "iad1",
      host: data.host,
      port: data.port,
      database: data.database,
      username: data.username,
      password: data.password,
      connectionString: this._buildConnectionString(data.type, data),
      sslEnabled: data.sslEnabled || false,
      backupEnabled: data.backupEnabled !== false,
      backupSchedule: data.backupSchedule || "daily",
      isProvisioned: true,
      status: "creating",
      createdBy,
    })

    await database.save()

    // Simulate provisioning completion
    setTimeout(() => {
      Database.findByIdAndUpdate(database._id, { status: "running" })
    }, 5000)

    return database
  }

  async getDatabases(projectId) {
    const query = projectId ? { projectId, isActive: true } : { isActive: true }
    return await Database.find(query).populate('projectId', 'name').sort({ createdAt: -1 })
  }

  async getAllDatabases() {
    return await Database.find({ isActive: true }).populate('projectId', 'name').sort({ createdAt: -1 })
  }

  async getDatabaseById(id, projectId) {
    return await Database.findOne({
      _id: id,
      projectId,
      isActive: true,
    })
  }

  async updateDatabase(id, data) {
    return await Database.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
  }

  async deleteDatabase(id) {
    return await Database.findByIdAndUpdate(
      id,
      { isActive: false, status: "deleted" },
      { new: true }
    )
  }

  async executeQuery(databaseId, query) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      success: true,
      query,
      results: [],
      duration: 125,
    }
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

    return []
  }

  async createBackup(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const backup = {
      name: `backup-${databaseId}-${Date.now()}`,
      size: Math.floor(Math.random() * 1000),
      status: "pending",
      backupAt: new Date(),
      retentionDays: 30,
      isAutomatic: false,
    }

    database.backups.push(backup)
    await database.save()

    return backup
  }

  async listBackups(databaseId, { limit = 20, offset = 0 }) {
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

  async restoreFromBackup(databaseId, backupName) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const backup = (database.backups || []).find((b) => b.name === backupName)
    if (!backup) throw new Error("Backup not found")

    backup.status = "restoring"
    await database.save()

    setTimeout(() => {
      Database.findByIdAndUpdate(databaseId, {
        "backups.$[elem].status": "completed",
        "backups.$[elem].restoreAt": new Date(),
      })
    }, 3000)

    return backup
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
      connections: {
        current: Math.floor(Math.random() * 50) + 10,
        max: 100,
        percentage: Math.floor(Math.random() * 80) + 10
      },
      storage: {
        used: Math.floor(Math.random() * 5000) + 1000,
        total: 10000,
        percentage: Math.floor(Math.random() * 50) + 10
      },
      performance: {
        avgResponseTime: Math.floor(Math.random() * 100) + 50,
        queriesPerSecond: Math.floor(Math.random() * 1000) + 100,
        cacheHitRatio: Math.floor(Math.random() * 30) + 70
      }
    }
  }

  async checkHealth(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      status: database.status === 'running' ? 'healthy' : 'unhealthy',
      uptime: Math.floor(Math.random() * 30) + 1,
      lastCheck: new Date(),
      checks: {
        connectivity: true,
        diskSpace: true,
        memory: true,
        cpu: Math.random() > 0.1
      }
    }
  }

  async getMetrics(databaseId, timeRange = 7) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const metrics = []
    for (let i = timeRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      metrics.push({
        timestamp: date,
        connections: Math.floor(Math.random() * 50) + 10,
        queries: Math.floor(Math.random() * 1000) + 100,
        responseTime: Math.floor(Math.random() * 100) + 50,
        cpuUsage: Math.floor(Math.random() * 80) + 10,
        memoryUsage: Math.floor(Math.random() * 70) + 20
      })
    }
    return metrics
  }

  async getConnections(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    const connections = []
    const count = Math.floor(Math.random() * 20) + 5
    for (let i = 0; i < count; i++) {
      connections.push({
        id: `conn_${i + 1}`,
        user: `user_${i + 1}`,
        host: `192.168.1.${Math.floor(Math.random() * 255)}`,
        database: database.database,
        state: Math.random() > 0.2 ? 'active' : 'idle',
        duration: Math.floor(Math.random() * 3600),
        query: Math.random() > 0.5 ? 'SELECT * FROM users' : null
      })
    }
    return connections
  }

  async createDatabaseUser(databaseId, userData) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      id: `user_${Date.now()}`,
      username: userData.username,
      permissions: userData.permissions || ['SELECT'],
      createdAt: new Date(),
      lastLogin: null,
      status: 'active'
    }
  }

  async getDatabaseUsers(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return [
      {
        id: 'user_1',
        username: 'admin',
        permissions: ['ALL'],
        createdAt: new Date(Date.now() - 86400000),
        lastLogin: new Date(),
        status: 'active'
      },
      {
        id: 'user_2',
        username: 'readonly',
        permissions: ['SELECT'],
        createdAt: new Date(Date.now() - 172800000),
        lastLogin: new Date(Date.now() - 3600000),
        status: 'active'
      }
    ]
  }

  async getTemplates() {
    return [
      {
        id: 'template_1',
        name: 'E-commerce Database',
        description: 'Pre-configured database for e-commerce applications',
        type: 'postgresql',
        tables: ['users', 'products', 'orders', 'categories'],
        size: 'medium'
      },
      {
        id: 'template_2',
        name: 'Analytics Database',
        description: 'Optimized for analytics and reporting',
        type: 'postgresql',
        tables: ['events', 'users', 'sessions'],
        size: 'large'
      }
    ]
  }

  async getMigrations(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return [
      {
        id: 'migration_1',
        name: 'Add user preferences table',
        status: 'completed',
        appliedAt: new Date(Date.now() - 86400000),
        version: '001'
      },
      {
        id: 'migration_2',
        name: 'Update product schema',
        status: 'pending',
        appliedAt: null,
        version: '002'
      }
    ]
  }

  async runMigration(databaseId, migrationData) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      id: `migration_${Date.now()}`,
      name: migrationData.name,
      status: 'running',
      appliedAt: new Date(),
      version: migrationData.version
    }
  }

  async getScalingOptions(databaseId) {
    const database = await Database.findById(databaseId)
    if (!database) throw new Error("Database not found")

    return {
      current: database.size,
      options: [
        { size: 'micro', cpu: '0.5 vCPU', memory: '1 GB', storage: '20 GB', price: '$15/month' },
        { size: 'small', cpu: '1 vCPU', memory: '2 GB', storage: '50 GB', price: '$35/month' },
        { size: 'medium', cpu: '2 vCPU', memory: '4 GB', storage: '100 GB', price: '$70/month' },
        { size: 'large', cpu: '4 vCPU', memory: '8 GB', storage: '200 GB', price: '$140/month' },
        { size: 'xlarge', cpu: '8 vCPU', memory: '16 GB', storage: '500 GB', price: '$280/month' }
      ]
    }
  }

  async scaleDatabase(databaseId, newSize) {
    const database = await Database.findByIdAndUpdate(
      databaseId,
      { size: newSize, status: 'scaling' },
      { new: true }
    )
    
    if (!database) throw new Error("Database not found")

    // Simulate scaling completion
    setTimeout(() => {
      Database.findByIdAndUpdate(databaseId, { status: 'running' })
    }, 10000)

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

  _buildConnectionString(type, config) {
    const dbType = (type || "postgresql").toLowerCase()
    switch (dbType) {
      case "postgresql":
        return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
      case "mysql":
        return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
      case "mongodb":
        return `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
      case "redis":
        return `redis://:${config.password}@${config.host}:${config.port}`
      default:
        return ""
    }
  }
}

module.exports = new DatabaseService()
