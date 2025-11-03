const mongoose = require('mongoose');

class ErrorMonitoringService {
  static init() {
    // Monitor all MongoDB operations
    mongoose.set('debug', process.env.NODE_ENV !== 'production');

    // Handle MongoDB connection errors
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      // Implement your error reporting here
    });

    // Handle MongoDB disconnection
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    // Handle successful reconnection
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
  }

  static handleError(error, req = null) {
    console.error('Application error:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      path: req?.path,
      method: req?.method,
      ip: req?.ip,
    });
    // Implement your error reporting here
  }
}

module.exports = ErrorMonitoringService;