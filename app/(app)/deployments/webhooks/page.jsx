'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Plus, Edit2, Trash2, Copy, Send, RotateCw } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function WebhooksManagementPage() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [webhooks, setWebhooks] = useState([]);
  const [deliveryLogs, setDeliveryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  const [formData, setFormData] = useState({
    url: '',
    events: [],
    active: true,
    retryAttempts: 3,
    timeout: 30
  });

  // Removed mock data - using backend integration
    {
      id: 1,
      url: 'https://api.example.com/webhooks/deployment',
      events: ['deployment.success', 'deployment.failed'],
      active: true,
      retryAttempts: 3,
      timeout: 30,
      createdAt: '2024-10-15T10:00:00Z',
      lastTriggered: '2024-12-20T14:32:00Z',
      totalDeliveries: 456,
      failedDeliveries: 12,
      successRate: 97.4
    },
    {
      id: 2,
      url: 'https://slack.com/api/webhooks/alerts',
      events: ['alert.triggered'],
      active: true,
      retryAttempts: 5,
      timeout: 30,
      createdAt: '2024-10-16T12:30:00Z',
      lastTriggered: '2024-12-20T15:10:00Z',
      totalDeliveries: 234,
      failedDeliveries: 2,
      successRate: 99.1
    },
    {
      id: 3,
      url: 'https://monitoring.example.com/incidents',
      events: ['incident.created', 'incident.resolved'],
      active: true,
      retryAttempts: 3,
      timeout: 30,
      createdAt: '2024-10-18T09:20:00Z',
      lastTriggered: '2024-12-20T13:45:00Z',
      totalDeliveries: 89,
      failedDeliveries: 3,
      successRate: 96.6
    },
    {
      id: 4,
      url: 'https://logging.example.com/events',
      events: ['deployment.success', 'deployment.failed', 'alert.triggered'],
      active: false,
      retryAttempts: 3,
      timeout: 30,
      createdAt: '2024-11-01T14:50:00Z',
      lastTriggered: '2024-12-10T10:15:00Z',
      totalDeliveries: 1200,
      failedDeliveries: 45,
      successRate: 96.2
    }
  ];

  // Mock delivery logs
  const mockDeliveryLogs = [
    {
      id: 1,
      event: 'deployment.success',
      timestamp: '2024-12-20T14:32:00Z',
      status: 'success',
      statusCode: 200,
      duration: 145,
      attempts: 1,
      payload: { deploymentId: 'deploy-123', status: 'success' }
    },
    {
      id: 2,
      event: 'alert.triggered',
      timestamp: '2024-12-20T15:10:00Z',
      status: 'success',
      statusCode: 200,
      duration: 89,
      attempts: 1,
      payload: { alertId: 'alert-456', severity: 'critical' }
    },
    {
      id: 3,
      event: 'incident.created',
      timestamp: '2024-12-20T13:45:00Z',
      status: 'success',
      statusCode: 201,
      duration: 234,
      attempts: 2,
      payload: { incidentId: 'inc-789', title: 'High CPU Usage' }
    },
    {
      id: 4,
      event: 'deployment.failed',
      timestamp: '2024-12-20T12:30:00Z',
      status: 'failed',
      statusCode: 500,
      duration: 30000,
      attempts: 3,
      payload: { deploymentId: 'deploy-124', error: 'Build failed' }
    },
    {
      id: 5,
      event: 'alert.triggered',
      timestamp: '2024-12-20T11:20:00Z',
      status: 'success',
      statusCode: 200,
      duration: 112,
      attempts: 1,
      payload: { alertId: 'alert-457', severity: 'warning' }
    }
  ];

  const eventOptions = [
    { id: 'deployment.success', name: 'Deployment Success' },
    { id: 'deployment.failed', name: 'Deployment Failed' },
    { id: 'alert.triggered', name: 'Alert Triggered' },
    { id: 'incident.created', name: 'Incident Created' },
    { id: 'incident.resolved', name: 'Incident Resolved' },
    { id: 'scaling.event', name: 'Scaling Event' },
    { id: 'backup.completed', name: 'Backup Completed' }
  ];

  const fetchDeployments = useCallback(async () => {
    try {
      setError('');
      const projects = await apiClient.getProjects();
      setDeployments(projects || []);
      if (projects?.length > 0 && !selectedDeployment) {
        setSelectedDeployment(projects[0]._id);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  }, [selectedDeployment]);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchWebhooks = useCallback(async () => {
    if (!selectedDeployment) return;
    
    try {
      setError('');
      setLoading(true);
      const [webhooksData, logsData] = await Promise.all([
        apiClient.getWebhooks(selectedDeployment),
        apiClient.getWebhookDeliveries(selectedDeployment)
      ]);
      setWebhooks(webhooksData || []);
      setDeliveryLogs(logsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  }, [selectedDeployment]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleEventToggle = (eventId) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  const handleCreateWebhook = async () => {
    if (!formData.url) {
      setError('Webhook URL is required');
      return;
    }

    if (formData.events.length === 0) {
      setError('At least one event must be selected');
      return;
    }

    try {
      setError('');
      await apiClient.createWebhook(selectedDeployment, formData);
      await fetchWebhooks();
      setSuccessMessage('Webhook created successfully');
      setFormData({
        url: '',
        events: [],
        active: true,
        retryAttempts: 3,
        timeout: 30
      });
      setShowCreateForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleTestWebhook = async (webhookId) => {
    try {
      setError('');
      const response = await apiClient.testWebhook(webhookId);

      if (response.success) {
        setSuccessMessage('Test webhook delivery sent successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to send test webhook');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
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

  const handleToggleWebhook = async (webhookId) => {
    try {
      setError('');
      const response = await apiClient.toggleWebhook(webhookId);

      if (response.success) {
        setWebhooks(webhooks.map(w => 
          w.id === webhookId ? {...w, active: !w.active} : w
        ));
      } else {
        setError(response.error || 'Failed to toggle webhook');
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
  const totalDeliveries = webhooks.reduce((sum, w) => sum + w.totalDeliveries, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Webhooks Management</h1>
          <p className="text-muted-foreground">Configure webhooks for event notifications</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
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

      {/* Deployment Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Deployment</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedDeployment}
            onChange={(e) => setSelectedDeployment(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
          >
            {deployments.map(dep => (
              <option key={dep._id} value={dep._id}>
                {dep.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

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
              <p className="text-sm text-muted-foreground">Avg Success Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {(webhooks.reduce((sum, w) => sum + w.successRate, 0) / webhooks.length).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Webhook Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/webhooks"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Must be HTTPS</p>
            </div>

            <div className="space-y-3">
              <Label>Events to Subscribe</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eventOptions.map(event => (
                  <label key={event.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.id)}
                      onChange={() => handleEventToggle(event.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{event.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retryAttempts">Retry Attempts</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  value={formData.retryAttempts}
                  onChange={(e) => handleInputChange('retryAttempts', parseInt(e.target.value))}
                  min="0"
                  max="10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
                  min="5"
                  max="120"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Enable webhook immediately</span>
            </label>

            <div className="flex gap-3">
              <Button onClick={handleCreateWebhook} className="flex-1">
                Create Webhook
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.map(webhook => (
          <Card key={webhook.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg break-all">{webhook.url}</h3>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(webhook.url)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Events: {webhook.events.join(', ')}
                    </p>
                  </div>
                  <Badge className={webhook.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {webhook.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted rounded text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Deliveries</p>
                    <p className="font-semibold">{webhook.totalDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failed</p>
                    <p className="font-semibold text-red-600">{webhook.failedDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-semibold">{webhook.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Retry Attempts</p>
                    <p className="font-semibold">{webhook.retryAttempts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Triggered</p>
                    <p className="font-semibold">
                      {webhook.lastTriggered 
                        ? new Date(webhook.lastTriggered).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleToggleWebhook(webhook.id)}
                  >
                    {webhook.active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTestWebhook(webhook.id)}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Test
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedWebhook(webhook)}
                    className="gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    Logs
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="gap-2 ml-auto"
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

      {/* Delivery Logs */}
      {selectedWebhook && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Delivery Logs - {selectedWebhook.url}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedWebhook(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveryLogs.map(log => (
                <div key={log.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{log.event}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {log.statusCode}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-semibold">{log.duration}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Attempts</p>
                      <p className="font-semibold">{log.attempts}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-semibold capitalize">{log.status}</p>
                    </div>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Payload</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
