'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Download, Filter, RefreshCw, Search, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [filters, setFilters] = useState({
    user: '',
    action: 'all',
    resource: 'all',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });

  // Mock audit logs
  const mockAuditLogs = [
    {
      id: 'audit-1',
      timestamp: '2024-12-20T15:45:30Z',
      user: { id: 'user-1', name: 'John Doe', email: 'john.doe@company.com' },
      action: 'created',
      resource: 'deployment',
      resourceId: 'deploy-123',
      resourceName: 'Production Deploy v2.1.0',
      status: 'success',
      details: {
        description: 'Created new deployment for production environment',
        changes: ['version: v2.0.9 → v2.1.0', 'replicas: 3 → 5'],
        ipAddress: '192.168.1.100'
      }
    },
    {
      id: 'audit-2',
      timestamp: '2024-12-20T14:30:15Z',
      user: { id: 'user-2', name: 'Sarah Lee', email: 'sarah.lee@company.com' },
      action: 'updated',
      resource: 'database',
      resourceId: 'db-456',
      resourceName: 'Production Database',
      status: 'success',
      details: {
        description: 'Updated database scaling policy',
        changes: ['maxReplicas: 10 → 15', 'cpuThreshold: 70% → 65%'],
        ipAddress: '192.168.1.101'
      }
    },
    {
      id: 'audit-3',
      timestamp: '2024-12-20T13:15:45Z',
      user: { id: 'user-3', name: 'Mike Johnson', email: 'mike.johnson@company.com' },
      action: 'deleted',
      resource: 'alert',
      resourceId: 'alert-789',
      resourceName: 'High CPU Alert',
      status: 'success',
      details: {
        description: 'Deleted alert rule',
        reason: 'Rule no longer needed after infrastructure upgrade',
        ipAddress: '192.168.1.102'
      }
    },
    {
      id: 'audit-4',
      timestamp: '2024-12-20T12:00:00Z',
      user: { id: 'user-1', name: 'John Doe', email: 'john.doe@company.com' },
      action: 'accessed',
      resource: 'settings',
      resourceId: 'settings-001',
      resourceName: 'Billing Settings',
      status: 'success',
      details: {
        description: 'Accessed billing settings page',
        duration: '5 minutes',
        ipAddress: '192.168.1.100'
      }
    },
    {
      id: 'audit-5',
      timestamp: '2024-12-20T11:30:22Z',
      user: { id: 'user-4', name: 'Jane Smith', email: 'jane.smith@company.com' },
      action: 'updated',
      resource: 'member',
      resourceId: 'user-5',
      resourceName: 'Tom Williams - Role Change',
      status: 'success',
      details: {
        description: 'Changed member role',
        changes: ['role: member → manager', 'permissions updated'],
        approvedBy: 'John Doe',
        ipAddress: '192.168.1.103'
      }
    },
    {
      id: 'audit-6',
      timestamp: '2024-12-20T10:45:10Z',
      user: { id: 'user-2', name: 'Sarah Lee', email: 'sarah.lee@company.com' },
      action: 'created',
      resource: 'api_key',
      resourceId: 'key-xyz789',
      resourceName: 'CI/CD Pipeline Key',
      status: 'success',
      details: {
        description: 'Generated new API key',
        scopes: ['deployments:create', 'deployments:read', 'logs:read'],
        ipAddress: '192.168.1.101'
      }
    },
    {
      id: 'audit-7',
      timestamp: '2024-12-20T09:20:35Z',
      user: { id: 'user-3', name: 'Mike Johnson', email: 'mike.johnson@company.com' },
      action: 'failed',
      resource: 'deployment',
      resourceId: 'deploy-124',
      resourceName: 'Staging Deploy Attempt',
      status: 'failure',
      details: {
        description: 'Deployment failed - insufficient permissions',
        error: 'User does not have permission to deploy to production',
        attemptedAt: '2024-12-20T09:20:35Z',
        ipAddress: '192.168.1.102'
      }
    },
    {
      id: 'audit-8',
      timestamp: '2024-12-20T08:15:50Z',
      user: { id: 'user-1', name: 'John Doe', email: 'john.doe@company.com' },
      action: 'exported',
      resource: 'report',
      resourceId: 'report-001',
      resourceName: 'Monthly Compliance Report',
      status: 'success',
      details: {
        description: 'Exported compliance report',
        format: 'PDF',
        dateRange: '2024-11-01 to 2024-11-30',
        ipAddress: '192.168.1.100'
      }
    },
    {
      id: 'audit-9',
      timestamp: '2024-12-19T16:30:20Z',
      user: { id: 'user-4', name: 'Jane Smith', email: 'jane.smith@company.com' },
      action: 'updated',
      resource: 'team',
      resourceId: 'team-001',
      resourceName: 'Engineering Team Settings',
      status: 'success',
      details: {
        description: 'Updated team settings',
        changes: ['name: Engineering Team → Platform Engineering', 'description updated'],
        ipAddress: '192.168.1.103'
      }
    },
    {
      id: 'audit-10',
      timestamp: '2024-12-19T15:45:00Z',
      user: { id: 'user-2', name: 'Sarah Lee', email: 'sarah.lee@company.com' },
      action: 'accessed',
      resource: 'logs',
      resourceId: 'logs-all',
      resourceName: 'System Logs',
      status: 'success',
      details: {
        description: 'Accessed system logs',
        filters: 'severity: error, timeRange: 24h',
        recordsViewed: 156,
        ipAddress: '192.168.1.101'
      }
    }
  ];

  useEffect(() => {
    setAuditLogs(mockAuditLogs);
    setLoading(false);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters({...filters, [field]: value});
  };

  const applyFilters = () => {
    let filtered = mockAuditLogs;

    if (filters.user) {
      filtered = filtered.filter(log => 
        log.user.name.toLowerCase().includes(filters.user.toLowerCase()) ||
        log.user.email.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.resource !== 'all') {
      filtered = filtered.filter(log => log.resource === filters.resource);
    }

    if (filters.searchQuery) {
      filtered = filtered.filter(log =>
        log.resourceName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        log.details.description?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo));
    }

    return filtered;
  };

  const handleExport = async (format) => {
    try {
      const filtered = applyFilters();
      const response = await apiClient.exportAuditLog(filtered, format);
      
      if (response.success) {
        setSuccessMessage(`Audit log exported as ${format.toUpperCase()}`);
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

  const filteredLogs = applyFilters();

  const actionColors = {
    created: 'bg-green-100 text-green-800',
    updated: 'bg-blue-100 text-blue-800',
    deleted: 'bg-red-100 text-red-800',
    accessed: 'bg-gray-100 text-gray-800',
    exported: 'bg-purple-100 text-purple-800',
    failed: 'bg-red-100 text-red-800'
  };

  const resourceColors = {
    deployment: 'bg-blue-50',
    database: 'bg-yellow-50',
    alert: 'bg-red-50',
    settings: 'bg-gray-50',
    member: 'bg-green-50',
    api_key: 'bg-purple-50',
    team: 'bg-indigo-50',
    logs: 'bg-pink-50',
    report: 'bg-orange-50'
  };

  const uniqueUsers = [...new Set(mockAuditLogs.map(log => log.user.name))];
  const uniqueResources = [...new Set(mockAuditLogs.map(log => log.resource))];
  const uniqueActions = [...new Set(mockAuditLogs.map(log => log.action))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">Complete audit trail of all system activities</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
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
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-3xl font-bold">{auditLogs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-3xl font-bold text-green-600">{auditLogs.filter(l => l.status === 'success').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-3xl font-bold text-red-600">{auditLogs.filter(l => l.status === 'failure').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Unique Users</p>
              <p className="text-3xl font-bold">{uniqueUsers.length}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search events..."
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
              <Label htmlFor="action-filter">Action</Label>
              <select
                id="action-filter"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-filter">Resource</Label>
              <select
                id="resource-filter"
                value={filters.resource}
                onChange={(e) => handleFilterChange('resource', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Resources</option>
                {uniqueResources.map(resource => (
                  <option key={resource} value={resource}>{resource}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events */}
      <div className="space-y-3">
        {filteredLogs.map(log => (
          <Card key={log.id} className={`hover:shadow-md transition cursor-pointer ${resourceColors[log.resource] || 'bg-white'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-2">
                      <Badge className={actionColors[log.action]}>
                        {log.action}
                      </Badge>
                      <Badge variant="outline">
                        {log.resource}
                      </Badge>
                      {log.status === 'failure' && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">User</p>
                      <p className="font-semibold">{log.user.name}</p>
                      <p className="text-sm text-muted-foreground break-all">{log.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Resource</p>
                      <p className="font-semibold">{log.resourceName}</p>
                      <p className="text-sm text-muted-foreground">{log.resourceId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Timestamp</p>
                      <p className="font-semibold">{new Date(log.timestamp).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{log.details.ipAddress}</p>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-muted rounded text-sm">
                    <p className="font-medium">{log.details.description}</p>
                  </div>
                </div>

                {/* Actions */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedLog(log);
                    setShowDetailsModal(true);
                  }}
                  className="flex-shrink-0"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-muted-foreground">No audit events found matching filters</p>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-96 overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Event Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">User</p>
                  <p className="font-semibold">{selectedLog.user.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <Badge className={actionColors[selectedLog.action]}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resource</p>
                  <p className="font-semibold">{selectedLog.resourceName}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.resourceId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={selectedLog.status === 'success' ? 'default' : 'destructive'}>
                    {selectedLog.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="font-semibold">{selectedLog.details.description}</p>
              </div>

              {selectedLog.details.changes && (
                <div>
                  <p className="text-xs text-muted-foreground">Changes</p>
                  <ul className="space-y-1 text-sm">
                    {selectedLog.details.changes.map((change, idx) => (
                      <li key={idx} className="font-mono text-xs bg-muted p-2 rounded">
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedLog.details.scopes && (
                <div>
                  <p className="text-xs text-muted-foreground">Scopes</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.details.scopes.map((scope, idx) => (
                      <Badge key={idx} variant="outline">{scope}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">Additional Info</p>
                <p className="text-sm">IP Address: {selectedLog.details.ipAddress}</p>
                <p className="text-sm">Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
