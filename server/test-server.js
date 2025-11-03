const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Test GitHub auth route
app.get('/auth/github', (req, res) => {
  res.json({ message: 'GitHub OAuth route working' })
})

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`)
})