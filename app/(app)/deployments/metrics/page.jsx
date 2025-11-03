'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

export default function CustomMetricsPage() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'gauge',
    unit: '',
    aggregation: 'average',
    enabled: true
  });

  // Backend integration for metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');
      
      if (!projectId) {
        setError('Please select a project first');
        setMetrics([]);
        setLoading(false);
        return;
      }

      const res = await apiClient.getMetrics?.(projectId) || { data: [] };
      setMetrics(Array.isArray(res) ? res : res.data || []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setError('Failed to load metrics');
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleCreateMetric = async () => {
    if (!formData.name) {
      setError('Metric name is required');
      return;
    }

    try {
      setError('');
      await apiClient.createMetric(selectedDeployment, formData);
      await fetchMetrics();
      setSuccessMessage('Custom metric created successfully');
      setFormData({
        name: '',
        description: '',
        type: 'gauge',
        unit: '',
        aggregation: 'average',
        enabled: true
      });
      setShowCreateForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteMetric = async (metricId) => {
    try {
      setError('');
      const response = await apiClient.deleteMetric(metricId);

      if (response.success) {
        setMetrics(metrics.filter(m => m.id !== metricId));
        setSuccessMessage('Metric deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete metric');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleToggleMetric = async (metricId) => {
    try {
      setError('');
      const response = await apiClient.toggleMetric(metricId);

      if (response.success) {
        setMetrics(metrics.map(m => 
          m.id === metricId ? {...m, enabled: !m.enabled} : m
        ));
      } else {
        setError(response.error || 'Failed to toggle metric');
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

  const enabledCount = metrics.filter(m => m.enabled).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Custom Metrics</h1>
          <p className="text-muted-foreground">Create and monitor custom application metrics</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Metric
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Metrics</p>
              <p className="text-3xl font-bold">{metrics.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-green-600">{enabledCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm font-semibold">
                {metrics.length > 0 
                  ? new Date(metrics[0].lastUpdated).toLocaleTimeString()
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Metric Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Metric</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Metric Name</Label>
              <Input
                id="name"
                placeholder="e.g., Request Queue Length"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Describe what this metric measures..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Metric Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="gauge">Gauge (instantaneous value)</option>
                  <option value="counter">Counter (accumulating)</option>
                  <option value="histogram">Histogram (distribution)</option>
                  <option value="percentage">Percentage (0-100)</option>
                  <option value="duration">Duration (time)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="e.g., ms, requests, %"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aggregation">Aggregation Method</Label>
                <select
                  id="aggregation"
                  value={formData.aggregation}
                  onChange={(e) => handleInputChange('aggregation', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="average">Average</option>
                  <option value="sum">Sum</option>
                  <option value="maximum">Maximum</option>
                  <option value="minimum">Minimum</option>
                  <option value="latest">Latest Value</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => handleInputChange('enabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Enable collection immediately</span>
            </label>

            <div className="flex gap-3">
              <Button onClick={handleCreateMetric} className="flex-1">
                Create Metric
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="space-y-4">
        {metrics.map(metric => (
          <Card key={metric.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setSelectedMetric(metric)}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{metric.name}</h3>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={metric.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {metric.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{metric.type}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted rounded text-sm">
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="font-semibold">{metric.lastValue}{metric.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Average</p>
                    <p className="font-semibold">{metric.average.toFixed(1)}{metric.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max</p>
                    <p className="font-semibold">{metric.maximum}{metric.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Min</p>
                    <p className="font-semibold">{metric.minimum}{metric.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Updated</p>
                    <p className="font-semibold">{new Date(metric.lastUpdated).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Mini Chart */}
                <div className="h-16 -mx-6 -mb-6">
                  <ResponsiveContainer width="100%" height={64}>
                    <AreaChart data={metric.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#93c5fd" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMetric(metric.id);
                    }}
                  >
                    {metric.enabled ? 'Disable' : 'Enable'}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMetric(metric.id);
                    }}
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

      {/* Selected Metric Detail */}
      {selectedMetric && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {selectedMetric.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedMetric.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMetric(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedMetric.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  dot={true} 
                  isAnimationActive={false}
                  name={`${selectedMetric.name} (${selectedMetric.unit})`}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-semibold capitalize">{selectedMetric.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aggregation</p>
                <p className="font-semibold capitalize">{selectedMetric.aggregation}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{selectedMetric.enabled ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-semibold">{new Date(selectedMetric.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
