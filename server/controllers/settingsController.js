const settingsService = require("../services/settingsService")
const EnvironmentVar = require("../models/EnvironmentVar")
const Domain = require("../models/Domain")
const AuditLog = require("../models/AuditLog")

// Environment Variables
exports.createEnvVar = async (req, res) => {
  try {
    const { projectId, key, value, isSecret } = req.body
    const { userId } = req

    const envVar = await settingsService.createEnvVar({
      projectId,
      key,
      value,
      isSecret,
    })

    await AuditLog.create({
      userId,
      action: "ENV_VAR_CREATED",
      resourceType: "EnvironmentVar",
      resourceId: envVar._id,
      metadata: { projectId, key, isSecret },
    })

    res.status(201).json(envVar)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listEnvVars = async (req, res) => {
  try {
    const { projectId, includeValues = false } = req.query

    const envVars = await EnvironmentVar.find({ projectId })

    if (includeValues === "false") {
      return res.json(
        envVars.map((env) => ({
          ...env.toObject(),
          value: env.isSecret ? "***" : env.value,
        }))
      )
    }

    res.json(envVars)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getEnvVar = async (req, res) => {
  try {
    const { varId } = req.params

    const envVar = await EnvironmentVar.findById(varId)

    if (!envVar) {
      return res.status(404).json({ error: "Environment variable not found" })
    }

    res.json(envVar)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateEnvVar = async (req, res) => {
  try {
    const { varId } = req.params
    const { key, value, isSecret } = req.body
    const { userId } = req

    const envVar = await EnvironmentVar.findByIdAndUpdate(
      varId,
      {
        key,
        value,
        isSecret,
        updatedAt: new Date(),
      },
      { new: true }
    )

    await AuditLog.create({
      userId,
      action: "ENV_VAR_UPDATED",
      resourceType: "EnvironmentVar",
      resourceId: varId,
      metadata: { key, isSecret },
    })

    res.json(envVar)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteEnvVar = async (req, res) => {
  try {
    const { varId } = req.params
    const { userId } = req

    const envVar = await EnvironmentVar.findByIdAndDelete(varId)

    await AuditLog.create({
      userId,
      action: "ENV_VAR_DELETED",
      resourceType: "EnvironmentVar",
      resourceId: varId,
      metadata: { key: envVar.key },
    })

    res.json({ message: "Environment variable deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Domains
exports.addDomain = async (req, res) => {
  try {
    const { projectId, host, ssl } = req.body
    const { userId } = req

    const domain = await settingsService.addDomain({
      projectId,
      host,
      ssl,
    })

    await AuditLog.create({
      userId,
      action: "DOMAIN_ADDED",
      resourceType: "Domain",
      resourceId: domain._id,
      metadata: { projectId, host },
    })

    res.status(201).json(domain)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.listDomains = async (req, res) => {
  try {
    const { projectId } = req.query

    const domains = await Domain.find(projectId ? { projectId } : {})

    res.json(domains)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getDomain = async (req, res) => {
  try {
    const { domainId } = req.params

    const domain = await Domain.findById(domainId)

    if (!domain) {
      return res.status(404).json({ error: "Domain not found" })
    }

    res.json(domain)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateDomain = async (req, res) => {
  try {
    const { domainId } = req.params
    const { host, ssl } = req.body
    const { userId } = req

    const domain = await Domain.findByIdAndUpdate(
      domainId,
      {
        host,
        ssl,
        updatedAt: new Date(),
      },
      { new: true }
    )

    await AuditLog.create({
      userId,
      action: "DOMAIN_UPDATED",
      resourceType: "Domain",
      resourceId: domainId,
      metadata: { host, ssl },
    })

    res.json(domain)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteDomain = async (req, res) => {
  try {
    const { domainId } = req.params
    const { userId } = req

    await Domain.findByIdAndDelete(domainId)

    await AuditLog.create({
      userId,
      action: "DOMAIN_DELETED",
      resourceType: "Domain",
      resourceId: domainId,
      metadata: {},
    })

    res.json({ message: "Domain deleted successfully" })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Build Settings
exports.getBuildSettings = async (req, res) => {
  try {
    const { projectId } = req.query

    const settings = await settingsService.getBuildSettings(projectId)

    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateBuildSettings = async (req, res) => {
  try {
    const { projectId, cacheEnabled, timeout, maxRetries, environment } = req.body
    const { userId } = req

    const settings = await settingsService.updateBuildSettings({
      projectId,
      cacheEnabled,
      timeout,
      maxRetries,
      environment,
    })

    await AuditLog.create({
      userId,
      action: "BUILD_SETTINGS_UPDATED",
      resourceType: "Settings",
      resourceId: projectId,
      metadata: { cacheEnabled, timeout, maxRetries },
    })

    res.json(settings)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// General Settings
exports.getSettings = async (req, res) => {
  try {
    const { projectId } = req.query

    const settings = await settingsService.getSettings(projectId)

    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateSettings = async (req, res) => {
  try {
    const { projectId, settings } = req.body
    const { userId } = req

    const updated = await settingsService.updateSettings(projectId, settings)

    await AuditLog.create({
      userId,
      action: "SETTINGS_UPDATED",
      resourceType: "Settings",
      resourceId: projectId,
      metadata: { settings },
    })

    res.json(updated)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Bulk Operations
exports.bulkCreateEnvVars = async (req, res) => {
  try {
    const { projectId, envVars } = req.body
    const { userId } = req

    const created = await Promise.all(
      envVars.map((env) =>
        settingsService.createEnvVar({
          projectId,
          ...env,
        })
      )
    )

    await AuditLog.create({
      userId,
      action: "ENV_VARS_BULK_CREATED",
      resourceType: "EnvironmentVar",
      resourceId: null,
      metadata: { count: created.length },
    })

    res.status(201).json(created)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.exportSettings = async (req, res) => {
  try {
    const { projectId, format = "json" } = req.query

    const settings = await settingsService.getSettings(projectId)

    if (format === "env") {
      const envContent = Object.entries(settings).map(([key, value]) => `${key}=${value}`).join("\n")
      res.setHeader("Content-Type", "text/plain")
      res.setHeader("Content-Disposition", "attachment; filename=.env")
      res.send(envContent)
    } else {
      res.json(settings)
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
