// SSL Service
const SSLCertificate = require("../models/SSLCertificate")
const Domain = require("../models/Domain")
const crypto = require("crypto")

class SSLService {
  async getSSLCertificates(domainId) {
    return await SSLCertificate.find({ domainId }).sort({ createdAt: -1 })
  }

  async uploadSSLCertificate(data) {
    const { domainId, name, domain, certificateData, privateKey, chainData } = data
    
    // Validate domain exists
    const domainDoc = await Domain.findById(domainId)
    if (!domainDoc) {
      throw new Error("Domain not found")
    }

    // Generate fingerprint
    const fingerprint = this.generateFingerprint(certificateData)
    
    // Calculate expiry date (mock - in real implementation, parse certificate)
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now

    const certificate = new SSLCertificate({
      domainId,
      name,
      domain,
      fingerprint,
      expiresAt,
      certificateData,
      privateKey,
      certificateChain: chainData || "ACME issued by R3",
      status: "active",
    })

    await certificate.save()
    return certificate
  }

  async deleteSSLCertificate(certificateId) {
    return await SSLCertificate.findByIdAndDelete(certificateId)
  }

  async renewSSLCertificate(certificateId) {
    const certificate = await SSLCertificate.findById(certificateId)
    if (!certificate) {
      throw new Error("Certificate not found")
    }

    // Mock renewal - extend expiry by 1 year
    certificate.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    certificate.issuedAt = new Date()
    certificate.status = "active"
    
    await certificate.save()
    return certificate
  }

  async getSSLCertificateById(certificateId) {
    return await SSLCertificate.findById(certificateId)
  }

  async checkExpiringCertificates(days = 30) {
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return await SSLCertificate.find({
      expiresAt: { $lte: expiryDate },
      status: "active",
    })
  }

  generateFingerprint(certificateData) {
    // Generate a mock fingerprint
    const hash = crypto.createHash("sha256").update(certificateData || "mock-cert").digest("hex")
    return hash.substring(0, 40).match(/.{2}/g).join(":").toUpperCase()
  }

  async updateCertificateStatus() {
    const now = new Date()
    
    // Update expiring certificates
    await SSLCertificate.updateMany(
      {
        expiresAt: { $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        status: "active",
      },
      { status: "expiring_soon" }
    )

    // Update expired certificates
    await SSLCertificate.updateMany(
      {
        expiresAt: { $lte: now },
        status: { $in: ["active", "expiring_soon"] },
      },
      { status: "expired" }
    )
  }
}

module.exports = new SSLService()