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
  const [projectId, setProjectId] = useState('');
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

  const fetchGrafanaData = async (activeProjectId) => {
    if (!activeProjectId) {
      setConnection(null);
      setDashboards([]);
      setAlerts([]);
      setDatasources([]);
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await apiClient.getWebhooks(activeProjectId);
      const webhooks = Array.isArray(response) ? response : response?.data || [];
      const grafanaWebhooks = webhooks.filter((webhook) =>
        webhook.url?.includes('grafana') || webhook.name?.toLowerCase().includes('grafana')
      );

      if (grafanaWebhooks.length === 0) {
        setConnection(null);
        setDashboards([]);
        setAlerts([]);
        setDatasources([]);
        return;
      }

      setConnection({
        id: grafanaWebhooks[0]._id,
        status: 'connected',
        url: grafanaWebhooks[0].url,
        version: '10.x',
        organization: 'Grafana',
        connectedAt: grafanaWebhooks[0].createdAt,
        lastSync: grafanaWebhooks[0].updatedAt,
        dashboardCount: grafanaWebhooks.length,
        userCount: 1,
        alertCount: grafanaWebhooks.filter((w) => (w.deliveryStats?.failed || 0) > 0).length,
      });

      setDashboards(grafanaWebhooks.map((webhook, index) => ({
        id: webhook._id,
        title: webhook.name || `Grafana Dashboard ${index + 1}`,
        uid: String(webhook._id).slice(-8),
        tags: ['grafana', 'integration'],
        panels: Math.max(1, Math.round((webhook.deliveryStats?.total || 0) / 5)),
        starred: (webhook.deliveryStats?.failed || 0) === 0,
        url: webhook.url,
        folderId: 1,
        folderTitle: 'Integrations',
        createdBy: 'system',
        updatedAt: webhook.updatedAt,
      })));

      setAlerts(grafanaWebhooks.map((webhook) => ({
        id: webhook._id,
        title: webhook.name || 'Grafana Alert',
        condition: webhook.url,
        state: (webhook.deliveryStats?.failed || 0) > 0 ? 'alerting' : 'normal',
        frequency: '5m',
        lastStateChange: webhook.lastDelivery || webhook.updatedAt,
        noDataState: 'no_data',
      })));

      setDatasources([
        {
          id: 'ds-grafana',
          name: 'Webhook Delivery Metrics',
          type: 'http',
          url: grafanaWebhooks[0].url,
          database: '',
          access: 'proxy',
          isDefault: true,
          jsonData: {},
        }
      ]);
    } catch (err) {
      setError(err.message || 'Failed to fetch Grafana integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const activeProjectId = user?.currentProjectId || localStorage.getItem('currentProjectId');
    setProjectId(activeProjectId || '');
    fetchGrafanaData(activeProjectId);
  }, []);

  const handleConnectGrafana = async () => {
    if (!grafanaUrl.trim() || !apiToken.trim()) {
      setError('Both Grafana URL and API token are required');
      return;
    }

    try {
      setError('');
      await apiClient.createWebhook(projectId, {
        name: 'Grafana Dashboard Sync',
        url: grafanaUrl,
        events: ['event.recorded', 'alert.triggered'],
        active: true,
        secret: apiToken,
      });
      await fetchGrafanaData(projectId);
      setSuccessMessage('Connected to Grafana successfully');
      setShowUrlInput(false);
      setGrafanaUrl('');
      setApiToken('');
      setTimeout(() => setSuccessMessage(''), 3000);
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
      const response = await apiClient.getWebhooks(projectId);
      const webhooks = Array.isArray(response) ? response : response?.data || [];
      const grafanaWebhooks = webhooks.filter((webhook) =>
        webhook.url?.includes('grafana') || webhook.name?.toLowerCase().includes('grafana')
      );
      await Promise.all(grafanaWebhooks.map((webhook) => apiClient.deleteWebhook(webhook._id || webhook.id)));
      await fetchGrafanaData(projectId);
      setSuccessMessage('Disconnected from Grafana');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleSyncDashboards = async () => {
    try {
      setError('');
      await fetchGrafanaData(projectId);
      setSuccessMessage('Dashboards synced successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleGetAlerts = async () => {
    try {
      setError('');
      await fetchGrafanaData(projectId);
      setSuccessMessage('Alerts refreshed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
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
      await apiClient.deleteWebhook(dashboardId);
      await fetchGrafanaData(projectId);
      setSuccessMessage('Dashboard deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
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
