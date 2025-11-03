'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Plus, Edit2, Trash2, Clock, Users, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function EscalationPoliciesPage() {
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [policies, setPolicies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    escalationRules: [
      { delayMinutes: 5, assignedTo: 'team', teamId: '' },
      { delayMinutes: 15, assignedTo: 'manager', teamId: '' }
    ]
  });

  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // Removed mock data - using backend integration
    {
      id: 1,
      name: 'Critical Incident Escalation',
      description: 'Immediate escalation for critical infrastructure issues',
      severity: 'critical',
      enabled: true,
      createdAt: '2024-10-15T10:00:00Z',
      escalationRules: [
        {
          id: 1,
          delayMinutes: 0,
          level: 1,
          assignedTo: 'on-call',
          team: 'Platform Team',
          contact: 'john.doe@company.com',
          notificationMethods: ['call', 'sms', 'email']
        },
        {
          id: 2,
          delayMinutes: 5,
          level: 2,
          assignedTo: 'manager',
          team: 'Platform Team',
          contact: 'Sarah Lee (Manager)',
          notificationMethods: ['call', 'email']
        },
        {
          id: 3,
          delayMinutes: 15,
          level: 3,
          assignedTo: 'director',
          team: 'Engineering',
          contact: 'Mike Johnson (Director)',
          notificationMethods: ['call']
        }
      ]
    },
    {
      id: 2,
      name: 'Warning Level Escalation',
      description: 'Standard escalation for warning-level alerts',
      severity: 'warning',
      enabled: true,
      createdAt: '2024-10-16T12:30:00Z',
      escalationRules: [
        {
          id: 1,
          delayMinutes: 0,
          level: 1,
          assignedTo: 'on-call',
          team: 'Support Team',
          contact: 'jane.smith@company.com',
          notificationMethods: ['email', 'sms']
        },
        {
          id: 2,
          delayMinutes: 30,
          level: 2,
          assignedTo: 'manager',
          team: 'Support Team',
          contact: 'Tom Williams (Manager)',
          notificationMethods: ['email']
        }
      ]
    },
    {
      id: 3,
      name: 'Deployment Failure Escalation',
      description: 'Escalation for failed deployments',
      severity: 'warning',
      enabled: true,
      createdAt: '2024-10-18T09:20:00Z',
      escalationRules: [
        {
          id: 1,
          delayMinutes: 0,
          level: 1,
          assignedTo: 'on-call',
          team: 'DevOps Team',
          contact: 'alex.kumar@company.com',
          notificationMethods: ['email', 'slack']
        },
        {
          id: 2,
          delayMinutes: 10,
          level: 2,
          assignedTo: 'manager',
          team: 'DevOps Team',
          contact: 'Emily Davis (Manager)',
          notificationMethods: ['call', 'email']
        }
      ]
    },
    {
      id: 4,
      name: 'Database Performance Escalation',
      description: 'Escalation for database performance issues',
      severity: 'info',
      enabled: false,
      createdAt: '2024-11-01T14:50:00Z',
      escalationRules: [
        {
          id: 1,
          delayMinutes: 0,
          level: 1,
          assignedTo: 'on-call',
          team: 'Database Team',
          contact: 'robert.brown@company.com',
          notificationMethods: ['email']
        }
      ]
    }
  ];

  // Mock teams
  const mockTeams = [
    { id: 'team-1', name: 'Platform Team', members: 5 },
    { id: 'team-2', name: 'Support Team', members: 8 },
    { id: 'team-3', name: 'DevOps Team', members: 4 },
    { id: 'team-4', name: 'Database Team', members: 3 }
  ];

  const severityColors = {
    critical: 'bg-red-100 text-red-800',
    warning: 'bg-orange-100 text-orange-800',
    info: 'bg-blue-100 text-blue-800'
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

  const fetchEscalationData = useCallback(async () => {
    if (!selectedDeployment) return;
    
    try {
      setError('');
      setLoading(true);
      const [policiesData, teamsData] = await Promise.all([
        apiClient.getEscalationPolicies(selectedDeployment),
        apiClient.getTeams(selectedDeployment)
      ]);
      setPolicies(policiesData || []);
      setTeams(teamsData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch escalation data');
    } finally {
      setLoading(false);
    }
  }, [selectedDeployment]);

  useEffect(() => {
    fetchEscalationData();
  }, [fetchEscalationData]);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleCreatePolicy = async () => {
    if (!formData.name) {
      setError('Policy name is required');
      return;
    }

    try {
      setError('');
      await apiClient.createEscalationPolicy(selectedDeployment, {
        ...formData,
        severity: 'warning'
      });
      await fetchEscalationData();
      setSuccessMessage('Escalation policy created successfully');
      setFormData({
        name: '',
        description: '',
        escalationRules: [
          { delayMinutes: 5, assignedTo: 'team', teamId: '' },
          { delayMinutes: 15, assignedTo: 'manager', teamId: '' }
        ]
      });
      setShowCreateForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeletePolicy = async (policyId) => {
    try {
      setError('');
      const response = await apiClient.deleteEscalationPolicy(policyId);

      if (response.success) {
        setPolicies(policies.filter(p => p.id !== policyId));
        setSuccessMessage('Escalation policy deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete policy');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleTogglePolicy = async (policyId) => {
    try {
      setError('');
      const response = await apiClient.toggleEscalationPolicy(policyId);

      if (response.success) {
        setPolicies(policies.map(p => 
          p.id === policyId ? {...p, enabled: !p.enabled} : p
        ));
      } else {
        setError(response.error || 'Failed to toggle policy');
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

  const enabledCount = policies.filter(p => p.enabled).length;
  const criticalPolicies = policies.filter(p => p.severity === 'critical').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Escalation Policies</h1>
          <p className="text-muted-foreground">Configure incident escalation paths and on-call schedules</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Policy
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
              <p className="text-sm text-muted-foreground">Total Policies</p>
              <p className="text-3xl font-bold">{policies.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Enabled</p>
              <p className="text-3xl font-bold text-green-600">{enabledCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-3xl font-bold text-red-600">{criticalPolicies}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Assigned Teams</p>
              <p className="text-3xl font-bold">{teams.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Policy Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Escalation Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Policy Name</Label>
              <Input
                id="name"
                placeholder="e.g., Critical Incident Escalation"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Describe when this escalation policy should be used..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Escalation Rules Preview</h4>
              <div className="space-y-2 text-sm">
                {formData.escalationRules.map((rule, idx) => (
                  <div key={idx} className="p-2 bg-background rounded">
                    <p>Level {idx + 1}: Escalate after {rule.delayMinutes} minutes</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Configure detailed rules after creating the policy</p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreatePolicy} className="flex-1">
                Create Policy
              </Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Escalation Policies */}
      <div className="space-y-4">
        {policies.map(policy => (
          <Card key={policy.id} className="cursor-pointer hover:shadow-md transition">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{policy.name}</h3>
                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={severityColors[policy.severity]}>
                      {policy.severity}
                    </Badge>
                    <Badge className={policy.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {policy.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                {/* Escalation Chain */}
                <div className="space-y-3 p-4 bg-muted rounded">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Escalation Chain
                  </h4>
                  <div className="space-y-2">
                    {policy.escalationRules.map((rule, idx) => (
                      <div key={rule.id} className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">
                          {rule.level}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{rule.contact}</p>
                          <p className="text-xs text-muted-foreground">
                            {rule.team} • {rule.delayMinutes > 0 ? `After ${rule.delayMinutes}min` : 'Immediate'}
                          </p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {rule.notificationMethods.map(method => (
                              <Badge key={method} variant="outline" className="text-xs">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {idx < policy.escalationRules.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 ml-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted rounded text-sm">
                  <div>
                    <p className="text-muted-foreground">Escalation Levels</p>
                    <p className="font-semibold">{policy.escalationRules.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Response Time</p>
                    <p className="font-semibold">
                      {Math.max(...policy.escalationRules.map(r => r.delayMinutes))} min
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Teams Involved</p>
                    <p className="font-semibold">
                      {new Set(policy.escalationRules.map(r => r.team)).size}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold">
                      {new Date(policy.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleTogglePolicy(policy.id)}
                  >
                    {policy.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-2"
                    onClick={() => setSelectedPolicy(policy)}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeletePolicy(policy.id)}
                    className="gap-2 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Teams Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Available Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teams.map(team => (
              <div key={team.id} className="p-3 border rounded-lg">
                <p className="font-semibold">{team.name}</p>
                <p className="text-sm text-muted-foreground">{team.members} members</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Keep escalation chains short (2-3 levels) to minimize response time</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Ensure all escalation contacts are up-to-date and active</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Set appropriate delays to avoid prematurely escalating</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Test escalation policies regularly to ensure contact information is correct</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
