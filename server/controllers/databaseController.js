const databaseService = require("../services/databaseService")
const DatabaseModel = require("../models/Database")
const AuditLog = require("../models/AuditLog")

// Database CRUD
exports.createDatabase = async (req, res) => {
  try {
    const { projectId, name, type, config, credentials } = req.body
    const { userId } = req

    const database = await databaseService.createDatabase({
      projectId,
      name,
      type,
      config,
      credentials,
    })

    await AuditLog.create({
      userId,
      action: "DATABASE_CREATED",
      resourceType: "Database",
      resourceId: database._id,
      metadata: { projectId, name, type },
    })

    res.status(201).json(database)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listDatabases = async (req, res) => {
  try {
    const { projectId, type } = req.query

    const query = {}
    if (projectId) query.projectId = projectId
    if (type) query.type = type

    const databases = await DatabaseModel.find(query)

    res.json(databases)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params

    const database = await databaseService.getDatabaseById(databaseId)

    if (!database) {
      return res.status(404).json({ error: "Database not found" })
    }

    res.json(database)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params
    const { name, config, credentials } = req.body
    const { userId } = req

    const database = await databaseService.updateDatabase(databaseId, { name, config, credentials })

    await AuditLog.create({
      userId,
      action: "DATABASE_UPDATED",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: { changes: { name, config } },
    })

    res.json(database)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params
    const { userId } = req

    await databaseService.deleteDatabase(databaseId)

    await AuditLog.create({
      userId,
      action: "DATABASE_DELETED",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: {},
    })

    res.json({ message: "Database deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Query Operations
exports.executeQuery = async (req, res) => {
  try {
    const { databaseId } = req.params
    const { query } = req.body
    const { userId } = req

    const result = await databaseService.executeQuery(databaseId, query)

    await AuditLog.create({
      userId,
      action: "DATABASE_QUERY_EXECUTED",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: { queryLength: query.length },
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getTables = async (req, res) => {
  try {
    const { databaseId } = req.params

    const tables = await databaseService.getTables(databaseId)

    res.json(tables)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getTableSchema = async (req, res) => {
  try {
    const { databaseId, tableName } = req.params

    const schema = await databaseService.getTableSchema(databaseId, tableName)

    res.json(schema)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.browseTable = async (req, res) => {
  try {
    const { databaseId, tableName } = req.params
    const { limit = 50, offset = 0, orderBy, order } = req.query

    const data = await databaseService.browseTable(databaseId, tableName, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      orderBy,
      order: order || "ASC",
    })

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Backups
exports.createBackup = async (req, res) => {
  try {
    const { databaseId } = req.params
    const { userId } = req

    const backup = await databaseService.createBackup(databaseId)

    await AuditLog.create({
      userId,
      action: "DATABASE_BACKUP_CREATED",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: { backupId: backup._id },
    })

    res.status(201).json(backup)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listBackups = async (req, res) => {
  try {
    const { databaseId } = req.params

    const backups = await databaseService.getBackups(databaseId)

    res.json(backups)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.restoreBackup = async (req, res) => {
  try {
    const { databaseId, backupId } = req.params
    const { userId } = req

    const result = await databaseService.restoreBackup(databaseId, backupId)

    await AuditLog.create({
      userId,
      action: "DATABASE_BACKUP_RESTORED",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: { backupId },
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteBackup = async (req, res) => {
  try {
    const { databaseId, backupId } = req.params
    const { userId } = req

    await databaseService.deleteBackup(databaseId, backupId)

    await AuditLog.create({
      userId,
      action: "DATABASE_BACKUP_DELETED",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: { backupId },
    })

    res.json({ message: "Backup deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Statistics
exports.getStatistics = async (req, res) => {
  try {
    const { databaseId } = req.params

    const stats = await databaseService.getStatistics(databaseId)

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getHealth = async (req, res) => {
  try {
    const { databaseId } = req.params

    const health = await databaseService.checkHealth(databaseId)

    res.json(health)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Monitoring
exports.getMetrics = async (req, res) => {
  try {
    const { databaseId } = req.params
    const { timeRange = 7 } = req.query

    const metrics = await databaseService.getMetrics(databaseId, parseInt(timeRange))

    res.json(metrics)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getConnections = async (req, res) => {
  try {
    const { databaseId } = req.params

    const connections = await databaseService.getConnections(databaseId)

    res.json(connections)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Users and Permissions
exports.createDatabaseUser = async (req, res) => {
  try {
    const { databaseId } = req.params
    const { username, password, permissions } = req.body
    const { userId } = req

    const user = await databaseService.createDatabaseUser(databaseId, { username, password, permissions })

    await AuditLog.create({
      userId,
      action: "DATABASE_USER_CREATED",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: { username },
    })

    res.status(201).json(user)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listDatabaseUsers = async (req, res) => {
  try {
    const { databaseId } = req.params

    const users = await databaseService.getDatabaseUsers(databaseId)

    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await databaseService.getTemplates()
    res.json(templates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.createFromTemplate = async (req, res) => {
  try {
    const { templateId } = req.params
    const { projectId, name, config } = req.body
    const { userId } = req

    const database = await databaseService.createFromTemplate(templateId, {
      projectId,
      name,
      config,
      createdBy: userId
    })

    res.status(201).json(database)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Migrations
exports.getMigrations = async (req, res) => {
  try {
    const { databaseId } = req.params
    const migrations = await databaseService.getMigrations(databaseId)
    res.json(migrations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.runMigration = async (req, res) => {
  try {
    const { databaseId } = req.params
    const migrationData = req.body
    const { userId } = req

    const result = await databaseService.runMigration(databaseId, migrationData)

    await AuditLog.create({
      userId,
      action: "DATABASE_MIGRATION_RUN",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: { migrationName: migrationData.name }
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Scaling
exports.getScalingOptions = async (req, res) => {
  try {
    const { databaseId } = req.params
    const options = await databaseService.getScalingOptions(databaseId)
    res.json(options)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.scaleDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params
    const { size } = req.body
    const { userId } = req

    const result = await databaseService.scaleDatabase(databaseId, size)

    await AuditLog.create({
      userId,
      action: "DATABASE_SCALED",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: { newSize: size }
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Compliance
exports.getCompliance = async (req, res) => {
  try {
    const { databaseId } = req.params
    const compliance = await databaseService.getCompliance(databaseId)
    res.json(compliance)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.runComplianceCheck = async (req, res) => {
  try {
    const { databaseId } = req.params
    const { userId } = req

    const result = await databaseService.runComplianceCheck(databaseId)

    await AuditLog.create({
      userId,
      action: "DATABASE_COMPLIANCE_CHECK",
      resourceType: "Database",
      resourceId: databaseId,
      metadata: { checkId: result.checkId }
    })

    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
