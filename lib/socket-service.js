import io from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      auth: {
        token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
      },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.emit('connection_established');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('connection_lost');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket_error', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.socket) this.connect();
    
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    
    this.socket.off(event, callback);
  }

  emit(event, data) {
    if (!this.socket) this.connect();
    this.socket.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // Subscription methods
  subscribeToMetrics(projectId, callback) {
    this.emit('subscribe_metrics', { projectId });
    this.on(`metrics:${projectId}`, callback);
  }

  unsubscribeFromMetrics(projectId, callback) {
    this.emit('unsubscribe_metrics', { projectId });
    this.off(`metrics:${projectId}`, callback);
  }

  subscribeToLogs(deploymentId, callback) {
    this.emit('subscribe_logs', { deploymentId });
    this.on(`logs:${deploymentId}`, callback);
  }

  unsubscribeFromLogs(deploymentId, callback) {
    this.emit('unsubscribe_logs', { deploymentId });
    this.off(`logs:${deploymentId}`, callback);
  }

  subscribeToAlerts(callback) {
    this.emit('subscribe_alerts');
    this.on('alerts:new', callback);
  }

  unsubscribeFromAlerts(callback) {
    this.emit('unsubscribe_alerts');
    this.off('alerts:new', callback);
  }

  subscribeToDeployments(callback) {
    this.emit('subscribe_deployments');
    this.on('deployments:update', callback);
  }

  unsubscribeFromDeployments(callback) {
    this.emit('unsubscribe_deployments');
    this.off('deployments:update', callback);
  }

  subscribeToSystemStatus(callback) {
    this.emit('subscribe_system_status');
    this.on('system:status', callback);
  }

  unsubscribeFromSystemStatus(callback) {
    this.emit('unsubscribe_system_status');
    this.off('system:status', callback);
  }
}

export const socketService = new SocketService();
export default socketService;
