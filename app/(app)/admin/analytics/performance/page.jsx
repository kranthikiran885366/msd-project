'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react';

export default function PerformanceAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');

  const performanceData = [
    { time: '00:00', latency: 120, throughput: 850, cpuUsage: 45, memoryUsage: 62 },
    { time: '04:00', latency: 95, throughput: 920, cpuUsage: 38, memoryUsage: 55 },
    { time: '08:00', latency: 180, throughput: 750, cpuUsage: 72, memoryUsage: 85 },
    { time: '12:00', latency: 210, throughput: 680, cpuUsage: 88, memoryUsage: 92 },
    { time: '16:00', latency: 165, throughput: 800, cpuUsage: 65, memoryUsage: 75 },
    { time: '20:00', latency: 140, throughput: 880, cpuUsage: 52, memoryUsage: 68 },
  ];

  const resourceUtilization = [
    { resource: 'CPU', usage: 65, limit: 100, status: 'good', trend: 'up' },
    { resource: 'Memory', usage: 78, limit: 100, status: 'warning', trend: 'up' },
    { resource: 'Disk I/O', usage: 42, limit: 100, status: 'good', trend: 'down' },
    { resource: 'Network', usage: 55, limit: 100, status: 'good', trend: 'stable' },
  ];

  const endpoints = [
    { name: '/api/users', avgLatency: '142ms', p99: '450ms', errorRate: '0.1%', requests: '2.4M', status: 'healthy' },
    { name: '/api/projects', avgLatency: '98ms', p99: '280ms', errorRate: '0.05%', requests: '1.8M', status: 'healthy' },
    { name: '/api/deployments', avgLatency: '256ms', p99: '750ms', errorRate: '0.2%', requests: '890K', status: 'degraded' },
    { name: '/api/logs', avgLatency: '320ms', p99: '1200ms', errorRate: '0.3%', requests: '650K', status: 'slow' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Analytics</h1>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Latency</p>
                <p className="text-3xl font-bold">165ms</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-orange-600">
                  <TrendingUp className="w-4 h-4" /> +8% vs yesterday
                </div>
              </div>
              <Clock className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">P99 Latency</p>
              <p className="text-3xl font-bold">756ms</p>
              <p className="text-xs text-gray-500 mt-2">95th percentile</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Throughput</p>
                <p className="text-3xl font-bold">798req/s</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <TrendingDown className="w-4 h-4" /> -2% vs yesterday
                </div>
              </div>
              <Zap className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-3xl font-bold">0.16%</p>
              <p className="text-xs text-red-600 mt-2">↑ +0.05% vs yesterday</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Latency Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="latency" stroke="#f97316" name="Latency (ms)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Throughput Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="throughput" fill="#3b82f6" stroke="#1e40af" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="throughput" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resourceUtilization.map((resource) => (
                  <div key={resource.resource} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{resource.resource}</p>
                        <Badge className={
                          resource.status === 'good' ? 'bg-green-600' :
                          resource.status === 'warning' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }>
                          {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {resource.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-600" />}
                        {resource.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-600" />}
                        <span className="font-bold">{resource.usage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          resource.status === 'good' ? 'bg-green-600' :
                          resource.status === 'warning' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${resource.usage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpuUsage" stroke="#ef4444" name="CPU %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="memoryUsage" stroke="#8b5cf6" name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {endpoints.map((endpoint) => (
                  <Card key={endpoint.name} className="border">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{endpoint.name}</p>
                            <Badge className={
                              endpoint.status === 'healthy' ? 'bg-green-600' :
                              endpoint.status === 'degraded' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }>
                              {endpoint.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{endpoint.requests} requests</p>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Avg Latency</p>
                            <p className="font-bold text-lg">{endpoint.avgLatency}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">P99</p>
                            <p className="font-bold text-lg">{endpoint.p99}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Error Rate</p>
                            <p className="font-bold text-lg text-red-600">{endpoint.errorRate}</p>
                          </div>
                          <div>
                            <Button size="sm" variant="outline">Details</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Latency Distribution (Histogram)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { range: '<50ms', count: 245 },
                  { range: '50-100ms', count: 480 },
                  { range: '100-200ms', count: 620 },
                  { range: '200-500ms', count: 340 },
                  { range: '500-1000ms', count: 120 },
                  { range: '>1000ms', count: 45 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SLA Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { sla: 'P50 < 100ms', current: '98ms', status: 'met' },
                  { sla: 'P95 < 500ms', current: '456ms', status: 'met' },
                  { sla: 'P99 < 1000ms', current: '756ms', status: 'met' },
                  { sla: 'Error Rate < 0.5%', current: '0.16%', status: 'met' },
                ].map((sla, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-semibold text-sm">{sla.sla}</p>
                      <p className="text-xs text-gray-600">Current: {sla.current}</p>
                    </div>
                    <Badge className={sla.status === 'met' ? 'bg-green-600' : 'bg-red-600'}>
                      {sla.status === 'met' ? '✓ Met' : '✗ Missed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
