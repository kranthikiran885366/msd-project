// Cron Job Service
const CronJob = require("../models/CronJob")
const { isValidCronExpression } = require("../utils/validators")

class CronJobService {
  async createCronJob(projectId, data) {
    if (!isValidCronExpression(data.schedule)) {
      throw new Error("Invalid cron expression")
    }

    const cronJob = new CronJob({
      projectId,
      name: data.name,
      schedule: data.schedule,
      target: data.target,
    })

    await cronJob.save()
    return cronJob
  }

  async getCronJobs(projectId) {
    return await CronJob.find({ projectId })
  }

  async getCronJobById(id) {
    return await CronJob.findById(id)
  }

  async updateCronJob(id, data) {
    if (data.schedule && !isValidCronExpression(data.schedule)) {
      throw new Error("Invalid cron expression")
    }
    return await CronJob.findByIdAndUpdate(id, data, { new: true })
  }

  async deleteCronJob(id) {
    return await CronJob.findByIdAndDelete(id)
  }

  async runCronJob(id) {
    const cronJob = await CronJob.findByIdAndUpdate(id, { lastRunAt: new Date() }, { new: true })
    return cronJob
  }
}

module.exports = new CronJobService()
