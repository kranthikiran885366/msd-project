'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, Trash2, Plus, RefreshCw, RotateCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAppStore } from '@/store/use-app-store';

export default function APIKeysPage() {
  const { projects } = useAppStore();
  const projectId = projects[0]?.id || projects[0]?._id || '';
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const [newKey, setNewKey] = useState({
    name: '',
    scopes: []
  });

  const availableScopes = [
    { id: 'deployments:read', label: 'Read Deployments' },
    { id: 'deployments:write', label: 'Create/Update Deployments' },
    { id: 'deployments:delete', label: 'Delete Deployments' },
    { id: 'logs:read', label: 'Read Logs' },
    { id: 'databases:read', label: 'Read Databases' },
    { id: 'databases:write', label: 'Manage Databases' },
    { id: 'alerts:read', label: 'Read Alerts' },
    { id: 'alerts:write', label: 'Manage Alerts' },
    { id: 'team:read', label: 'Read Team Info' },
    { id: 'billing:read', label: 'Read Billing' },
    { id: 'settings:write', label: 'Manage Settings' }
  ];

  const normalizeToken = (token, secret) => ({
    id: token._id || token.id,
    name: token.name,
    prefix: token.prefix,
    secret: secret || token.token || token.secret || '',
    scopes: token.scopes || [],
    status: token.isActive === false || token.revoked ? 'revoked' : 'active',
    createdAt: token.createdAt,
    lastUsed: token.lastUsedAt || token.lastUsed || null,
    expiresAt: token.expiresAt || null
  });

  useEffect(() => {
    const loadKeys = async () => {
      try {
        setLoading(true);
        if (!projectId) {
          setApiKeys([]);
          return;
        }

        const response = await apiClient.getApiTokens(projectId);
        const tokens = response?.tokens || response?.data || response || [];
        setApiKeys(tokens.map((token) => normalizeToken(token)));
      } catch (err) {
        setError(err.message || 'Failed to load API keys');
        setApiKeys([]);
      } finally {
        setLoading(false);
      }
    };

    loadKeys();
  }, []);

  const handleScopeToggle = (scopeId) => {
    setNewKey({
      ...newKey,
      scopes: newKey.scopes.includes(scopeId)
        ? newKey.scopes.filter(s => s !== scopeId)
        : [...newKey.scopes, scopeId]
    });
  };

  const handleCreateKey = async () => {
    if (!newKey.name.trim()) {
      setError('API key name is required');
      return;
    }

    if (newKey.scopes.length === 0) {
      setError('Select at least one scope');
      return;
    }

    try {
      setError('');
      const response = await apiClient.createApiToken({
        projectId,
        name: newKey.name,
        scopes: newKey.scopes,
      });

      const createdKey = normalizeToken(response?.data || response, response?.token || response?.data?.token);
      setApiKeys([...apiKeys, createdKey]);
        setSuccessMessage('API key created successfully');
        setNewKey({ name: '', scopes: [] });
        setShowCreateForm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      await apiClient.revokeApiToken(keyId);
      setApiKeys(apiKeys.map(k =>
        k.id === keyId ? {...k, status: 'revoked'} : k
      ));
        setSuccessMessage('API key revoked successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleRotateKey = async (keyId) => {
    if (!confirm('Are you sure you want to rotate this API key? A new key will be generated.')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.rotateApiToken(keyId);
      const rotatedSecret = response?.token || response?.data?.token || '';
      setApiKeys(apiKeys.map(k =>
        k.id === keyId ? {...k, secret: rotatedSecret || k.secret} : k
      ));
        setSuccessMessage('API key rotated successfully');
        setShowSecrets({});
        setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const activeKeys = apiKeys.filter(k => k.status === 'active').length;
  const revokedKeys = apiKeys.filter(k => k.status === 'revoked').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage API keys for programmatic access to your account</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create API Key
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Keys</p>
              <p className="text-3xl font-bold">{apiKeys.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-green-600">{activeKeys}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Revoked</p>
              <p className="text-3xl font-bold text-red-600">{revokedKeys}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">API Key Name *</Label>
              <Input
                id="key-name"
                placeholder="e.g., GitHub Actions, Monitoring Service"
                value={newKey.name}
                onChange={(e) => setNewKey({...newKey, name: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Use a descriptive name to identify this key</p>
            </div>

            <div className="space-y-3">
              <Label>Scopes *</Label>
              <p className="text-sm text-muted-foreground">Select the permissions this API key should have</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {availableScopes.map(scope => (
                  <label key={scope.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                    <input
                      type="checkbox"
                      checked={newKey.scopes.includes(scope.id)}
                      onChange={() => handleScopeToggle(scope.id)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">{scope.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Note:</strong> API keys created with limited scopes are more secure. Only grant the permissions necessary for your integration.
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateKey} className="flex-1">Create API Key</Button>
              <Button onClick={() => setShowCreateForm(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="space-y-3">
        {apiKeys.map(key => (
          <Card key={key.id} className={`hover:shadow-md transition ${key.status === 'revoked' ? 'opacity-60' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                {/* Key Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-semibold text-sm">
                      {key.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{key.name}</h3>
                      <p className="text-sm text-muted-foreground">{key.prefix}...</p>
                    </div>
                  </div>

                  {/* Status and Dates */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <Badge className={key.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {key.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                    {key.lastUsed && (
                      <span className="text-xs text-muted-foreground">
                        Last used {new Date(key.lastUsed).toLocaleDateString()}
                      </span>
                    )}
                    {!key.lastUsed && (
                      <span className="text-xs text-orange-600">Never used</span>
                    )}
                  </div>

                  {/* Secret Display */}
                  {key.status === 'active' && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 bg-muted p-2 rounded">
                        <code className="text-xs flex-1 font-mono break-all">
                          {showSecrets[key.id] ? key.secret : key.secret.substring(0, 20) + '•'.repeat(20)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowSecrets({...showSecrets, [key.id]: !showSecrets[key.id]})}
                          className="h-6 w-6 p-0"
                        >
                          {showSecrets[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyToClipboard(key.secret)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Scopes */}
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground font-semibold mb-2">Scopes:</p>
                    <div className="flex flex-wrap gap-2">
                      {key.scopes.map(scope => (
                        <Badge key={scope} variant="outline" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {key.status === 'active' && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRotateKey(key.id)}
                      className="gap-1"
                    >
                      <RotateCw className="w-4 h-4" />
                      Rotate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeKey(key.id)}
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

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Never commit API keys to version control systems</li>
            <li>Use environment variables to store and reference API keys</li>
            <li>Grant the minimum necessary permissions (scopes) for each key</li>
            <li>Rotate keys regularly, especially if you suspect they've been compromised</li>
            <li>Monitor API key usage and revoke keys that are no longer needed</li>
            <li>Use separate keys for different applications and environments (dev, staging, production)</li>
            <li>Consider using IP whitelisting for additional security</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
