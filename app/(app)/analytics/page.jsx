'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Users, Zap, Activity, Download, RefreshCw, Filter } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function AnalyticsOverviewPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('7'); // days
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setError('');
      setLoading(true);

      const [overviewRes, historyRes] = await Promise.all([
        apiClient.getAnalyticsOverview(),
        apiClient.getAnalyticsHistory({ days: parseInt(timeRange) })
      ]);

      if (overviewRes.success) {
        setAnalyticsData(overviewRes.data);
      } else {
        setError(overviewRes.error || 'Failed to fetch analytics');
      }

      if (historyRes.success) {
        setMetricsHistory(historyRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIndicator = (current, previous) => {
    if (!previous) return null;
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: percentChange,
      isPositive: percentChange >= 0
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your platform activity and performance
          </p>
        </div>
        <Button
          onClick={fetchAnalyticsData}
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
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Deployments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>Total Deployments</span>
                <Zap className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{analyticsData.totalDeployments}</p>
                {analyticsData.previousDeployments && (
                  <p className={`text-sm font-medium ${
                    getTrendIndicator(analyticsData.totalDeployments, analyticsData.previousDeployments)?.isPositive
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {getTrendIndicator(analyticsData.totalDeployments, analyticsData.previousDeployments)?.isPositive ? '↑' : '↓'}
                    {Math.abs(getTrendIndicator(analyticsData.totalDeployments, analyticsData.previousDeployments)?.value || 0).toFixed(1)}%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>Active Users</span>
                <Users className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{analyticsData.activeUsers}</p>
                {analyticsData.previousActiveUsers && (
                  <p className={`text-sm font-medium ${
                    getTrendIndicator(analyticsData.activeUsers, analyticsData.previousActiveUsers)?.isPositive
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {getTrendIndicator(analyticsData.activeUsers, analyticsData.previousActiveUsers)?.isPositive ? '↑' : '↓'}
                    {Math.abs(getTrendIndicator(analyticsData.activeUsers, analyticsData.previousActiveUsers)?.value || 0).toFixed(1)}%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>Success Rate</span>
                <TrendingUp className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{analyticsData.successRate.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${analyticsData.successRate}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Calls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>API Calls</span>
                <Activity className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{(analyticsData.apiCalls / 1000).toFixed(1)}K</p>
                {analyticsData.previousApiCalls && (
                  <p className={`text-sm font-medium ${
                    getTrendIndicator(analyticsData.apiCalls, analyticsData.previousApiCalls)?.isPositive
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {getTrendIndicator(analyticsData.apiCalls, analyticsData.previousApiCalls)?.isPositive ? '↑' : '↓'}
                    {Math.abs(getTrendIndicator(analyticsData.apiCalls, analyticsData.previousApiCalls)?.value || 0).toFixed(1)}%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Range Selector */}
      <div className="flex gap-2">
        <Button
          onClick={() => setTimeRange('7')}
          variant={timeRange === '7' ? 'default' : 'outline'}
          size="sm"
        >
          7 Days
        </Button>
        <Button
          onClick={() => setTimeRange('30')}
          variant={timeRange === '30' ? 'default' : 'outline'}
          size="sm"
        >
          30 Days
        </Button>
        <Button
          onClick={() => setTimeRange('90')}
          variant={timeRange === '90' ? 'default' : 'outline'}
          size="sm"
        >
          90 Days
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deployments Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Deployments Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="deployments"
                    stroke="#3b82f6"
                    fill="#3b82f685"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Deployment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Status</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Successful', value: analyticsData.successfulDeployments },
                      { name: 'Failed', value: analyticsData.failedDeployments },
                      { name: 'In Progress', value: analyticsData.inProgressDeployments }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* API Response Times */}
        <Card>
          <CardHeader>
            <CardTitle>API Response Times (ms)</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}ms`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    name="Average"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="p95ResponseTime"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="P95"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      {analyticsData && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Avg Response Time</p>
                <p className="text-2xl font-bold">{analyticsData.avgResponseTime}ms</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">P95 Response Time</p>
                <p className="text-2xl font-bold">{analyticsData.p95ResponseTime}ms</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Uptime</p>
                <p className="text-2xl font-bold">{analyticsData.uptime.toFixed(2)}%</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Error Rate</p>
                <p className="text-2xl font-bold">{analyticsData.errorRate.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export as JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
