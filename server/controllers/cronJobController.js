// Cron Job Controller
const cronJobService = require("../services/cronJobService")

class CronJobController {
  async createCronJob(req, res, next) {
    try {
      const { projectId } = req.params
      const cronJob = await cronJobService.createCronJob(projectId, req.body)
      res.status(201).json(cronJob)
    } catch (error) {
      next(error)
    }
  }

  async getCronJobs(req, res, next) {
    try {
      const { projectId } = req.params
      const cronJobs = await cronJobService.getCronJobs(projectId)
      res.json(cronJobs)
    } catch (error) {
      next(error)
    }
  }

  async updateCronJob(req, res, next) {
    try {
      const { id } = req.params
      const cronJob = await cronJobService.updateCronJob(id, req.body)
      res.json(cronJob)
    } catch (error) {
      next(error)
    }
  }

  async deleteCronJob(req, res, next) {
    try {
      const { id } = req.params
      await cronJobService.deleteCronJob(id)
      res.json({ message: "Cron job deleted successfully" })
    } catch (error) {
      next(error)
    }
  }

  async runCronJob(req, res, next) {
    try {
      const { id } = req.params
      const cronJob = await cronJobService.runCronJob(id)
      res.json(cronJob)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new CronJobController()
