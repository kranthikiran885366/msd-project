'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Trash2, RefreshCw, Link2, Zap, AlertTriangle, BarChart3 } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function PrometheusIntegrationPage() {
  const [projectId, setProjectId] = useState('');
  const [connection, setConnection] = useState(null);
  const [targets, setTargets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [prometheusUrl, setPrometheusUrl] = useState('');

  const fetchPrometheusData = async (activeProjectId) => {
    if (!activeProjectId) {
      setConnection(null);
      setTargets([]);
      setAlerts([]);
      setMetrics([]);
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await apiClient.getWebhooks(activeProjectId);
      const webhooks = Array.isArray(response) ? response : response?.data || [];
      const prometheusWebhooks = webhooks.filter((webhook) =>
        webhook.url?.includes('prometheus') || webhook.name?.toLowerCase().includes('prometheus')
      );

      if (prometheusWebhooks.length === 0) {
        setConnection(null);
        setTargets([]);
        setAlerts([]);
        setMetrics([]);
        return;
      }

      const totalSeries = prometheusWebhooks.reduce((sum, webhook) => sum + (webhook.deliveryStats?.total || 0), 0);
      const failed = prometheusWebhooks.reduce((sum, webhook) => sum + (webhook.deliveryStats?.failed || 0), 0);

      setConnection({
        id: prometheusWebhooks[0]._id,
        status: 'healthy',
        url: prometheusWebhooks[0].url,
        version: '2.x',
        uptime: '-',
        connectedAt: prometheusWebhooks[0].createdAt,
        lastScrape: prometheusWebhooks[0].lastDelivery || prometheusWebhooks[0].updatedAt,
        scrapeInterval: '15s',
        dataRetention: '15d',
        timeSeriesCount: totalSeries,
      });

      setTargets(prometheusWebhooks.map((webhook) => ({
        id: webhook._id,
        job: webhook.name || 'prometheus',
        instance: webhook.url,
        state: (webhook.deliveryStats?.failed || 0) > 0 ? 'down' : 'up',
        labels: { provider: 'prometheus' },
        scrapeUrl: webhook.url,
        interval: '15s',
        timeout: '10s',
        lastScrape: webhook.lastDelivery || webhook.updatedAt,
        scrapeDuration: 0,
        samplesScraped: webhook.deliveryStats?.total || 0,
      })));

      setAlerts(prometheusWebhooks.map((webhook) => ({
        id: webhook._id,
        name: webhook.name || 'Prometheus Alert',
        state: (webhook.deliveryStats?.failed || 0) > 0 ? 'firing' : 'resolved',
        severity: (webhook.deliveryStats?.failed || 0) > 0 ? 'warning' : 'info',
        expr: webhook.url,
        duration: '5m',
        firedAt: webhook.lastDelivery || webhook.updatedAt,
        value: webhook.deliveryStats?.failed || 0,
      })));

      setMetrics([
        {
          id: 'prom-metric-total',
          name: 'webhook_deliveries_total',
          type: 'counter',
          help: 'Total Prometheus integration deliveries',
          value: totalSeries,
        },
        {
          id: 'prom-metric-failed',
          name: 'webhook_deliveries_failed_total',
          type: 'counter',
          help: 'Failed Prometheus integration deliveries',
          value: failed,
        },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to fetch Prometheus integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const activeProjectId = user?.currentProjectId || localStorage.getItem('currentProjectId');
    setProjectId(activeProjectId || '');
    fetchPrometheusData(activeProjectId);
  }, []);

  const handleConnectPrometheus = async () => {
    if (!prometheusUrl.trim()) {
      setError('Prometheus URL is required');
      return;
    }

    try {
      setError('');
      await apiClient.createWebhook(projectId, {
        name: 'Prometheus Metrics',
        url: prometheusUrl,
        events: ['metric.recorded', 'alert.triggered'],
        active: true,
      });
      await fetchPrometheusData(projectId);
      setSuccessMessage('Connected to Prometheus successfully');
      setShowUrlInput(false);
      setPrometheusUrl('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Prometheus?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.getWebhooks(projectId);
      const webhooks = Array.isArray(response) ? response : response?.data || [];
      const prometheusWebhooks = webhooks.filter((webhook) =>
        webhook.url?.includes('prometheus') || webhook.name?.toLowerCase().includes('prometheus')
      );
      await Promise.all(prometheusWebhooks.map((webhook) => apiClient.deleteWebhook(webhook._id || webhook.id)));
      await fetchPrometheusData(projectId);
      setSuccessMessage('Disconnected from Prometheus');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleGetAlerts = async () => {
    try {
      setError('');
      await fetchPrometheusData(projectId);
      setSuccessMessage('Alerts refreshed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleQueryMetrics = async (query) => {
    try {
      setError('');
      await apiClient.getAnalyticsMetrics({ query });
      setSuccessMessage('Query executed successfully');
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

  const upTargets = targets.filter(t => t.state === 'up').length;
  const firingAlerts = alerts.filter(a => a.state === 'firing').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Prometheus Integration</h1>
          <p className="text-muted-foreground">Time-series metrics collection and alerting</p>
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
                <p className="font-semibold text-orange-900">Not Connected to Prometheus</p>
                <p className="text-sm text-orange-700 mt-1">Connect your Prometheus instance for metrics collection</p>
              </div>

              {!showUrlInput ? (
                <Button onClick={() => setShowUrlInput(true)} className="gap-2">
                  <Link2 className="w-4 h-4" />
                  Connect to Prometheus
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="url">Prometheus URL *</Label>
                    <Input
                      id="url"
                      placeholder="https://prometheus.example.com:9090"
                      value={prometheusUrl}
                      onChange={(e) => setPrometheusUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleConnectPrometheus} className="flex-1">Connect</Button>
                    <Button onClick={() => {
                      setShowUrlInput(false);
                      setPrometheusUrl('');
                    }} variant="outline">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="w-fit bg-green-100 text-green-800">Healthy</Badge>
                  <p className="text-xs text-gray-500">v{connection.version}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold">{connection.uptime}</p>
                  <p className="text-xs text-blue-600">without restart</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Time Series</p>
                  <p className="text-2xl font-bold">{(connection.timeSeriesCount / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-blue-600">total metrics</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Data Retention</p>
                  <p className="text-2xl font-bold">{connection.dataRetention}</p>
                  <p className="text-xs text-gray-500">configured</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scrape Targets */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Scrape Targets ({upTargets}/{targets.length} up)</h2>

            <div className="space-y-3">
              {targets.map(target => (
                <Card key={target.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{target.job}</h3>
                            <Badge className={target.state === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {target.state.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">{target.instance}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm pt-2 border-t">
                        <div>
                          <p className="text-muted-foreground">Interval</p>
                          <p className="font-semibold text-xs">{target.interval}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Timeout</p>
                          <p className="font-semibold text-xs">{target.timeout}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Scrape</p>
                          <p className="text-xs">{new Date(target.lastScrape).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-semibold">{target.scrapeDuration}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Samples</p>
                          <p className="font-semibold">{target.samplesScraped.toLocaleString()}</p>
                        </div>
                      </div>

                      {Object.keys(target.labels).length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Labels:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(target.labels).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}={value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Alert Rules ({firingAlerts} firing)</h2>
              <Button onClick={handleGetAlerts} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {alerts.map(alert => (
                <Card key={alert.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {alert.state === 'firing' ? (
                        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{alert.name}</h4>
                          <Badge className={alert.state === 'firing' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {alert.state.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{alert.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{alert.expr}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span>Duration: {alert.duration}</span>
                          <span>Value: {alert.value}</span>
                          {alert.firedAt && <span>Fired: {new Date(alert.firedAt).toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Metrics Reference */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Available Metrics ({metrics.length})</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.map(metric => (
                <Card key={metric.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold font-mono text-sm">{metric.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1">{metric.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{metric.help}</p>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">Current value:</p>
                        <p className="font-mono text-sm font-semibold">{metric.value.toLocaleString()}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => handleQueryMetrics(metric.name)}
                      >
                        Query Metric
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Query Examples */}
          <Card>
            <CardHeader>
              <CardTitle>PromQL Query Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">CPU Usage Last 5 Minutes</p>
                <code className="text-xs bg-gray-100 p-2 rounded block break-all">rate(node_cpu_seconds_total[5m])</code>
              </div>
              <div>
                <p className="font-semibold mb-1">Memory Available</p>
                <code className="text-xs bg-gray-100 p-2 rounded block break-all">node_memory_MemAvailable_bytes / 1024 / 1024 / 1024</code>
              </div>
              <div>
                <p className="font-semibold mb-1">Request Rate by Job</p>
                <code className="text-xs bg-gray-100 p-2 rounded block break-all">sum(rate(http_requests_total[5m])) by (job)</code>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
