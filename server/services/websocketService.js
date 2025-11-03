const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Real-time WebSocket service for deployment updates
 * Handles live logs, status updates, and deployment events
 */
class WebSocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.deploymentRooms = new Map(); // deployment_id -> [users]
    this.userSockets = new Map(); // user_id -> [socket_ids]

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * JWT middleware for socket connections
   */
  setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userEmail = decoded.email;
        next();
      } catch (error) {
        logger.error('WebSocket auth failed:', error);
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User ${socket.userId} connected via WebSocket`, { socketId: socket.id });

      // Track user sockets
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, []);
      }
      this.userSockets.get(socket.userId).push(socket.id);

      // Join deployment room
      socket.on('join-deployment', (deploymentId) => {
        socket.join(`deployment:${deploymentId}`);
        logger.info(`User ${socket.userId} joined deployment ${deploymentId}`);

        if (!this.deploymentRooms.has(deploymentId)) {
          this.deploymentRooms.set(deploymentId, new Set());
        }
        this.deploymentRooms.get(deploymentId).add(socket.userId);

        socket.emit('joined', { deploymentId, message: 'Connected to deployment stream' });
      });

      // Leave deployment room
      socket.on('leave-deployment', (deploymentId) => {
        socket.leave(`deployment:${deploymentId}`);
        logger.info(`User ${socket.userId} left deployment ${deploymentId}`);

        const room = this.deploymentRooms.get(deploymentId);
        if (room) room.delete(socket.userId);
      });

      // Disconnect
      socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected`, { socketId: socket.id });

        const userSockets = this.userSockets.get(socket.userId);
        if (userSockets) {
          const idx = userSockets.indexOf(socket.id);
          if (idx > -1) userSockets.splice(idx, 1);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });
  }

  /**
   * Emit deployment status update
   */
  emitDeploymentStatus(deploymentId, status) {
    this.io.to(`deployment:${deploymentId}`).emit('deployment:status-update', {
      deploymentId,
      status,
      timestamp: new Date(),
    });
    logger.debug(`Deployment status emitted: ${deploymentId} -> ${status}`);
  }

  /**
   * Stream build logs
   */
  streamBuildLog(deploymentId, log) {
    this.io.to(`deployment:${deploymentId}`).emit('deployment:log', {
      deploymentId,
      log,
      timestamp: new Date(),
    });
  }

  /**
   * Emit deployment completion
   */
  emitDeploymentComplete(deploymentId, deployment) {
    this.io.to(`deployment:${deploymentId}`).emit('deployment:complete', {
      deployment,
      timestamp: new Date(),
    });
  }

  /**
   * Emit deployment error
   */
  emitDeploymentError(deploymentId, error) {
    this.io.to(`deployment:${deploymentId}`).emit('deployment:error', {
      deploymentId,
      error,
      timestamp: new Date(),
    });
  }

  /**
   * Notify user of deployment event
   */
  notifyUser(userId, event, data) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Get active users for a deployment
   */
  getDeploymentUsers(deploymentId) {
    const room = this.deploymentRooms.get(deploymentId);
    return room ? Array.from(room) : [];
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      totalConnected: Object.keys(this.io.sockets.sockets).length,
      totalUsers: this.userSockets.size,
      totalDeployments: this.deploymentRooms.size,
      deployments: Array.from(this.deploymentRooms.entries()).map(([id, users]) => ({
        id,
        watchers: users.size,
      })),
    };
  }
}

module.exports = WebSocketService;
