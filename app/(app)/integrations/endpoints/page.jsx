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

  // Mock webhook endpoints
  const mockEndpoints = [
    {
      id: 'webhook-ep-1',
      name: 'Deployment Webhook',
      description: 'Receives deployment events',
      url: 'https://webhook.company.com/deploy',
      secret: 'whsec_test1234567890abcdef',
      active: true,
      eventTypes: ['deployment.created', 'deployment.started', 'deployment.completed', 'deployment.failed'],
      totalDeliveries: 1247,
      successfulDeliveries: 1234,
      failedDeliveries: 13,
      lastDelivery: '2024-12-20T16:02:00Z',
      nextRetry: null,
      createdAt: '2024-09-15T10:00:00Z',
      updatedAt: '2024-12-20T14:30:00Z'
    },
    {
      id: 'webhook-ep-2',
      name: 'Alert Webhook',
      description: 'Alert event notifications',
      url: 'https://webhook.company.com/alerts',
      secret: 'whsec_alert1234567890abcdef',
      active: true,
      eventTypes: ['alert.triggered', 'alert.resolved', 'alert.acknowledged'],
      totalDeliveries: 523,
      successfulDeliveries: 518,
      failedDeliveries: 5,
      lastDelivery: '2024-12-20T15:45:00Z',
      nextRetry: null,
      createdAt: '2024-08-20T09:00:00Z',
      updatedAt: '2024-12-18T11:20:00Z'
    },
    {
      id: 'webhook-ep-3',
      name: 'Scaling Events',
      description: 'Auto-scaling event tracking',
      url: 'https://webhook.company.com/scaling',
      secret: 'whsec_scaling1234567890abcd',
      active: true,
      eventTypes: ['scaling.initiated', 'scaling.completed', 'scaling.failed'],
      totalDeliveries: 342,
      successfulDeliveries: 340,
      failedDeliveries: 2,
      lastDelivery: '2024-12-20T16:00:00Z',
      nextRetry: null,
      createdAt: '2024-10-01T12:00:00Z',
      updatedAt: '2024-12-19T15:30:00Z'
    },
    {
      id: 'webhook-ep-4',
      name: 'Backup Notifications',
      description: 'Database backup status updates',
      url: 'https://webhook.company.com/backups',
      secret: 'whsec_backup1234567890abcde',
      active: false,
      eventTypes: ['backup.started', 'backup.completed', 'backup.failed', 'backup.verified'],
      totalDeliveries: 128,
      successfulDeliveries: 127,
      failedDeliveries: 1,
      lastDelivery: '2024-12-15T08:00:00Z',
      nextRetry: null,
      createdAt: '2024-07-10T14:00:00Z',
      updatedAt: '2024-12-10T10:30:00Z'
    },
    {
      id: 'webhook-ep-5',
      name: 'Analytics Ingestion',
      description: 'Send metrics to analytics platform',
      url: 'https://webhook.company.com/analytics',
      secret: 'whsec_analytics1234567890abc',
      active: true,
      eventTypes: ['metric.recorded', 'event.recorded', 'trace.recorded'],
      totalDeliveries: 8932,
      successfulDeliveries: 8754,
      failedDeliveries: 178,
      lastDelivery: '2024-12-20T16:02:00Z',
      nextRetry: '2024-12-20T16:05:00Z',
      createdAt: '2024-06-01T09:00:00Z',
      updatedAt: '2024-12-20T15:45:00Z'
    }
  ];

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

  useEffect(() => {
    setEndpoints(mockEndpoints);
    setLoading(false);
  }, []);

  const handleCreateEndpoint = async () => {
    if (!formData.name.trim() || !formData.url.trim() || formData.eventTypes.length === 0) {
      setError('Name, URL, and at least one event type are required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.createWebhookEndpoint(formData);

      if (response.success) {
        const newSecret = `whsec_${Math.random().toString(36).substring(2, 20)}`;
        const newEndpoint = {
          id: `webhook-ep-${endpoints.length + 1}`,
          secret: newSecret,
          active: true,
          totalDeliveries: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          lastDelivery: null,
          nextRetry: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          headers: [{ key: 'X-Custom-Header', value: 'value' }],
          ...formData
        };
        setEndpoints([...endpoints, newEndpoint]);
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
      } else {
        setError(response.error || 'Failed to create endpoint');
      }
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
      const response = await apiClient.deleteWebhookEndpoint(endpointId);

      if (response.success) {
        setEndpoints(endpoints.filter(e => e.id !== endpointId));
        setSuccessMessage('Endpoint deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete endpoint');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleTestEndpoint = async (endpointId) => {
    try {
      setError('');
      const response = await apiClient.testWebhookEndpoint(endpointId);

      if (response.success) {
        setSuccessMessage('Test payload sent successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Test failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleGetLogs = async (endpointId) => {
    try {
      setError('');
      const response = await apiClient.getWebhookEndpointLogs(endpointId);

      if (response.success) {
        setSuccessMessage('Logs retrieved successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to fetch logs');
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

  const activeEndpoints = endpoints.filter(e => e.active).length;
  const totalDeliveries = endpoints.reduce((sum, e) => sum + e.totalDeliveries, 0);
  const avgSuccessRate = ((endpoints.reduce((sum, e) => sum + e.successfulDeliveries, 0) / totalDeliveries) * 100).toFixed(1);

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
