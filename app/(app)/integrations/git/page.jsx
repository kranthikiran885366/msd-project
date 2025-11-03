'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, Trash2, RefreshCw, GitBranch, Copy, Link, Settings } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function GitRepositoriesPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    provider: 'github',
    repoUrl: '',
    branch: 'main',
    autoSync: true,
    deployOnPush: false
  });

  // Mock repositories
  const mockRepos = [
    {
      id: 'repo-1',
      name: 'acme-app-api',
      provider: 'github',
      owner: 'acme-corp',
      url: 'https://github.com/acme-corp/acme-app-api',
      branch: 'main',
      autoSync: true,
      deployOnPush: true,
      connected: true,
      lastSync: '2024-12-20T15:30:00Z',
      commitCount: 342,
      branches: ['main', 'develop', 'staging'],
      webhook: { id: 'wh-gh-1', status: 'active' },
      createdAt: '2024-09-15T10:00:00Z'
    },
    {
      id: 'repo-2',
      name: 'acme-frontend',
      provider: 'github',
      owner: 'acme-corp',
      url: 'https://github.com/acme-corp/acme-frontend',
      branch: 'main',
      autoSync: true,
      deployOnPush: false,
      connected: true,
      lastSync: '2024-12-20T14:15:00Z',
      commitCount: 567,
      branches: ['main', 'develop', 'feature/*'],
      webhook: { id: 'wh-gh-2', status: 'active' },
      createdAt: '2024-08-20T09:00:00Z'
    },
    {
      id: 'repo-3',
      name: 'platform-services',
      provider: 'gitlab',
      owner: 'internal',
      url: 'https://gitlab.com/internal/platform-services',
      branch: 'develop',
      autoSync: true,
      deployOnPush: false,
      connected: true,
      lastSync: '2024-12-19T10:00:00Z',
      commitCount: 234,
      branches: ['develop', 'main', 'staging'],
      webhook: { id: 'wh-gl-1', status: 'active' },
      createdAt: '2024-10-01T14:30:00Z'
    },
    {
      id: 'repo-4',
      name: 'legacy-monolith',
      provider: 'github',
      owner: 'acme-corp',
      url: 'https://github.com/acme-corp/legacy-monolith',
      branch: 'master',
      autoSync: false,
      deployOnPush: false,
      connected: false,
      lastSync: '2024-11-15T08:00:00Z',
      commitCount: 1203,
      branches: ['master', 'develop'],
      webhook: { id: 'wh-gh-3', status: 'disconnected' },
      createdAt: '2024-07-10T11:00:00Z'
    },
    {
      id: 'repo-5',
      name: 'microservices-auth',
      provider: 'github',
      owner: 'acme-corp',
      url: 'https://github.com/acme-corp/microservices-auth',
      branch: 'main',
      autoSync: true,
      deployOnPush: true,
      connected: true,
      lastSync: '2024-12-20T16:00:00Z',
      commitCount: 89,
      branches: ['main', 'develop'],
      webhook: { id: 'wh-gh-4', status: 'active' },
      createdAt: '2024-11-05T13:00:00Z'
    }
  ];

  useEffect(() => {
    setRepos(mockRepos);
    setLoading(false);
  }, []);

  const handleAddRepository = async () => {
    if (!formData.repoUrl.trim()) {
      setError('Repository URL is required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.connectGitRepository(formData);

      if (response.success) {
        const newRepo = {
          id: `repo-${repos.length + 1}`,
          name: formData.repoUrl.split('/').pop().replace('.git', ''),
          ...formData,
          connected: true,
          lastSync: new Date().toISOString(),
          commitCount: 0,
          branches: [formData.branch],
          webhook: { id: 'wh-new', status: 'active' },
          createdAt: new Date().toISOString()
        };
        setRepos([...repos, newRepo]);
        setSuccessMessage('Repository connected successfully');
        setFormData({ provider: 'github', repoUrl: '', branch: 'main', autoSync: true, deployOnPush: false });
        setShowForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to connect repository');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDisconnectRepo = async (repoId) => {
    if (!confirm('Are you sure you want to disconnect this repository?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.disconnectGitRepository(repoId);

      if (response.success) {
        setRepos(repos.filter(r => r.id !== repoId));
        setSuccessMessage('Repository disconnected successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to disconnect repository');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleSyncRepository = async (repoId) => {
    try {
      setError('');
      const response = await apiClient.syncGitRepository(repoId);

      if (response.success) {
        setRepos(repos.map(r =>
          r.id === repoId ? {...r, lastSync: new Date().toISOString()} : r
        ));
        setSuccessMessage('Repository synced successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to sync repository');
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

  const connectedCount = repos.filter(r => r.connected).length;
  const autoSyncCount = repos.filter(r => r.autoSync).length;
  const deployOnPushCount = repos.filter(r => r.deployOnPush).length;

  const providerIcons = {
    github: <GitBranch className="w-5 h-5" />,
    gitlab: <GitBranch className="w-5 h-5" />
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Git Repositories</h1>
          <p className="text-muted-foreground">Connect and manage Git repositories for deployments</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Connect Repository
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Repositories</p>
              <p className="text-3xl font-bold">{repos.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Connected</p>
              <p className="text-3xl font-bold text-green-600">{connectedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Auto-sync Enabled</p>
              <p className="text-3xl font-bold text-blue-600">{autoSyncCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Deploy on Push</p>
              <p className="text-3xl font-bold text-purple-600">{deployOnPushCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connect Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Git Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <select
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                  <option value="gitea">Gitea</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Repository URL *</Label>
                <Input
                  id="url"
                  placeholder="https://github.com/owner/repo"
                  value={formData.repoUrl}
                  onChange={(e) => setFormData({...formData, repoUrl: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Default Branch</Label>
                <Input
                  id="branch"
                  placeholder="main"
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoSync}
                    onChange={(e) => setFormData({...formData, autoSync: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span>Enable Auto-sync</span>
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.deployOnPush}
                    onChange={(e) => setFormData({...formData, deployOnPush: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span>Deploy on Push</span>
                </Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddRepository} className="flex-1">Connect Repository</Button>
              <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repositories List */}
      <div className="space-y-4">
        {repos.map(repo => (
          <Card key={repo.id} className={`hover:shadow-md transition ${repo.connected ? '' : 'opacity-60'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                {/* Repository Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {providerIcons[repo.provider]}
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{repo.name}</h3>
                      <p className="text-sm text-muted-foreground break-all">{repo.owner}</p>
                    </div>
                  </div>

                  {/* Status and Branches */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={repo.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {repo.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <GitBranch className="w-3 h-3" />
                      {repo.branch}
                    </Badge>
                    {repo.autoSync && <Badge variant="secondary">Auto-sync</Badge>}
                    {repo.deployOnPush && <Badge className="bg-purple-100 text-purple-800">Deploy on Push</Badge>}
                  </div>

                  {/* Repository Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t text-sm">
                    <div>
                      <p className="text-muted-foreground">Commits</p>
                      <p className="font-semibold">{repo.commitCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branches</p>
                      <p className="font-semibold">{repo.branches.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Webhook</p>
                      <Badge variant={repo.webhook.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                        {repo.webhook.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Sync</p>
                      <p className="font-semibold">{new Date(repo.lastSync).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Branches */}
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Available Branches:</p>
                    <div className="flex flex-wrap gap-1">
                      {repo.branches.map(branch => (
                        <Badge key={branch} variant="outline" className="text-xs">
                          {branch}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {repo.connected && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncRepository(repo.id)}
                      className="gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnectRepo(repo.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold mb-2">GitHub Setup:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create a Personal Access Token in GitHub Settings → Developer settings → Personal access tokens</li>
              <li>Grant repo and workflow scopes</li>
              <li>Paste the token URL above</li>
              <li>The webhook will be automatically configured</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold mb-2">GitLab Setup:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create a Personal Access Token in Settings → Access Tokens</li>
              <li>Grant api and read_api scopes</li>
              <li>Paste the repository URL and token</li>
              <li>Enable webhooks in project settings if needed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
