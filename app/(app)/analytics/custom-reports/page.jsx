'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Trash2, Edit2, Download, Share2, Clock, Filter, CheckCircle, Calendar } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CustomReportsPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    metrics: [],
    timeRange: '30',
    frequency: 'manual',
    recipients: [],
    includeCharts: true,
    includeTable: true,
    format: 'pdf'
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await apiClient.getCustomReports();

      if (response.success) {
        setReports(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch reports');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      setError('');

      if (!newReport.name || newReport.metrics.length === 0) {
        setError('Report name and at least one metric are required');
        return;
      }

      setSaving(true);
      const response = await apiClient.createCustomReport(newReport);

      if (response.success) {
        setReports([...reports, response.data]);
        setNewReport({
          name: '',
          description: '',
          metrics: [],
          timeRange: '30',
          frequency: 'manual',
          recipients: [],
          includeCharts: true,
          includeTable: true,
          format: 'pdf'
        });
        setShowCreateForm(false);
        setSuccessMessage('Report created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to create report');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Delete this report?')) return;

    try {
      setError('');
      setSaving(true);
      const response = await apiClient.deleteCustomReport(reportId);

      if (response.success) {
        setReports(reports.filter(r => r.id !== reportId));
        setSelectedReport(null);
        setSuccessMessage('Report deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete report');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = async (reportId) => {
    try {
      setError('');
      setSaving(true);
      const response = await apiClient.generateReport(reportId);

      if (response.success) {
        setSuccessMessage('Report generated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to generate report');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      await apiClient.downloadReport(reportId);
    } catch (err) {
      setError(err.message || 'Failed to download report');
    }
  };

  const toggleMetric = (metric) => {
    if (newReport.metrics.includes(metric)) {
      setNewReport({
        ...newReport,
        metrics: newReport.metrics.filter(m => m !== metric)
      });
    } else {
      setNewReport({
        ...newReport,
        metrics: [...newReport.metrics, metric]
      });
    }
  };

  const availableMetrics = [
    'total_deployments',
    'success_rate',
    'avg_latency',
    'error_rate',
    'api_calls',
    'active_users',
    'cost_analysis',
    'storage_usage',
    'bandwidth_usage',
    'uptime',
    'sla_compliance'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Custom Reports</h1>
          <p className="text-muted-foreground">
            Create and manage custom analytics reports
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Report
        </Button>
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

      {/* Create Report Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Weekly Performance Report"
                  value={newReport.name}
                  onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Optional description of the report"
                  value={newReport.description}
                  onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                  disabled={saving}
                  className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Metrics Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold">Select Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableMetrics.map((metric) => (
                  <label key={metric} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={newReport.metrics.includes(metric)}
                      onChange={() => toggleMetric(metric)}
                      disabled={saving}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{metric.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeRange">Time Range</Label>
                <select
                  id="timeRange"
                  value={newReport.timeRange}
                  onChange={(e) => setNewReport({...newReport, timeRange: e.target.value})}
                  disabled={saving}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="365">Last Year</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  value={newReport.frequency}
                  onChange={(e) => setNewReport({...newReport, frequency: e.target.value})}
                  disabled={saving}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full"
                >
                  <option value="manual">Manual</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <select
                  id="format"
                  value={newReport.format}
                  onChange={(e) => setNewReport({...newReport, format: e.target.value})}
                  disabled={saving}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 border-t pt-4">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <input
                  type="checkbox"
                  checked={newReport.includeCharts}
                  onChange={(e) => setNewReport({...newReport, includeCharts: e.target.checked})}
                  disabled={saving}
                  className="w-4 h-4"
                />
                <span className="text-sm">Include Charts</span>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                <input
                  type="checkbox"
                  checked={newReport.includeTable}
                  onChange={(e) => setNewReport({...newReport, includeTable: e.target.checked})}
                  disabled={saving}
                  className="w-4 h-4"
                />
                <span className="text-sm">Include Data Table</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateReport}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Creating...' : 'Create Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Your Reports</h2>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No reports created yet</p>
              <p className="text-sm">Click "New Report" to create your first custom report</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{report.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{report.description}</p>

                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline">{report.frequency}</Badge>
                        <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                        <Badge variant="outline">{report.timeRange} days</Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Last generated: {report.lastGenerated || 'Never'}
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        <p>Metrics: {report.metrics.length}</p>
                        <p className="truncate">{report.metrics.join(', ')}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleGenerateReport(report.id)}
                        size="sm"
                        disabled={saving}
                      >
                        Generate
                      </Button>
                      <Button
                        onClick={() => handleDownloadReport(report.id)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                      <Button
                        onClick={() => handleDeleteReport(report.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weekly Performance */}
            <Card className="border cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Weekly Performance</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Deployment metrics, success rates, and latency analysis for the week
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>

            {/* Cost Optimization */}
            <Card className="border cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Cost Optimization</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cost breakdown, trends, and optimization recommendations
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>

            {/* Security Audit */}
            <Card className="border cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Security Audit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Compliance status, audit events, and vulnerability findings
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
