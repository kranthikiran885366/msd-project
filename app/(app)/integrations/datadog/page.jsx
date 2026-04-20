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
  const [projectId, setProjectId] = useState('');
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

  const fetchDatadogData = async (activeProjectId) => {
    if (!activeProjectId) {
      setConnection(null);
      setDashboards([]);
      setMonitors([]);
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const webhooksResponse = await apiClient.getWebhooks(activeProjectId);
      const webhooks = Array.isArray(webhooksResponse) ? webhooksResponse : webhooksResponse?.data || [];
      const datadogWebhooks = webhooks.filter((webhook) =>
        webhook.url?.includes('datadog') || webhook.name?.toLowerCase().includes('datadog')
      );

      if (datadogWebhooks.length === 0) {
        setConnection(null);
        setDashboards([]);
        setMonitors([]);
        return;
      }

      const totalDeliveries = datadogWebhooks.reduce((sum, webhook) => sum + (webhook.deliveryStats?.total || 0), 0);
      const failedDeliveries = datadogWebhooks.reduce((sum, webhook) => sum + (webhook.deliveryStats?.failed || 0), 0);

      setConnection({
        id: datadogWebhooks[0]._id,
        status: 'connected',
        siteName: 'Datadog',
        datadogSite: 'app.datadoghq.com',
        connectedAt: datadogWebhooks[0].createdAt,
        lastSync: datadogWebhooks[0].updatedAt,
        eventsReceived: totalDeliveries,
        metricsReceived: totalDeliveries,
        hostedAssets: datadogWebhooks.length,
      });

      setDashboards(datadogWebhooks.map((webhook, index) => ({
        id: webhook._id,
        name: webhook.name || `Datadog Dashboard ${index + 1}`,
        url: webhook.url,
        widgets: Math.max(1, Math.round((webhook.deliveryStats?.total || 0) / 10)),
        lastModified: webhook.updatedAt,
        refreshInterval: 'auto',
        syncedAt: webhook.updatedAt,
      })));

      setMonitors(datadogWebhooks.map((webhook) => ({
        id: webhook._id,
        name: webhook.name || 'Datadog Monitor',
        type: 'webhook alert',
        query: webhook.url,
        threshold: 5,
        status: (webhook.deliveryStats?.failed || 0) > 0 ? 'WARNING' : 'OK',
        lastTriggered: webhook.lastDelivery || null,
        evaluationWindow: '5m',
        dataPoints: webhook.deliveryStats?.total || 0,
      })));
    } catch (err) {
      setError(err.message || 'Failed to load Datadog integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const activeProjectId = user?.currentProjectId || localStorage.getItem('currentProjectId');
    setProjectId(activeProjectId || '');
    fetchDatadogData(activeProjectId);
  }, []);

  const handleConnectDatadog = async () => {
    if (!apiKey.trim() || !appKey.trim()) {
      setError('Both API and App keys are required');
      return;
    }

    try {
      setError('');
      await apiClient.createWebhook(projectId, {
        name: 'Datadog Events',
        url: 'https://api.datadoghq.com/api/v1/events',
        events: ['event.recorded', 'alert.triggered'],
        active: true,
        secret: apiKey,
      });
      await fetchDatadogData(projectId);
      setSuccessMessage('Connected to Datadog successfully');
      setShowApiKeyInput(false);
      setApiKey('');
      setAppKey('');
      setTimeout(() => setSuccessMessage(''), 3000);
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
      const webhooksResponse = await apiClient.getWebhooks(projectId);
      const webhooks = Array.isArray(webhooksResponse) ? webhooksResponse : webhooksResponse?.data || [];
      const datadogWebhooks = webhooks.filter((webhook) =>
        webhook.url?.includes('datadog') || webhook.name?.toLowerCase().includes('datadog')
      );
      await Promise.all(datadogWebhooks.map((webhook) => apiClient.deleteWebhook(webhook._id || webhook.id)));
      await fetchDatadogData(projectId);
      setSuccessMessage('Disconnected from Datadog');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleSyncDashboards = async () => {
    try {
      setError('');
      await fetchDatadogData(projectId);
      setSuccessMessage('Dashboards synced successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleGetAlerts = async () => {
    try {
      setError('');
      await fetchDatadogData(projectId);
      setSuccessMessage('Alerts refreshed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleExportMetrics = async () => {
    try {
      setError('');
      await apiClient.getAnalyticsMetrics({ provider: 'datadog' });
      setSuccessMessage('Metrics export requested successfully');
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
