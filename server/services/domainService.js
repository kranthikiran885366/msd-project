// Domain Service
const crypto = require('crypto')
const dns = require('dns').promises
const Domain = require('../models/Domain')

class DomainService {
  constructor() {
    this.cnameTarget = (process.env.PLATFORM_CNAME_TARGET || 'cname.clouddeck.dev').toLowerCase().replace(/\.$/, '')
  }

  normalizeHost(host) {
    return String(host || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
  }

  validationHost(host) {
    return `_clouddeck-challenge.${host}`
  }

  buildDnsInstructions(host, token) {
    return [
      {
        type: 'TXT',
        host: this.validationHost(host),
        value: `clouddeck-verify=${token}`,
        ttl: 300,
        required: true,
      },
      {
        type: 'CNAME',
        host,
        value: this.cnameTarget,
        ttl: 300,
        required: false,
      },
    ]
  }

  async getVerificationStatus(id) {
    const domain = await Domain.findById(id)
    if (!domain) throw new Error('Domain not found')

    const host = this.normalizeHost(domain.host)
    const token = domain.verificationToken
    const txtHost = this.validationHost(host)
    const expectedTxt = token ? `clouddeck-verify=${token}` : null

    let txtRecords = []
    let cnameRecords = []

    try {
      const txt = await dns.resolveTxt(txtHost)
      txtRecords = txt.flat().map(v => String(v).trim())
    } catch (_) {}

    try {
      const cname = await dns.resolveCname(host)
      cnameRecords = cname.map(v => String(v).toLowerCase().replace(/\.$/, ''))
    } catch (_) {}

    const txtValid = !!(expectedTxt && txtRecords.includes(expectedTxt))
    const cnameValid = cnameRecords.includes(this.cnameTarget)

    return {
      domainId: String(domain._id),
      host,
      status: domain.status,
      verifiedAt: domain.verifiedAt || null,
      expected: {
        txtHost,
        txtValue: expectedTxt,
        cnameTarget: this.cnameTarget,
      },
      observed: {
        txtRecords,
        cnameRecords,
      },
      checks: {
        txtValid,
        cnameValid,
      },
      canVerify: txtValid,
    }
  }

  async createDomain(projectId, host) {
    const normalizedHost = this.normalizeHost(host)
    if (!/^[a-z0-9.-]+$/.test(normalizedHost) || !normalizedHost.includes('.')) {
      throw new Error('Invalid domain host')
    }

    const token = crypto.randomBytes(10).toString('hex')
    const domain = new Domain({
      projectId,
      host: normalizedHost,
      status: 'pending',
      verificationToken: token,
      dnsRecords: this.buildDnsInstructions(normalizedHost, token),
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

  async generateVerificationToken(id) {
    const token = crypto.randomBytes(12).toString('hex')
    const domain = await Domain.findById(id)
    if (!domain) return null

    domain.verificationToken = token
    domain.status = 'pending'
    domain.dnsRecords = this.buildDnsInstructions(this.normalizeHost(domain.host), token)
    await domain.save()
    return domain
  }

  async verifyDomain(id) {
    const domain = await Domain.findById(id)
    if (!domain) throw new Error('Domain not found')
    if (!domain.verificationToken) throw new Error('No verification token set')

    const host = this.normalizeHost(domain.host)
    const token = domain.verificationToken
    const txtHost = this.validationHost(host)
    const expectedTxt = `clouddeck-verify=${token}`
    let txtVerified = false
    let cnameVerified = false

    // Check TXT records
    try {
      const txt = await dns.resolveTxt(txtHost)
      const flat = txt.flat().map(s => String(s).trim())
      txtVerified = flat.includes(expectedTxt)
    } catch (err) {
      // ignore
    }

    // Check CNAME
    try {
      const cname = await dns.resolveCname(host).catch(() => null)
      const normalized = (cname || []).map(v => String(v).toLowerCase().replace(/\.$/, ''))
      if (normalized.includes(this.cnameTarget)) {
        cnameVerified = true
      }
    } catch (err) {}

    // Ownership verification requires TXT challenge to be present.
    if (!txtVerified) {
      return {
        verified: false,
        reason: 'missing_txt_challenge',
        expected: { host: txtHost, value: expectedTxt, cnameTarget: this.cnameTarget },
        checks: { txtVerified, cnameVerified },
      }
    }

    domain.host = host
    domain.status = 'verified'
    domain.verifiedAt = new Date()
    domain.certificateStatus = 'pending'
    domain.sslCertificate = {
      issued: new Date(),
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      provider: 'letsencrypt',
    }
    await domain.save()

    return {
      verified: true,
      method: txtVerified && cnameVerified ? 'txt+cname' : 'txt',
      checks: { txtVerified, cnameVerified },
      domain,
    }
  }

  async deleteDomain(id) {
    return await Domain.findByIdAndDelete(id)
  }
}

module.exports = new DomainService()
