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

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getAuditLogs({ limit: 100 });
        const records = response?.logs || response?.data || response || [];
        setAuditLogs(records.map(normalizeAuditLog));
      } catch (err) {
        setError(err.message || 'Failed to load audit logs');
        setAuditLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  const normalizeAuditLog = (log) => ({
    id: log._id || log.id,
    timestamp: log.createdAt || log.timestamp,
    user: {
      id: log.userId?._id || log.userId || log.userId?.id || 'unknown',
      name: log.userId?.name || log.metadata?.userName || log.metadata?.actorName || 'System',
      email: log.userId?.email || log.metadata?.userEmail || '',
    },
    action: String(log.action || 'unknown').toLowerCase().replace(/_/g, ' '),
    resource: String(log.resourceType || log.resource || 'resource').toLowerCase(),
    resourceId: log.resourceId || '',
    resourceName: log.metadata?.resourceName || log.metadata?.name || log.resourceType || 'Resource',
    status: log.metadata?.status || (String(log.action || '').includes('FAILED') ? 'failure' : 'success'),
    details: {
      description: log.metadata?.description || log.metadata?.message || `${log.action} ${log.resourceType}`,
      changes: log.metadata?.changes || [],
      ipAddress: log.ipAddress || log.metadata?.ipAddress || '',
      ...log.metadata,
    }
  });

  const handleFilterChange = (field, value) => {
    setFilters({...filters, [field]: value});
  };

  const applyFilters = () => {
    let filtered = auditLogs;

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
      const content = format === 'csv'
        ? [
            ['timestamp', 'user', 'action', 'resource', 'resourceId', 'description'].join(','),
            ...filtered.map((log) => [
              new Date(log.timestamp).toISOString(),
              JSON.stringify(log.user.name || ''),
              JSON.stringify(log.action || ''),
              JSON.stringify(log.resource || ''),
              JSON.stringify(log.resourceId || ''),
              JSON.stringify(log.details?.description || ''),
            ].join(','))
          ].join('\n')
        : JSON.stringify(filtered, null, 2);

      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      setSuccessMessage(`Audit log exported as ${format.toUpperCase()}`);
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

  const uniqueUsers = [...new Set(auditLogs.map(log => log.user.name))];
  const uniqueResources = [...new Set(auditLogs.map(log => log.resource))];
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];

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
