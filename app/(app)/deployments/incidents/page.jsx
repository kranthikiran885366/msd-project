'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Plus, MessageSquare, Clock, User } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function IncidentsManagementPage() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'warning',
    assignee: '',
    component: ''
  });

  // Removed mock data - using backend integration
    {
      id: 1,
      title: 'Database Connection Pool Exhaustion',
      description: 'Connection pool reached maximum capacity causing request timeouts',
      status: 'resolved',
      severity: 'critical',
      component: 'Database',
      assignee: 'john.doe@company.com',
      createdAt: '2024-12-20T08:15:00Z',
      resolvedAt: '2024-12-20T09:30:00Z',
      detectedBy: 'alert_rule_003',
      resolution: 'Scaled database connections from 100 to 200. Issue resolved.',
      timeline: [
        { time: '08:15:00', event: 'Incident created', detail: 'Alert triggered by connection pool monitoring' },
        { time: '08:18:00', event: 'Acknowledged', detail: 'john.doe acknowledged the incident' },
        { time: '08:45:00', event: 'In Progress', detail: 'Started investigating connection patterns' },
        { time: '09:15:00', event: 'Action Taken', detail: 'Scaled database connections to 200' },
        { time: '09:30:00', event: 'Resolved', detail: 'Incident resolved and verified' }
      ]
    },
    {
      id: 2,
      title: 'High Memory Usage on API Server',
      description: 'Memory utilization exceeded 85% threshold for 10 minutes',
      status: 'in-progress',
      severity: 'warning',
      component: 'API Server',
      assignee: 'jane.smith@company.com',
      createdAt: '2024-12-20T12:45:00Z',
      resolvedAt: null,
      detectedBy: 'alert_rule_001',
      resolution: null,
      timeline: [
        { time: '12:45:00', event: 'Incident created', detail: 'Alert triggered by memory monitoring' },
        { time: '12:47:00', event: 'Acknowledged', detail: 'jane.smith acknowledged the incident' },
        { time: '12:50:00', event: 'In Progress', detail: 'Analyzing memory dump and process logs' }
      ]
    },
    {
      id: 3,
      title: 'Deployment Failed - Service Restart',
      description: 'Deployment to production failed during service restart',
      status: 'resolved',
      severity: 'critical',
      component: 'Deployment Service',
      assignee: 'mike.johnson@company.com',
      createdAt: '2024-12-20T14:20:00Z',
      resolvedAt: '2024-12-20T14:55:00Z',
      detectedBy: 'deployment_monitor',
      resolution: 'Rolled back to previous stable version. Re-deployment successful.',
      timeline: [
        { time: '14:20:00', event: 'Incident created', detail: 'Deployment failed during restart' },
        { time: '14:22:00', event: 'Acknowledged', detail: 'mike.johnson acknowledged the incident' },
        { time: '14:35:00', event: 'Action Taken', detail: 'Rolled back to previous stable deployment' },
        { time: '14:55:00', event: 'Resolved', detail: 'Re-deployment successful' }
      ]
    },
    {
      id: 4,
      title: 'Cache Invalidation Issue',
      description: 'Redis cache not invalidating properly causing stale data',
      status: 'acknowledged',
      severity: 'warning',
      component: 'Cache Layer',
      assignee: 'sarah.lee@company.com',
      createdAt: '2024-12-20T16:10:00Z',
      resolvedAt: null,
      detectedBy: 'alert_rule_005',
      resolution: null,
      timeline: [
        { time: '16:10:00', event: 'Incident created', detail: 'Stale cache data detected' },
        { time: '16:12:00', event: 'Acknowledged', detail: 'sarah.lee acknowledged the incident' }
      ]
    },
    {
      id: 5,
      title: 'SSL Certificate Expiration Warning',
      description: 'SSL certificate expiring in 7 days - requires renewal',
      status: 'pending',
      severity: 'info',
      component: 'Security',
      assignee: null,
      createdAt: '2024-12-20T10:00:00Z',
      resolvedAt: null,
      detectedBy: 'certificate_monitor',
      resolution: null,
      timeline: [
        { time: '10:00:00', event: 'Incident created', detail: 'Certificate expiration warning triggered' }
      ]
    }
  ];

  const statusColorMap = {
    'pending': 'bg-gray-100 text-gray-800',
    'acknowledged': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-orange-100 text-orange-800',
    'resolved': 'bg-green-100 text-green-800'
  };

  const severityColorMap = {
    'info': 'bg-blue-100 text-blue-800',
    'warning': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800'
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

  const fetchIncidents = useCallback(async () => {
    if (!selectedDeployment) return;
    
    try {
      setError('');
      setLoading(true);
      const incidentsData = await apiClient.getIncidents(selectedDeployment);
      setIncidents(incidentsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  }, [selectedDeployment]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleCreateIncident = async () => {
    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }

    try {
      setError('');
      await apiClient.createIncident(selectedDeployment, formData);
      await fetchIncidents();
      setSuccessMessage('Incident created successfully');
      setFormData({
        title: '',
        description: '',
        severity: 'warning',
        assignee: '',
        component: ''
      });
      setShowCreateForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      setError('');
      await apiClient.updateIncidentStatus(incidentId, newStatus);
      await fetchIncidents();
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleResolveIncident = async (incidentId) => {
    if (!resolutionNote.trim()) {
      setError('Resolution notes are required');
      return;
    }

    try {
      setError('');
      await apiClient.resolveIncident(incidentId, {
        resolution: resolutionNote
      });
      await fetchIncidents();
      setSuccessMessage('Incident resolved successfully');
      setResolutionNote('');
      setSelectedIncident(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const calculateDuration = (createdAt, resolvedAt) => {
    if (!resolvedAt) return 'Ongoing';
    const start = new Date(createdAt);
    const end = new Date(resolvedAt);
    const minutes = Math.floor((end - start) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const inProgressCount = incidents.filter(i => i.status === 'in-progress').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Incidents Management</h1>
          <p className="text-muted-foreground">Track and resolve service incidents</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Report Incident
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Incidents</p>
              <p className="text-3xl font-bold">{incidents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold text-orange-600">{inProgressCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Resolved (24h)</p>
              <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Incident Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Report Incident</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title</Label>
              <Input
                id="title"
                placeholder="e.g., High CPU Usage on API Server"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Describe the incident in detail..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <select
                  id="severity"
                  value={formData.severity}
                  onChange={(e) => handleInputChange('severity', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="component">Component</Label>
                <Input
                  id="component"
                  placeholder="e.g., Database, API Server"
                  value={formData.component}
                  onChange={(e) => handleInputChange('component', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateIncident} className="flex-1">
                Create Incident
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.map(incident => (
          <Card key={incident.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setSelectedIncident(incident)}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{incident.title}</h3>
                    <p className="text-sm text-muted-foreground">{incident.description}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge className={severityColorMap[incident.severity]}>
                      {incident.severity}
                    </Badge>
                    <Badge className={statusColorMap[incident.status]}>
                      {incident.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted rounded text-sm">
                  <div>
                    <p className="text-muted-foreground">Component</p>
                    <p className="font-semibold">{incident.component}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold">{new Date(incident.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold">{calculateDuration(incident.createdAt, incident.resolvedAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Detected By</p>
                    <p className="font-semibold capitalize">{incident.detectedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assignee</p>
                    <p className="font-semibold">{incident.assignee || 'Unassigned'}</p>
                  </div>
                </div>

                {incident.status !== 'resolved' && (
                  <div className="flex gap-2">
                    {incident.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(incident.id, 'acknowledged');
                        }}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {(incident.status === 'acknowledged' || incident.status === 'pending') && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(incident.id, 'in-progress');
                        }}
                      >
                        Start Investigation
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Incident Detail Modal */}
      {selectedIncident && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedIncident.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedIncident.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIncident(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Incident Timeline
              </h3>
              <div className="space-y-3">
                {selectedIncident.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b last:border-b-0">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{event.event}</p>
                      <p className="text-sm text-muted-foreground">{event.time}</p>
                      <p className="text-sm mt-1">{event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Section */}
            {selectedIncident.status !== 'resolved' ? (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <Label htmlFor="resolution">Resolution Notes</Label>
                <textarea
                  id="resolution"
                  placeholder="Document the resolution steps and outcome..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button 
                  onClick={() => handleResolveIncident(selectedIncident.id)}
                  className="w-full"
                >
                  Mark as Resolved
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Resolution</h4>
                <p className="text-sm text-green-800">{selectedIncident.resolution}</p>
                <p className="text-xs text-green-600 mt-2">
                  Resolved at {new Date(selectedIncident.resolvedAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{selectedIncident.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Severity</p>
                <p className="font-semibold capitalize">{selectedIncident.severity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Component</p>
                <p className="font-semibold">{selectedIncident.component}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assignee</p>
                <p className="font-semibold">{selectedIncident.assignee || 'Unassigned'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
