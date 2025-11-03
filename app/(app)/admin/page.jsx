'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, Users, Zap, Eye, ArrowRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
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

  // Mock chart data - this should come from API in real implementation
  const chartData = [
    { month: 'Jan', deployments: 45, errors: 2, users: 120 },
    { month: 'Feb', deployments: 52, errors: 1, users: 135 },
    { month: 'Mar', deployments: 48, errors: 3, users: 142 },
    { month: 'Apr', deployments: 61, errors: 1, users: 158 },
    { month: 'May', deployments: 55, errors: 2, users: 167 },
    { month: 'Jun', deployments: 67, errors: 1, users: 184 },
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

  const { stats, systemMetrics, recentDeployments } = dashboardData || {};

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
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">High Memory Usage</p>
                  <p className="text-xs text-gray-600">Storage service memory at 85%. Consider scaling up.</p>
                </div>
                <Button size="sm" variant="outline">Review</Button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Scheduled Maintenance</p>
                  <p className="text-xs text-gray-600">Database backup scheduled for tonight at 2:00 AM UTC.</p>
                </div>
                <Button size="sm" variant="outline">Details</Button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">All Systems Healthy</p>
                  <p className="text-xs text-gray-600">All services are operating within normal parameters.</p>
                </div>
              </div>
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
                {[
                  { action: 'Created new project', user: 'Sarah Chen', time: '2 hours ago', type: 'create' },
                  { action: 'Modified API key permissions', user: 'Alex Rodriguez', time: '4 hours ago', type: 'modify' },
                  { action: 'Added team member', user: 'Jordan Kim', time: '1 day ago', type: 'create' },
                  { action: 'Deleted deprecated API key', user: 'Sarah Chen', time: '2 days ago', type: 'delete' },
                  { action: 'Updated security policy', user: 'Admin', time: '3 days ago', type: 'modify' },
                ].map((item, idx) => (
                  <Card key={idx} className="border">
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
                            <span className="font-semibold">{item.user}</span> {item.time}
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
                {[
                  { team: 'Platform Engineers', activity: 'Created 5 deployments', time: '2 hours ago' },
                  { team: 'DevOps Team', activity: 'Updated 3 projects', time: '6 hours ago' },
                  { team: 'Security Team', activity: 'Reviewed access logs', time: '1 day ago' },
                ].map((item) => (
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
