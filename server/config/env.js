// Environment Configuration
module.exports = {
  port: process.env.BACKEND_PORT || process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/clouddeck",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  apiUrl: process.env.API_URL || "http://localhost:3001",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5000",
}
