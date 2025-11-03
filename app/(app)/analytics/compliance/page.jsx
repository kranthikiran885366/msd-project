'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Shield, Lock, CheckCircle, XCircle, Clock, TrendingUp, RefreshCw, Download } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ComplianceAnalyticsPage() {
  const [complianceData, setComplianceData] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [complianceHistory, setComplianceHistory] = useState([]);
  const [selectedFramework, setSelectedFramework] = useState('soc2');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComplianceData();
  }, [selectedFramework]);

  const fetchComplianceData = async () => {
    try {
      setError('');
      setLoading(true);

      const [compRes, eventsRes, auditRes, historyRes] = await Promise.all([
        apiClient.getComplianceAnalytics({ framework: selectedFramework }),
        apiClient.getSecurityEvents(),
        apiClient.getAuditLogs({ limit: 10 }),
        apiClient.getComplianceHistory({ framework: selectedFramework })
      ]);

      if (compRes.success) {
        setComplianceData(compRes.data);
      } else {
        setError(compRes.error || 'Failed to fetch compliance data');
      }

      if (eventsRes.success) {
        setSecurityEvents(eventsRes.data || []);
      }

      if (auditRes.success) {
        setAuditLogs(auditRes.data || []);
      }

      if (historyRes.success) {
        setComplianceHistory(historyRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusIcon = (status) => {
    return status === 'compliant' ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getComplianceScore = (data) => {
    if (!data) return 0;
    return ((data.compliantControls / (data.compliantControls + data.nonCompliantControls)) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Compliance & Security</h1>
          <p className="text-muted-foreground">
            Monitor compliance status and security events
          </p>
        </div>
        <Button
          onClick={fetchComplianceData}
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

      {/* Framework Selector */}
      <div className="flex gap-2">
        <Button
          onClick={() => setSelectedFramework('soc2')}
          variant={selectedFramework === 'soc2' ? 'default' : 'outline'}
          size="sm"
        >
          SOC 2
        </Button>
        <Button
          onClick={() => setSelectedFramework('hipaa')}
          variant={selectedFramework === 'hipaa' ? 'default' : 'outline'}
          size="sm"
        >
          HIPAA
        </Button>
        <Button
          onClick={() => setSelectedFramework('gdpr')}
          variant={selectedFramework === 'gdpr' ? 'default' : 'outline'}
          size="sm"
        >
          GDPR
        </Button>
        <Button
          onClick={() => setSelectedFramework('pci')}
          variant={selectedFramework === 'pci' ? 'default' : 'outline'}
          size="sm"
        >
          PCI DSS
        </Button>
        <Button
          onClick={() => setSelectedFramework('iso27001')}
          variant={selectedFramework === 'iso27001' ? 'default' : 'outline'}
          size="sm"
        >
          ISO 27001
        </Button>
      </div>

      {/* Compliance Score */}
      {complianceData && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              {selectedFramework.toUpperCase()} Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Overall Score</span>
                    <span className="text-3xl font-bold text-green-600">
                      {getComplianceScore(complianceData)}%
                    </span>
                  </div>
                  <Progress
                    value={parseFloat(getComplianceScore(complianceData))}
                    className="h-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-sm text-muted-foreground">Compliant Controls</p>
                    <p className="text-2xl font-bold text-green-600">{complianceData.compliantControls}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-red-200">
                    <p className="text-sm text-muted-foreground">Non-Compliant</p>
                    <p className="text-2xl font-bold text-red-600">{complianceData.nonCompliantControls}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm text-muted-foreground">Last Assessment</p>
                  <p className="font-semibold">{complianceData.lastAssessment}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm text-muted-foreground">Next Assessment</p>
                  <p className="font-semibold">{complianceData.nextAssessment}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm text-muted-foreground">Certification Status</p>
                  <Badge className={complianceData.certified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {complianceData.certified ? 'Certified' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Trend */}
      {complianceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Security Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recent Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {securityEvents.length > 0 ? (
              <div className="space-y-3">
                {securityEvents.slice(0, 5).map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge className={`mt-1 ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No security events</p>
            )}
          </CardContent>
        </Card>

        {/* Security Events by Severity */}
        <Card>
          <CardHeader>
            <CardTitle>Events by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {securityEvents.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  {
                    severity: 'Critical',
                    count: securityEvents.filter(e => e.severity === 'critical').length
                  },
                  {
                    severity: 'High',
                    count: securityEvents.filter(e => e.severity === 'high').length
                  },
                  {
                    severity: 'Medium',
                    count: securityEvents.filter(e => e.severity === 'medium').length
                  },
                  {
                    severity: 'Low',
                    count: securityEvents.filter(e => e.severity === 'low').length
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Control Details */}
      <Card>
        <CardHeader>
          <CardTitle>Control Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {complianceData?.controls && complianceData.controls.length > 0 ? (
            <div className="space-y-3">
              {complianceData.controls.map((control, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(control.status)}
                    <div>
                      <p className="font-medium">{control.id}: {control.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{control.description}</p>
                    </div>
                  </div>
                  <Badge className={
                    control.status === 'compliant'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }>
                    {control.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No controls data available</p>
          )}
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Timestamp</th>
                    <th className="text-left py-3 px-4 font-semibold">User</th>
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                    <th className="text-left py-3 px-4 font-semibold">Resource</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-xs text-muted-foreground">{log.timestamp}</td>
                      <td className="py-3 px-4">{log.user}</td>
                      <td className="py-3 px-4 font-mono text-xs">{log.action}</td>
                      <td className="py-3 px-4">{log.resource}</td>
                      <td className="py-3 px-4">
                        <Badge className={
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }>
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No audit logs available</p>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Compliance Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
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
