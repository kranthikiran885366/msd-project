const mongoose = require('mongoose');

const systemStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['operational', 'degraded', 'maintenance', 'outage'],
    default: 'operational'
  },
  message: {
    type: String
  },
  services: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemStatus', systemStatusSchema);