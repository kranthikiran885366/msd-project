'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, Users, Zap, Eye, ArrowRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
  };

  const normalizeUser = (user) => {
    if (!user) return 'System';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') return user.name || user.email || user._id || 'System';
    return 'System';
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewResponse, historyResponse, auditResponse, projectsResponse] = await Promise.all([
        apiClient.getAnalyticsOverview(),
        apiClient.getAnalyticsHistory({ days: 30 }),
        apiClient.getAuditLogs({ limit: 20 }),
        apiClient.getProjects()
      ]);

      const overview = overviewResponse?.data || overviewResponse || {};
      const history = historyResponse?.data || historyResponse || [];
      const auditLogs = auditResponse?.logs || [];
      const projects = projectsResponse || [];

      const chartData = history.slice(-6).map((item, index) => ({
        month: item.date || `Point ${index + 1}`,
        deployments: toNumber(item.deployments),
        errors: toNumber(item.errors ?? item.failedDeployments ?? item.errorRate),
        users: toNumber(item.activeUsers)
      }));

      const recentActions = auditLogs.map((log) => ({
        id: log._id || log.id,
        action: log.action || 'UNKNOWN_ACTION',
        user: normalizeUser(log.userId),
        time: log.createdAt || log.timestamp,
        type: String(log.action || '').includes('DELETED') ? 'delete' : String(log.action || '').includes('UPDATED') ? 'modify' : 'create'
      })).sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

      const teamActivity = Object.values(
        recentActions.reduce((acc, action) => {
          const user = action.user || 'Unknown';
          if (!acc[user]) {
            acc[user] = { team: user, activityCount: 0, latestTime: action.time };
          }
          acc[user].activityCount += 1;
          if (new Date(action.time || 0) > new Date(acc[user].latestTime || 0)) {
            acc[user].latestTime = action.time;
          }
          return acc;
        }, {})
      ).slice(0, 3).map((item) => ({
        team: item.team,
        activity: `${item.activityCount} recent admin actions`,
        time: formatDateTime(item.latestTime)
      }));

      setDashboardData({
        stats: {
          totalUsers: overview.activeUsers || 0,
          activeDeployments: overview.inProgressDeployments || 0,
          totalProjects: projects.length
        },
        systemMetrics: {
          uptime: `${Number(overview.uptime || 0).toFixed(2)}%`,
          errorRate: `${Number(overview.errorRate || 0).toFixed(2)}%`
        },
        chartData,
        recentActions,
        teamActivity
      });
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const adminLinks = [
    { title: 'System Health', desc: 'Monitor system uptime and performance', href: '/admin/monitoring', icon: '📊' },
    { title: 'API & SDKs', desc: 'Manage API keys and SDK documentation', href: '/admin/api', icon: '🔌' },
    { title: 'Team Management', desc: 'Manage users and permissions', href: '/admin/team', icon: '👥' },
    { title: 'Audit Logs', desc: 'View compliance and audit logs', href: '/admin/audit', icon: '📋' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  const { stats, systemMetrics, chartData = [], recentActions = [], teamActivity = [] } = dashboardData || {};

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Administration</h1>
        <p className="text-gray-600">Manage system settings, users, and monitoring</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  +12% this month
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Deployments</p>
                <p className="text-3xl font-bold">{stats?.activeDeployments || 0}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  +22% vs last month
                </div>
              </div>
              <Zap className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Uptime</p>
                <p className="text-3xl font-bold">{systemMetrics?.uptime || '99.98%'}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <span>⬆ Last 7 days</span>
                </div>
              </div>
              <Eye className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-3xl font-bold">{systemMetrics?.errorRate || '0.02%'}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  -5% vs last week
                </div>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Deployments Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="deployments" fill="#3b82f6" name="Deployments" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="errors" stroke="#ef4444" name="Errors" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* User Growth */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#10b981" name="Active Users" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActions.length === 0 ? (
                <p className="text-sm text-gray-600">No recent alerts or actions available.</p>
              ) : (
                recentActions.slice(0, 3).map((action) => (
                  <div key={action.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{action.action}</p>
                      <p className="text-xs text-gray-600">{action.user} • {formatDateTime(action.time)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {adminLinks.map((link) => (
              <Card key={link.href} className="cursor-pointer hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-3xl mb-2">{link.icon}</div>
                      <p className="font-semibold text-lg">{link.title}</p>
                      <p className="text-sm text-gray-600 mt-2">{link.desc}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Useful Links */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation & Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { title: 'Admin Guide', desc: 'Complete documentation for administrators' },
                  { title: 'API Reference', desc: 'Full API documentation and examples' },
                  { title: 'Security Guidelines', desc: 'Security best practices and policies' },
                  { title: 'Support Center', desc: 'Get help from our support team' },
                ].map((doc) => (
                  <a key={doc.title} href="#" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border">
                    <div>
                      <p className="font-semibold text-sm">{doc.title}</p>
                      <p className="text-xs text-gray-600">{doc.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActions.length === 0 ? (
                  <p className="text-sm text-gray-600">No recent admin activity available.</p>
                ) : recentActions.map((item) => (
                  <Card key={item.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              item.type === 'delete' ? 'destructive' :
                              item.type === 'modify' ? 'secondary' :
                              'default'
                            }>
                              {item.action}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-semibold">{item.user}</span> {formatDateTime(item.time)}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Team Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamActivity.length === 0 ? (
                  <p className="text-sm text-gray-600">No team activity available.</p>
                ) : teamActivity.map((item) => (
                  <div key={item.team} className="flex items-start justify-between p-3 border rounded">
                    <div>
                      <p className="font-semibold text-sm">{item.team}</p>
                      <p className="text-xs text-gray-600">{item.activity} • {item.time}</p>
                    </div>
                    <Button size="sm" variant="outline">Review</Button>
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
