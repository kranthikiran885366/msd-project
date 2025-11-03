'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Trash2, RefreshCw, Settings, Copy, Lock, Zap } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function APIGatewayPage() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    path: '',
    targetUrl: '',
    method: 'GET',
    rateLimit: 1000,
    rateLimitPeriod: 'hour',
    authRequired: true,
    caching: false,
    cacheTTL: 300
  });

  // Mock API Gateway Endpoints
  const mockEndpoints = [
    {
      id: 'api-1',
      name: 'User Service',
      path: '/api/users',
      targetUrl: 'https://users-service.internal:8080/v1/users',
      method: 'ANY',
      status: 'active',
      rateLimit: 10000,
      rateLimitPeriod: 'hour',
      authRequired: true,
      authType: 'bearer',
      caching: true,
      cacheTTL: 600,
      requestsPerSecond: 245,
      maxRequestsPerSecond: 1000,
      errorRate: 0.2,
      avgLatency: 125,
      maxLatency: 850,
      uptime: 99.98,
      createdAt: '2024-09-10T10:00:00Z',
      lastModified: '2024-12-15T14:30:00Z'
    },
    {
      id: 'api-2',
      name: 'Product Catalog',
      path: '/api/products',
      targetUrl: 'https://products-service.internal:8080/v2/products',
      method: 'ANY',
      status: 'active',
      rateLimit: 5000,
      rateLimitPeriod: 'hour',
      authRequired: true,
      authType: 'bearer',
      caching: true,
      cacheTTL: 1800,
      requestsPerSecond: 412,
      maxRequestsPerSecond: 500,
      errorRate: 0.1,
      avgLatency: 215,
      maxLatency: 1200,
      uptime: 99.95,
      createdAt: '2024-08-20T09:00:00Z',
      lastModified: '2024-12-18T11:20:00Z'
    },
    {
      id: 'api-3',
      name: 'Analytics Events',
      path: '/api/events',
      targetUrl: 'https://analytics.internal:9000/collect',
      method: 'POST',
      status: 'active',
      rateLimit: 50000,
      rateLimitPeriod: 'hour',
      authRequired: false,
      authType: 'none',
      caching: false,
      cacheTTL: 0,
      requestsPerSecond: 8932,
      maxRequestsPerSecond: 50000,
      errorRate: 0.05,
      avgLatency: 45,
      maxLatency: 250,
      uptime: 99.99,
      createdAt: '2024-07-15T08:00:00Z',
      lastModified: '2024-12-19T09:45:00Z'
    },
    {
      id: 'api-4',
      name: 'Payment Gateway',
      path: '/api/payments',
      targetUrl: 'https://payments.internal:8443/v1/transactions',
      method: 'POST',
      status: 'active',
      rateLimit: 1000,
      rateLimitPeriod: 'hour',
      authRequired: true,
      authType: 'api-key',
      caching: false,
      cacheTTL: 0,
      requestsPerSecond: 85,
      maxRequestsPerSecond: 100,
      errorRate: 0.3,
      avgLatency: 450,
      maxLatency: 2100,
      uptime: 99.97,
      createdAt: '2024-10-01T12:00:00Z',
      lastModified: '2024-12-17T16:00:00Z'
    },
    {
      id: 'api-5',
      name: 'Legacy Auth',
      path: '/api/auth-v1',
      targetUrl: 'https://legacy-auth.internal:3000/auth',
      method: 'ANY',
      status: 'maintenance',
      rateLimit: 500,
      rateLimitPeriod: 'hour',
      authRequired: true,
      authType: 'basic',
      caching: false,
      cacheTTL: 0,
      requestsPerSecond: 12,
      maxRequestsPerSecond: 50,
      errorRate: 1.5,
      avgLatency: 680,
      maxLatency: 3400,
      uptime: 98.5,
      createdAt: '2024-06-01T14:00:00Z',
      lastModified: '2024-12-10T10:30:00Z'
    }
  ];

  useEffect(() => {
    setEndpoints(mockEndpoints);
    setLoading(false);
  }, []);

  const handleAddEndpoint = async () => {
    if (!formData.name.trim() || !formData.path.trim() || !formData.targetUrl.trim()) {
      setError('Name, path, and target URL are required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.createGatewayEndpoint(formData);

      if (response.success) {
        const newEndpoint = {
          id: `api-${endpoints.length + 1}`,
          status: 'active',
          requestsPerSecond: 0,
          maxRequestsPerSecond: formData.rateLimit / 3600,
          errorRate: 0,
          avgLatency: 0,
          maxLatency: 0,
          uptime: 100,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          authType: formData.authRequired ? 'bearer' : 'none',
          ...formData
        };
        setEndpoints([...endpoints, newEndpoint]);
        setSuccessMessage('API endpoint created successfully');
        setFormData({ name: '', path: '', targetUrl: '', method: 'GET', rateLimit: 1000, rateLimitPeriod: 'hour', authRequired: true, caching: false, cacheTTL: 300 });
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
    if (!confirm('Are you sure you want to delete this endpoint?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.deleteGatewayEndpoint(endpointId);

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

  const handleUpdateRateLimit = async (endpointId, newLimit) => {
    try {
      setError('');
      const response = await apiClient.configureRateLimiting(endpointId, { rateLimit: newLimit });

      if (response.success) {
        setEndpoints(endpoints.map(e =>
          e.id === endpointId ? {...e, rateLimit: newLimit, maxRequestsPerSecond: newLimit / 3600} : e
        ));
        setSuccessMessage('Rate limit updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to update rate limit');
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

  const activeEndpoints = endpoints.filter(e => e.status === 'active').length;
  const totalRequests = endpoints.reduce((sum, e) => sum + e.requestsPerSecond, 0);
  const avgErrorRate = (endpoints.reduce((sum, e) => sum + e.errorRate, 0) / endpoints.length).toFixed(2);
  const avgLatency = Math.round(endpoints.reduce((sum, e) => sum + e.avgLatency, 0) / endpoints.length);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">API Gateway</h1>
          <p className="text-muted-foreground">Manage API endpoints, rate limits, and routing</p>
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
              <p className="text-sm text-muted-foreground">Requests/Second</p>
              <p className="text-3xl font-bold">{totalRequests.toLocaleString()}</p>
              <p className="text-xs text-blue-600">current load</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Error Rate</p>
              <p className="text-3xl font-bold">{avgErrorRate}%</p>
              <p className="text-xs text-orange-600">across all endpoints</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Latency</p>
              <p className="text-3xl font-bold">{avgLatency}ms</p>
              <p className="text-xs text-purple-600">response time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create API Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Endpoint Name *</Label>
                <Input
                  id="name"
                  placeholder="User Service"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="path">Path *</Label>
                <Input
                  id="path"
                  placeholder="/api/users"
                  value={formData.path}
                  onChange={(e) => setFormData({...formData, path: e.target.value})}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="url">Target URL *</Label>
                <Input
                  id="url"
                  placeholder="https://service.internal:8080/v1/path"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({...formData, targetUrl: e.target.value})}
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
                  <option value="PATCH">PATCH</option>
                  <option value="ANY">ANY</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateLimit">Rate Limit (per hour)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={formData.rateLimit}
                  onChange={(e) => setFormData({...formData, rateLimit: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.authRequired}
                    onChange={(e) => setFormData({...formData, authRequired: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span>Require Authentication</span>
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.caching}
                    onChange={(e) => setFormData({...formData, caching: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span>Enable Caching</span>
                </Label>
              </div>

              {formData.caching && (
                <div className="space-y-2">
                  <Label htmlFor="cacheTTL">Cache TTL (seconds)</Label>
                  <Input
                    id="cacheTTL"
                    type="number"
                    value={formData.cacheTTL}
                    onChange={(e) => setFormData({...formData, cacheTTL: parseInt(e.target.value)})}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddEndpoint} className="flex-1">Create Endpoint</Button>
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
              <div className="flex items-start justify-between gap-4">
                {/* Endpoint Info */}
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{endpoint.name}</h3>
                      <Badge className={endpoint.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {endpoint.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{endpoint.path}</p>
                    <p className="text-xs text-gray-500">{endpoint.targetUrl}</p>
                  </div>

                  {/* Configuration */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t text-sm">
                    <div>
                      <p className="text-muted-foreground">Method</p>
                      <Badge variant="outline" className="text-xs">{endpoint.method}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rate Limit</p>
                      <p className="font-semibold">{endpoint.rateLimit}/hr</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Auth</p>
                      <div className="flex items-center gap-1">
                        {endpoint.authRequired ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span className="text-xs">{endpoint.authType}</span>
                          </>
                        ) : (
                          <span className="text-xs text-orange-600">None</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cache</p>
                      <p className="font-semibold text-xs">{endpoint.caching ? `${endpoint.cacheTTL}s` : 'Disabled'}</p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t text-sm">
                    <div>
                      <p className="text-muted-foreground">Req/sec</p>
                      <p className="font-semibold text-blue-600">{endpoint.requestsPerSecond}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Error Rate</p>
                      <p className={`font-semibold ${endpoint.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                        {endpoint.errorRate.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Latency</p>
                      <p className="font-semibold">{endpoint.avgLatency}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max Latency</p>
                      <p className="font-semibold text-orange-600">{endpoint.maxLatency}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Uptime</p>
                      <p className="font-semibold text-green-600">{endpoint.uptime}%</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateRateLimit(endpoint.id, endpoint.rateLimit * 1.5)}
                    className="gap-1"
                    title="Increase rate limit by 50%"
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(endpoint.path)}
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteEndpoint(endpoint.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
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
          <CardTitle>Rate Limiting Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">Token Bucket Algorithm</p>
            <p className="text-muted-foreground">Rate limits are enforced using token bucket algorithm, allowing burst traffic while maintaining average rate</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Exponential Backoff</p>
            <p className="text-muted-foreground">Clients should implement exponential backoff when receiving 429 (Too Many Requests) responses</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Monitoring Thresholds</p>
            <p className="text-muted-foreground">Set rate limits at 80% of expected peak load to allow headroom for traffic spikes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
