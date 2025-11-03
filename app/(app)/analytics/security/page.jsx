'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Shield, Lock, TrendingUp, TrendingDown, Eye, EyeOff, RefreshCw, Download, Filter } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function SecurityAuditPage() {
  const [auditData, setAuditData] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [auditHistory, setAuditHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('30');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuditData();
  }, [timeRange, filterAction]);

  const fetchAuditData = async () => {
    try {
      setError('');
      setLoading(true);

      const [auditRes, eventsRes, vulnRes, historyRes] = await Promise.all([
        apiClient.getSecurityAudit({ days: parseInt(timeRange) }),
        apiClient.getAuditEvents({ 
          days: parseInt(timeRange), 
          action: filterAction !== 'all' ? filterAction : undefined 
        }),
        apiClient.getVulnerabilities(),
        apiClient.getAuditHistory({ days: parseInt(timeRange) })
      ]);

      if (auditRes.success) {
        setAuditData(auditRes.data);
      } else {
        setError(auditRes.error || 'Failed to fetch audit data');
      }

      if (eventsRes.success) {
        setAuditEvents(eventsRes.data || []);
      }

      if (vulnRes.success) {
        setVulnerabilities(vulnRes.data || []);
      }

      if (historyRes.success) {
        setAuditHistory(historyRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = auditEvents.filter(event => {
    if (filterUser && !event.user.toLowerCase().includes(filterUser.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'login':
        return 'bg-blue-100 text-blue-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'access':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading audit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Security Audit</h1>
          <p className="text-muted-foreground">
            Track security events, access logs, and vulnerability assessments
          </p>
        </div>
        <Button
          onClick={fetchAuditData}
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

      {/* Audit Metrics */}
      {auditData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{auditData.totalEvents}</p>
                <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
              </div>
            </CardContent>
          </Card>

          {/* Failed Logins */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-red-600">{auditData.failedLogins}</p>
                <p className="text-xs text-muted-foreground">Suspicious attempts</p>
              </div>
            </CardContent>
          </Card>

          {/* Privileged Operations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Privileged Ops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{auditData.privilegedOperations}</p>
                <p className="text-xs text-muted-foreground">Admin actions</p>
              </div>
            </CardContent>
          </Card>

          {/* Vulnerabilities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vulnerabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-orange-600">{vulnerabilities.length}</p>
                <p className="text-xs text-muted-foreground">Found in scan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Range & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
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

        <div className="flex gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="access">Access</option>
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Events Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {auditHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={auditHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalEvents"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Total Events"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="failedLogins"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Failed Logins"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Event Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            {auditEvents.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  {
                    type: 'Login',
                    count: auditEvents.filter(e => e.action === 'login').length
                  },
                  {
                    type: 'Create',
                    count: auditEvents.filter(e => e.action === 'create').length
                  },
                  {
                    type: 'Update',
                    count: auditEvents.filter(e => e.action === 'update').length
                  },
                  {
                    type: 'Delete',
                    count: auditEvents.filter(e => e.action === 'delete').length
                  },
                  {
                    type: 'Access',
                    count: auditEvents.filter(e => e.action === 'access').length
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vulnerabilities */}
      {vulnerabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Found Vulnerabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vulnerabilities.map((vuln, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{vuln.title}</h3>
                        <Badge className={getSeverityColor(vuln.severity)}>
                          {vuln.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{vuln.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">Component: {vuln.component}</p>
                      <p className="text-xs text-muted-foreground">CVE: {vuln.cveId}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Filter by user..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Timestamp</th>
                    <th className="text-left py-3 px-4 font-semibold">User</th>
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                    <th className="text-left py-3 px-4 font-semibold">Resource</th>
                    <th className="text-left py-3 px-4 font-semibold">IP Address</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.slice(0, 20).map((event, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-xs text-muted-foreground">{event.timestamp}</td>
                      <td className="py-3 px-4 font-medium">{event.user}</td>
                      <td className="py-3 px-4">
                        <Badge className={getActionBadge(event.action)}>
                          {event.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{event.resource}</td>
                      <td className="py-3 px-4 text-xs font-mono">{event.ipAddress}</td>
                      <td className="py-3 px-4">
                        <Badge className={
                          event.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }>
                          {event.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{event.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No events found</p>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Audit Report
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
