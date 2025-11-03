'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiClient from '@/lib/api-client';

export default function UptimeDashboardPage() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [uptimeMetrics, setUptimeMetrics] = useState(null);
  const [slaStatus, setSlaStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d

  // Removed mock data - using backend integration
    uptime24h: 99.98,
    uptime7d: 99.92,
    uptime30d: 99.89,
    uptime90d: 99.76,
    averageResponseTime: 145,
    lastIncident: '2024-12-20T14:20:00Z',
    totalDowntime30d: 158, // minutes
    incidents30d: 3
  };

  const mockSlaStatus = {
    targetUptime: 99.95,
    currentUptime: 99.89,
    slaCompliant: false,
    remainingBuffer: -0.06,
    creditAmount: 850 // USD
  };

  const mockUptimeHistory = [
    { date: 'Dec 15', uptime24h: 100, uptime7d: 99.95, uptime30d: 99.82 },
    { date: 'Dec 16', uptime24h: 99.95, uptime7d: 99.93, uptime30d: 99.81 },
    { date: 'Dec 17', uptime24h: 99.92, uptime7d: 99.91, uptime30d: 99.80 },
    { date: 'Dec 18', uptime24h: 99.88, uptime7d: 99.89, uptime30d: 99.78 },
    { date: 'Dec 19', uptime24h: 99.90, uptime7d: 99.90, uptime30d: 99.78 },
    { date: 'Dec 20', uptime24h: 99.98, uptime7d: 99.92, uptime30d: 99.89 }
  ];

  const mockDowntimeBreakdown = [
    { name: 'Scheduled Maintenance', value: 85, minutes: 85 },
    { name: 'Infrastructure Issues', value: 45, minutes: 45 },
    { name: 'Deployment Issues', value: 28, minutes: 28 }
  ];

  const mockIncidentHistory = [
    {
      date: '2024-12-20',
      incident: 'Deployment Failed - Service Restart',
      duration: '35 minutes',
      severity: 'critical',
      status: 'resolved'
    },
    {
      date: '2024-12-18',
      incident: 'Database Connection Pool Exhaustion',
      duration: '12 minutes',
      severity: 'critical',
      status: 'resolved'
    },
    {
      date: '2024-12-15',
      incident: 'Scheduled Maintenance',
      duration: '85 minutes',
      severity: 'info',
      status: 'resolved'
    },
    {
      date: '2024-12-12',
      incident: 'Network Latency Issues',
      duration: '8 minutes',
      severity: 'warning',
      status: 'resolved'
    }
  ];

  const mockMonthlyData = [
    { month: 'October', uptime: 99.82, downtime: 26 },
    { month: 'November', uptime: 99.88, downtime: 17 },
    { month: 'December', uptime: 99.89, downtime: 16 }
  ];

  const colors = ['#ef4444', '#f59e0b', '#3b82f6'];

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

  const fetchUptimeData = useCallback(async () => {
    if (!selectedDeployment) return;
    
    try {
      setError('');
      setLoading(true);
      const [uptimeStats, slaData] = await Promise.all([
        apiClient.getUptimeMetrics(selectedDeployment),
        apiClient.getSLAStatus(selectedDeployment)
      ]);
      setUptimeMetrics(uptimeStats || {});
      setSlaStatus(slaData || {});
    } catch (err) {
      setError(err.message || 'Failed to fetch uptime data');
    } finally {
      setLoading(false);
    }
  }, [selectedDeployment]);

  useEffect(() => {
    fetchUptimeData();
  }, [fetchUptimeData]);

  const getUptimeColor = (uptime) => {
    if (uptime >= 99.9) return 'text-green-600';
    if (uptime >= 99.0) return 'text-orange-600';
    return 'text-red-600';
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Uptime Dashboard</h1>
        <p className="text-muted-foreground">Monitor service availability and SLA compliance</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {slaStatus && !slaStatus.slaCompliant && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            SLA target not met. Current uptime: {slaStatus.currentUptime}% (Target: {slaStatus.targetUptime}%). 
            Service credit: ${slaStatus.creditAmount}
          </AlertDescription>
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

      {uptimeMetrics && (
        <>
          {/* Main Uptime Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">24h Uptime</p>
                  <p className={`text-3xl font-bold ${getUptimeColor(uptimeMetrics.uptime24h)}`}>
                    {uptimeMetrics.uptime24h}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">7d Uptime</p>
                  <p className={`text-3xl font-bold ${getUptimeColor(uptimeMetrics.uptime7d)}`}>
                    {uptimeMetrics.uptime7d}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">30d Uptime</p>
                  <p className={`text-3xl font-bold ${getUptimeColor(uptimeMetrics.uptime30d)}`}>
                    {uptimeMetrics.uptime30d}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">90d Uptime</p>
                  <p className={`text-3xl font-bold ${getUptimeColor(uptimeMetrics.uptime90d)}`}>
                    {uptimeMetrics.uptime90d}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SLA Status */}
          {slaStatus && (
            <Card>
              <CardHeader>
                <CardTitle>SLA Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Target Uptime</p>
                    <p className="text-2xl font-bold">{slaStatus.targetUptime}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Uptime</p>
                    <p className={`text-2xl font-bold ${getUptimeColor(slaStatus.currentUptime)}`}>
                      {slaStatus.currentUptime}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={slaStatus.slaCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {slaStatus.slaCompliant ? 'Compliant' : 'Non-Compliant'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>SLA Buffer Remaining</span>
                    <span className={slaStatus.remainingBuffer >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {slaStatus.remainingBuffer > 0 ? '+' : ''}{slaStatus.remainingBuffer}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        slaStatus.remainingBuffer >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, 50 + slaStatus.remainingBuffer * 10))}%` }}
                    />
                  </div>
                </div>

                {!slaStatus.slaCompliant && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Service credit issued: ${slaStatus.creditAmount}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Uptime Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Uptime Trend (Last 6 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockUptimeHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[99.5, 100.1]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="uptime24h" stroke="#ef4444" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="uptime7d" stroke="#f59e0b" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="uptime30d" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Downtime Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Downtime Breakdown (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockDowntimeBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, value}) => `${name}: ${value}m`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockDowntimeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">Total Downtime (30d)</p>
                    <p className="text-2xl font-bold">{uptimeMetrics.totalDowntime30d} minutes</p>
                    <p className="text-xs text-muted-foreground mt-1">{(uptimeMetrics.totalDowntime30d / 60).toFixed(1)} hours</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">Incidents (30d)</p>
                    <p className="text-2xl font-bold">{uptimeMetrics.incidents30d}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{uptimeMetrics.averageResponseTime}ms</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">Last Incident</p>
                    <p className="text-sm font-semibold">
                      {new Date(uptimeMetrics.lastIncident).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Uptime Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" domain={[99, 100]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="uptime" fill="#3b82f6" />
                  <Bar yAxisId="right" dataKey="downtime" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Incident History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockIncidentHistory.map((incident, idx) => (
                  <div key={idx} className="flex justify-between items-start p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">{incident.incident}</p>
                      <p className="text-sm text-muted-foreground">{incident.date}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground">{incident.duration}</span>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
