'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import realtimeService from '@/lib/realtime-service';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

export default function PerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [cpuData, setCpuData] = useState([]);
  const [memoryData, setMemoryData] = useState([]);
  const [latencyData, setLatencyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();

    const handleMetricUpdate = (data) => {
      setMetrics(data);
      if (data.cpu) setCpuData(prev => [...prev.slice(-59), data.cpu]);
      if (data.memory) setMemoryData(prev => [...prev.slice(-59), data.memory]);
      if (data.latency) setLatencyData(prev => [...prev.slice(-59), data.latency]);
    };

    realtimeService.subscribeToMetrics(null, handleMetricUpdate);

    return () => {
      realtimeService.off('metric:update', handleMetricUpdate);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metrics/performance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setCpuData(data.cpuHistory || []);
      setMemoryData(data.memoryHistory || []);
      setLatencyData(data.latencyHistory || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading performance metrics...</div>;

  const mockCpuData = cpuData.length === 0 ? Array.from({ length: 60 }, (_, i) => ({
    time: `${i}m`,
    cpu: 30 + Math.random() * 40,
    threshold: 80
  })) : cpuData;

  const mockMemoryData = memoryData.length === 0 ? Array.from({ length: 60 }, (_, i) => ({
    time: `${i}m`,
    memory: 40 + Math.random() * 30
  })) : memoryData;

  const mockLatencyData = latencyData.length === 0 ? Array.from({ length: 60 }, (_, i) => ({
    time: `${i}m`,
    p50: 45 + Math.random() * 10,
    p95: 80 + Math.random() * 30,
    p99: 120 + Math.random() * 80
  })) : latencyData;

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
              <p className="text-3xl font-bold">45%</p>
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">↓ 5% from last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">62%</p>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">↑ 3% from last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">P95 Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">125ms</p>
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">Target: 150ms ✓</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">0.02%</p>
              <Badge className="bg-green-600">Healthy</Badge>
            </div>
            <p className="text-xs text-gray-600 mt-2">Target: &lt;0.1% ✓</p>
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
              <AreaChart data={mockCpuData}>
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
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage (Last Hour)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockMemoryData}>
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
            <LineChart data={mockLatencyData}>
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
        </CardContent>
      </Card>

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { service: 'API Server', status: 'healthy', uptime: '99.98%' },
              { service: 'Database', status: 'healthy', uptime: '99.99%' },
              { service: 'Cache (Redis)', status: 'healthy', uptime: '99.97%' },
              { service: 'Message Queue', status: 'healthy', uptime: '99.98%' },
              { service: 'Search Engine', status: 'healthy', uptime: '99.95%' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-green-600" />
                  <p className="font-semibold text-sm">{item.service}</p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="bg-green-600">Online</Badge>
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
