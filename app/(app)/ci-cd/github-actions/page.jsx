'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, Github, Plus, Trash2, Settings, PlayCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function GitHubActionsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});

  const [newSecret, setNewSecret] = useState({ name: '', value: '' });
  const [newWorkflow, setNewWorkflow] = useState({ 
    name: '', 
    yamlContent: '', 
    events: ['push'],
    branches: ['main']
  });

  // Fetch GitHub Actions data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [workflowsRes, secretsRes] = await Promise.all([
          apiClient.getGitHubWorkflows(),
          apiClient.getGitHubSecrets()
        ]);

        if (workflowsRes.success) setWorkflows(workflowsRes.data || []);
        if (secretsRes.success) setSecrets(secretsRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch GitHub Actions data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add new secret
  const handleAddSecret = async () => {
    try {
      setError('');
      if (!newSecret.name || !newSecret.value) {
        setError('Secret name and value are required');
        return;
      }

      setSaving(true);
      const response = await apiClient.createGitHubSecret(newSecret.name, newSecret.value);

      if (response.success) {
        setSecrets([...secrets, response.data]);
        setNewSecret({ name: '', value: '' });
        setSuccessMessage('Secret created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to create secret');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Delete secret
  const handleDeleteSecret = async (secretName) => {
    if (!confirm(`Delete secret "${secretName}"?`)) return;

    try {
      setError('');
      setSaving(true);
      const response = await apiClient.deleteGitHubSecret(secretName);

      if (response.success) {
        setSecrets(secrets.filter(s => s.name !== secretName));
        setSuccessMessage('Secret deleted');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete secret');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Create workflow
  const handleCreateWorkflow = async () => {
    try {
      setError('');
      if (!newWorkflow.name || !newWorkflow.yamlContent) {
        setError('Workflow name and YAML content are required');
        return;
      }

      setSaving(true);
      const response = await apiClient.createGitHubWorkflow(newWorkflow);

      if (response.success) {
        setWorkflows([...workflows, response.data]);
        setNewWorkflow({ name: '', yamlContent: '', events: ['push'], branches: ['main'] });
        setSuccessMessage('Workflow created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to create workflow');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Trigger workflow
  const handleTriggerWorkflow = async (workflowId) => {
    try {
      setError('');
      setSaving(true);
      const response = await apiClient.triggerGitHubWorkflow(workflowId);

      if (response.success) {
        setSuccessMessage('Workflow triggered successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to trigger workflow');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Delete workflow
  const handleDeleteWorkflow = async (workflowId) => {
    if (!confirm('Delete this workflow?')) return;

    try {
      setError('');
      setSaving(true);
      const response = await apiClient.deleteGitHubWorkflow(workflowId);

      if (response.success) {
        setWorkflows(workflows.filter(w => w.id !== workflowId));
        setSuccessMessage('Workflow deleted');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete workflow');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Copy to clipboard
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading GitHub Actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Github className="w-8 h-8" />
          GitHub Actions
        </h1>
        <p className="text-muted-foreground">
          Configure and manage CI/CD workflows with GitHub Actions
        </p>
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

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="secrets">Secrets</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          {/* Create Workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflowName">Workflow Name</Label>
                <Input
                  id="workflowName"
                  placeholder="e.g., Build and Deploy"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yamlContent">YAML Content</Label>
                <Textarea
                  id="yamlContent"
                  placeholder="name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18"
                  value={newWorkflow.yamlContent}
                  onChange={(e) => setNewWorkflow({...newWorkflow, yamlContent: e.target.value})}
                  disabled={saving}
                  className="font-mono text-xs min-h-64"
                />
              </div>

              <Button 
                onClick={handleCreateWorkflow}
                disabled={saving || !newWorkflow.name || !newWorkflow.yamlContent}
                className="w-full"
              >
                {saving ? 'Creating...' : 'Create Workflow'}
              </Button>
            </CardContent>
          </Card>

          {/* Workflows List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No workflows configured</p>
                ) : (
                  workflows.map(workflow => (
                    <div key={workflow.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{workflow.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Triggers: {workflow.events?.join(', ') || 'N/A'}
                          </p>
                        </div>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'outline'}>
                          {workflow.status}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Last run: {workflow.lastRun || 'Never'}</p>
                        <p>Success rate: {workflow.successRate}%</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleTriggerWorkflow(workflow.id)}
                          disabled={saving}
                          className="flex-1"
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Trigger
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Secrets Tab */}
        <TabsContent value="secrets" className="space-y-4">
          {/* Add Secret */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Secret
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="secretName">Secret Name</Label>
                  <Input
                    id="secretName"
                    placeholder="e.g., DOCKER_PASSWORD"
                    value={newSecret.name}
                    onChange={(e) => setNewSecret({...newSecret, name: e.target.value})}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretValue">Secret Value</Label>
                  <Input
                    id="secretValue"
                    type="password"
                    placeholder="Enter secret value"
                    value={newSecret.value}
                    onChange={(e) => setNewSecret({...newSecret, value: e.target.value})}
                    disabled={saving}
                  />
                </div>
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Secrets are encrypted and cannot be displayed after creation
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleAddSecret}
                disabled={saving || !newSecret.name || !newSecret.value}
                className="w-full"
              >
                {saving ? 'Creating...' : 'Add Secret'}
              </Button>
            </CardContent>
          </Card>

          {/* Secrets List */}
          <Card>
            <CardHeader>
              <CardTitle>Repository Secrets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {secrets.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No secrets configured</p>
                ) : (
                  secrets.map(secret => (
                    <div key={secret.name} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-mono text-sm">{secret.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(secret.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSecret(secret.name)}
                        disabled={saving}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">GitHub Actions Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• Workflows are defined in YAML format in your repository</p>
          <p>• Secrets are encrypted and used in your workflow steps</p>
          <p>• Common triggers: push, pull_request, schedule, workflow_dispatch</p>
          <p>• Use $&#123;&#123; secrets.SECRET_NAME &#125;&#125; to reference secrets in workflows</p>
          <p>• GitHub provides free minutes for public repositories</p>
        </CardContent>
      </Card>
    </div>
  );
}
