'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import realtimeService from '@/lib/realtime-service';
import apiClient from '@/lib/api-client';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function PerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [cpuData, setCpuData] = useState([]);
  const [memoryData, setMemoryData] = useState([]);
  const [latencyData, setLatencyData] = useState([]);
  const [serviceHealth, setServiceHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  const toNumber = (value, fallback = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    if (value && typeof value === 'object') {
      const nested = value.avg ?? value.value ?? value.current;
      return toNumber(nested, fallback);
    }
    return fallback;
  };

  const normalizeRealtimePoint = (point, field) => {
    if (point && typeof point === 'object') return point;
    return { time: new Date().toLocaleTimeString(), [field]: toNumber(point) };
  };

  useEffect(() => {
    fetchMetrics();

    const handleMetricUpdate = (data) => {
      setMetrics((prev) => ({ ...(prev || {}), ...(data || {}) }));
      if (data?.cpu != null) setCpuData(prev => [...prev.slice(-59), normalizeRealtimePoint(data.cpu, 'cpu')]);
      if (data?.memory != null) setMemoryData(prev => [...prev.slice(-59), normalizeRealtimePoint(data.memory, 'memory')]);
      if (data?.latency != null) setLatencyData(prev => [...prev.slice(-59), normalizeRealtimePoint(data.latency, 'p95')]);
    };

    realtimeService.subscribeToMetrics(null, handleMetricUpdate);

    return () => {
      realtimeService.off('metric:update', handleMetricUpdate);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [historyResponse, overviewResponse, projectsResponse] = await Promise.all([
        apiClient.getAnalyticsHistory({ days: 1 }),
        apiClient.getAnalyticsOverview(),
        apiClient.getProjects()
      ]);

      const history = historyResponse?.data || historyResponse || [];
      const overview = overviewResponse?.data || overviewResponse || {};
      const projects = Array.isArray(projectsResponse) ? projectsResponse : projectsResponse?.data || [];

      const normalizedHistory = history.map((item, index) => ({
        time: item.date || `${index}`,
        cpu: toNumber(item.cpuUsage),
        memory: toNumber(item.memoryUsage),
        p50: toNumber(item.p50ResponseTime ?? item.avgResponseTime ?? item.responseTime),
        p95: toNumber(item.p95ResponseTime ?? item.p95),
        p99: Math.max(toNumber(item.p99ResponseTime ?? item.p99), toNumber(item.p95ResponseTime ?? item.avgResponseTime ?? item.responseTime))
      }));

      setMetrics(overview);
      setCpuData(normalizedHistory.map(item => ({ time: item.time, cpu: item.cpu, threshold: 80 })));
      setMemoryData(normalizedHistory.map(item => ({ time: item.time, memory: item.memory })));
      setLatencyData(normalizedHistory.map(item => ({ time: item.time, p50: item.p50, p95: item.p95, p99: item.p99 })));

      if (projects.length > 0) {
        const healthResults = await Promise.all(
          projects.slice(0, 5).map(async (project) => {
            try {
              const health = await apiClient.getServiceHealth(project._id || project.id);
              return {
                service: project.name,
                status: health?.status || 'unknown',
                uptime: `${toNumber(health?.statusCode || health?.uptime).toFixed(2)}%`
              };
            } catch {
              return {
                service: project.name,
                status: 'unknown',
                uptime: 'N/A'
              };
            }
          })
        );
        setServiceHealth(healthResults);
      } else {
        setServiceHealth([]);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics({});
      setCpuData([]);
      setMemoryData([]);
      setLatencyData([]);
      setServiceHealth([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading performance metrics...</div>;

  const avg = (values) => {
    if (!values.length) return 0;
    return values.reduce((sum, item) => sum + item, 0) / values.length;
  };

  const avgCpu = avg(cpuData.map(item => Number(item.cpu || 0))).toFixed(1);
  const avgMemory = avg(memoryData.map(item => Number(item.memory || 0))).toFixed(1);
  const latestLatency = toNumber(latencyData[latencyData.length - 1]?.p95 || metrics?.p95ResponseTime || metrics?.avgResponseTime || 0);
  const errorRate = toNumber(metrics?.errorRate || metrics?.avgErrorRate || 0).toFixed(2);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <Button onClick={fetchMetrics}>Refresh</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{avgCpu}%</p>
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">Derived from recent analytics history</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{avgMemory}%</p>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">Based on collected memory samples</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">P95 Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{latestLatency}ms</p>
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">Current P95 latency from backend analytics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{errorRate}%</p>
              <Badge className="bg-green-600">Healthy</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-2">Latest aggregated error ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* CPU Usage */}
        <Card>
          <CardHeader>
            <CardTitle>CPU Usage (Last Hour)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cpuData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
                <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
            {cpuData.length === 0 && <p className="text-xs text-gray-600 mt-2">No CPU samples available.</p>}
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage (Last Hour)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={memoryData}>
                <defs>
                  <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="memory" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMemory)" />
              </AreaChart>
            </ResponsiveContainer>
            {memoryData.length === 0 && <p className="text-xs text-gray-600 mt-2">No memory samples available.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Latency Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time Distribution (Percentiles)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="p50" stroke="#10b981" name="P50" />
              <Line type="monotone" dataKey="p95" stroke="#f59e0b" name="P95" />
              <Line type="monotone" dataKey="p99" stroke="#ef4444" name="P99" />
            </LineChart>
          </ResponsiveContainer>
          {latencyData.length === 0 && <p className="text-xs text-gray-600 mt-2">No latency samples available.</p>}
        </CardContent>
      </Card>

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {serviceHealth.length === 0 ? (
              <p className="text-sm text-gray-600">No service health data available.</p>
            ) : serviceHealth.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-green-600" />
                  <p className="font-semibold text-sm">{item.service}</p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className={item.status === 'healthy' ? 'bg-green-600' : 'bg-gray-600'}>{item.status}</Badge>
                  <p className="text-xs text-gray-600 mt-1">{item.uptime}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
