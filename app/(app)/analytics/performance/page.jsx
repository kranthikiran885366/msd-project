'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, Clock, Zap, Filter, Download, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function PerformanceAnalyticsPage() {
  const [performanceData, setPerformanceData] = useState(null);
  const [endpointMetrics, setEndpointMetrics] = useState([]);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [sortBy, setSortBy] = useState('avgLatency');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setError('');
      setLoading(true);

      const [perfRes, endpointsRes, latencyRes] = await Promise.all([
        apiClient.getPerformanceAnalytics({ timeRange }),
        apiClient.getEndpointMetrics({ timeRange }),
        apiClient.getLatencyHistory({ timeRange })
      ]);

      if (perfRes.success) {
        setPerformanceData(perfRes.data);
      } else {
        setError(perfRes.error || 'Failed to fetch performance data');
      }

      if (endpointsRes.success) {
        setEndpointMetrics(endpointsRes.data || []);
      }

      if (latencyRes.success) {
        setLatencyHistory(latencyRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sortedEndpoints = [...endpointMetrics].sort((a, b) => {
    switch (sortBy) {
      case 'avgLatency':
        return b.avgLatency - a.avgLatency;
      case 'p95Latency':
        return b.p95Latency - a.p95Latency;
      case 'errorRate':
        return b.errorRate - a.errorRate;
      case 'throughput':
        return b.throughput - a.throughput;
      default:
        return 0;
    }
  });

  const getLatencyBadge = (latency) => {
    if (latency < 100) return 'bg-green-100 text-green-800 border-green-200';
    if (latency < 500) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusColor = (status) => {
    if (status === 'excellent') return 'text-green-600';
    if (status === 'good') return 'text-blue-600';
    if (status === 'fair') return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground">
            Monitor application performance, latency, and throughput metrics
          </p>
        </div>
        <Button
          onClick={fetchPerformanceData}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Avg Latency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>Avg Latency</span>
                <Clock className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{performanceData.avgLatency}ms</p>
                <Badge className={`w-fit ${getLatencyBadge(performanceData.avgLatency)}`}>
                  {performanceData.avgLatency < 100 ? 'Excellent' : performanceData.avgLatency < 500 ? 'Good' : 'Poor'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* P95 Latency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>P95 Latency</span>
                <TrendingUp className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{performanceData.p95Latency}ms</p>
                <p className="text-xs text-muted-foreground">95th percentile</p>
              </div>
            </CardContent>
          </Card>

          {/* Throughput */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>Throughput</span>
                <Zap className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{performanceData.throughput.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">requests/sec</p>
              </div>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>Error Rate</span>
                <TrendingDown className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-red-600">{performanceData.errorRate.toFixed(2)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${Math.min(performanceData.errorRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Range & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => setTimeRange('1h')}
            variant={timeRange === '1h' ? 'default' : 'outline'}
            size="sm"
          >
            1 Hour
          </Button>
          <Button
            onClick={() => setTimeRange('24h')}
            variant={timeRange === '24h' ? 'default' : 'outline'}
            size="sm"
          >
            24 Hours
          </Button>
          <Button
            onClick={() => setTimeRange('7d')}
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
          >
            7 Days
          </Button>
          <Button
            onClick={() => setTimeRange('30d')}
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
          >
            30 Days
          </Button>
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="avgLatency">Sort by Avg Latency</option>
            <option value="p95Latency">Sort by P95 Latency</option>
            <option value="errorRate">Sort by Error Rate</option>
            <option value="throughput">Sort by Throughput</option>
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Latency Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {latencyHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value) => `${value}ms`} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgLatency"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Avg Latency"
                    dot={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="p95Latency"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="P95 Latency"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="maxLatency"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Max Latency"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Throughput & Errors */}
        <Card>
          <CardHeader>
            <CardTitle>Throughput vs Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {latencyHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="throughput"
                    fill="#3b82f6"
                    name="Throughput (req/s)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="errorRate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Error Rate (%)"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedEndpoints.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Endpoint</th>
                    <th className="text-center py-3 px-4 font-semibold">Method</th>
                    <th className="text-right py-3 px-4 font-semibold">Avg Latency</th>
                    <th className="text-right py-3 px-4 font-semibold">P95 Latency</th>
                    <th className="text-right py-3 px-4 font-semibold">Throughput</th>
                    <th className="text-right py-3 px-4 font-semibold">Error Rate</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEndpoints.map((endpoint, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{endpoint.path}</td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="outline" className="font-mono">
                          {endpoint.method}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={getLatencyBadge(endpoint.avgLatency)}>
                          {endpoint.avgLatency}ms
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">{endpoint.p95Latency}ms</td>
                      <td className="text-right py-3 px-4">{endpoint.throughput.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">
                        <span className={endpoint.errorRate > 5 ? 'text-red-600 font-bold' : ''}>
                          {endpoint.errorRate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge className={
                          endpoint.status === 'healthy' ? 'bg-green-100 text-green-800' :
                          endpoint.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {endpoint.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No endpoint data available</p>
          )}
        </CardContent>
      </Card>

      {/* Performance Issues Alert */}
      {performanceData && performanceData.errorRate > 5 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>High Error Rate Detected:</strong> Your error rate is currently {performanceData.errorRate.toFixed(2)}%. 
            Please review your logs and investigate potential issues.
          </AlertDescription>
        </Alert>
      )}

      {performanceData && performanceData.avgLatency > 1000 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>High Latency Detected:</strong> Your average latency is {performanceData.avgLatency}ms. 
            Consider optimizing slow queries or upgrading your infrastructure.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
