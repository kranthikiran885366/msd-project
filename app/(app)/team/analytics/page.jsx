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
  const [data, setData] = useState({
    memberGrowth: [],
    activityData: [],
    roleDistribution: [],
    topUsers: [],
    loginStats: [],
    usageMetrics: [],
    summary: {
      totalMembers: 0,
      activeUsers: 0,
      totalActions: 0,
      loginSuccessRate: 0,
      failedLogins: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const projects = await apiClient.getProjects();
        const projectId = projects?.[0]?._id || projects?.[0]?.id;

        if (!projectId) {
          setData({
            memberGrowth: [],
            activityData: [],
            roleDistribution: [],
            topUsers: [],
            loginStats: [],
            usageMetrics: [],
            summary: {
              totalMembers: 0,
              activeUsers: 0,
              totalActions: 0,
              loginSuccessRate: 0,
              failedLogins: 0,
            },
          });
          return;
        }

        const [membersResponse, activityResponse, deploymentsResponse, nodesResponse] = await Promise.all([
          apiClient.getTeamMembers(projectId),
          apiClient.getTeamActivityLogs({ projectId, limit: 200 }),
          apiClient.getAllDeployments().catch(() => []),
          apiClient.getNodeStats().catch(() => null),
        ]);

        const members = Array.isArray(membersResponse?.members) ? membersResponse.members : Array.isArray(membersResponse) ? membersResponse : [];
        const activities = Array.isArray(activityResponse?.logs) ? activityResponse.logs : Array.isArray(activityResponse) ? activityResponse : [];
        const deployments = Array.isArray(deploymentsResponse) ? deploymentsResponse : [];
        const nodeStats = nodesResponse || {};

        setData(buildAnalyticsData(members, activities, deployments, nodeStats));
      } catch (err) {
        setError(err.message || 'Failed to load team analytics');
        setData({
          memberGrowth: [],
          activityData: [],
          roleDistribution: [],
          topUsers: [],
          loginStats: [],
          usageMetrics: [],
          summary: {
            totalMembers: 0,
            activeUsers: 0,
            totalActions: 0,
            loginSuccessRate: 0,
            failedLogins: 0,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const handleExport = async (format) => {
    try {
      const rows = [
        ['Metric', 'Value'],
        ['Date Range', dateRange],
        ['Total Members', data.summary.totalMembers],
        ['Active Users', data.summary.activeUsers],
        ['Total Actions', data.summary.totalActions],
        ['Login Success Rate', `${data.summary.loginSuccessRate}%`],
      ];

      const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `team-analytics-${dateRange}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      setSuccessMessage(`Team analytics exported as ${format.toUpperCase()}`);
      setTimeout(() => setSuccessMessage(''), 3000);
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

  const buildAnalyticsData = (members, activities, deployments, nodeStats) => {
    const roleDistributionMap = members.reduce((acc, member) => {
      const role = member.role || 'Member';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const totalMembers = members.length;
    const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeUsers = new Set(activities.filter((activity) => new Date(activity.createdAt || activity.timestamp || 0).getTime() >= recentThreshold).map((activity) => String(activity.userId?._id || activity.userId || activity.userId?.email || activity.userId))).size;

    const memberGrowth = buildMemberGrowthSeries(members);
    const activityData = buildActivitySeries(activities, deployments);
    const loginStats = buildLoginSeries(activities);
    const topUsers = buildTopUsers(members, activities);
    const roleDistribution = Object.entries(roleDistributionMap).map(([name, value]) => ({
      name,
      value,
      percentage: totalMembers ? Math.round((value / totalMembers) * 100) : 0,
    }));

    const deploymentCount = deployments.length;
    const failedDeployments = deployments.filter((deployment) => ['failed', 'error'].includes(String(deployment.status || '').toLowerCase())).length;
    const successRate = deploymentCount ? Math.round(((deploymentCount - failedDeployments) / deploymentCount) * 100) : 0;
    const usageMetrics = buildUsageMetrics(nodeStats, deploymentCount, failedDeployments);

    return {
      memberGrowth,
      activityData,
      roleDistribution,
      topUsers,
      loginStats,
      usageMetrics,
      summary: {
        totalMembers,
        activeUsers,
        totalActions: activities.length,
        loginSuccessRate: successRate,
        failedLogins: loginStats.reduce((total, item) => total + item.failures, 0),
      },
    };
  };

  const buildMemberGrowthSeries = (members) => {
    const sortedMembers = [...members].filter((member) => member.createdAt).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const buckets = new Map();

    sortedMembers.forEach((member) => {
      const key = new Date(member.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    let cumulative = 0;
    return Array.from(buckets.entries()).map(([date, increment]) => {
      cumulative += increment;
      return { date, members: cumulative, active: Math.max(cumulative - 1, 0) };
    });
  };

  const buildActivitySeries = (activities, deployments) => {
    const typeCounts = new Map();
    activities.forEach((activity) => {
      const type = normalizeActivityType(activity.action, activity.resourceType);
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    const deploymentCount = deployments.length;
    const activityTypes = [
      { name: 'Deployments', value: deploymentCount, color: '#3B82F6' },
      { name: 'Configuration Updates', value: typeCounts.get('config_change') || 0, color: '#F59E0B' },
      { name: 'Alerts Triggered', value: typeCounts.get('alert_triggered') || 0, color: '#EF4444' },
      { name: 'Logins', value: typeCounts.get('login') || 0, color: '#10B981' },
      { name: 'Logouts', value: typeCounts.get('logout') || 0, color: '#8B5CF6' },
    ];

    return activityTypes.filter((entry) => entry.value > 0);
  };

  const buildLoginSeries = (activities) => {
    const recent = activities.filter((activity) => {
      const timestamp = new Date(activity.createdAt || activity.timestamp || 0).getTime();
      return Number.isFinite(timestamp);
    });

    const buckets = new Map();
    recent.forEach((activity) => {
      const date = new Date(activity.createdAt || activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const current = buckets.get(date) || { date, logins: 0, failures: 0 };
      if (normalizeActivityType(activity.action, activity.resourceType) === 'login') {
        current.logins += 1;
      }
      if (String(activity.action || '').toUpperCase().includes('FAILED')) {
        current.failures += 1;
      }
      buckets.set(date, current);
    });

    return Array.from(buckets.values()).slice(-7);
  };

  const buildTopUsers = (members, activities) => {
    const counts = new Map();

    activities.forEach((activity) => {
      const key = String(activity.userId?._id || activity.userId || activity.userId?.email || activity.userId);
      const entry = counts.get(key) || { actions: 0, lastActive: activity.createdAt || activity.timestamp, member: activity.userId };
      entry.actions += 1;
      entry.lastActive = activity.createdAt || activity.timestamp || entry.lastActive;
      counts.set(key, entry);
    });

    return members
      .map((member) => {
        const entry = counts.get(String(member.userId?._id || member.userId || member._id)) || { actions: 0, lastActive: member.createdAt };
        return {
          name: member.userId?.name || member.name || member.email || 'Unknown user',
          email: member.userId?.email || member.email || '',
          actions: entry.actions,
          deployments: activities.filter((activity) => String(activity.userId?._id || activity.userId || activity.userId?.email || activity.userId) === String(member.userId?._id || member.userId || member._id) && normalizeActivityType(activity.action, activity.resourceType) === 'deployment_created').length,
          lastActive: entry.lastActive || member.createdAt,
        };
      })
      .sort((a, b) => b.actions - a.actions)
      .slice(0, 5);
  };

  const buildUsageMetrics = (nodeStats, deploymentCount, failedDeployments) => {
    const cpuUsage = Math.round((nodeStats?.cpuUsage || nodeStats?.cpu || 0) * 100) || 0;
    const memoryUsage = Math.round((nodeStats?.memoryUsage || nodeStats?.memory || 0) * 100) || 0;
    const dataTransferred = nodeStats?.bandwidth || nodeStats?.dataTransferred || 'N/A';

    return [
      { metric: 'Node CPU Usage', value: cpuUsage, limit: 100, percentage: Math.min(cpuUsage, 100) },
      { metric: 'Node Memory Usage', value: memoryUsage, limit: 100, percentage: Math.min(memoryUsage, 100) },
      { metric: 'Data Transferred', value: dataTransferred, limit: 'N/A', percentage: 0 },
      { metric: 'Deployments', value: deploymentCount, limit: Math.max(deploymentCount + failedDeployments, 1), percentage: deploymentCount ? Math.round((deploymentCount / Math.max(deploymentCount + failedDeployments, 1)) * 100) : 0 },
    ];
  };

  const normalizeActivityType = (action, resourceType) => {
    const normalizedAction = String(action || '').toUpperCase();
    const normalizedResource = String(resourceType || '').toUpperCase();

    if (normalizedAction.includes('LOGIN')) return 'login';
    if (normalizedAction.includes('LOGOUT')) return 'logout';
    if (normalizedAction.includes('TEAM_MEMBER') || normalizedAction.includes('TEAM_INVITATION') || normalizedAction.includes('ROLE') || normalizedAction.includes('PERMISSION')) return 'config_change';
    if (normalizedAction.includes('WEBHOOK')) return 'deployment_created';
    if (normalizedResource.includes('DEPLOY')) return 'deployment_created';
    if (normalizedAction.includes('BACKUP')) return 'database_backup';
    if (normalizedAction.includes('ALERT')) return 'alert_triggered';
    if (normalizedAction.includes('REPORT')) return 'report_generated';
    return 'config_change';
  };

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
              <p className="text-3xl font-bold">{data.summary.totalMembers}</p>
              <p className="text-xs text-green-600">Live from backend</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Users (7d)</p>
              <p className="text-3xl font-bold">{data.summary.activeUsers}</p>
              <p className="text-xs text-green-600">Based on recent activity</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Actions (30d)</p>
              <p className="text-3xl font-bold">{data.summary.totalActions}</p>
              <p className="text-xs text-blue-600">Tracked audit actions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Login Success Rate</p>
              <p className="text-3xl font-bold">{data.summary.loginSuccessRate}%</p>
              <p className="text-xs text-green-600">{data.summary.failedLogins} failed attempts</p>
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
            <LineChart data={data.memberGrowth}>
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
                  data={data.activityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.activityData.map((entry, index) => (
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
                  data={data.roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.roleDistribution.map((entry, index) => (
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
            <BarChart data={data.loginStats}>
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
            {data.topUsers.map((user, idx) => (
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
            {data.usageMetrics.map((metric, idx) => (
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
            <p className="text-sm text-blue-800">Recent activity is coming from live backend audit logs, so engagement reflects real usage.</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">Growing Team</p>
            <p className="text-sm text-green-800">Member growth is derived from the current team roster and creation timestamps.</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-sm font-semibold text-orange-900 mb-1">Monitor API Usage</p>
            <p className="text-sm text-orange-800">Node usage and deployment volume are read from backend metrics and deployment history.</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">High Login Security</p>
            <p className="text-sm text-green-800">Login success rate is calculated from the backend audit log stream.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
