'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Filter, RefreshCw, Download, Globe, LogIn, LogOut, Clock } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function TeamActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [filters, setFilters] = useState({
    user: '',
    activityType: 'all',
    dateRange: '7d',
    searchQuery: ''
  });

  useEffect(() => {
    const loadActivityLogs = async () => {
      try {
        setLoading(true);
        setError('');

        const projects = await apiClient.getProjects();
        const projectId = projects?.[0]?._id || projects?.[0]?.id;

        if (!projectId) {
          setActivities([]);
          return;
        }

        const response = await apiClient.getTeamActivityLogs({ projectId, limit: 100 });
        const normalized = Array.isArray(response) ? response.map(normalizeActivityLog) : [];
        setActivities(normalized);
      } catch (err) {
        setError(err.message || 'Failed to load activity logs');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivityLogs();
  }, []);

  const normalizeActivityLog = (activity) => {
    const metadata = activity?.metadata && typeof activity.metadata === 'object' ? activity.metadata : {};
    const type = normalizeActivityType(activity?.action, activity?.resourceType);

    return {
      id: activity?._id || activity?.id || `${activity?.action || 'activity'}-${activity?.createdAt || Date.now()}`,
      timestamp: activity?.createdAt || activity?.timestamp || new Date().toISOString(),
      user: {
        id: activity?.userId?._id || activity?.userId || 'unknown',
        name: activity?.userId?.name || activity?.userId?.email || 'Unknown user',
        email: activity?.userId?.email || ''
      },
      type,
      title: formatActivityTitle(type, activity?.resourceType, activity?.action),
      description: formatActivityDescription(activity?.action, activity?.resourceType, metadata),
      metadata,
      ipAddress: activity?.ipAddress || 'Unknown',
      userAgent: activity?.userAgent || 'Unknown'
    };
  };

  const normalizeActivityType = (action, resourceType) => {
    const normalizedAction = String(action || '').toUpperCase();
    const normalizedResource = String(resourceType || '').toUpperCase();

    if (normalizedAction.includes('LOGIN')) return 'login';
    if (normalizedAction.includes('LOGOUT')) return 'logout';
    if (normalizedAction.includes('TEAM_INVITATION')) return 'config_change';
    if (normalizedAction.includes('TEAM_MEMBER')) return 'config_change';
    if (normalizedAction.includes('WEBHOOK')) return 'deployment_created';
    if (normalizedAction.includes('BACKUP')) return 'database_backup';
    if (normalizedAction.includes('ROLE') || normalizedAction.includes('PERMISSION')) return 'config_change';
    if (normalizedResource.includes('DEPLOY')) return 'deployment_created';
    if (normalizedAction.includes('ALERT')) return 'alert_triggered';
    return 'config_change';
  };

  const formatActivityTitle = (type, resourceType, action) => {
    const typeTitles = {
      login: 'User Login',
      logout: 'User Logout',
      deployment_created: 'Deployment Activity',
      database_backup: 'Backup Activity',
      config_change: 'Configuration Updated',
      alert_triggered: 'Alert Triggered',
      api_key_generated: 'API Key Activity',
      scaling_triggered: 'Scaling Activity',
      report_generated: 'Report Activity',
      incident_resolved: 'Incident Resolved'
    };

    return typeTitles[type] || `${resourceType || 'Resource'} ${action || 'Activity'}`;
  };

  const formatActivityDescription = (action, resourceType, metadata) => {
    const details = Object.entries(metadata || {})
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const base = `${action || 'Activity'} on ${resourceType || 'resource'}`;
    return details ? `${base} (${details})` : base;
  };

  const handleFilterChange = (field, value) => {
    setFilters({...filters, [field]: value});
  };

  const applyFilters = () => {
    let filtered = activities;

    if (filters.user) {
      filtered = filtered.filter(activity =>
        activity.user.name.toLowerCase().includes(filters.user.toLowerCase()) ||
        activity.user.email.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    if (filters.activityType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filters.activityType);
    }

    if (filters.searchQuery) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Date range filtering
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let fromDate;

      switch (filters.dateRange) {
        case '24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(0);
      }

      filtered = filtered.filter(activity => new Date(activity.timestamp) >= fromDate);
    }

    return filtered;
  };

  const buildCsv = (rows) => {
    const columns = ['timestamp', 'user', 'type', 'title', 'description', 'ipAddress', 'userAgent'];
    const escapeValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    return [
      columns.join(','),
      ...rows.map((row) => columns.map((column) => {
        if (column === 'user') {
          return escapeValue(`${row.user.name} <${row.user.email || 'unknown'}>`);
        }

        return escapeValue(row[column]);
      }).join(','))
    ].join('\n');
  };

  const handleExport = async (format) => {
    const filtered = applyFilters();

    if (filtered.length === 0) {
      setError('No activity data available to export');
      return;
    }

    try {
      if (format === 'csv') {
        const blob = new Blob([buildCsv(filtered)], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `team-activity-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        setSuccessMessage('Activity data exported as CSV');
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        setError('Unable to open print dialog');
        return;
      }

      const rows = filtered.map((activity) => `
        <tr>
          <td>${new Date(activity.timestamp).toLocaleString()}</td>
          <td>${activity.user.name}${activity.user.email ? ` (${activity.user.email})` : ''}</td>
          <td>${activity.type.replace(/_/g, ' ')}</td>
          <td>${activity.title}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Team Activity</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
              h1 { margin: 0 0 16px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
              th { background: #f5f5f5; }
            </style>
          </head>
          <body>
            <h1>Team Activity</h1>
            <table>
              <thead>
                <tr><th>Timestamp</th><th>User</th><th>Type</th><th>Title</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setSuccessMessage('Activity preview opened for PDF export');
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

  const filteredActivities = applyFilters();

  const activityTypeColors = {
    login: 'bg-green-100 text-green-800',
    logout: 'bg-gray-100 text-gray-800',
    deployment_created: 'bg-blue-100 text-blue-800',
    database_backup: 'bg-yellow-100 text-yellow-800',
    config_change: 'bg-purple-100 text-purple-800',
    alert_triggered: 'bg-red-100 text-red-800',
    api_key_generated: 'bg-indigo-100 text-indigo-800',
    scaling_triggered: 'bg-orange-100 text-orange-800',
    report_generated: 'bg-pink-100 text-pink-800',
    incident_resolved: 'bg-teal-100 text-teal-800'
  };

  const activityTypeIcons = {
    login: <LogIn className="w-4 h-4" />,
    logout: <LogOut className="w-4 h-4" />,
    deployment_created: <Globe className="w-4 h-4" />,
    database_backup: <RefreshCw className="w-4 h-4" />,
    config_change: <Clock className="w-4 h-4" />,
    alert_triggered: <AlertCircle className="w-4 h-4" />,
    api_key_generated: <Globe className="w-4 h-4" />,
    scaling_triggered: <RefreshCw className="w-4 h-4" />,
    report_generated: <Globe className="w-4 h-4" />,
    incident_resolved: <CheckCircle className="w-4 h-4" />
  };

  const uniqueUsers = [...new Set(activities.map(a => a.user.name))];
  const uniqueActivityTypes = [...new Set(activities.map(a => a.type))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Team Activity</h1>
          <p className="text-muted-foreground">Monitor user activity and system events</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            PDF
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-3xl font-bold">{activities.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Logins (24h)</p>
              <p className="text-3xl font-bold">{activities.filter(a => a.type === 'login').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Deployments (7d)</p>
              <p className="text-3xl font-bold">{activities.filter(a => a.type === 'deployment_created').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Alerts (7d)</p>
              <p className="text-3xl font-bold">{activities.filter(a => a.type === 'alert_triggered').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search activities..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-filter">User</Label>
              <select
                id="user-filter"
                value={filters.user}
                onChange={(e) => handleFilterChange('user', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-type">Activity Type</Label>
              <select
                id="activity-type"
                value={filters.activityType}
                onChange={(e) => handleFilterChange('activityType', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                {uniqueActivityTypes.map(type => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-range">Time Range</Label>
              <select
                id="date-range"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Timeline */}
      <div className="space-y-3">
        {filteredActivities.map((activity, index) => (
          <Card key={activity.id} className="hover:shadow-md transition">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activityTypeColors[activity.type] || 'bg-gray-100'}`}>
                    {activityTypeIcons[activity.type] || <Globe className="w-4 h-4" />}
                  </div>
                  {index < filteredActivities.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <Badge className={activityTypeColors[activity.type]}>
                      {activity.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {/* Activity Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">User</p>
                      <p className="font-semibold">{activity.user.name}</p>
                      <p className="text-xs text-muted-foreground break-all">{activity.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Timestamp</p>
                      <p className="font-semibold">{new Date(activity.timestamp).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{activity.ipAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Details</p>
                      <div className="space-y-1">
                        {Object.entries(activity.metadata).slice(0, 2).map(([key, value]) => (
                          <p key={key} className="text-xs">
                            <span className="font-semibold">{key}:</span> {String(value)}
                          </p>
                        ))}
                        {Object.keys(activity.metadata).length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{Object.keys(activity.metadata).length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-muted-foreground">No activities found matching filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
