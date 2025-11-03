'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

export default function TeamAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dateRange, setDateRange] = useState('30d');

  // Mock analytics data
  const mockMemberGrowth = [
    { date: 'Dec 1', members: 18, active: 15 },
    { date: 'Dec 5', members: 20, active: 17 },
    { date: 'Dec 10', members: 22, active: 19 },
    { date: 'Dec 15', members: 24, active: 21 },
    { date: 'Dec 20', members: 25, active: 23 }
  ];

  const mockActivityData = [
    { name: 'Deployments', value: 245, color: '#3B82F6' },
    { name: 'Database Changes', value: 89, color: '#10B981' },
    { name: 'Config Updates', value: 156, color: '#F59E0B' },
    { name: 'Alerts Triggered', value: 34, color: '#EF4444' },
    { name: 'Reports Generated', value: 67, color: '#8B5CF6' }
  ];

  const mockRoleDistribution = [
    { name: 'Admin', value: 2, percentage: 8 },
    { name: 'Manager', value: 6, percentage: 25 },
    { name: 'Member', value: 14, percentage: 58 },
    { name: 'Viewer', value: 2, percentage: 9 }
  ];

  const mockTopUsers = [
    { name: 'John Doe', email: 'john.doe@company.com', actions: 234, deployments: 45, lastActive: '2024-12-20T15:45:00Z' },
    { name: 'Sarah Lee', email: 'sarah.lee@company.com', actions: 189, deployments: 32, lastActive: '2024-12-20T14:20:00Z' },
    { name: 'Mike Johnson', email: 'mike.johnson@company.com', actions: 156, deployments: 28, lastActive: '2024-12-20T13:00:00Z' },
    { name: 'Jane Smith', email: 'jane.smith@company.com', actions: 123, deployments: 18, lastActive: '2024-12-19T16:30:00Z' },
    { name: 'Tom Williams', email: 'tom.williams@company.com', actions: 98, deployments: 12, lastActive: '2024-12-19T10:15:00Z' }
  ];

  const mockLoginStats = [
    { date: 'Dec 16', logins: 89, failures: 3 },
    { date: 'Dec 17', logins: 92, failures: 2 },
    { date: 'Dec 18', logins: 87, failures: 5 },
    { date: 'Dec 19', logins: 95, failures: 1 },
    { date: 'Dec 20', logins: 91, failures: 3 }
  ];

  const mockUsageMetrics = [
    { metric: 'API Calls', value: 45230, limit: 100000, percentage: 45 },
    { metric: 'Database Queries', value: 12456, limit: 50000, percentage: 25 },
    { metric: 'Data Transferred', value: '245 GB', limit: '1000 GB', percentage: 25 },
    { metric: 'Deployments', value: 156, limit: 500, percentage: 31 }
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleExport = async (format) => {
    try {
      const response = await apiClient.exportTeamAnalytics(dateRange, format);
      
      if (response.success) {
        setSuccessMessage(`Team analytics exported as ${format.toUpperCase()}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to export');
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

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  const roleColors = { Admin: '#EF4444', Manager: '#3B82F6', Member: '#10B981', Viewer: '#6B7280' };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Team Analytics</h1>
          <p className="text-muted-foreground">Monitor team activity, usage, and engagement metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last year</option>
          </select>
          <Button onClick={() => handleExport('csv')} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-3xl font-bold">25</p>
              <p className="text-xs text-green-600">+3 this month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Users (7d)</p>
              <p className="text-3xl font-bold">23</p>
              <p className="text-xs text-green-600">92% engagement</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Actions (30d)</p>
              <p className="text-3xl font-bold">1,247</p>
              <p className="text-xs text-blue-600">+5% vs prev month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Login Success Rate</p>
              <p className="text-3xl font-bold">98.6%</p>
              <p className="text-xs text-green-600">12 failed attempts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Member Growth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockMemberGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="members" stroke="#3B82F6" strokeWidth={2} name="Total Members" />
              <Line type="monotone" dataKey="active" stroke="#10B981" strokeWidth={2} name="Active Members" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Distribution & Role Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity by Type (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockActivityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockActivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockRoleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockRoleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={roleColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Login Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Login Attempts & Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockLoginStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="logins" fill="#3B82F6" name="Successful Logins" />
              <Bar dataKey="failures" fill="#EF4444" name="Failed Attempts" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle>Most Active Users (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTopUsers.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-semibold">{user.actions}</p>
                    <p className="text-muted-foreground">actions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{user.deployments}</p>
                    <p className="text-muted-foreground">deployments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.lastActive).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Metrics & Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUsageMetrics.map((metric, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{metric.metric}</span>
                  <Badge variant="outline">
                    {metric.value} / {metric.limit}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition ${
                      metric.percentage > 80 ? 'bg-red-500' :
                      metric.percentage > 50 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{metric.percentage}% of limit used</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-1">Strong Engagement</p>
            <p className="text-sm text-blue-800">92% of team members are active within the last 7 days - excellent engagement!</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">Growing Team</p>
            <p className="text-sm text-green-800">Team has grown by 3 members this month. Ensure onboarding resources are updated.</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-sm font-semibold text-orange-900 mb-1">Monitor API Usage</p>
            <p className="text-sm text-orange-800">API calls are at 45% of monthly limit. Plan accordingly for peak periods.</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">High Login Security</p>
            <p className="text-sm text-green-800">98.6% login success rate indicates strong security posture with minimal unauthorized attempts.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
