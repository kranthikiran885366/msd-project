const axios = require("axios")

class AtlasProvider {
  constructor() {
    this.groupId = process.env.ATLAS_PROJECT_ID
    this.publicKey = process.env.ATLAS_PUBLIC_KEY
    this.privateKey = process.env.ATLAS_PRIVATE_KEY
    this.clusterTier = process.env.ATLAS_CLUSTER_TIER || "M10"
    this.providerName = process.env.ATLAS_CLOUD_PROVIDER || "AWS"
    this.regionName = process.env.ATLAS_REGION || "US_EAST_1"
    this.baseUrl = "https://cloud.mongodb.com/api/atlas/v1.0"
  }

  async createDatabase({ databaseId, username, password, databaseName }) {
    if (!this.groupId || !this.publicKey || !this.privateKey) {
      throw new Error("Atlas credentials are not configured")
    }

    const clusterName = `db-${String(databaseId).slice(-10).toLowerCase()}`
    await this._atlas().post(`/groups/${this.groupId}/clusters`, {
      name: clusterName,
      clusterType: "REPLICASET",
      providerSettings: {
        providerName: this.providerName,
        instanceSizeName: this.clusterTier,
        regionName: this.regionName,
      },
      replicationSpecs: [
        {
          numShards: 1,
          regionsConfig: {
            [this.regionName]: { electableNodes: 3, priority: 7, readOnlyNodes: 0 },
          },
        },
      ],
      backupEnabled: true,
      autoScaling: { diskGBEnabled: true },
    })

    await this._waitForCluster(clusterName)
    await this._atlas().post(`/groups/${this.groupId}/databaseUsers`, {
      databaseName: "admin",
      roles: [{ roleName: "readWriteAnyDatabase", databaseName: "admin" }],
      username,
      password,
      scopes: [{ name: clusterName, type: "CLUSTER" }],
    })

    // Network access list for app egress IP/CIDR
    const cidrs = (process.env.ATLAS_ACCESS_LIST || "").split(",").map((s) => s.trim()).filter(Boolean)
    if (cidrs.length) {
      await this._atlas().post(`/groups/${this.groupId}/accessList`, cidrs.map((cidr) => ({ cidrBlock: cidr })))
    }

    const cluster = await this._atlas().get(`/groups/${this.groupId}/clusters/${clusterName}`)
    const host = cluster.data?.mongoURI?.split("@")[1]?.split("/")[0] || cluster.data?.mongoURI?.replace("mongodb+srv://", "")
    const connectionString = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}/${databaseName}?retryWrites=true&w=majority`
    return {
      provider: "atlas",
      host,
      privateHost: host,
      port: 27017,
      externalResourceId: clusterName,
      connectionString,
    }
  }

  async deleteDatabase(meta) {
    if (!meta.externalResourceId) return { deleted: true }
    await this._atlas().delete(`/groups/${this.groupId}/clusters/${meta.externalResourceId}`)
    return { deleted: true }
  }

  async getStatus(meta) {
    const cluster = await this._atlas().get(`/groups/${this.groupId}/clusters/${meta.externalResourceId}`)
    return cluster.data?.stateName || "unknown"
  }

  async _waitForCluster(clusterName) {
    const timeoutMs = Number(process.env.ATLAS_CREATE_TIMEOUT_MS || 1800000)
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const res = await this._atlas().get(`/groups/${this.groupId}/clusters/${clusterName}`)
      if (res.data?.stateName === "IDLE") return
      await new Promise((r) => setTimeout(r, 15000))
    }
    throw new Error("Timed out waiting for Atlas cluster readiness")
  }

  _atlas() {
    const auth = Buffer.from(`${this.publicKey}:${this.privateKey}`).toString("base64")
    return axios.create({
      baseURL: this.baseUrl,
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      timeout: 30000,
    })
  }
}

module.exports = AtlasProvider
