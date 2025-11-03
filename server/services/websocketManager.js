const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { EventEmitter } = require('events');

class WebSocketManager {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.eventBus = new EventEmitter();
    this.clients = new Map(); // userId -> Set<WebSocket>
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract token from query string
        const token = new URL(req.url, 'http://localhost').searchParams.get('token');
        if (!token) {
          ws.close(4001, 'Authentication required');
          return;
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Store client connection
        if (!this.clients.has(userId)) {
          this.clients.set(userId, new Set());
        }
        this.clients.get(userId).add(ws);

        // Handle client messages
        ws.on('message', (data) => this.handleMessage(ws, userId, data));

        // Handle client disconnect
        ws.on('close', () => {
          const userClients = this.clients.get(userId);
          userClients.delete(ws);
          if (userClients.size === 0) {
            this.clients.delete(userId);
          }
        });

        // Send initial state
        ws.send(JSON.stringify({ type: 'connected', userId }));

      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close(4002, 'Invalid token');
      }
    });
  }

  handleMessage(ws, userId, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(ws, userId, message);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, userId, message);
          break;
        default:
          ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
    }
  }

  handleSubscribe(ws, userId, message) {
    const { resource, resourceId } = message;
    const subscriptionKey = `${resource}:${resourceId}`;
    
    // Add subscription handler
    const handler = (data) => {
      ws.send(JSON.stringify({
        type: 'update',
        resource,
        resourceId,
        data
      }));
    };

    // Store handler reference for cleanup
    ws.subscriptions = ws.subscriptions || new Map();
    ws.subscriptions.set(subscriptionKey, handler);

    // Subscribe to events
    this.eventBus.on(subscriptionKey, handler);

    // Acknowledge subscription
    ws.send(JSON.stringify({
      type: 'subscribed',
      resource,
      resourceId
    }));
  }

  handleUnsubscribe(ws, userId, message) {
    const { resource, resourceId } = message;
    const subscriptionKey = `${resource}:${resourceId}`;
    
    // Remove subscription
    if (ws.subscriptions && ws.subscriptions.has(subscriptionKey)) {
      const handler = ws.subscriptions.get(subscriptionKey);
      this.eventBus.off(subscriptionKey, handler);
      ws.subscriptions.delete(subscriptionKey);
    }

    // Acknowledge unsubscription
    ws.send(JSON.stringify({
      type: 'unsubscribed',
      resource,
      resourceId
    }));
  }

  // Public methods for emitting updates

  emitDeploymentUpdate(deploymentId, data) {
    this.eventBus.emit(`deployment:${deploymentId}`, data);
  }

  emitBuildUpdate(buildId, data) {
    this.eventBus.emit(`build:${buildId}`, data);
  }

  emitFunctionUpdate(functionId, data) {
    this.eventBus.emit(`function:${functionId}`, data);
  }

  emitProjectUpdate(projectId, data) {
    this.eventBus.emit(`project:${projectId}`, data);
  }

  emitTeamUpdate(teamId, data) {
    this.eventBus.emit(`team:${teamId}`, data);
  }

  // Broadcast to all clients of a user
  broadcastToUser(userId, data) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }

  // Broadcast to all clients of a team
  async broadcastToTeam(teamId, data) {
    // TODO: Implement getting team members from your database
    const teamMembers = await this.getTeamMembers(teamId);
    teamMembers.forEach(userId => {
      this.broadcastToUser(userId, data);
    });
  }

  // Helper method to get team members (implement based on your data model)
  async getTeamMembers(teamId) {
    // TODO: Implement fetching team members from your database
    return [];
  }
}

module.exports = WebSocketManager;