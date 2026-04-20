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
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reportType, setReportType] = useState('incident');
  const [timeRange, setTimeRange] = useState('30d');

  const fetchDeployments = useCallback(async () => {
    try {
      setError('');
      const projects = await apiClient.getProjects();
      const normalizedProjects = Array.isArray(projects) ? projects : [];
      setDeployments(normalizedProjects);
      if (normalizedProjects.length > 0 && !selectedDeployment) {
        setSelectedDeployment(normalizedProjects[0]._id || normalizedProjects[0].id);
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
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [selectedDeployment]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const matchingReports = reports.filter((report) => report.type === reportType);
    setSelectedReport(matchingReports[0] || reports[0] || null);
  }, [reports, reportType]);

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

  const summary = selectedReport?.summary || {};

  function normalizeReport(report, reportSummary) {
    if (!report) {
      return null;
    }

    const data = report.data || {};

    if (report.type === 'incident') {
      const incidents = Array.isArray(data.incidents) ? data.incidents : [];
      const bySeverity = data.bySeverity || {};
      const weeklyData = buildWeeklyIncidentData(incidents);

      return {
        period: data.period || 'Live report',
        totalIncidents: data.totalIncidents ?? reportSummary.totalIncidents ?? incidents.length,
        averageResolutionTime: reportSummary.averageResolutionTime ?? 0,
        mttr: reportSummary.averageResolutionTime ?? 0,
        mtbf: incidents.length > 1 ? Math.max(1, Math.round((parseTimeSpanToMinutes(weeklyData) || 1) / incidents.length)) : 0,
        totalDowntime: reportSummary.totalDowntime ?? 0,
        data: weeklyData,
        severityBreakdown: Object.entries(bySeverity).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })),
        topIncidents: buildTopIncidents(incidents),
      };
    }

    if (report.type === 'sla') {
      return {
        period: data.period || 'Live report',
        targetUptime: data.targetUptime ?? 99.95,
        actualUptime: data.actualUptime ?? summary.uptime ?? 0,
        compliant: Boolean(data.slaCompliant ?? summary.slaCompliance),
        creditIssued: summary.totalDowntime ? Math.max(0, Math.round(summary.totalDowntime * 5)) : 0,
        slaBreaches: data.breaches ?? 0,
        breachDates: [],
        data: Array.isArray(data.uptimeHistory) ? data.uptimeHistory.map((point) => ({
          date: point.date || point.label || new Date(point.timestamp || Date.now()).toLocaleDateString(),
          uptime: point.uptime ?? point.value ?? 0,
          target: data.targetUptime ?? 99.95,
        })) : [],
      };
    }

    if (report.type === 'metrics') {
      const responseTime = data.responseTime || {};
      const metricsByType = data.metricsByType || {};

      return {
        period: data.period || 'Live report',
        averageResponseTime: responseTime.average ?? summary.averageResponseTime ?? 0,
        p95ResponseTime: responseTime.p95 ?? summary.p95ResponseTime ?? 0,
        p99ResponseTime: responseTime.p99 ?? 0,
        errorRate: responseTime.errorRate ?? 0,
        requestsPerSecond: responseTime.requestsPerSecond ?? 0,
        cacheHitRatio: responseTime.cacheHitRatio ?? 0,
        databaseQueryTime: responseTime.databaseQueryTime ?? 0,
        data: buildMetricTrend(metricsByType),
      };
    }

    if (report.type === 'trend') {
      return {
        period: data.period || 'Live report',
        incidentTrend: reportSummary.trendDirection || 'stable',
        downTimeTrend: reportSummary.trendDirection || 'stable',
        performanceTrend: reportSummary.trendDirection || 'stable',
        data: Array.isArray(data.trendData) ? data.trendData : [],
      };
    }

    if (report.type === 'alert') {
      const alertsByType = data.alertsByType || {};
      const topAlerts = Object.entries(alertsByType).map(([name, value]) => ({
        name,
        triggered: value,
        falsePositive: 0,
      }));

      return {
        period: data.period || 'Live report',
        totalAlerts: reportSummary.totalAlerts ?? data.totalAlerts ?? 0,
        triggeredAlerts: reportSummary.triggerRate ? Math.round((reportSummary.triggerRate / 100) * (reportSummary.totalAlerts ?? data.totalAlerts ?? 0)) : data.triggeredAlerts ?? 0,
        falsePositives: 0,
        silencedAlerts: 0,
        topAlerts,
      };
    }

    return data;
  };

  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  const buildWeeklyIncidentData = (incidents) => {
    const buckets = new Map();

    incidents.forEach((incident) => {
      const date = new Date(incident.createdAt || incident.timestamp || Date.now());
      const week = `Week ${Math.min(4, Math.max(1, Math.ceil(date.getDate() / 7)))}`;
      const current = buckets.get(week) || { week, incidents: 0, critical: 0, warning: 0, info: 0 };
      current.incidents += 1;
      current[normalizeSeverity(incident.severity)] += 1;
      buckets.set(week, current);
    });

    return Array.from(buckets.values());
  };

  const buildTopIncidents = (incidents) => {
    const grouped = incidents.reduce((acc, incident) => {
      const title = incident.title || incident.component || 'Incident';
      const entry = acc.get(title) || { title, count: 0, lastOccurred: incident.createdAt || incident.timestamp || new Date().toISOString() };
      entry.count += 1;
      entry.lastOccurred = incident.createdAt || incident.timestamp || entry.lastOccurred;
      acc.set(title, entry);
      return acc;
    }, new Map());

    return Array.from(grouped.values()).sort((a, b) => b.count - a.count).slice(0, 4);
  };

  const buildMetricTrend = (metricsByType) => {
    const entries = Object.entries(metricsByType);
    return entries.map(([day, metrics]) => ({
      day,
      responseTime: metrics?.average ?? 0,
      errors: metrics?.errorRate ?? 0,
      rps: metrics?.requestsPerSecond ?? 0,
    }));
  };

  const normalizeSeverity = (severity) => {
    const value = String(severity || '').toLowerCase();
    if (value.includes('critical')) return 'critical';
    if (value.includes('warn')) return 'warning';
    return 'info';
  };

  const parseTimeSpanToMinutes = (series) => {
    return series.reduce((total, item) => total + (item.incidents || 0), 0);
  };

  const reportData = normalizeReport(selectedReport, summary);

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
