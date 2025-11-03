const ISRPage = require("../models/ISRPage")
const fetch = require("node-fetch")

class ISRService {
  async getPages(projectId) {
    return await ISRPage.find({ projectId })
  }

  async addPage(pageData) {
    const page = new ISRPage(pageData)
    return await page.save()
  }

  async updatePage(id, updates) {
    return await ISRPage.findByIdAndUpdate(id, updates, { new: true })
  }

  async deletePage(id) {
    return await ISRPage.findByIdAndDelete(id)
  }

  async revalidatePage(id) {
    const page = await ISRPage.findById(id)
    if (!page) throw new Error("Page not found")

    if (!page.onDemand) {
      throw new Error("Page is not configured for on-demand revalidation")
    }

    const startTime = Date.now()

    try {
      // Call Next.js revalidation endpoint
      const response = await fetch(`/api/revalidate?path=${page.path}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Revalidation failed: ${response.statusText}`)
      }

      const endTime = Date.now()
      const revalidationTime = endTime - startTime

      // Update revalidation history
      page.revalidationHistory.push({
        timestamp: new Date(),
        trigger: "manual",
        success: true,
      })

      // Update analytics
      page.analytics.totalRevalidations += 1
      page.analytics.averageRevalidationTime = revalidationTime
      page.lastRevalidated = new Date()

      await page.save()

      return { success: true, revalidationTime }
    } catch (error) {
      // Record failure
      page.revalidationHistory.push({
        timestamp: new Date(),
        trigger: "manual",
        success: false,
        error: error.message,
      })

      page.updateAnalytics()
      await page.save()

      throw error
    }
  }

  async setupRevalidationWebhook(pageId, webhookUrl) {
    const page = await ISRPage.findById(pageId)
    if (!page) throw new Error("Page not found")

    // Store webhook URL securely
    page.webhookUrl = webhookUrl
    await page.save()

    return {
      webhookEndpoint: `/api/isr/webhook/${pageId}`,
      secret: "your-webhook-secret", // In practice, generate this securely
    }
  }

  async handleWebhookTrigger(pageId, payload) {
    const page = await ISRPage.findById(pageId)
    if (!page) throw new Error("Page not found")

    // Verify webhook signature/secret here

    return await this.revalidatePage(pageId)
  }

  async getPageAnalytics(pageId) {
    const page = await ISRPage.findById(pageId)
    if (!page) throw new Error("Page not found")

    return {
      totalRevalidations: page.analytics.totalRevalidations,
      averageRevalidationTime: page.analytics.averageRevalidationTime,
      failureRate: page.analytics.failureRate,
      lastFailure: page.analytics.lastFailure,
      history: page.revalidationHistory,
    }
  }

  validatePageConfig(config) {
    const errors = []

    if (!config.path) {
      errors.push("Page path is required")
    }

    if (!config.onDemand && (!config.revalidateSeconds || config.revalidateSeconds < 1)) {
      errors.push("Revalidation interval must be at least 1 second")
    }

    if (errors.length) {
      throw new Error(`Invalid page config: ${errors.join(", ")}`)
    }
  }
}

module.exports = new ISRService()