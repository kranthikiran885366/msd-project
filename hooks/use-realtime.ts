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

    // Subscribe to metrics
    if (projectId) {
      socketService.subscribeToMetrics(projectId, (data: any) => {
        setMetrics(data);
        setError(null);
      });
    }

    // Cleanup
    return () => {
      if (projectId) {
        socketService.unsubscribeFromMetrics(projectId, (data: any) => setMetrics(data));
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

    if (deploymentId) {
      socketService.subscribeToLogs(deploymentId, (logEntry: any) => {
        setLogs((prev) => [logEntry, ...prev].slice(0, 1000));
        setError(null);
      });
    }

    return () => {
      if (deploymentId) {
        socketService.unsubscribeFromLogs(deploymentId, (logEntry: any) => {
          setLogs((prev) => [logEntry, ...prev].slice(0, 1000));
        });
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

    socketService.subscribeToAlerts((alert: any) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 100));
      setError(null);
    });

    return () => {
      socketService.unsubscribeFromAlerts((alert: any) => {
        setAlerts((prev) => [alert, ...prev].slice(0, 100));
      });
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

    socketService.subscribeToDeployments((deployment: any) => {
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
    });

    return () => {
      socketService.unsubscribeFromDeployments((deployment: any) => {
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
      });
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

    socketService.subscribeToSystemStatus((systemStatus: any) => {
      setStatus(systemStatus);
      setError(null);
    });

    return () => {
      socketService.unsubscribeFromSystemStatus((systemStatus: any) => {
        setStatus(systemStatus);
      });
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, []);

  return { status, isConnected, error };
}
