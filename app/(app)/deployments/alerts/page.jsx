'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Plus, Edit2, Trash2, Bell, Mail, MessageCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function AlertConfigurationPage() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    metric: 'cpu',
    operator: '>',
    threshold: 80,
    duration: 5,
    severity: 'warning',
    notificationChannels: [],
    enabled: true
  });

  const [selectedAlert, setSelectedAlert] = useState(null);



  const notificationChannelOptions = [
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'sms', name: 'SMS', icon: MessageCircle },
    { id: 'slack', name: 'Slack', icon: Bell },
    { id: 'webhook', name: 'Webhook', icon: Bell }
  ];

  const metrics = [
    { id: 'cpu', name: 'CPU Usage (%)' },
    { id: 'memory', name: 'Memory Usage (%)' },
    { id: 'disk_usage', name: 'Disk Usage (%)' },
    { id: 'response_time', name: 'Response Time (ms)' },
    { id: 'error_rate', name: 'Error Rate (%)' },
    { id: 'deployment_status', name: 'Deployment Status' },
    { id: 'uptime', name: 'Uptime (%)' }
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

  const fetchAlerts = useCallback(async () => {
    if (!selectedDeployment) return;
    
    try {
      setError('');
      setLoading(true);
      const alertsData = await apiClient.getAlerts(selectedDeployment);
      setAlerts(alertsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [selectedDeployment]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleChannelToggle = (channelId) => {
    setFormData(prev => ({
      ...prev,
      notificationChannels: prev.notificationChannels.includes(channelId)
        ? prev.notificationChannels.filter(c => c !== channelId)
        : [...prev.notificationChannels, channelId]
    }));
  };

  const handleCreateAlert = async () => {
    if (!formData.name || !formData.metric) {
      setError('Alert name and metric are required');
      return;
    }

    if (formData.notificationChannels.length === 0) {
      setError('At least one notification channel is required');
      return;
    }

    try {
      setError('');
      await apiClient.createAlert(selectedDeployment, {
        name: formData.name,
        metricType: formData.metric,
        threshold: formData.threshold,
        operator: formData.operator === '>' ? 'gt' : formData.operator === '<' ? 'lt' : 'eq',
        message: `Alert: ${formData.name}`,
        channels: formData.notificationChannels,
        active: formData.enabled
      });

      await fetchAlerts();
      setSuccessMessage('Alert created successfully');
      setFormData({
        name: '',
        metric: 'cpu',
        operator: '>',
        threshold: 80,
        duration: 5,
        severity: 'warning',
        notificationChannels: [],
        enabled: true
      });
      setShowCreateForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      setError('');
      await apiClient.deleteAlert(alertId);
      await fetchAlerts();
      setSuccessMessage('Alert deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleToggleAlert = async (alertId) => {
    try {
      setError('');
      await apiClient.toggleAlert(alertId);
      await fetchAlerts();
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const enabledCount = alerts.filter(a => a.active).length;
  const criticalCount = alerts.filter(a => a.active).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Alert Configuration</h1>
          <p className="text-muted-foreground">Configure alert rules and notification channels</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Alert
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
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <p className="text-3xl font-bold">{alerts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Enabled</p>
              <p className="text-3xl font-bold text-green-600">{enabledCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Triggered (24h)</p>
              <p className="text-3xl font-bold">
                {alerts.reduce((sum, a) => sum + (a.triggeredCount || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Alert Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Alert Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., High CPU Usage"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metric">Metric</Label>
                <select
                  id="metric"
                  value={formData.metric}
                  onChange={(e) => handleInputChange('metric', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {metrics.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator">Condition</Label>
                <select
                  id="operator"
                  value={formData.operator}
                  onChange={(e) => handleInputChange('operator', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value=">">Greater than (>)</option>
                  <option value="<">Less than (<)</option>
                  <option value=">=">Greater or equal (>=)</option>
                  <option value="<=">Less or equal (<=)</option>
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not equals</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold Value</Label>
                <Input
                  id="threshold"
                  placeholder="80"
                  value={formData.threshold}
                  onChange={(e) => handleInputChange('threshold', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  min="1"
                  max="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <select
                  id="severity"
                  value={formData.severity}
                  onChange={(e) => handleInputChange('severity', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-3">
              <Label>Notification Channels</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {notificationChannelOptions.map(channel => (
                  <label key={channel.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={formData.notificationChannels.includes(channel.id)}
                      onChange={() => handleChannelToggle(channel.id)}
                      className="w-4 h-4"
                    />
                    <channel.icon className="w-4 h-4" />
                    <span className="text-sm">{channel.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => handleInputChange('enabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Enable this alert immediately</span>
            </label>

            <div className="flex gap-3">
              <Button onClick={handleCreateAlert} className="flex-1">
                Create Alert
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map(alert => (
          <Card key={alert._id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{alert.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Trigger when {alert.metricType} {alert.operator} {alert.threshold}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {alert.active ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted rounded text-sm">
                  <div>
                    <p className="text-muted-foreground">Notification Channels</p>
                    <p className="font-semibold">{alert.channels?.join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Triggered Count</p>
                    <p className="font-semibold">{alert.triggerCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Triggered</p>
                    <p className="font-semibold">
                      {alert.lastTriggered 
                        ? new Date(alert.lastTriggered).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleToggleAlert(alert._id)}
                  >
                    {alert.active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteAlert(alert._id)}
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

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Set realistic thresholds to avoid alert fatigue</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Use multiple notification channels for critical alerts</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Configure appropriate severity levels for different metrics</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Regularly review and update alert rules based on monitoring data</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
