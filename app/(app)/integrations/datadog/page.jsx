'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Trash2, RefreshCw, Link2, Settings, TrendingUp, BarChart3, Eye, EyeOff } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function DatadogIntegrationPage() {
  const [connection, setConnection] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [appKey, setAppKey] = useState('');

  // Mock connection data
  const mockConnection = {
    id: 'dd-conn-1',
    status: 'connected',
    siteName: 'Acme Corp',
    datadogSite: 'us3.datadoghq.com',
    connectedAt: '2024-08-15T10:00:00Z',
    lastSync: '2024-12-20T15:45:00Z',
    eventsReceived: 15342,
    metricsReceived: 284567,
    hostedAssets: 42
  };

  // Mock dashboards
  const mockDashboards = [
    {
      id: 'dd-dash-1',
      name: 'Infrastructure Overview',
      url: 'https://app.datadoghq.com/dashboard/abc123',
      widgets: 12,
      lastModified: '2024-12-18T14:30:00Z',
      refreshInterval: 'auto',
      syncedAt: '2024-12-20T15:45:00Z'
    },
    {
      id: 'dd-dash-2',
      name: 'Application Performance',
      url: 'https://app.datadoghq.com/dashboard/def456',
      widgets: 18,
      lastModified: '2024-12-19T09:15:00Z',
      refreshInterval: '1m',
      syncedAt: '2024-12-20T15:45:00Z'
    },
    {
      id: 'dd-dash-3',
      name: 'Database Metrics',
      url: 'https://app.datadoghq.com/dashboard/ghi789',
      widgets: 9,
      lastModified: '2024-12-17T11:00:00Z',
      refreshInterval: '5m',
      syncedAt: '2024-12-20T15:45:00Z'
    },
    {
      id: 'dd-dash-4',
      name: 'Security & Compliance',
      url: 'https://app.datadoghq.com/dashboard/jkl012',
      widgets: 15,
      lastModified: '2024-12-20T08:30:00Z',
      refreshInterval: 'auto',
      syncedAt: '2024-12-20T15:45:00Z'
    }
  ];

  // Mock monitors
  const mockMonitors = [
    {
      id: 'dd-mon-1',
      name: 'High CPU Usage',
      type: 'metric alert',
      query: 'avg:system.cpu{*}',
      threshold: 85,
      status: 'OK',
      lastTriggered: '2024-12-18T10:30:00Z',
      evaluationWindow: '5m',
      dataPoints: 23
    },
    {
      id: 'dd-mon-2',
      name: 'API Error Rate Threshold',
      type: 'metric alert',
      query: 'avg:trace.web.request.errors{*}',
      threshold: 5,
      status: 'ALERT',
      lastTriggered: '2024-12-20T14:15:00Z',
      evaluationWindow: '3m',
      dataPoints: 18
    },
    {
      id: 'dd-mon-3',
      name: 'Database Connection Pool',
      type: 'metric alert',
      query: 'avg:postgresql.connections{*}',
      threshold: 80,
      status: 'OK',
      lastTriggered: '2024-12-19T16:45:00Z',
      evaluationWindow: '2m',
      dataPoints: 45
    },
    {
      id: 'dd-mon-4',
      name: 'Deployment Failure',
      type: 'event alert',
      query: 'status:error tag:deployment',
      threshold: 1,
      status: 'OK',
      lastTriggered: null,
      evaluationWindow: '1h',
      dataPoints: 0
    },
    {
      id: 'dd-mon-5',
      name: 'Storage Capacity Alert',
      type: 'metric alert',
      query: 'avg:system.disk.in_use{*}',
      threshold: 90,
      status: 'WARNING',
      lastTriggered: '2024-12-20T13:00:00Z',
      evaluationWindow: '10m',
      dataPoints: 67
    }
  ];

  useEffect(() => {
    setConnection(mockConnection);
    setDashboards(mockDashboards);
    setMonitors(mockMonitors);
    setLoading(false);
  }, []);

  const handleConnectDatadog = async () => {
    if (!apiKey.trim() || !appKey.trim()) {
      setError('Both API and App keys are required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.connectDatadog({ apiKey, appKey });

      if (response.success) {
        setConnection(mockConnection);
        setSuccessMessage('Connected to Datadog successfully');
        setShowApiKeyInput(false);
        setApiKey('');
        setAppKey('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to connect to Datadog');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Datadog?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.disconnectDatadog();

      if (response.success) {
        setConnection(null);
        setDashboards([]);
        setMonitors([]);
        setSuccessMessage('Disconnected from Datadog');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to disconnect');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleSyncDashboards = async () => {
    try {
      setError('');
      const response = await apiClient.syncDatadogDashboards();

      if (response.success) {
        setDashboards(mockDashboards);
        setSuccessMessage('Dashboards synced successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to sync dashboards');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleGetAlerts = async () => {
    try {
      setError('');
      const response = await apiClient.getDatadogAlerts();

      if (response.success) {
        setMonitors(mockMonitors);
        setSuccessMessage('Alerts refreshed successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleExportMetrics = async () => {
    try {
      setError('');
      const response = await apiClient.exportDatadogMetrics();

      if (response.success) {
        setSuccessMessage('Metrics exported successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to export metrics');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const alertStatuses = {
    'OK': 'bg-green-100 text-green-800',
    'ALERT': 'bg-red-100 text-red-800',
    'WARNING': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Datadog Integration</h1>
          <p className="text-muted-foreground">Monitor, visualize, and manage your infrastructure with Datadog</p>
        </div>
        {connection && (
          <Button onClick={handleDisconnect} variant="destructive">
            Disconnect
          </Button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      {!connection ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-orange-900">Not Connected to Datadog</p>
                <p className="text-sm text-orange-700 mt-1">Connect your Datadog account to sync dashboards and monitors</p>
              </div>

              {!showApiKeyInput ? (
                <Button onClick={() => setShowApiKeyInput(true)} className="gap-2">
                  <Link2 className="w-4 h-4" />
                  Connect to Datadog
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Datadog API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your Datadog API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appKey">Datadog App Key *</Label>
                    <Input
                      id="appKey"
                      type="password"
                      placeholder="Enter your Datadog App key"
                      value={appKey}
                      onChange={(e) => setAppKey(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleConnectDatadog} className="flex-1">Connect</Button>
                    <Button onClick={() => {
                      setShowApiKeyInput(false);
                      setApiKey('');
                      setAppKey('');
                    }} variant="outline">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Connection Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="w-fit bg-green-100 text-green-800">Connected</Badge>
                  <p className="text-xs text-gray-500">Since {new Date(connection.connectedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Events Received</p>
                  <p className="text-3xl font-bold">{connection.eventsReceived.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">this month</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Metrics Collected</p>
                  <p className="text-3xl font-bold">{connection.metricsReceived.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">data points</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Last Sync</p>
                  <p className="text-2xl font-bold">{new Date(connection.lastSync).toLocaleTimeString()}</p>
                  <p className="text-xs text-gray-500">today</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboards Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">Dashboards</h2>
                <p className="text-sm text-muted-foreground">{dashboards.length} synced dashboards</p>
              </div>
              <Button onClick={handleSyncDashboards} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Sync Dashboards
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboards.map(dashboard => (
                <Card key={dashboard.id} className="hover:shadow-md transition">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold">{dashboard.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{dashboard.url}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                        <div>
                          <p className="text-muted-foreground">Widgets</p>
                          <p className="font-semibold">{dashboard.widgets}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Refresh</p>
                          <p className="font-semibold text-xs">{dashboard.refreshInterval}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Modified</p>
                          <p className="font-semibold text-xs">{new Date(dashboard.lastModified).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => window.open(dashboard.url, '_blank')} className="w-full">
                        View Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Monitors Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">Monitors & Alerts</h2>
                <p className="text-sm text-muted-foreground">{monitors.length} active monitors</p>
              </div>
              <Button onClick={handleGetAlerts} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh Alerts
              </Button>
            </div>

            <div className="space-y-3">
              {monitors.map(monitor => (
                <Card key={monitor.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{monitor.name}</h3>
                          <Badge className={alertStatuses[monitor.status]}>
                            {monitor.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mb-2">{monitor.query}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm pt-2 border-t">
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="text-xs font-semibold">{monitor.type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Threshold</p>
                            <p className="font-semibold">{monitor.threshold}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Evaluation</p>
                            <p className="text-xs font-semibold">{monitor.evaluationWindow}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Data Points</p>
                            <p className="font-semibold">{monitor.dataPoints}</p>
                          </div>
                        </div>

                        {monitor.lastTriggered && (
                          <p className="text-xs text-orange-600 mt-2">
                            Last triggered: {new Date(monitor.lastTriggered).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle>Export Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Export all collected metrics and event data from Datadog for archival or analysis</p>
              <Button onClick={handleExportMetrics} variant="outline" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Export Metrics
              </Button>
            </CardContent>
          </Card>

          {/* Integration Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">API Key Location</p>
                <p className="text-muted-foreground">Find your API key in Datadog Organization Settings → API Keys</p>
              </div>
              <div>
                <p className="font-semibold mb-1">App Key Location</p>
                <p className="text-muted-foreground">Find your App key in Datadog Personal Settings → Application Keys</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Data Retention</p>
                <p className="text-muted-foreground">Metrics and events are automatically synced based on Datadog retention policy</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
