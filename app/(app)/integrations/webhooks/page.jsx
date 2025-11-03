'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Edit2, Trash2, RefreshCw, Copy, Globe, Send, TestTube } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function WebhooksIntegrationPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [testResults, setTestResults] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [],
    headers: {},
    active: true,
    retryPolicy: 'exponential',
    timeout: 30
  });

  const availableEvents = [
    'deployment.created',
    'deployment.started',
    'deployment.completed',
    'deployment.failed',
    'database.backup.completed',
    'database.backup.failed',
    'alert.triggered',
    'alert.resolved',
    'incident.created',
    'incident.resolved',
    'scaling.triggered',
    'billing.invoice.created',
    'user.invited',
    'user.added'
  ];

  // Mock webhooks
  const mockWebhooks = [
    {
      id: 'wh-1',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
      events: ['deployment.completed', 'deployment.failed', 'alert.triggered'],
      active: true,
      headers: { 'X-Slack-Request-Timestamp': '' },
      retryPolicy: 'exponential',
      timeout: 30,
      deliveryStats: { total: 245, success: 238, failure: 7, lastDelivery: '2024-12-20T15:45:00Z' },
      createdAt: '2024-11-10T10:00:00Z'
    },
    {
      id: 'wh-2',
      name: 'Custom Analytics Service',
      url: 'https://analytics.example.com/webhook',
      events: ['deployment.completed', 'scaling.triggered'],
      active: true,
      headers: { 'Authorization': 'Bearer token_...', 'X-Api-Key': 'key_...' },
      retryPolicy: 'linear',
      timeout: 45,
      deliveryStats: { total: 156, success: 154, failure: 2, lastDelivery: '2024-12-20T14:20:00Z' },
      createdAt: '2024-10-15T09:30:00Z'
    },
    {
      id: 'wh-3',
      name: 'Datadog Events',
      url: 'https://api.datadoghq.com/api/v1/events',
      events: ['alert.triggered', 'incident.created', 'incident.resolved'],
      active: true,
      headers: { 'DD-API-KEY': 'api_key_...', 'DD-APPLICATION-KEY': 'app_key_...' },
      retryPolicy: 'exponential',
      timeout: 20,
      deliveryStats: { total: 123, success: 121, failure: 2, lastDelivery: '2024-12-20T13:00:00Z' },
      createdAt: '2024-09-01T14:00:00Z'
    },
    {
      id: 'wh-4',
      name: 'PagerDuty Integration',
      url: 'https://events.pagerduty.com/v2/enqueue',
      events: ['alert.triggered', 'incident.created'],
      active: true,
      headers: { 'Content-Type': 'application/json' },
      retryPolicy: 'exponential',
      timeout: 15,
      deliveryStats: { total: 89, success: 87, failure: 2, lastDelivery: '2024-12-20T12:15:00Z' },
      createdAt: '2024-08-20T11:00:00Z'
    },
    {
      id: 'wh-5',
      name: 'Legacy System Interface',
      url: 'https://legacy.internal.company.com/events',
      events: ['deployment.completed'],
      active: false,
      headers: { 'X-Legacy-Auth': 'legacy_token_...' },
      retryPolicy: 'linear',
      timeout: 60,
      deliveryStats: { total: 45, success: 42, failure: 3, lastDelivery: '2024-12-10T10:00:00Z' },
      createdAt: '2024-07-01T08:00:00Z'
    }
  ];

  useEffect(() => {
    setWebhooks(mockWebhooks);
    setLoading(false);
  }, []);

  const handleEventToggle = (event) => {
    setFormData({
      ...formData,
      events: formData.events.includes(event)
        ? formData.events.filter(e => e !== event)
        : [...formData.events, event]
    });
  };

  const handleHeaderChange = (key, value) => {
    setFormData({
      ...formData,
      headers: {...formData.headers, [key]: value}
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      headers: {},
      active: true,
      retryPolicy: 'exponential',
      timeout: 30
    });
    setEditingId(null);
  };

  const handleSaveWebhook = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      setError('Name and URL are required');
      return;
    }

    if (formData.events.length === 0) {
      setError('Select at least one event');
      return;
    }

    try {
      setError('');
      const response = await apiClient.createWebhook(formData);

      if (response.success) {
        if (editingId) {
          setWebhooks(webhooks.map(w => w.id === editingId ? {...w, ...formData} : w));
          setSuccessMessage('Webhook updated successfully');
        } else {
          const newWebhook = {
            id: `wh-${webhooks.length + 1}`,
            ...formData,
            deliveryStats: { total: 0, success: 0, failure: 0, lastDelivery: null },
            createdAt: new Date().toISOString()
          };
          setWebhooks([...webhooks, newWebhook]);
          setSuccessMessage('Webhook created successfully');
        }
        resetForm();
        setShowForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to save webhook');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleTestWebhook = async (webhookId) => {
    try {
      setError('');
      const response = await apiClient.testWebhook(webhookId);

      if (response.success) {
        setTestResults({...testResults, [webhookId]: { success: true, statusCode: 200, responseTime: '145ms' }});
        setSuccessMessage('Webhook test successful');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setTestResults({...testResults, [webhookId]: { success: false, statusCode: response.statusCode, error: response.error }});
        setError('Webhook test failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.deleteWebhook(webhookId);

      if (response.success) {
        setWebhooks(webhooks.filter(w => w.id !== webhookId));
        setSuccessMessage('Webhook deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete webhook');
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

  const activeWebhooks = webhooks.filter(w => w.active).length;
  const totalDeliveries = webhooks.reduce((sum, w) => sum + w.deliveryStats.total, 0);
  const successRate = totalDeliveries > 0 
    ? ((webhooks.reduce((sum, w) => sum + w.deliveryStats.success, 0) / totalDeliveries) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Webhooks Integration</h1>
          <p className="text-muted-foreground">Configure and manage outbound webhooks for system events</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Webhook
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
              <p className="text-sm text-muted-foreground">Total Webhooks</p>
              <p className="text-3xl font-bold">{webhooks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-green-600">{activeWebhooks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
              <p className="text-3xl font-bold">{totalDeliveries}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">{successRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Webhook' : 'Create New Webhook'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Webhook Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Slack Notifications"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Webhook URL *</Label>
                <Input
                  id="url"
                  placeholder="https://hooks.example.com/webhook"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData({...formData, timeout: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retry">Retry Policy</Label>
                <select
                  id="retry"
                  value={formData.retryPolicy}
                  onChange={(e) => setFormData({...formData, retryPolicy: e.target.value})}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="exponential">Exponential Backoff</option>
                  <option value="linear">Linear Backoff</option>
                  <option value="none">No Retry</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Events to Subscribe *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {availableEvents.map(event => (
                  <label key={event} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event)}
                      onChange={() => handleEventToggle(event)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveWebhook} className="flex-1">
                {editingId ? 'Update Webhook' : 'Create Webhook'}
              </Button>
              <Button onClick={() => { resetForm(); setShowForm(false); }} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.map(webhook => (
          <Card key={webhook.id} className="hover:shadow-md transition">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                {/* Webhook Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{webhook.name}</h3>
                      <p className="text-sm text-muted-foreground break-all font-mono text-xs">{webhook.url}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={webhook.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {webhook.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{webhook.events.length} events</Badge>
                    <Badge variant="outline">{webhook.retryPolicy} retry</Badge>
                  </div>

                  {/* Delivery Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Deliveries</p>
                      <p className="font-semibold">{webhook.deliveryStats.total}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success</p>
                      <p className="font-semibold text-green-600">{webhook.deliveryStats.success}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="font-semibold text-red-600">{webhook.deliveryStats.failure}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Delivery</p>
                      <p className="font-semibold">
                        {webhook.deliveryStats.lastDelivery 
                          ? new Date(webhook.deliveryStats.lastDelivery).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Subscribed Events:</p>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Test Result */}
                  {testResults[webhook.id] && (
                    <div className={`mt-2 p-2 rounded text-xs ${testResults[webhook.id].success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      {testResults[webhook.id].success 
                        ? `✓ Test successful (${testResults[webhook.id].responseTime})`
                        : `✗ Test failed (HTTP ${testResults[webhook.id].statusCode})`}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestWebhook(webhook.id)}
                    className="gap-1"
                  >
                    <TestTube className="w-4 h-4" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Payload Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">All webhooks receive JSON payloads with the following structure:</p>
          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "id": "evt_1234567890",
  "timestamp": "2024-12-20T15:45:30Z",
  "event": "deployment.completed",
  "data": {
    "deploymentId": "deploy-123",
    "status": "success",
    "environment": "production",
    "version": "v2.1.0"
  },
  "retryCount": 0
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
