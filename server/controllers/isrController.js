const isrService = require("../services/isrService")

class ISRController {
  async listPages(req, res, next) {
    try {
      const { projectId } = req.params
      const pages = await isrService.getPages(projectId)
      res.json(pages)
    } catch (error) {
      next(error)
    }
  }

  async addPage(req, res, next) {
    try {
      const page = await isrService.addPage({
        ...req.body,
        projectId: req.params.projectId,
      })
      res.status(201).json(page)
    } catch (error) {
      next(error)
    }
  }

  async updatePage(req, res, next) {
    try {
      const { id } = req.params
      const page = await isrService.updatePage(id, req.body)
      res.json(page)
    } catch (error) {
      next(error)
    }
  }

  async deletePage(req, res, next) {
    try {
      const { id } = req.params
      await isrService.deletePage(id)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  async revalidatePage(req, res, next) {
    try {
      const { id } = req.params
      const result = await isrService.revalidatePage(id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async setupWebhook(req, res, next) {
    try {
      const { id } = req.params
      const { webhookUrl } = req.body
      const webhook = await isrService.setupRevalidationWebhook(id, webhookUrl)
      res.json(webhook)
    } catch (error) {
      next(error)
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const { id } = req.params
      const result = await isrService.handleWebhookTrigger(id, req.body)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const { id } = req.params
      const analytics = await isrService.getPageAnalytics(id)
      res.json(analytics)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ISRController()