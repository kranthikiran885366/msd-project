// Serverless Function Service - Enhanced
const Function = require("../models/Function")
const Log = require("../models/Log")

class FunctionService {
  async createFunction(projectId, data) {
    const func = new Function({
      projectId,
      name: data.name,
      path: data.path,
      description: data.description,
      runtime: data.runtime || "node20",
      handler: data.handler,
      code: data.code,
      memory: data.memory || 256,
      timeout: data.timeout || 30,
      enabled: data.enabled !== false,
      isEdgeFunction: data.isEdgeFunction || false,
      regions: data.regions || [],
      triggers: data.triggers || [],
      cronExpression: data.cronExpression,
      environment: data.environment || {},
      createdBy: data.createdBy,
    })

    await func.save()

    await Log.create({
      projectId,
      functionId: func._id,
      service: 'function',
      level: 'info',
      message: `Function ${data.name} created`,
    })

    return func
  }

  async getFunctions(projectId) {
    return await Function.find({ projectId }).populate('createdBy', 'name email').sort({ createdAt: -1 })
  }

  async getFunctionById(id) {
    return await Function.findById(id).populate('createdBy', 'name email')
  }

  async updateFunction(id, data) {
    return await Function.findByIdAndUpdate(id, data, { new: true }).populate('createdBy', 'name email')
  }

  async deleteFunction(id) {
    return await Function.findByIdAndDelete(id)
  }

  async invokeFunction(functionId, payload = {}, isSync = true) {
    const func = await Function.findById(functionId)
    if (!func) throw new Error("Function not found")
    if (!func.enabled) throw new Error("Function is disabled")

    const startTime = Date.now()
    const isColdStart = !func.lastRunAt || (Date.now() - func.lastRunAt) > 900000

    try {
      // Mock execution
      const result = {
        statusCode: 200,
        body: { message: 'Function executed successfully', input: payload },
      }

      const duration = Date.now() - startTime
      const executionLog = {
        timestamp: new Date(),
        duration,
        status: 'success',
        input: payload,
        output: result,
        coldStart: isColdStart,
        memoryUsed: Math.random() * func.memory,
        cpuUsed: Math.random() * 100,
      }

      func.executionLogs.push(executionLog)
      func.lastRunAt = new Date()
      func.lastStatus = 'success'
      func.invocations += 1
      func.averageExecutionTime = (func.averageExecutionTime + duration) / 2

      await func.save()

      return { success: true, duration, result, isColdStart }
    } catch (error) {
      const duration = Date.now() - startTime

      func.executionLogs.push({
        timestamp: new Date(),
        duration,
        status: 'error',
        input: payload,
        error: error.message,
        coldStart: isColdStart,
      })

      func.lastRunAt = new Date()
      func.lastStatus = 'error'
      func.errors += 1

      await func.save()

      throw error
    }
  }

  async getExecutionLogs(functionId, limit = 100) {
    const func = await Function.findById(functionId)
    if (!func) throw new Error("Function not found")

    return func.executionLogs.slice(-limit).reverse()
  }

  async getFunctionMetrics(functionId) {
    const func = await Function.findById(functionId)
    if (!func) throw new Error("Function not found")

    const recentLogs = func.executionLogs.slice(-100)
    const errorRate = recentLogs.length > 0
      ? (recentLogs.filter(l => l.status === 'error').length / recentLogs.length) * 100
      : 0

    const avgDuration = recentLogs.length > 0
      ? recentLogs.reduce((sum, l) => sum + (l.duration || 0), 0) / recentLogs.length
      : 0

    const coldStarts = recentLogs.filter(l => l.coldStart).length

    return {
      name: func.name,
      invocations: func.invocations,
      errors: func.errors,
      errorRate: errorRate.toFixed(2),
      lastRun: func.lastRunAt,
      lastStatus: func.lastStatus,
      runtime: func.runtime,
      memory: func.memory,
      timeout: func.timeout,
      averageDuration: Math.round(avgDuration),
      coldStarts,
      enabled: func.enabled,
    }
  }

  async toggleFunction(functionId, enabled) {
    return await Function.findByIdAndUpdate(functionId, { enabled }, { new: true })
  }

  async updateFunctionCode(functionId, code, handler) {
    return await Function.findByIdAndUpdate(
      functionId,
      { code, handler, updatedAt: new Date() },
      { new: true }
    )
  }

  async deployFunction(functionId) {
    const func = await Function.findByIdAndUpdate(
      functionId,
      { updatedAt: new Date() },
      { new: true }
    )

    await Log.create({
      functionId,
      service: 'function',
      level: 'info',
      message: `Function ${func.name} deployed`,
    })

    return func
  }

  async testFunction(functionId, testPayload) {
    try {
      return await this.invokeFunction(functionId, testPayload, true)
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getAnalytics(projectId, timeRange = 7) {
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)

    const functions = await Function.find({
      projectId,
      createdAt: { $gte: startDate },
    })

    const totalFunctions = functions.length
    const enabledFunctions = functions.filter(f => f.enabled).length
    const totalInvocations = functions.reduce((sum, f) => sum + f.invocations, 0)
    const totalErrors = functions.reduce((sum, f) => sum + f.errors, 0)

    return {
      totalFunctions,
      enabledFunctions,
      totalInvocations,
      totalErrors,
      errorRate: totalInvocations > 0 ? ((totalErrors / totalInvocations) * 100).toFixed(2) : '0',
      averageMemory: totalFunctions > 0 ? (functions.reduce((sum, f) => sum + f.memory, 0) / totalFunctions).toFixed(0) : '0',
      functions: functions.map(f => ({
        id: f._id,
        name: f.name,
        invocations: f.invocations,
        errors: f.errors,
        averageExecutionTime: f.averageExecutionTime,
      })),
    }
  }
}

module.exports = new FunctionService()
