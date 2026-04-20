import { useEffect, useState, useCallback } from 'react';
import { socketService } from '@/lib/socket-service';

export function useRealTimeMetrics(projectId: string) {
  const [metrics, setMetrics] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // Connect to socket
    socketService.connect();
    setIsConnected(socketService.isConnected());

    // Handle connection status
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: any) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    const handleMetricUpdate = (data: any) => {
      setMetrics(data);
      setError(null);
    };

    // Subscribe to metrics
    if (projectId) {
      socketService.subscribeToMetrics(projectId, handleMetricUpdate);
    }

    // Cleanup
    return () => {
      if (projectId) {
        socketService.unsubscribeFromMetrics(projectId, handleMetricUpdate);
      }
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, [projectId]);

  return { metrics, isConnected, error };
}

export function useRealTimeLogs(deploymentId: string) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: any) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    const handleLogEntry = (logEntry: any) => {
        setLogs((prev) => [logEntry, ...prev].slice(0, 1000));
        setError(null);
    };

    if (deploymentId) {
      socketService.subscribeToLogs(deploymentId, handleLogEntry);
    }

    return () => {
      if (deploymentId) {
        socketService.unsubscribeFromLogs(deploymentId, handleLogEntry);
      }
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, [deploymentId]);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, isConnected, error, clearLogs };
}

export function useRealTimeAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: any) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    const handleAlert = (alert: any) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 100));
      setError(null);
    };

    socketService.subscribeToAlerts(handleAlert);

    return () => {
      socketService.unsubscribeFromAlerts(handleAlert);
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    socketService.emit('acknowledge_alert', { alertId });
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  return { alerts, isConnected, error, acknowledgeAlert };
}

export function useRealTimeDeployments() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: any) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    const handleDeployment = (deployment: any) => {
      setDeployments((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((d) => d.id === deployment.id);
        if (index > -1) {
          updated[index] = deployment;
        } else {
          updated.unshift(deployment);
        }
        return updated.slice(0, 50);
      });
      setError(null);
    };

    socketService.subscribeToDeployments(handleDeployment);

    return () => {
      socketService.unsubscribeFromDeployments(handleDeployment);
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, []);

  return { deployments, isConnected, error };
}

export function useSystemStatus() {
  const [status, setStatus] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: any) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    const handleSystemStatus = (systemStatus: any) => {
      setStatus(systemStatus);
      setError(null);
    };

    socketService.subscribeToSystemStatus(handleSystemStatus);

    return () => {
      socketService.unsubscribeFromSystemStatus(handleSystemStatus);
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, []);

  return { status, isConnected, error };
}
