// Test script to verify dashboard API integration
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Simple test server
const app = express();
app.use(cors());
app.use(express.json());

// Mock auth middleware for testing
const mockAuth = (req, res, next) => {
  req.userId = 'test-user-id';
  next();
};

// Import dashboard controller
const dashboardController = require('./controllers/dashboardController');

// Test routes
app.get('/api/dashboard', mockAuth, dashboardController.getDashboard);
app.get('/api/dashboard/stats', mockAuth, dashboardController.getStats);
app.get('/api/dashboard/recent-activity', mockAuth, dashboardController.getRecentActivity);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dashboard API test server running' });
});

const PORT = process.env.TEST_PORT || 3001;

// Connect to MongoDB (use test database)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deployment-framework-test';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB (test database)');
    app.listen(PORT, () => {
      console.log(`Dashboard API test server running on port ${PORT}`);
      console.log(`Test endpoints:`);
      console.log(`- GET http://localhost:${PORT}/health`);
      console.log(`- GET http://localhost:${PORT}/api/dashboard`);
      console.log(`- GET http://localhost:${PORT}/api/dashboard/stats`);
      console.log(`- GET http://localhost:${PORT}/api/dashboard/recent-activity`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  });

module.exports = app;