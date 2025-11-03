// DNS Controller
const dnsService = require("../services/dnsService")

class DNSController {
  async getDNSRecords(req, res, next) {
    try {
      const { domainId } = req.query
      if (!domainId) {
        return res.status(400).json({ success: false, error: "Domain ID is required" })
      }
      
      const records = await dnsService.getDNSRecords(domainId)
      res.json({ success: true, data: records })
    } catch (error) {
      next(error)
    }
  }

  async addDNSRecord(req, res, next) {
    try {
      const record = await dnsService.addDNSRecord(req.body)
      res.status(201).json({ success: true, data: record })
    } catch (error) {
      next(error)
    }
  }

  async updateDNSRecord(req, res, next) {
    try {
      const { id } = req.params
      const record = await dnsService.updateDNSRecord(id, req.body)
      if (!record) {
        return res.status(404).json({ success: false, error: "DNS record not found" })
      }
      res.json({ success: true, data: record })
    } catch (error) {
      next(error)
    }
  }

  async deleteDNSRecord(req, res, next) {
    try {
      const { id } = req.params
      const record = await dnsService.deleteDNSRecord(id)
      if (!record) {
        return res.status(404).json({ success: false, error: "DNS record not found" })
      }
      res.json({ success: true, message: "DNS record deleted successfully" })
    } catch (error) {
      next(error)
    }
  }

  async getDNSRecordById(req, res, next) {
    try {
      const { id } = req.params
      const record = await dnsService.getDNSRecordById(id)
      if (!record) {
        return res.status(404).json({ success: false, error: "DNS record not found" })
      }
      res.json({ success: true, data: record })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new DNSController()