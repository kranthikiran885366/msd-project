'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Trash2, RefreshCw, Copy, Eye, EyeOff, Play, Settings } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function WebhookEndpointsPage() {
  const [projectId, setProjectId] = useState('');
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    eventTypes: [],
    secret: '',
    active: true,
    headers: [{ key: 'X-Custom-Header', value: 'value' }]
  });

  const eventTypeOptions = [
    'deployment.created',
    'deployment.started',
    'deployment.completed',
    'deployment.failed',
    'alert.triggered',
    'alert.resolved',
    'alert.acknowledged',
    'scaling.initiated',
    'scaling.completed',
    'scaling.failed',
    'backup.started',
    'backup.completed',
    'backup.failed',
    'backup.verified',
    'metric.recorded',
    'event.recorded',
    'trace.recorded'
  ];

  const normalizeWebhook = (webhook) => ({
    ...webhook,
    id: webhook._id || webhook.id,
    name: webhook.name || `Webhook ${String(webhook._id || webhook.id).slice(-6)}`,
    description: webhook.description || '',
    eventTypes: webhook.events || webhook.eventTypes || [],
    totalDeliveries: webhook.deliveryStats?.total || 0,
    successfulDeliveries: webhook.deliveryStats?.success || 0,
    failedDeliveries: webhook.deliveryStats?.failed || 0,
    nextRetry: null,
    secret: webhook.secret || ''
  });

  const fetchEndpoints = async (activeProjectId) => {
    if (!activeProjectId) {
      setEndpoints([]);
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await apiClient.getWebhooks(activeProjectId);
      const list = Array.isArray(response) ? response : response?.data || [];
      setEndpoints(list.map(normalizeWebhook));
    } catch (err) {
      setError(err.message || 'Failed to fetch endpoints');
      setEndpoints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const activeProjectId = user?.currentProjectId || localStorage.getItem('currentProjectId');
    setProjectId(activeProjectId || '');
    fetchEndpoints(activeProjectId);
  }, []);

  const handleCreateEndpoint = async () => {
    if (!formData.name.trim() || !formData.url.trim() || formData.eventTypes.length === 0) {
      setError('Name, URL, and at least one event type are required');
      return;
    }

    try {
      setError('');
      await apiClient.createWebhookEndpoint({
        ...formData,
        projectId,
      });
      await fetchEndpoints(projectId);
      setSuccessMessage('Webhook endpoint created successfully');
      setFormData({
        name: '',
        description: '',
        url: '',
        eventTypes: [],
        secret: '',
        active: true,
        headers: [{ key: 'X-Custom-Header', value: 'value' }]
      });
      setShowForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteEndpoint = async (endpointId) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) {
      return;
    }

    try {
      setError('');
      await apiClient.deleteWebhookEndpoint(endpointId);
      await fetchEndpoints(projectId);
      setSuccessMessage('Endpoint deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleTestEndpoint = async (endpointId) => {
    try {
      setError('');
      await apiClient.testWebhookEndpoint(endpointId);
      setSuccessMessage('Test payload sent successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleGetLogs = async (endpointId) => {
    try {
      setError('');
      const deliveries = await apiClient.getWebhookEndpointLogs(endpointId, { limit: 1 });
      const lastDelivery = Array.isArray(deliveries) ? deliveries[0] : deliveries?.deliveries?.[0];
      setSuccessMessage(lastDelivery ? `Last delivery status: ${lastDelivery.status}` : 'No deliveries yet');
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

  const activeEndpoints = endpoints.filter(e => e.active).length;
  const totalDeliveries = endpoints.reduce((sum, e) => sum + e.totalDeliveries, 0);
  const avgSuccessRate = totalDeliveries > 0
    ? ((endpoints.reduce((sum, e) => sum + e.successfulDeliveries, 0) / totalDeliveries) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Webhook Endpoints</h1>
          <p className="text-muted-foreground">Manage webhook URLs and event subscriptions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Endpoint
        </Button>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Endpoints</p>
              <p className="text-3xl font-bold">{endpoints.length}</p>
              <p className="text-xs text-green-600">{activeEndpoints} active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
              <p className="text-3xl font-bold">{totalDeliveries.toLocaleString()}</p>
              <p className="text-xs text-blue-600">all time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">{avgSuccessRate}%</p>
              <p className="text-xs text-gray-500">average</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Event Types</p>
              <p className="text-3xl font-bold">{eventTypeOptions.length}</p>
              <p className="text-xs text-gray-500">available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Webhook Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Endpoint Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Deployment Notifications"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="desc">Description</Label>
                <Input
                  id="desc"
                  placeholder="What this endpoint does"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="url">Webhook URL *</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/webhook"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span>Active</span>
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event Types * (select at least one)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {eventTypeOptions.map(eventType => (
                  <label key={eventType} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.eventTypes.includes(eventType)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, eventTypes: [...formData.eventTypes, eventType]});
                        } else {
                          setFormData({...formData, eventTypes: formData.eventTypes.filter(t => t !== eventType)});
                        }
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">{eventType}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateEndpoint} className="flex-1">Create Endpoint</Button>
              <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoints List */}
      <div className="space-y-4">
        {endpoints.map(endpoint => (
          <Card key={endpoint.id} className="hover:shadow-md transition">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{endpoint.name}</h3>
                      <Badge className={endpoint.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {endpoint.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {endpoint.description && (
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    )}
                  </div>
                </div>

                {/* Webhook URL and Secret */}
                <div className="pt-3 border-t space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Webhook URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-100 p-2 rounded truncate">{endpoint.url}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(endpoint.url)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Secret</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-100 p-2 rounded truncate font-mono">
                        {showSecrets[endpoint.id] ? endpoint.secret : '●'.repeat(24)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowSecrets({...showSecrets, [endpoint.id]: !showSecrets[endpoint.id]})}
                      >
                        {showSecrets[endpoint.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(endpoint.secret)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Event Subscriptions */}
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Subscribed Events ({endpoint.eventTypes.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {endpoint.eventTypes.map(eventType => (
                      <Badge key={eventType} variant="secondary" className="text-xs">
                        {eventType}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Delivery Statistics */}
                <div className="grid grid-cols-4 gap-3 pt-3 border-t text-sm">
                  <div>
                    <p className="text-muted-foreground">Deliveries</p>
                    <p className="font-semibold">{endpoint.totalDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Successful</p>
                    <p className="font-semibold text-green-600">{endpoint.successfulDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failed</p>
                    <p className={`font-semibold ${endpoint.failedDeliveries > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {endpoint.failedDeliveries}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Delivery</p>
                    <p className="text-xs">{endpoint.lastDelivery ? new Date(endpoint.lastDelivery).toLocaleTimeString() : 'Never'}</p>
                  </div>
                </div>

                {endpoint.nextRetry && (
                  <div className="pt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    Next retry: {new Date(endpoint.nextRetry).toLocaleString()}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleTestEndpoint(endpoint.id)}
                  >
                    <Play className="w-4 h-4" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleGetLogs(endpoint.id)}
                  >
                    View Logs
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1 ml-auto"
                    onClick={() => handleDeleteEndpoint(endpoint.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Webhook Security */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">Request Verification</p>
            <p className="text-muted-foreground">All webhook requests include an HMAC-SHA256 signature in the X-Webhook-Signature header. Verify the signature using your endpoint secret.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Payload Format</p>
            <code className="text-xs bg-gray-100 p-2 rounded block font-mono">
              {'{'}
              <br />
              &nbsp;&nbsp;"id": "evt_123...",
              <br />
              &nbsp;&nbsp;"timestamp": "2024-12-20T16:00:00Z",
              <br />
              &nbsp;&nbsp;"type": "deployment.completed",
              <br />
              &nbsp;&nbsp;"data": {'{'}...{'}'}{'}'}
              <br />
              {'}'}
            </code>
          </div>
          <div>
            <p className="font-semibold mb-1">Retry Policy</p>
            <p className="text-muted-foreground">Failed deliveries are retried with exponential backoff: 5s, 30s, 2m, 5m, 30m up to 24 hours.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
