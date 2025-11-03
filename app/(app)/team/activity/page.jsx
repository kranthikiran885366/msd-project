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

  // Mock activity data
  const mockActivities = [
    {
      id: 'activity-1',
      timestamp: '2024-12-20T15:45:30Z',
      user: { id: 'user-1', name: 'John Doe', email: 'john.doe@company.com' },
      type: 'deployment_created',
      title: 'Created Production Deployment',
      description: 'Deployed v2.1.0 to production',
      metadata: {
        deploymentId: 'deploy-123',
        environment: 'production',
        version: 'v2.1.0'
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    {
      id: 'activity-2',
      timestamp: '2024-12-20T14:30:15Z',
      user: { id: 'user-2', name: 'Sarah Lee', email: 'sarah.lee@company.com' },
      type: 'login',
      title: 'User Login',
      description: 'Logged in via email',
      metadata: {
        mfaEnabled: true,
        sessionDuration: '8h 45m'
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    },
    {
      id: 'activity-3',
      timestamp: '2024-12-20T13:15:45Z',
      user: { id: 'user-3', name: 'Mike Johnson', email: 'mike.johnson@company.com' },
      type: 'database_backup',
      title: 'Database Backup Completed',
      description: 'Automatic backup of production database',
      metadata: {
        databaseId: 'db-456',
        backupSize: '2.4 GB',
        duration: '12 minutes'
      },
      ipAddress: '10.0.0.50',
      userAgent: 'Backup System v1.2.3'
    },
    {
      id: 'activity-4',
      timestamp: '2024-12-20T12:00:00Z',
      user: { id: 'user-1', name: 'John Doe', email: 'john.doe@company.com' },
      type: 'config_change',
      title: 'Configuration Updated',
      description: 'Updated environment variables',
      metadata: {
        configName: 'Production Env',
        changes: 5,
        appliedTo: 'production'
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    {
      id: 'activity-5',
      timestamp: '2024-12-20T11:30:22Z',
      user: { id: 'user-4', name: 'Jane Smith', email: 'jane.smith@company.com' },
      type: 'alert_triggered',
      title: 'Alert Triggered',
      description: 'High CPU usage detected',
      metadata: {
        alertName: 'CPU > 85%',
        threshold: '85%',
        current: '92%'
      },
      ipAddress: '10.0.0.51',
      userAgent: 'Alert System v2.1.0'
    },
    {
      id: 'activity-6',
      timestamp: '2024-12-20T10:45:10Z',
      user: { id: 'user-2', name: 'Sarah Lee', email: 'sarah.lee@company.com' },
      type: 'api_key_generated',
      title: 'API Key Generated',
      description: 'New API key created for CI/CD pipeline',
      metadata: {
        keyName: 'GitHub Actions',
        scopes: ['deployments:write', 'logs:read'],
        expiresIn: '90 days'
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    },
    {
      id: 'activity-7',
      timestamp: '2024-12-20T09:20:35Z',
      user: { id: 'user-3', name: 'Mike Johnson', email: 'mike.johnson@company.com' },
      type: 'logout',
      title: 'User Logout',
      description: 'User logged out of the platform',
      metadata: {
        sessionDuration: '4h 23m',
        reason: 'manual_logout'
      },
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)'
    },
    {
      id: 'activity-8',
      timestamp: '2024-12-20T08:15:50Z',
      user: { id: 'user-1', name: 'John Doe', email: 'john.doe@company.com' },
      type: 'scaling_triggered',
      title: 'Auto-scaling Triggered',
      description: 'Application scaled up automatically',
      metadata: {
        serviceName: 'API Server',
        fromReplicas: 3,
        toReplicas: 5,
        reason: 'High load detected'
      },
      ipAddress: '10.0.0.52',
      userAgent: 'Scaling Manager v1.5.0'
    },
    {
      id: 'activity-9',
      timestamp: '2024-12-19T16:30:20Z',
      user: { id: 'user-4', name: 'Jane Smith', email: 'jane.smith@company.com' },
      type: 'report_generated',
      title: 'Report Generated',
      description: 'Monthly compliance report generated',
      metadata: {
        reportType: 'Compliance',
        period: 'November 2024',
        pageCount: 24
      },
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    {
      id: 'activity-10',
      timestamp: '2024-12-19T15:45:00Z',
      user: { id: 'user-2', name: 'Sarah Lee', email: 'sarah.lee@company.com' },
      type: 'incident_resolved',
      title: 'Incident Resolved',
      description: 'Production incident successfully resolved',
      metadata: {
        incidentId: 'INC-2024-001',
        severity: 'critical',
        duration: '1h 15m'
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    }
  ];

  useEffect(() => {
    setActivities(mockActivities);
    setLoading(false);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters({...filters, [field]: value});
  };

  const applyFilters = () => {
    let filtered = mockActivities;

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

  const handleExport = async (format) => {
    try {
      const filtered = applyFilters();
      const response = await apiClient.exportActivity(filtered, format);

      if (response.success) {
        setSuccessMessage(`Activity data exported as ${format.toUpperCase()}`);
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

  const uniqueUsers = [...new Set(mockActivities.map(a => a.user.name))];
  const uniqueActivityTypes = [...new Set(mockActivities.map(a => a.type))];

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
