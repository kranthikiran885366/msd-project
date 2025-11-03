'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Plus, Trash2, Settings, Play, Clock } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function TektonPage() {
  const [pipelines, setPipelines] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newPipeline, setNewPipeline] = useState({
    name: '',
    description: '',
    yamlContent: '',
    tasks: [],
  });

  // Fetch Tekton data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [pipelinesRes, runsRes] = await Promise.all([
          apiClient.getTektonPipelines(),
          apiClient.getTektonRuns()
        ]);

        if (pipelinesRes.success) setPipelines(pipelinesRes.data || []);
        if (runsRes.success) setRuns(runsRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch Tekton data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create pipeline
  const handleCreatePipeline = async () => {
    try {
      setError('');
      if (!newPipeline.name || !newPipeline.yamlContent) {
        setError('Pipeline name and YAML content are required');
        return;
      }

      setSaving(true);
      const response = await apiClient.createTektonPipeline(newPipeline);

      if (response.success) {
        setPipelines([...pipelines, response.data]);
        setNewPipeline({
          name: '',
          description: '',
          yamlContent: '',
          tasks: [],
        });
        setSuccessMessage('Pipeline created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to create pipeline');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Delete pipeline
  const handleDeletePipeline = async (pipelineId) => {
    if (!confirm('Delete this pipeline?')) return;

    try {
      setError('');
      setSaving(true);
      const response = await apiClient.deleteTektonPipeline(pipelineId);

      if (response.success) {
        setPipelines(pipelines.filter(p => p.id !== pipelineId));
        setSuccessMessage('Pipeline deleted');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete pipeline');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Trigger pipeline run
  const handleTriggerRun = async (pipelineId) => {
    try {
      setError('');
      setSaving(true);
      const response = await apiClient.triggerTektonRun(pipelineId);

      if (response.success) {
        setRuns([response.data, ...runs]);
        setSuccessMessage('Pipeline run triggered');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to trigger run');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading Tekton pipelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Tekton Pipelines</h1>
        <p className="text-muted-foreground">
          Cloud-native CI/CD pipelines on Kubernetes
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

      {/* Create Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pipelineName">Pipeline Name</Label>
              <Input
                id="pipelineName"
                placeholder="e.g., Build and Test"
                value={newPipeline.name}
                onChange={(e) => setNewPipeline({...newPipeline, name: e.target.value})}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Pipeline description"
                value={newPipeline.description}
                onChange={(e) => setNewPipeline({...newPipeline, description: e.target.value})}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yamlContent">Pipeline YAML</Label>
            <Textarea
              id="yamlContent"
              placeholder="apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: build-test-deploy
spec:
  tasks:
    - name: build
      taskRef:
        name: buildah
      params:
        - name: image
          value: registry.example.com/my-app:latest"
              value={newPipeline.yamlContent}
              onChange={(e) => setNewPipeline({...newPipeline, yamlContent: e.target.value})}
              disabled={saving}
              className="font-mono text-xs min-h-56"
            />
          </div>

          <Button 
            onClick={handleCreatePipeline}
            disabled={saving || !newPipeline.name || !newPipeline.yamlContent}
            className="w-full"
          >
            {saving ? 'Creating...' : 'Create Pipeline'}
          </Button>
        </CardContent>
      </Card>

      {/* Pipelines */}
      <Card>
        <CardHeader>
          <CardTitle>Tekton Pipelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipelines.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pipelines configured</p>
            ) : (
              pipelines.map(pipeline => (
                <div key={pipeline.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{pipeline.name}</p>
                      {pipeline.description && (
                        <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                      )}
                    </div>
                    <Badge variant={pipeline.status === 'active' ? 'default' : 'outline'}>
                      {pipeline.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Tasks: {pipeline.tasks?.length || 0}</p>
                    <p>Last run: {pipeline.lastRun || 'Never'}</p>
                  </div>

                  <div className="p-3 bg-muted rounded font-mono text-xs overflow-x-auto max-h-32 overflow-y-auto">
                    {pipeline.yamlContent.split('\n').slice(0, 10).join('\n')}
                    {pipeline.yamlContent.split('\n').length > 10 && '...'}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleTriggerRun(pipeline.id)}
                      disabled={saving}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Trigger Run
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
                      onClick={() => handleDeletePipeline(pipeline.id)}
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

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {runs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No runs yet</p>
            ) : (
              runs.slice(0, 10).map(run => (
                <div key={run.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{run.pipelineName}</p>
                    <p className="text-sm text-muted-foreground">
                      Started: {new Date(run.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        run.status === 'success' ? 'default' :
                        run.status === 'failed' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {run.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{run.duration}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Tekton Benefits</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• Cloud-native CI/CD pipelines running on Kubernetes</p>
          <p>• Reusable Tasks and Pipelines shared across teams</p>
          <p>• Tekton Hub provides community-contributed Tasks</p>
          <p>• Built-in source control integration (Git, GitHub)</p>
          <p>• Webhook support for automated pipeline triggering</p>
        </CardContent>
      </Card>
    </div>
  );
}
