'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Trash2, RefreshCw, Code, Play, Settings, Copy, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CustomIntegrationBuilderPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'webhook',
    method: 'POST',
    endpoint: '',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    transformScript: '',
    enabled: true,
    retryPolicy: 'exponential',
    maxRetries: 3,
    timeout: 30
  });

  // Mock custom integrations
  const mockIntegrations = [
    {
      id: 'custom-1',
      name: 'Slack Notifications',
      description: 'Send deployment notifications to Slack',
      type: 'webhook',
      status: 'active',
      endpoint: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
      method: 'POST',
      lastExecuted: '2024-12-20T15:45:00Z',
      successRate: 98.5,
      totalExecutions: 342,
      headers: [
        { key: 'Authorization', value: 'Bearer ***' }
      ],
      transformScript: `
function transform(event) {
  return {
    text: "Deployment: " + event.deployment.name,
    attachments: [{
      color: event.status === 'success' ? 'good' : 'danger',
      fields: [
        { title: "Status", value: event.status, short: true },
        { title: "Environment", value: event.environment, short: true }
      ]
    }]
  };
}
      `,
      createdAt: '2024-09-10T10:00:00Z',
      updatedAt: '2024-12-15T14:30:00Z'
    },
    {
      id: 'custom-2',
      name: 'PagerDuty Incidents',
      description: 'Create incidents in PagerDuty on critical alerts',
      type: 'webhook',
      status: 'active',
      endpoint: 'https://events.pagerduty.com/v2/enqueue',
      method: 'POST',
      lastExecuted: '2024-12-20T16:00:00Z',
      successRate: 99.2,
      totalExecutions: 156,
      headers: [
        { key: 'Authorization', value: 'Token token=***' }
      ],
      transformScript: `
function transform(alert) {
  return {
    routing_key: "R1234567890abcdef",
    event_action: alert.severity === 'critical' ? 'trigger' : 'resolve',
    payload: {
      summary: alert.title,
      severity: alert.severity,
      source: "Deployment Platform"
    }
  };
}
      `,
      createdAt: '2024-10-05T12:00:00Z',
      updatedAt: '2024-12-18T11:20:00Z'
    },
    {
      id: 'custom-3',
      name: 'Datadog Events',
      description: 'Log deployment events to Datadog',
      type: 'webhook',
      status: 'active',
      endpoint: 'https://api.datadoghq.com/api/v1/events',
      method: 'POST',
      lastExecuted: '2024-12-20T15:30:00Z',
      successRate: 97.8,
      totalExecutions: 234,
      headers: [
        { key: 'DD-API-KEY', value: '***' },
        { key: 'DD-APPLICATION-KEY', value: '***' }
      ],
      transformScript: `
function transform(event) {
  return {
    title: event.deployment.name + " deployment",
    text: event.message,
    priority: event.priority,
    tags: ["deployment", event.environment, event.status],
    alert_type: event.status === 'error' ? 'error' : 'success'
  };
}
      `,
      createdAt: '2024-11-01T08:00:00Z',
      updatedAt: '2024-12-19T09:45:00Z'
    },
    {
      id: 'custom-4',
      name: 'HTTP Analytics Logger',
      description: 'Send analytics data to custom logging service',
      type: 'rest-api',
      status: 'active',
      endpoint: 'https://logs.internal.company.com/v1/logs',
      method: 'POST',
      lastExecuted: '2024-12-20T16:02:00Z',
      successRate: 96.3,
      totalExecutions: 5847,
      headers: [
        { key: 'X-API-Key', value: '***' },
        { key: 'X-Service', value: 'deployment-platform' }
      ],
      transformScript: `
function transform(data) {
  return {
    timestamp: new Date().toISOString(),
    service: "deployment-platform",
    level: data.level || "info",
    message: data.message,
    metadata: data.metadata || {},
    source: data.source
  };
}
      `,
      createdAt: '2024-08-20T09:00:00Z',
      updatedAt: '2024-12-20T10:30:00Z'
    }
  ];

  useEffect(() => {
    setIntegrations(mockIntegrations);
    setLoading(false);
  }, []);

  const handleCreateIntegration = async () => {
    if (!formData.name.trim() || !formData.endpoint.trim()) {
      setError('Name and endpoint are required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.createCustomIntegration(formData);

      if (response.success) {
        const newIntegration = {
          id: `custom-${integrations.length + 1}`,
          status: 'active',
          lastExecuted: null,
          successRate: 0,
          totalExecutions: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...formData
        };
        setIntegrations([...integrations, newIntegration]);
        setSuccessMessage('Custom integration created successfully');
        setFormData({
          name: '',
          description: '',
          type: 'webhook',
          method: 'POST',
          endpoint: '',
          headers: [{ key: 'Content-Type', value: 'application/json' }],
          transformScript: '',
          enabled: true,
          retryPolicy: 'exponential',
          maxRetries: 3,
          timeout: 30
        });
        setShowForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to create integration');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteIntegration = async (integrationId) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.deleteCustomIntegration(integrationId);

      if (response.success) {
        setIntegrations(integrations.filter(i => i.id !== integrationId));
        setSuccessMessage('Integration deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete integration');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleTestIntegration = async (integrationId) => {
    try {
      setError('');
      const response = await apiClient.testCustomIntegration(integrationId);

      if (response.success) {
        setSuccessMessage('Integration test successful');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Integration test failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleGetLogs = async (integrationId) => {
    try {
      setError('');
      const response = await apiClient.getCustomIntegrationLogs(integrationId);

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

  const activeIntegrations = integrations.filter(i => i.status === 'active').length;
  const totalExecutions = integrations.reduce((sum, i) => sum + i.totalExecutions, 0);
  const avgSuccessRate = (integrations.reduce((sum, i) => sum + i.successRate, 0) / integrations.length).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Custom Integration Builder</h1>
          <p className="text-muted-foreground">Create and manage custom webhooks and API integrations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Integration
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
              <p className="text-sm text-muted-foreground">Total Integrations</p>
              <p className="text-3xl font-bold">{integrations.length}</p>
              <p className="text-xs text-green-600">{activeIntegrations} active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Executions</p>
              <p className="text-3xl font-bold">{totalExecutions.toLocaleString()}</p>
              <p className="text-xs text-blue-600">all time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Success Rate</p>
              <p className="text-3xl font-bold text-green-600">{avgSuccessRate}%</p>
              <p className="text-xs text-gray-500">across all</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Integration Types</p>
              <p className="text-3xl font-bold">2</p>
              <p className="text-xs text-gray-500">webhook, rest-api</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Integration Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Slack Notifications"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Integration Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="webhook">Webhook</option>
                  <option value="rest-api">REST API</option>
                  <option value="graphql">GraphQL</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="desc">Description</Label>
                <Input
                  id="desc"
                  placeholder="Brief description of this integration"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method</Label>
                <select
                  id="method"
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint URL *</Label>
                <Input
                  id="endpoint"
                  placeholder="https://example.com/api/webhook"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                />
              </div>

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
                <Label htmlFor="retries">Max Retries</Label>
                <Input
                  id="retries"
                  type="number"
                  value={formData.maxRetries}
                  onChange={(e) => setFormData({...formData, maxRetries: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span>Enable Integration</span>
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="script">Transform Script (JavaScript)</Label>
              <textarea
                id="script"
                placeholder="function transform(data) { return data; }"
                value={formData.transformScript}
                onChange={(e) => setFormData({...formData, transformScript: e.target.value})}
                className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateIntegration} className="flex-1">Create Integration</Button>
              <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrations List */}
      <div className="space-y-4">
        {integrations.map(integration => (
          <Card key={integration.id} className="hover:shadow-md transition">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{integration.name}</h3>
                      <Badge className={integration.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {integration.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{integration.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>

                {/* Endpoint and Config */}
                <div className="pt-3 border-t space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Endpoint</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-gray-100 p-2 rounded truncate">{integration.endpoint}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(integration.endpoint)}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <Badge variant="outline" className="text-xs mt-1">{integration.method}</Badge>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Executions</p>
                    <p className="font-semibold">{integration.totalExecutions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-semibold text-green-600">{integration.successRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Executed</p>
                    <p className="text-xs">{integration.lastExecuted ? new Date(integration.lastExecuted).toLocaleString() : 'Never'}</p>
                  </div>
                </div>

                {/* Transform Script Preview */}
                {integration.transformScript && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Transform Function</p>
                    <code className="block text-xs bg-gray-100 p-2 rounded max-h-24 overflow-auto font-mono">
                      {integration.transformScript.substring(0, 150)}...
                    </code>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleTestIntegration(integration.id)}
                  >
                    <Play className="w-4 h-4" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleGetLogs(integration.id)}
                  >
                    <Eye className="w-4 h-4" />
                    View Logs
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1 ml-auto"
                    onClick={() => handleDeleteIntegration(integration.id)}
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

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Development Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-1">Transform Function Signature</p>
            <code className="block text-xs bg-gray-100 p-2 rounded font-mono">
              function transform(event) {'{'} return transformedData; {'}'}
            </code>
          </div>
          <div>
            <p className="font-semibold mb-1">Available Event Properties</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>event.deployment - Deployment details</li>
              <li>event.alert - Alert information</li>
              <li>event.timestamp - Event timestamp</li>
              <li>event.environment - Deployment environment</li>
              <li>event.status - Success/failure status</li>
              <li>event.metadata - Additional context</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">Retry Policy Options</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>exponential</strong> - 2^n seconds between retries</li>
              <li><strong>linear</strong> - n seconds between retries</li>
              <li><strong>none</strong> - No retries</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
