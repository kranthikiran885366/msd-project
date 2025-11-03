'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, Plus, Trash2, Settings, GitBranch, Zap } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ArgoCDPage() {
  const [applications, setApplications] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(null);
  const [showToken, setShowToken] = useState(false);

  const [newApp, setNewApp] = useState({
    name: '',
    repoUrl: '',
    targetRevision: 'main',
    path: '.',
    destServer: 'https://kubernetes.default.svc',
    destNamespace: 'default',
  });

  const [configForm, setConfigForm] = useState({
    argoCDUrl: '',
    apiToken: '',
    syncWave: 'AUTO',
    prune: true,
    selfHeal: true,
  });

  // Fetch ArgoCD data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [appsRes, configRes] = await Promise.all([
          apiClient.getArgoCDApplications(),
          apiClient.getArgoCDConfig()
        ]);

        if (appsRes.success) setApplications(appsRes.data || []);
        if (configRes.success) {
          setConfig(configRes.data);
          setConfigForm({
            argoCDUrl: configRes.data.argoCDUrl || '',
            apiToken: configRes.data.apiToken ? '••••••••' : '',
            syncWave: configRes.data.syncWave || 'AUTO',
            prune: configRes.data.prune !== false,
            selfHeal: configRes.data.selfHeal !== false,
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch ArgoCD data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create application
  const handleCreateApp = async () => {
    try {
      setError('');
      if (!newApp.name || !newApp.repoUrl) {
        setError('Application name and repository URL are required');
        return;
      }

      setSaving(true);
      const response = await apiClient.createArgoCDApplication(newApp);

      if (response.success) {
        setApplications([...applications, response.data]);
        setNewApp({
          name: '',
          repoUrl: '',
          targetRevision: 'main',
          path: '.',
          destServer: 'https://kubernetes.default.svc',
          destNamespace: 'default',
        });
        setSuccessMessage('Application created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to create application');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Delete application
  const handleDeleteApp = async (appId) => {
    if (!confirm('Delete this application?')) return;

    try {
      setError('');
      setSaving(true);
      const response = await apiClient.deleteArgoCDApplication(appId);

      if (response.success) {
        setApplications(applications.filter(a => a.id !== appId));
        setSuccessMessage('Application deleted');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete application');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Sync application
  const handleSyncApp = async (appId) => {
    try {
      setError('');
      setSaving(true);
      const response = await apiClient.syncArgoCDApplication(appId);

      if (response.success) {
        setSuccessMessage('Sync initiated');
        const updated = await apiClient.getArgoCDApplications();
        if (updated.success) setApplications(updated.data || []);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to sync application');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Save config
  const handleSaveConfig = async () => {
    try {
      setError('');
      if (!configForm.argoCDUrl) {
        setError('ArgoCD URL is required');
        return;
      }

      setSaving(true);
      const data = { ...configForm };
      if (data.apiToken === '••••••••') delete data.apiToken;

      const response = await apiClient.updateArgoCDConfig(data);

      if (response.success) {
        setConfig(response.data);
        setSuccessMessage('Configuration saved');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to save configuration');
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
          <p className="text-muted-foreground">Loading ArgoCD configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">ArgoCD Integration</h1>
        <p className="text-muted-foreground">
          Manage GitOps continuous deployment with ArgoCD
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

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            ArgoCD Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="argoCDUrl">ArgoCD Server URL</Label>
              <Input
                id="argoCDUrl"
                placeholder="https://argocd.example.com"
                value={configForm.argoCDUrl}
                onChange={(e) => setConfigForm({...configForm, argoCDUrl: e.target.value})}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <div className="flex gap-2">
                <Input
                  id="apiToken"
                  type={showToken ? 'text' : 'password'}
                  placeholder="Enter API token"
                  value={configForm.apiToken}
                  onChange={(e) => setConfigForm({...configForm, apiToken: e.target.value})}
                  disabled={saving}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Default Options</p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.prune}
                  onChange={(e) => setConfigForm({...configForm, prune: e.target.checked})}
                  disabled={saving}
                />
                Prune
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.selfHeal}
                  onChange={(e) => setConfigForm({...configForm, selfHeal: e.target.checked})}
                  disabled={saving}
                />
                Self Heal
              </label>
            </div>
          </div>

          <Button 
            onClick={handleSaveConfig}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardContent>
      </Card>

      {/* Create Application */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName">Application Name</Label>
            <Input
              id="appName"
              placeholder="e.g., my-app"
              value={newApp.name}
              onChange={(e) => setNewApp({...newApp, name: e.target.value})}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repoUrl">Repository URL</Label>
            <Input
              id="repoUrl"
              placeholder="https://github.com/username/repo"
              value={newApp.repoUrl}
              onChange={(e) => setNewApp({...newApp, repoUrl: e.target.value})}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetRevision">Target Revision</Label>
              <Input
                id="targetRevision"
                placeholder="main"
                value={newApp.targetRevision}
                onChange={(e) => setNewApp({...newApp, targetRevision: e.target.value})}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                placeholder="./"
                value={newApp.path}
                onChange={(e) => setNewApp({...newApp, path: e.target.value})}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destServer">Destination Server</Label>
              <Input
                id="destServer"
                placeholder="https://kubernetes.default.svc"
                value={newApp.destServer}
                onChange={(e) => setNewApp({...newApp, destServer: e.target.value})}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destNamespace">Destination Namespace</Label>
              <Input
                id="destNamespace"
                placeholder="default"
                value={newApp.destNamespace}
                onChange={(e) => setNewApp({...newApp, destNamespace: e.target.value})}
                disabled={saving}
              />
            </div>
          </div>

          <Button 
            onClick={handleCreateApp}
            disabled={saving || !newApp.name || !newApp.repoUrl}
            className="w-full"
          >
            {saving ? 'Creating...' : 'Create Application'}
          </Button>
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {applications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No applications configured</p>
            ) : (
              applications.map(app => (
                <div key={app.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{app.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <GitBranch className="w-4 h-4" />
                        {app.repoUrl}
                      </p>
                    </div>
                    <Badge variant={app.status === 'synced' ? 'default' : 'secondary'}>
                      {app.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Revision: {app.targetRevision}</p>
                    <p>Namespace: {app.destNamespace}</p>
                    <p>Health: <Badge variant="outline">{app.health}</Badge></p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleSyncApp(app.id)}
                      disabled={saving}
                      className="flex-1"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Sync
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
                      onClick={() => handleDeleteApp(app.id)}
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

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">ArgoCD GitOps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• ArgoCD continuously monitors Git repositories for deployment manifests</p>
          <p>• Applications are automatically synced when Git changes are detected</p>
          <p>• Prune removes Kubernetes resources that are no longer in Git</p>
          <p>• Self Heal automatically corrects configuration drift</p>
          <p>• Support Kustomize, Helm, and plain Kubernetes manifests</p>
        </CardContent>
      </Card>
    </div>
  );
}
