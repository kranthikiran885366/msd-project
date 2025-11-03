'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Trash2, RefreshCw, Link2, Folder, Eye, Settings, BarChart3 } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function GrafanaIntegrationPage() {
  const [connection, setConnection] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [datasources, setDatasources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [grafanaUrl, setGrafanaUrl] = useState('');
  const [apiToken, setApiToken] = useState('');

  // Mock connection
  const mockConnection = {
    id: 'grafana-conn-1',
    status: 'connected',
    url: 'https://grafana.monitoring.svc.cluster.local:3000',
    version: '10.2.1',
    organization: 'Acme Corp',
    connectedAt: '2024-08-15T10:00:00Z',
    lastSync: '2024-12-20T16:05:00Z',
    dashboardCount: 18,
    userCount: 34,
    alertCount: 12
  };

  // Mock dashboards
  const mockDashboards = [
    {
      id: 'grafana-dash-1',
      title: 'Infrastructure Overview',
      uid: 'infra-overview-1',
      tags: ['infrastructure', 'production'],
      panels: 16,
      starred: true,
      url: '/d/infra-overview-1/infrastructure-overview',
      folderId: 1,
      folderTitle: 'Production',
      createdBy: 'admin',
      updatedAt: '2024-12-18T14:30:00Z'
    },
    {
      id: 'grafana-dash-2',
      title: 'Application Performance',
      uid: 'app-perf-1',
      tags: ['application', 'monitoring'],
      panels: 12,
      starred: true,
      url: '/d/app-perf-1/application-performance',
      folderId: 1,
      folderTitle: 'Production',
      createdBy: 'devops',
      updatedAt: '2024-12-20T10:15:00Z'
    },
    {
      id: 'grafana-dash-3',
      title: 'Database Health',
      uid: 'db-health-1',
      tags: ['database', 'postgres'],
      panels: 10,
      starred: false,
      url: '/d/db-health-1/database-health',
      folderId: 2,
      folderTitle: 'Databases',
      createdBy: 'dba',
      updatedAt: '2024-12-17T09:00:00Z'
    },
    {
      id: 'grafana-dash-4',
      title: 'Kubernetes Cluster',
      uid: 'k8s-cluster-1',
      tags: ['kubernetes', 'infrastructure'],
      panels: 20,
      starred: true,
      url: '/d/k8s-cluster-1/kubernetes-cluster',
      folderId: 1,
      folderTitle: 'Production',
      createdBy: 'platform',
      updatedAt: '2024-12-19T16:45:00Z'
    }
  ];

  // Mock alerts
  const mockAlerts = [
    {
      id: 'grafana-alert-1',
      title: 'High CPU Usage',
      condition: 'cpu > 80%',
      state: 'alerting',
      frequency: '5m',
      lastStateChange: '2024-12-20T15:30:00Z',
      noDataState: 'no_data'
    },
    {
      id: 'grafana-alert-2',
      title: 'High Memory Usage',
      condition: 'memory > 85%',
      state: 'alerting',
      frequency: '5m',
      lastStateChange: '2024-12-20T14:45:00Z',
      noDataState: 'no_data'
    },
    {
      id: 'grafana-alert-3',
      title: 'Pod Restart',
      condition: 'restart_count > 3',
      state: 'normal',
      frequency: '10m',
      lastStateChange: '2024-12-20T12:00:00Z',
      noDataState: 'no_data'
    },
    {
      id: 'grafana-alert-4',
      title: 'Service Unavailable',
      condition: 'http_status_5xx > 10',
      state: 'normal',
      frequency: '1m',
      lastStateChange: '2024-12-19T08:15:00Z',
      noDataState: 'no_data'
    }
  ];

  // Mock datasources
  const mockDatasources = [
    {
      id: 'ds-1',
      name: 'Prometheus',
      type: 'prometheus',
      url: 'http://prometheus:9090',
      database: '',
      access: 'proxy',
      isDefault: true,
      jsonData: { timeInterval: '15s' }
    },
    {
      id: 'ds-2',
      name: 'Loki Logs',
      type: 'loki',
      url: 'http://loki:3100',
      database: '',
      access: 'proxy',
      isDefault: false,
      jsonData: {}
    },
    {
      id: 'ds-3',
      name: 'PostgreSQL',
      type: 'postgres',
      url: 'postgresql://postgres:5432/grafana',
      database: 'grafana',
      access: 'proxy',
      isDefault: false,
      jsonData: {}
    },
    {
      id: 'ds-4',
      name: 'Elasticsearch',
      type: 'elasticsearch',
      url: 'http://elasticsearch:9200',
      database: 'grafana-index-*',
      access: 'proxy',
      isDefault: false,
      jsonData: { logMessageField: 'message' }
    }
  ];

  useEffect(() => {
    setConnection(mockConnection);
    setDashboards(mockDashboards);
    setAlerts(mockAlerts);
    setDatasources(mockDatasources);
    setLoading(false);
  }, []);

  const handleConnectGrafana = async () => {
    if (!grafanaUrl.trim() || !apiToken.trim()) {
      setError('Both Grafana URL and API token are required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.connectGrafana({ url: grafanaUrl, token: apiToken });

      if (response.success) {
        setConnection(mockConnection);
        setSuccessMessage('Connected to Grafana successfully');
        setShowUrlInput(false);
        setGrafanaUrl('');
        setApiToken('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to connect to Grafana');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Grafana?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.disconnectGrafana();

      if (response.success) {
        setConnection(null);
        setDashboards([]);
        setAlerts([]);
        setDatasources([]);
        setSuccessMessage('Disconnected from Grafana');
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
      const response = await apiClient.getGrafanaDashboards();

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
      const response = await apiClient.getGrafanaAlerts();

      if (response.success) {
        setAlerts(mockAlerts);
        setSuccessMessage('Alerts refreshed successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteDashboard = async (dashboardId) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.deleteGrafanaDashboard(dashboardId);

      if (response.success) {
        setDashboards(dashboards.filter(d => d.id !== dashboardId));
        setSuccessMessage('Dashboard deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete dashboard');
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

  const alertingCount = alerts.filter(a => a.state === 'alerting').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Grafana Integration</h1>
          <p className="text-muted-foreground">Create, manage, and sync Grafana dashboards</p>
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
                <p className="font-semibold text-orange-900">Not Connected to Grafana</p>
                <p className="text-sm text-orange-700 mt-1">Connect your Grafana instance to manage and sync dashboards</p>
              </div>

              {!showUrlInput ? (
                <Button onClick={() => setShowUrlInput(true)} className="gap-2">
                  <Link2 className="w-4 h-4" />
                  Connect to Grafana
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="url">Grafana URL *</Label>
                    <Input
                      id="url"
                      placeholder="https://grafana.example.com"
                      value={grafanaUrl}
                      onChange={(e) => setGrafanaUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token">API Token *</Label>
                    <Input
                      id="token"
                      type="password"
                      placeholder="Enter your Grafana API token"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleConnectGrafana} className="flex-1">Connect</Button>
                    <Button onClick={() => {
                      setShowUrlInput(false);
                      setGrafanaUrl('');
                      setApiToken('');
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="w-fit bg-green-100 text-green-800">Connected</Badge>
                  <p className="text-xs text-gray-500">v{connection.version}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="text-2xl font-bold">{connection.organization}</p>
                  <p className="text-xs text-gray-500">active org</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Dashboards</p>
                  <p className="text-3xl font-bold">{connection.dashboardCount}</p>
                  <p className="text-xs text-blue-600">total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Users</p>
                  <p className="text-3xl font-bold">{connection.userCount}</p>
                  <p className="text-xs text-blue-600">active users</p>
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
              <h2 className="text-2xl font-bold">Dashboards ({dashboards.length})</h2>
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold break-words">{dashboard.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{dashboard.folderTitle}</p>
                        </div>
                        {dashboard.starred && (
                          <span className="text-lg">⭐</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {dashboard.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                        <div>
                          <p className="text-muted-foreground">Panels</p>
                          <p className="font-semibold">{dashboard.panels}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created By</p>
                          <p className="text-xs font-semibold">{dashboard.createdBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Updated</p>
                          <p className="text-xs">{new Date(dashboard.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => window.open(dashboard.url, '_blank')}>
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteDashboard(dashboard.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Alerts Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Alert Rules ({alertingCount} alerting)</h2>
              <Button onClick={handleGetAlerts} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {alerts.map(alert => (
                <Card key={alert.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge className={alert.state === 'alerting' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {alert.state.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{alert.condition}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span>Frequency: {alert.frequency}</span>
                          <span>Changed: {new Date(alert.lastStateChange).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Datasources Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Data Sources ({datasources.length})</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datasources.map(ds => (
                <Card key={ds.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{ds.name}</h3>
                        {ds.isDefault && (
                          <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm pt-2 border-t">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-semibold text-xs">{ds.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">URL</p>
                          <p className="text-xs font-mono break-all">{ds.url}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Access</p>
                          <p className="text-xs font-semibold">{ds.access}</p>
                        </div>
                        {ds.database && (
                          <div>
                            <p className="text-muted-foreground">Database</p>
                            <p className="text-xs">{ds.database}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Integration Guide */}
          <Card>
            <CardHeader>
              <CardTitle>API Token Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">Generate API Token</p>
                <p className="text-muted-foreground">Go to Grafana → Configuration → API Keys → New API Key. Select Admin role for full access.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Token Permissions Required</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>dashboards:read, dashboards:write</li>
                  <li>datasources:read, datasources:write</li>
                  <li>alerts:read, alerts:write</li>
                  <li>org:read</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
