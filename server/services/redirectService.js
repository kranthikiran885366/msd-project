// Redirect Service
const DomainRedirect = require("../models/DomainRedirect")
const Domain = require("../models/Domain")

class RedirectService {
  async getDomainRedirects(domainId) {
    return await DomainRedirect.find({ domainId }).sort({ createdAt: -1 })
  }

  async addDomainRedirect(data) {
    const { domainId, sourceUrl, destinationUrl, redirectType, enabled } = data
    
    // Validate domain exists
    const domain = await Domain.findById(domainId)
    if (!domain) {
      throw new Error("Domain not found")
    }

    // Validate URLs
    if (!this.isValidUrl(destinationUrl)) {
      throw new Error("Invalid destination URL")
    }

    const redirect = new DomainRedirect({
      domainId,
      sourceUrl,
      destinationUrl,
      redirectType: redirectType || "301",
      enabled: enabled !== false,
    })

    await redirect.save()
    return redirect
  }

  async updateDomainRedirect(redirectId, data) {
    if (data.destinationUrl && !this.isValidUrl(data.destinationUrl)) {
      throw new Error("Invalid destination URL")
    }

    return await DomainRedirect.findByIdAndUpdate(redirectId, data, { new: true })
  }

  async deleteDomainRedirect(redirectId) {
    return await DomainRedirect.findByIdAndDelete(redirectId)
  }

  async getDomainRedirectById(redirectId) {
    return await DomainRedirect.findById(redirectId)
  }

  async recordRedirectHit(redirectId) {
    return await DomainRedirect.findByIdAndUpdate(
      redirectId,
      {
        $inc: { hits: 1 },
        lastHit: new Date(),
      },
      { new: true }
    )
  }

  async getRedirectStats(domainId) {
    const redirects = await DomainRedirect.find({ domainId })
    const totalRedirects = redirects.length
    const activeRedirects = redirects.filter(r => r.enabled).length
    const totalHits = redirects.reduce((sum, r) => sum + r.hits, 0)

    return {
      totalRedirects,
      activeRedirects,
      totalHits,
      redirects: redirects.map(r => ({
        id: r._id,
        sourceUrl: r.sourceUrl,
        destinationUrl: r.destinationUrl,
        hits: r.hits,
        enabled: r.enabled,
      })),
    }
  }

  isValidUrl(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  validateRedirectType(type) {
    return ["301", "302", "307", "308"].includes(type)
  }
}

module.exports = new RedirectService()