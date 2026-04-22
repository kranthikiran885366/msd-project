const mongodbProvider = require("./mongodb")
const postgresProvider = require("./postgres")
const redisProvider = require("./redis")

const providers = {
  mongodb: mongodbProvider,
  postgresql: postgresProvider,
  redis: redisProvider,
}

function getProvider(type) {
  const normalized = String(type || "").toLowerCase()
  const provider = providers[normalized]
  if (!provider) {
    throw new Error(`Unsupported database type: ${type}`)
  }
  return provider
}

module.exports = {
  getProvider,
}
