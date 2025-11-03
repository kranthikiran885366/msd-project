'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Download, Filter, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiClient from '@/lib/api-client';

export default function MonitoringReportsPage() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportType, setReportType] = useState('incident');
  const [timeRange, setTimeRange] = useState('30d');

  // Mock incident reports
  const mockIncidentReport = {
    period: 'Last 30 Days',
    startDate: '2024-11-20',
    endDate: '2024-12-20',
    totalIncidents: 12,
    criticalIncidents: 3,
    warningIncidents: 5,
    infoIncidents: 4,
    averageResolutionTime: 45,
    mttr: 38, // Mean Time To Resolution (minutes)
    mtbf: 168, // Mean Time Between Failures (hours)
    totalDowntime: 158,
    data: [
      { week: 'Week 1', incidents: 2, critical: 0, warning: 1, info: 1 },
      { week: 'Week 2', incidents: 3, critical: 1, warning: 1, info: 1 },
      { week: 'Week 3', incidents: 4, critical: 1, warning: 2, info: 1 },
      { week: 'Week 4', incidents: 3, critical: 1, warning: 1, info: 1 }
    ],
    severityBreakdown: [
      { name: 'Critical', value: 3, incidents: 'database-crash, deployment-failure, api-outage' },
      { name: 'Warning', value: 5, incidents: '5 different warnings' },
      { name: 'Info', value: 4, incidents: '4 informational alerts' }
    ],
    topIncidents: [
      { title: 'Database Connection Pool Exhaustion', count: 4, lastOccurred: '2024-12-20' },
      { title: 'High Memory Usage', count: 3, lastOccurred: '2024-12-18' },
      { title: 'Deployment Failures', count: 3, lastOccurred: '2024-12-15' },
      { title: 'API Timeout Errors', count: 2, lastOccurred: '2024-12-10' }
    ]
  };

  const mockSlaReport = {
    period: 'Last 30 Days',
    startDate: '2024-11-20',
    endDate: '2024-12-20',
    targetUptime: 99.95,
    actualUptime: 99.89,
    compliant: false,
    creditIssued: 850,
    slaBreaches: 1,
    breachDates: ['2024-12-18 to 2024-12-19'],
    data: [
      { date: 'Nov 20-26', uptime: 99.92, target: 99.95 },
      { date: 'Nov 27-Dec 3', uptime: 99.88, target: 99.95 },
      { date: 'Dec 4-10', uptime: 99.91, target: 99.95 },
      { date: 'Dec 11-17', uptime: 99.90, target: 99.95 },
      { date: 'Dec 18-20', uptime: 99.78, target: 99.95 }
    ]
  };

  const mockMetricsReport = {
    period: 'Last 30 Days',
    averageResponseTime: 145,
    p95ResponseTime: 284,
    p99ResponseTime: 512,
    errorRate: 0.23,
    requestsPerSecond: 2456,
    cacheHitRatio: 85.2,
    databaseQueryTime: 142,
    data: [
      { day: 'Dec 15', responseTime: 138, errors: 0.2, rps: 2200 },
      { day: 'Dec 16', responseTime: 145, errors: 0.22, rps: 2350 },
      { day: 'Dec 17', responseTime: 152, errors: 0.25, rps: 2400 },
      { day: 'Dec 18', responseTime: 148, errors: 0.24, rps: 2380 },
      { day: 'Dec 19', responseTime: 142, errors: 0.21, rps: 2500 },
      { day: 'Dec 20', responseTime: 145, errors: 0.23, rps: 2456 }
    ]
  };

  const mockTrendReport = {
    period: 'Last 90 Days',
    incidentTrend: 'increasing',
    downTimeTrend: 'stable',
    performanceTrend: 'improving',
    data: [
      { month: 'October', incidents: 15, downtime: 245, avgResponseTime: 165, uptime: 99.82 },
      { month: 'November', incidents: 18, downtime: 189, avgResponseTime: 152, uptime: 99.88 },
      { month: 'December', incidents: 12, downtime: 158, avgResponseTime: 145, uptime: 99.89 }
    ]
  };

  const mockAlertReport = {
    period: 'Last 30 Days',
    totalAlerts: 456,
    triggeredAlerts: 98,
    falsePositives: 12,
    silencedAlerts: 34,
    topAlerts: [
      { name: 'High CPU Usage', triggered: 23, falsePositive: 2 },
      { name: 'Memory Warning', triggered: 18, falsePositive: 1 },
      { name: 'Deployment Failure', triggered: 15, falsePositive: 3 },
      { name: 'Low Disk Space', triggered: 12, falsePositive: 1 },
      { name: 'Response Time High', triggered: 30, falsePositive: 5 }
    ]
  };

  const fetchDeployments = useCallback(async () => {
    try {
      setError('');
      const projects = await apiClient.getProjects();
      setDeployments(projects || []);
      if (projects?.length > 0 && !selectedDeployment) {
        setSelectedDeployment(projects[0]._id);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  }, [selectedDeployment]);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchReports = useCallback(async () => {
    if (!selectedDeployment) return;
    
    try {
      setError('');
      setLoading(true);
      const reportsData = await apiClient.getReports(selectedDeployment);
      setReports(reportsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [selectedDeployment]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerateReport = async () => {
    try {
      setError('');
      await apiClient.generateReport(selectedDeployment, {
        type: reportType,
        timeRange: timeRange
      });
      await fetchReports();
      setSuccessMessage(`${reportType} report generated successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleExportReport = async (format = 'pdf') => {
    try {
      setError('');
      await apiClient.exportReport(selectedDeployment, {
        type: reportType,
        timeRange: timeRange,
        format: format
      });
      setSuccessMessage(`Report exported as ${format.toUpperCase()}`);
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

  const getSelectedReportData = () => {
    switch(reportType) {
      case 'incident': return mockIncidentReport;
      case 'sla': return mockSlaReport;
      case 'metrics': return mockMetricsReport;
      case 'trend': return mockTrendReport;
      case 'alert': return mockAlertReport;
      default: return mockIncidentReport;
    }
  };

  const reportData = getSelectedReportData();
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Monitoring Reports</h1>
        <p className="text-muted-foreground">Generate and analyze monitoring and incident reports</p>
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

      {/* Deployment Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Deployment</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedDeployment}
            onChange={(e) => setSelectedDeployment(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
          >
            {deployments.map(dep => (
              <option key={dep._id} value={dep._id}>
                {dep.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="incident">Incident Summary</option>
                <option value="sla">SLA Compliance</option>
                <option value="metrics">Performance Metrics</option>
                <option value="trend">Trend Analysis</option>
                <option value="alert">Alert Activity</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="365d">Last Year</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleGenerateReport} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Generate Report
            </Button>
            <Button onClick={() => handleExportReport('pdf')} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button onClick={() => handleExportReport('csv')} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <>
          {/* Key Metrics */}
          {reportType === 'incident' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Incidents</p>
                      <p className="text-3xl font-bold">{reportData.totalIncidents}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                      <p className="text-3xl font-bold">{reportData.averageResolutionTime}m</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">MTTR</p>
                      <p className="text-3xl font-bold">{reportData.mttr}m</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">MTBF</p>
                      <p className="text-3xl font-bold">{reportData.mtbf}h</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Incident Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Incident Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="critical" stackId="a" fill="#ef4444" />
                      <Bar dataKey="warning" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="info" stackId="a" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Severity Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Severity Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={reportData.severityBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, value}) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reportData.severityBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Incidents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.topIncidents.map((incident, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">{incident.title}</p>
                              <p className="text-xs text-muted-foreground">Last: {incident.lastOccurred}</p>
                            </div>
                            <Badge className="bg-red-100 text-red-800">{incident.count}x</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {reportType === 'sla' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Target Uptime</p>
                      <p className="text-3xl font-bold">{reportData.targetUptime}%</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Actual Uptime</p>
                      <p className={`text-3xl font-bold ${reportData.compliant ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.actualUptime}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Compliant</p>
                      <Badge className={reportData.compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {reportData.compliant ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Credit Issued</p>
                      <p className="text-3xl font-bold">${reportData.creditIssued}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Uptime vs SLA Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[99.5, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="uptime" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {reportType === 'metrics' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                      <p className="text-3xl font-bold">{reportData.averageResponseTime}ms</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">P95 Response Time</p>
                      <p className="text-3xl font-bold">{reportData.p95ResponseTime}ms</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Error Rate</p>
                      <p className="text-3xl font-bold">{reportData.errorRate}%</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Requests/sec</p>
                      <p className="text-3xl font-bold">{reportData.requestsPerSecond}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="errors" stroke="#ef4444" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {reportType === 'trend' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>3-Month Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="incidents" fill="#ef4444" />
                      <Bar dataKey="downtime" fill="#f59e0b" />
                      <Bar dataKey="avgResponseTime" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {reportType === 'alert' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Alerts</p>
                      <p className="text-3xl font-bold">{reportData.totalAlerts}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Triggered</p>
                      <p className="text-3xl font-bold text-orange-600">{reportData.triggeredAlerts}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">False Positives</p>
                      <p className="text-3xl font-bold text-red-600">{reportData.falsePositives}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.topAlerts.map((alert, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold">{alert.name}</p>
                          <div className="flex gap-2">
                            <Badge className="bg-orange-100 text-orange-800">Triggered: {alert.triggered}</Badge>
                            <Badge className="bg-red-100 text-red-800">False: {alert.falsePositive}</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(alert.triggered / reportData.totalAlerts) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
