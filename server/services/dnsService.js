// DNS Service
const DNSRecord = require("../models/DNSRecord")
const Domain = require("../models/Domain")

class DNSService {
  async getDNSRecords(domainId) {
    return await DNSRecord.find({ domainId }).sort({ createdAt: -1 })
  }

  async addDNSRecord(data) {
    const { domainId, name, type, value, ttl, priority } = data
    
    // Validate domain exists
    const domain = await Domain.findById(domainId)
    if (!domain) {
      throw new Error("Domain not found")
    }

    const record = new DNSRecord({
      domainId,
      name,
      type,
      value,
      ttl: ttl || 3600,
      priority: priority || 10,
    })

    await record.save()
    return record
  }

  async updateDNSRecord(recordId, data) {
    return await DNSRecord.findByIdAndUpdate(recordId, data, { new: true })
  }

  async deleteDNSRecord(recordId) {
    return await DNSRecord.findByIdAndDelete(recordId)
  }

  async getDNSRecordById(recordId) {
    return await DNSRecord.findById(recordId)
  }

  async validateDNSRecord(type, value) {
    // Basic validation for different record types
    switch (type) {
      case "A":
        return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(value)
      case "AAAA":
        return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(value)
      case "CNAME":
      case "NS":
        return /^[a-zA-Z0-9.-]+\.$/.test(value) || /^[a-zA-Z0-9.-]+$/.test(value)
      case "MX":
        return /^\d+\s+[a-zA-Z0-9.-]+\.?$/.test(value)
      case "TXT":
        return value.length <= 255
      default:
        return true
    }
  }
}

module.exports = new DNSService()