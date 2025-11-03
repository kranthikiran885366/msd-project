'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Copy, Eye, EyeOff, Save, Trash2, Plus, Check } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function SSOConfigurationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSecret, setShowSecret] = useState({});
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showAddProvider, setShowAddProvider] = useState(false);

  const [providers, setProviders] = useState([
    {
      id: 'sso-1',
      type: 'saml',
      name: 'Okta',
      status: 'enabled',
      config: {
        entityId: 'https://acme-corp.okta.com',
        ssoUrl: 'https://acme-corp.okta.com/app/123/exk123/sso/saml',
        certificate: '-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAKc/VLGrwIlDMA0GCSqGSIb3...',
        nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-12-10T14:30:00Z'
    },
    {
      id: 'sso-2',
      type: 'oauth2',
      name: 'Google',
      status: 'enabled',
      config: {
        clientId: 'oauth2-client-id-google',
        clientSecret: 'oauth2-client-secret-...',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        scopes: ['openid', 'email', 'profile']
      },
      createdAt: '2024-02-20T09:00:00Z',
      updatedAt: '2024-12-15T11:00:00Z'
    },
    {
      id: 'sso-3',
      type: 'oauth2',
      name: 'Microsoft Entra ID',
      status: 'pending',
      config: {
        clientId: 'azure-app-id-pending',
        clientSecret: 'azure-secret-...',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scopes: ['openid', 'email', 'profile']
      },
      createdAt: '2024-03-01T15:30:00Z',
      updatedAt: '2024-03-01T15:30:00Z'
    }
  ]);

  const [newProvider, setNewProvider] = useState({
    type: 'saml',
    name: '',
    config: {}
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleToggleProvider = async (providerId, currentStatus) => {
    try {
      setError('');
      const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
      const response = await apiClient.toggleSSOProvider(providerId, newStatus);

      if (response.success) {
        setProviders(providers.map(p =>
          p.id === providerId ? {...p, status: newStatus} : p
        ));
        setSuccessMessage(`Provider ${newStatus}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to toggle provider');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!confirm('Are you sure you want to delete this SSO provider?')) {
      return;
    }

    try {
      setError('');
      const response = await apiClient.deleteSSOProvider(providerId);

      if (response.success) {
        setProviders(providers.filter(p => p.id !== providerId));
        setSuccessMessage('Provider deleted successfully');
        setSelectedProvider(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete provider');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleAddProvider = async () => {
    if (!newProvider.name) {
      setError('Provider name is required');
      return;
    }

    try {
      setError('');
      const response = await apiClient.createSSOProvider(newProvider);

      if (response.success) {
        const addedProvider = {
          id: `sso-${providers.length + 1}`,
          ...newProvider,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProviders([...providers, addedProvider]);
        setSuccessMessage('SSO provider added successfully');
        setNewProvider({ type: 'saml', name: '', config: {} });
        setShowAddProvider(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to add provider');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const copyableSecrets = ['clientSecret', 'certificate'];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  const enabledProviders = providers.filter(p => p.status === 'enabled');
  const pendingProviders = providers.filter(p => p.status === 'pending');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">SSO Configuration</h1>
          <p className="text-muted-foreground">Manage Single Sign-On providers for your organization</p>
        </div>
        <Button onClick={() => setShowAddProvider(!showAddProvider)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Provider
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
              <p className="text-sm text-muted-foreground">Total Providers</p>
              <p className="text-3xl font-bold">{providers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Enabled</p>
              <p className="text-3xl font-bold text-green-600">{enabledProviders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pending Setup</p>
              <p className="text-3xl font-bold text-orange-600">{pendingProviders.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Provider Form */}
      {showAddProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Add New SSO Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-type">Provider Type</Label>
                <select
                  id="provider-type"
                  value={newProvider.type}
                  onChange={(e) => setNewProvider({...newProvider, type: e.target.value})}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="saml">SAML 2.0</option>
                  <option value="oauth2">OAuth 2.0</option>
                  <option value="openid">OpenID Connect</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider-name">Provider Name</Label>
                <Input
                  id="provider-name"
                  placeholder="e.g., Okta, Entra ID, Ping"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddProvider}>Add Provider</Button>
              <Button onClick={() => setShowAddProvider(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Providers List */}
      <div className="space-y-4">
        {providers.map(provider => (
          <Card
            key={provider.id}
            className={`cursor-pointer hover:shadow-md transition ${selectedProvider?.id === provider.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedProvider(provider)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                {/* Provider Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                      {provider.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                      <p className="text-sm text-muted-foreground">{provider.type.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Status and Details */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <Badge
                      className={
                        provider.status === 'enabled'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {provider.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Added {new Date(provider.createdAt).toLocaleDateString()}
                    </span>
                    {provider.status === 'enabled' && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </Badge>
                    )}
                  </div>

                  {/* Configuration Details */}
                  {selectedProvider?.id === provider.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <p className="font-semibold text-sm">Configuration:</p>
                      {Object.entries(provider.config).map(([key, value]) => (
                        <div key={key} className="space-y-1 text-xs">
                          <p className="text-muted-foreground font-semibold">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <div className="flex items-start gap-2 bg-muted p-2 rounded break-all">
                            <code className="text-xs flex-1">
                              {typeof value === 'string' && (showSecret[provider.id] || !copyableSecrets.includes(key))
                                ? value
                                : typeof value === 'string' && value.length > 20
                                ? '•'.repeat(20)
                                : Array.isArray(value)
                                ? value.join(', ')
                                : String(value)}
                            </code>
                            {typeof value === 'string' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyToClipboard(String(value))}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant={provider.status === 'enabled' ? 'default' : 'outline'}
                    onClick={() => handleToggleProvider(provider.id, provider.status)}
                  >
                    {provider.status === 'enabled' ? 'Enabled' : 'Disabled'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold">SAML 2.0 Configuration:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Obtain the Assertion Consumer Service (ACS) URL from your IdP</li>
              <li>Configure the following in your IdP:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Service Provider Entity ID: {'{acme-corp-sso-entity-id}'}</li>
                  <li>Assertion Consumer Service URL (ACS): {'{your-acs-url}'}</li>
                  <li>Name ID Format: EmailAddress</li>
                </ul>
              </li>
              <li>Download the IdP metadata certificate and upload it here</li>
              <li>Test the connection before enabling for all users</li>
            </ol>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold">OAuth 2.0 / OpenID Connect:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Register your application with the OAuth provider</li>
              <li>Obtain Client ID and Client Secret</li>
              <li>Set the Redirect URI to: {'{your-redirect-uri}'}</li>
              <li>Configure the authorization, token, and userinfo endpoints</li>
              <li>Map identity provider scopes to user attributes</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Security Notice:</strong> Keep your client secrets and certificates secure. Never share these credentials. Rotate secrets periodically.
        </AlertDescription>
      </Alert>
    </div>
  );
}
