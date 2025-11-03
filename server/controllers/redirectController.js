// Redirect Controller
const redirectService = require("../services/redirectService")

class RedirectController {
  async getDomainRedirects(req, res, next) {
    try {
      const { domainId } = req.query
      if (!domainId) {
        return res.status(400).json({ success: false, error: "Domain ID is required" })
      }
      
      const redirects = await redirectService.getDomainRedirects(domainId)
      res.json({ success: true, data: redirects })
    } catch (error) {
      next(error)
    }
  }

  async addDomainRedirect(req, res, next) {
    try {
      const { domainId } = req.params
      const redirectData = { ...req.body, domainId }
      const redirect = await redirectService.addDomainRedirect(redirectData)
      res.status(201).json({ success: true, data: redirect })
    } catch (error) {
      next(error)
    }
  }

  async updateDomainRedirect(req, res, next) {
    try {
      const { id } = req.params
      const redirect = await redirectService.updateDomainRedirect(id, req.body)
      if (!redirect) {
        return res.status(404).json({ success: false, error: "Redirect not found" })
      }
      res.json({ success: true, data: redirect })
    } catch (error) {
      next(error)
    }
  }

  async deleteDomainRedirect(req, res, next) {
    try {
      const { id } = req.params
      const redirect = await redirectService.deleteDomainRedirect(id)
      if (!redirect) {
        return res.status(404).json({ success: false, error: "Redirect not found" })
      }
      res.json({ success: true, message: "Redirect deleted successfully" })
    } catch (error) {
      next(error)
    }
  }

  async getDomainRedirectById(req, res, next) {
    try {
      const { id } = req.params
      const redirect = await redirectService.getDomainRedirectById(id)
      if (!redirect) {
        return res.status(404).json({ success: false, error: "Redirect not found" })
      }
      res.json({ success: true, data: redirect })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new RedirectController()