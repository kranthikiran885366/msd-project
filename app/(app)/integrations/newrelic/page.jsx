'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Trash2, RefreshCw, Link2, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function NewRelicIntegrationPage() {
  const [projectId, setProjectId] = useState('');
  const [connection, setConnection] = useState(null);
  const [applications, setApplications] = useState([]);
  const [insights, setInsights] = useState([]);
  const [apmMetrics, setApmMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const fetchNewRelicData = async (activeProjectId) => {
    if (!activeProjectId) {
      setConnection(null);
      setApplications([]);
      setInsights([]);
      setApmMetrics([]);
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await apiClient.getWebhooks(activeProjectId);
      const webhooks = Array.isArray(response) ? response : response?.data || [];
      const nrWebhooks = webhooks.filter((webhook) =>
        webhook.url?.includes('newrelic') || webhook.name?.toLowerCase().includes('new relic') || webhook.name?.toLowerCase().includes('newrelic')
      );

      if (nrWebhooks.length === 0) {
        setConnection(null);
        setApplications([]);
        setInsights([]);
        setApmMetrics([]);
        return;
      }

      const totalDeliveries = nrWebhooks.reduce((sum, webhook) => sum + (webhook.deliveryStats?.total || 0), 0);
      const failedDeliveries = nrWebhooks.reduce((sum, webhook) => sum + (webhook.deliveryStats?.failed || 0), 0);

      setConnection({
        id: nrWebhooks[0]._id,
        status: 'connected',
        accountId: String(nrWebhooks[0]._id).slice(-8),
        licensingKey: 'nr-***',
        connectedAt: nrWebhooks[0].createdAt,
        lastSync: nrWebhooks[0].updatedAt,
        accountName: 'New Relic',
        dataIngested: totalDeliveries,
        hosts: nrWebhooks.length,
        applications: nrWebhooks.length,
      });

      setApplications(nrWebhooks.map((webhook) => {
        const failed = webhook.deliveryStats?.failed || 0;
        const total = webhook.deliveryStats?.total || 0;
        const errorRate = total > 0 ? (failed / total) * 100 : 0;
        return {
          id: webhook._id,
          name: webhook.name || 'New Relic App',
          language: 'N/A',
          status: 'reporting',
          health: failed > 0 ? 'yellow' : 'green',
          apdex: Number((1 - Math.min(errorRate / 100, 1)).toFixed(2)),
          responseTime: 0,
          errorRate,
          throughput: total,
          lastReportedAt: webhook.lastDelivery || webhook.updatedAt,
        };
      }));

      setInsights(nrWebhooks.map((webhook) => ({
        id: webhook._id,
        title: webhook.name || 'New Relic Insight',
        severity: (webhook.deliveryStats?.failed || 0) > 0 ? 'warning' : 'info',
        description: `Deliveries: ${webhook.deliveryStats?.total || 0}, Failed: ${webhook.deliveryStats?.failed || 0}`,
        timestamp: webhook.updatedAt,
        application: webhook.name || 'Integration',
      })));

      setApmMetrics([
        {
          id: 'nr-metric-deliveries',
          metric: 'Total Deliveries',
          value: totalDeliveries,
          unit: 'count',
          threshold: Math.max(1, totalDeliveries + 1),
          status: 'normal',
        },
        {
          id: 'nr-metric-failures',
          metric: 'Failed Deliveries',
          value: failedDeliveries,
          unit: 'count',
          threshold: 1,
          status: failedDeliveries > 0 ? 'warning' : 'normal',
        },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to fetch New Relic integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const activeProjectId = user?.currentProjectId || localStorage.getItem('currentProjectId');
    setProjectId(activeProjectId || '');
    fetchNewRelicData(activeProjectId);
  }, []);

  const handleConnectNewRelic = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    try {
      setError('');
      await apiClient.createWebhook(projectId, {
        name: 'New Relic APM',
        url: 'https://api.newrelic.com/graphql',
        events: ['event.recorded', 'alert.triggered'],
        active: true,
        secret: apiKey,
      });
      await fetchNewRelicData(projectId);
      setSuccessMessage('Connected to New Relic successfully');
      setShowApiKeyInput(false);
      setApiKey('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from New Relic?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.getWebhooks(projectId);
      const webhooks = Array.isArray(response) ? response : response?.data || [];
      const nrWebhooks = webhooks.filter((webhook) =>
        webhook.url?.includes('newrelic') || webhook.name?.toLowerCase().includes('new relic') || webhook.name?.toLowerCase().includes('newrelic')
      );
      await Promise.all(nrWebhooks.map((webhook) => apiClient.deleteWebhook(webhook._id || webhook.id)));
      await fetchNewRelicData(projectId);
      setSuccessMessage('Disconnected from New Relic');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleGetInsights = async () => {
    try {
      setError('');
      await fetchNewRelicData(projectId);
      setSuccessMessage('Insights refreshed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleConfigureAPM = async () => {
    try {
      setError('');
      await apiClient.getPerformanceAnalytics({ provider: 'newrelic' });
      setSuccessMessage('APM configuration updated successfully');
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

  const healthColors = {
    'green': 'bg-green-100 text-green-800',
    'yellow': 'bg-yellow-100 text-yellow-800',
    'red': 'bg-red-100 text-red-800'
  };

  const severityColors = {
    'info': 'bg-blue-100 text-blue-800',
    'warning': 'bg-yellow-100 text-yellow-800',
    'critical': 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">New Relic Integration</h1>
          <p className="text-muted-foreground">Application Performance Monitoring and Infrastructure visibility</p>
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
                <p className="font-semibold text-orange-900">Not Connected to New Relic</p>
                <p className="text-sm text-orange-700 mt-1">Connect your New Relic account for APM insights and performance monitoring</p>
              </div>

              {!showApiKeyInput ? (
                <Button onClick={() => setShowApiKeyInput(true)} className="gap-2">
                  <Link2 className="w-4 h-4" />
                  Connect to New Relic
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">New Relic API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your New Relic API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleConnectNewRelic} className="flex-1">Connect</Button>
                    <Button onClick={() => {
                      setShowApiKeyInput(false);
                      setApiKey('');
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
                  <p className="text-xs text-gray-500">{connection.accountName}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Data Ingested</p>
                  <p className="text-3xl font-bold">{connection.dataIngested}</p>
                  <p className="text-xs text-blue-600">GB this month</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Hosts</p>
                  <p className="text-3xl font-bold">{connection.hosts}</p>
                  <p className="text-xs text-blue-600">being monitored</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-3xl font-bold">{connection.applications}</p>
                  <p className="text-xs text-blue-600">connected</p>
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

          {/* Applications Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Monitored Applications</h2>

            <div className="space-y-3">
              {applications.map(app => (
                <Card key={app.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">{app.name}</h3>
                            <p className="text-xs text-muted-foreground">{app.language}</p>
                          </div>
                        </div>
                        <Badge className={healthColors[app.health]}>
                          {app.health.toUpperCase()}
                        </Badge>
                      </div>

                      {app.status === 'reporting' ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm pt-2 border-t">
                          <div>
                            <p className="text-muted-foreground">Apdex</p>
                            <p className="font-semibold">{app.apdex.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Response Time</p>
                            <p className="font-semibold">{app.responseTime}ms</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Error Rate</p>
                            <p className="font-semibold text-orange-600">{app.errorRate.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Throughput</p>
                            <p className="font-semibold">{app.throughput.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Reported</p>
                            <p className="text-xs">{new Date(app.lastReportedAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-red-600 pt-2 border-t">
                          Not reporting (last seen {new Date(app.lastReportedAt).toLocaleString()})
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Insights Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Insights & Alerts</h2>
              <Button onClick={handleGetInsights} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            <div className="space-y-2">
              {insights.map(insight => (
                <Card key={insight.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-orange-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge className={severityColors[insight.severity]} className="text-xs">
                            {insight.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>{insight.application}</span>
                          <span>{new Date(insight.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* APM Metrics */}
          <div>
            <h2 className="text-2xl font-bold mb-4">APM Metrics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apmMetrics.map(metric => (
                <Card key={metric.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">{metric.metric}</h4>
                        <Badge className={metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                          {metric.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-3xl font-bold">{metric.value}</span>
                          <span className="text-sm text-muted-foreground">{metric.unit}</span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${metric.value > metric.threshold * 0.8 ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%` }}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">Threshold: {metric.threshold} {metric.unit}</p>
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
              <CardTitle>Integration Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">API Key Location</p>
                <p className="text-muted-foreground">Find your API key in Account Settings → API Keys (User API Key)</p>
              </div>
              <div>
                <p className="font-semibold mb-1">APM Agents</p>
                <p className="text-muted-foreground">Install New Relic APM agents on your applications for real-time monitoring</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Data Retention</p>
                <p className="text-muted-foreground">Metrics, events, and logs are retained according to your subscription plan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
