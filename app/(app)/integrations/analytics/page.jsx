'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

export default function IntegrationAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  // Mock analytics data
  const mockAnalytics = {
    period: '7d',
    summary: {
      totalRequests: 12847,
      successfulRequests: 12634,
      failedRequests: 213,
      totalRetries: 45,
      avgResponseTime: 342,
      maxResponseTime: 8234,
      minResponseTime: 12,
      uptime: 98.34,
      p95Latency: 1245,
      p99Latency: 3456
    },
    trendData: [
      { date: '2024-12-14', requests: 1234, successful: 1210, failed: 24, retries: 5 },
      { date: '2024-12-15', requests: 1456, successful: 1423, failed: 33, retries: 7 },
      { date: '2024-12-16', requests: 1678, successful: 1645, failed: 33, retries: 8 },
      { date: '2024-12-17', requests: 1834, successful: 1801, failed: 33, retries: 6 },
      { date: '2024-12-18', requests: 2145, successful: 2098, failed: 47, retries: 9 },
      { date: '2024-12-19', requests: 2034, successful: 1987, failed: 47, retries: 8 },
      { date: '2024-12-20', requests: 2466, successful: 2370, failed: 96, retries: 6 }
    ],
    byIntegration: [
      { name: 'Slack Notifications', requests: 3456, success: 98.5, latency: 245 },
      { name: 'PagerDuty Incidents', requests: 1523, success: 99.2, latency: 512 },
      { name: 'Datadog Events', requests: 2847, success: 97.8, latency: 187 },
      { name: 'Custom Analytics', requests: 5021, success: 96.3, latency: 145 }
    ],
    failureReasons: [
      { name: 'Connection Timeout', value: 67, percentage: 31.5 },
      { name: 'Invalid Response', value: 45, percentage: 21.1 },
      { name: '5xx Server Error', value: 56, percentage: 26.3 },
      { name: 'Authentication Failed', value: 28, percentage: 13.1 },
      { name: 'Rate Limited', value: 17, percentage: 8.0 }
    ],
    byHour: [
      { hour: '00:00', requests: 145 },
      { hour: '04:00', requests: 89 },
      { hour: '08:00', requests: 1234 },
      { hour: '12:00', requests: 2456 },
      { hour: '16:00', requests: 1987 },
      { hour: '20:00', requests: 3456 },
      { hour: '23:59', requests: 234 }
    ],
    topEndpoints: [
      { name: 'https://hooks.slack.com/services/...', requests: 3456, success: 98.5 },
      { name: 'https://events.pagerduty.com/v2/enqueue', requests: 1523, success: 99.2 },
      { name: 'https://api.datadoghq.com/api/v1/events', requests: 2847, success: 97.8 },
      { name: 'https://logs.internal.company.com/v1/logs', requests: 5021, success: 96.3 }
    ],
    insights: [
      {
        title: 'Peak Hours',
        description: 'Highest traffic between 8 PM - 11 PM (28% of daily volume)',
        icon: '📊'
      },
      {
        title: 'Most Reliable',
        description: 'PagerDuty integration has 99.2% success rate with fastest recovery',
        icon: '✅'
      },
      {
        title: 'Performance Alert',
        description: 'Datadog integration latency increased 35% - investigate authentication',
        icon: '⚠️'
      },
      {
        title: 'Cost Optimization',
        description: 'Analytics Logger uses 39% of quota - consider sampling or batching',
        icon: '💰'
      }
    ]
  };

  useEffect(() => {
    setAnalytics(mockAnalytics);
    setLoading(false);
  }, []);

  const handleExportAnalytics = async () => {
    try {
      setError('');
      const response = await apiClient.exportIntegrationAnalytics({ dateRange });

      if (response.success) {
        setSuccessMessage('Analytics exported successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to export analytics');
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

  const successRate = ((analytics.summary.successfulRequests / analytics.summary.totalRequests) * 100).toFixed(1);
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Integration Analytics</h1>
          <p className="text-muted-foreground">Performance metrics and usage analytics across all integrations</p>
        </div>
        <Button onClick={handleExportAnalytics} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
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

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Time Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold">{analytics.summary.totalRequests.toLocaleString()}</p>
              <p className="text-xs text-blue-600">across all integrations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">{successRate}%</p>
              <p className="text-xs text-green-600">+1.2% vs last period</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-3xl font-bold">{analytics.summary.avgResponseTime}ms</p>
              <p className="text-xs text-gray-500">min: {analytics.summary.minResponseTime}ms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">P95 Latency</p>
              <p className="text-3xl font-bold">{analytics.summary.p95Latency}ms</p>
              <p className="text-xs text-gray-500">95th percentile</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="text-3xl font-bold text-green-600">{analytics.summary.uptime}%</p>
              <p className="text-xs text-green-600">excellent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Request Trends ({analytics.period})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="requests" stroke="#3b82f6" name="Total Requests" />
              <Line type="monotone" dataKey="successful" stroke="#10b981" name="Successful" />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.byHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Failure Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Failure Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.failureReasons}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.failureReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* By Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.byIntegration.map((integration, idx) => (
              <div key={idx} className="space-y-2 pb-4 border-b last:pb-0 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{integration.name}</h4>
                    <p className="text-xs text-muted-foreground">{integration.requests.toLocaleString()} requests</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">{integration.success}% success</Badge>
                    <p className="text-xs text-gray-500 mt-1">{integration.latency}ms avg</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${integration.success}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Top Endpoints by Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topEndpoints.map((endpoint, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{endpoint.name}</p>
                  <p className="text-xs text-muted-foreground">{endpoint.requests.toLocaleString()} requests</p>
                </div>
                <Badge className="flex-shrink-0 bg-green-100 text-green-800">
                  {endpoint.success}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Key Insights & Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.insights.map((insight, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{insight.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-muted-foreground">P50 Latency</p>
              <p className="text-2xl font-bold text-blue-600">234ms</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-muted-foreground">P99 Latency</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.summary.p99Latency}ms</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Retries</p>
              <p className="text-2xl font-bold text-orange-600">{analytics.summary.totalRetries}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Failed Requests</p>
              <p className="text-2xl font-bold text-red-600">{analytics.summary.failedRequests}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SLA Report */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">99.0% SLA Target</p>
            <p className="text-muted-foreground">Current period: {analytics.summary.uptime}% ✅ Above target</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Downtime Allowance</p>
            <p className="text-muted-foreground">43 minutes per month | Used: 11 minutes (25%)</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Recommendations</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Monitor timeout errors - implement adaptive retry delays</li>
              <li>Investigate 5xx errors from upstream services</li>
              <li>Consider load balancing for high-volume integrations</li>
              <li>Schedule maintenance during low-traffic hours (2-6 AM)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
