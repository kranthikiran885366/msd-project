'use strict';
const mongoose = require('mongoose');

const WorkerNodeSchema = new mongoose.Schema({
    nodeId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    hostname: {
        type: String,
        required: true
    },
    // AWS EC2: private IP used for internal VPC communication
    privateIp: {
        type: String,
        default: ''
    },
    // AWS EC2: public IP used for live app URL generation
    publicIp: {
        type: String,
        default: ''
    },
    region: {
        type: String,
        default: 'us-east-1'
    },
    availabilityZone: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'failed'],
        default: 'active'
    },
    lastHeartbeat: {
        type: Date,
        default: Date.now
    },
    cpuUsage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    memoryUsage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    diskUsage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    activeContainers: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCapacity: {
        cpu: { type: Number, default: 2 },
        memory: { type: Number, default: 2048 },   // MB
        storage: { type: Number, default: 10240 }  // MB
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    errors: [{
        timestamp: Date,
        message: String
    }]
}, { timestamps: true });

WorkerNodeSchema.index({ status: 1, lastHeartbeat: -1 });
WorkerNodeSchema.index({ region: 1, status: 1 });

WorkerNodeSchema.virtual('isHealthy').get(function () {
    return this.status === 'active';
});

WorkerNodeSchema.virtual('isAtCapacity').get(function () {
    return this.activeContainers >= 10;
});

module.exports = mongoose.model('WorkerNode', WorkerNodeSchema);
