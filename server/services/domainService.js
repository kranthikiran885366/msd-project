// Domain Service
const Domain = require("../models/Domain")
const { isValidUrl } = require("../utils/validators")

class DomainService {
  async createDomain(projectId, host) {
    const domain = new Domain({
      projectId,
      host,
      status: "pending",
      dnsRecords: [
        {
          type: "CNAME",
          host: host.split(".")[0],
          value: "cname.clouddeck.dev",
          ttl: 3600,
        },
      ],
    })

    await domain.save()
    return domain
  }

  async getDomains(projectId) {
    return await Domain.find({ projectId })
  }

  async getDomainById(id) {
    return await Domain.findById(id)
  }

  async updateDomain(id, data) {
    return await Domain.findByIdAndUpdate(id, data, { new: true })
  }

  async verifyDomain(id) {
    const domain = await Domain.findByIdAndUpdate(
      id,
      {
        status: "verified",
        "sslCertificate.issued": new Date(),
        "sslCertificate.expires": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        certificateStatus: "active",
      },
      { new: true },
    )
    return domain
  }

  async deleteDomain(id) {
    return await Domain.findByIdAndDelete(id)
  }
}

module.exports = new DomainService()
