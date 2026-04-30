// Domain Controller
const domainService = require("../services/domainService")

class DomainController {
  async createDomain(req, res, next) {
    try {
      const { projectId } = req.params
      const { host } = req.body
      const domain = await domainService.createDomain(projectId, host)
      res.status(201).json(domain)
    } catch (error) {
      next(error)
    }
  }

  async getDomains(req, res, next) {
    try {
      const { projectId } = req.params
      const domains = await domainService.getDomains(projectId)
      res.json(domains)
    } catch (error) {
      next(error)
    }
  }

  async verifyDomain(req, res, next) {
    try {
      const { id } = req.params
      const result = await domainService.verifyDomain(id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async getVerificationStatus(req, res, next) {
    try {
      const { id } = req.params
      const status = await domainService.getVerificationStatus(id)
      res.json(status)
    } catch (error) {
      next(error)
    }
  }

  async regenerateVerification(req, res, next) {
    try {
      const { id } = req.params
      const domain = await domainService.generateVerificationToken(id)
      if (!domain) return res.status(404).json({ error: 'Domain not found' })
      res.json({
        domainId: domain._id,
        host: domain.host,
        verificationToken: domain.verificationToken,
        dnsRecords: domain.dnsRecords || [],
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteDomain(req, res, next) {
    try {
      const { id } = req.params
      await domainService.deleteDomain(id)
      res.json({ message: "Domain deleted successfully" })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new DomainController()
