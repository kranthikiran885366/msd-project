'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Github, Link2, Zap, GitBranch, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function GitHubSetupPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const [webhookStatus, setWebhookStatus] = useState(null);
  const [autoDeployEnabled, setAutoDeployEnabled] = useState(false);
  const [previewDeployEnabled, setPreviewDeployEnabled] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [projectId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const config = await apiClient.getDeploymentConfig(projectId);
      setConfig(config);
      setAutoDeployEnabled(config?.autoDeployEnabled || false);
      setPreviewDeployEnabled(config?.previewDeployEnabled || false);
    } catch (err) {
      console.error('Failed to fetch config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupWebhook = async () => {
    if (!config?.repository) {
      setError('Repository not configured');
      return;
    }

    try {
      setLoading(true);
      const result = await apiClient.setupDeploymentWebhook(
        projectId,
        config.repository.owner,
        config.repository.name
      );
      setWebhookStatus(result);
      setError(null);
    } catch (err) {
      console.error('Failed to setup webhook:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await apiClient.updateDeploymentSettings(projectId, {
        autoDeployEnabled,
        previewDeployEnabled,
      });
      setError(null);
      // Show success message
      setTimeout(() => alert('Settings saved successfully!'), 500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GitHub Integration Setup</h1>
        <p className="text-gray-600">Configure automatic deployments from GitHub, similar to Netlify & Render</p>
      </div>

      {error && (
        <Card className="mb-6 p-4 bg-red-50 border-red-200">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </Card>
      )}

      {/* Repository Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Repository Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.repository ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Repository</label>
                  <p className="font-medium">{config.repository.fullName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Default Branch</label>
                  <p className="font-medium flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    {config.repository.defaultBranch || 'main'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Repository URL</label>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                  {config.repository.url}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">Repository connected</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-gray-600 mb-4">No repository configured yet</p>
              <Button onClick={() => router.back()} variant="outline">
                Connect Repository
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Setup */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhookStatus?.configured ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Webhook is configured</span>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Webhook ID:</strong> {webhookStatus.webhookId}</p>
                <p><strong>Events:</strong> push, pull_request</p>
                <p><strong>Last Delivery:</strong> {webhookStatus.lastDelivery ? new Date(webhookStatus.lastDelivery).toLocaleString() : 'Never'}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Set up a webhook to automatically trigger deployments when you push to GitHub.
              </p>
              <Button
                onClick={handleSetupWebhook}
                disabled={!config?.repository}
                className="gap-2"
              >
                <Link2 className="w-4 h-4" />
                Setup Webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Deployment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto Deploy */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Auto Deploy on Push</h4>
              <p className="text-sm text-gray-600">Automatically deploy when code is pushed to the default branch</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoDeployEnabled}
                onChange={(e) => setAutoDeployEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Preview Deploy */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Deployments
              </h4>
              <p className="text-sm text-gray-600">Create preview deployments for pull requests</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={previewDeployEnabled}
                onChange={(e) => setPreviewDeployEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full gap-2 mt-4"
          >
            {savingSettings ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-4">
              <Badge className="flex-shrink-0">1</Badge>
              <div>
                <h4 className="font-medium">Push to GitHub</h4>
                <p className="text-sm text-gray-600">Commit and push your code to the connected repository</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Badge className="flex-shrink-0">2</Badge>
              <div>
                <h4 className="font-medium">Webhook Triggered</h4>
                <p className="text-sm text-gray-600">GitHub sends a webhook notification to our servers</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Badge className="flex-shrink-0">3</Badge>
              <div>
                <h4 className="font-medium">Automatic Build</h4>
                <p className="text-sm text-gray-600">Build process starts automatically with your latest code</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Badge className="flex-shrink-0">4</Badge>
              <div>
                <h4 className="font-medium">Deploy to Production</h4>
                <p className="text-sm text-gray-600">Once tests pass, deploy to your production environment</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Buttons */}
      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button onClick={() => router.push(`/deployments?projectId=${projectId}`)}>
          View Deployments
        </Button>
      </div>
    </div>
  );
}
