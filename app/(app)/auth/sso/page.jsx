'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, Shield, Github, Mail, Globe } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function SSOManagementPage() {
  const [ssoProviders, setSsoProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});
  
  const [formData, setFormData] = useState({
    github: { clientId: '', clientSecret: '', enabled: false },
    google: { clientId: '', clientSecret: '', enabled: false },
    gitlab: { clientId: '', clientSecret: '', enabled: false },
    microsoft: { clientId: '', clientSecret: '', enabled: false },
  });

  // Fetch SSO configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setError('');
        const response = await apiClient.getSSOConfig();
        
        if (response.success && response.data) {
          setSsoProviders(response.data);
          setFormData({
            github: response.data.github || { clientId: '', clientSecret: '', enabled: false },
            google: response.data.google || { clientId: '', clientSecret: '', enabled: false },
            gitlab: response.data.gitlab || { clientId: '', clientSecret: '', enabled: false },
            microsoft: response.data.microsoft || { clientId: '', clientSecret: '', enabled: false },
          });
        }
      } catch (err) {
        console.error('Failed to fetch SSO config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Update provider settings
  const handleProviderChange = (provider, field, value) => {
    setFormData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  // Save provider configuration
  const handleSaveProvider = async (provider) => {
    try {
      setError('');
      setSaving(true);

      const config = formData[provider];
      if (!config.clientId || !config.clientSecret) {
        setError(`Client ID and Secret are required for ${provider}`);
        return;
      }

      const response = await apiClient.updateSSOProvider(provider, config);

      if (response.success) {
        setSsoProviders(response.data);
        setSuccessMessage(`${provider} configuration updated`);
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

  // Toggle provider
  const handleToggleProvider = async (provider, enabled) => {
    try {
      setError('');
      setSaving(true);

      const response = await apiClient.updateSSOProvider(provider, {
        ...formData[provider],
        enabled
      });

      if (response.success) {
        setSsoProviders(response.data);
        setFormData(prev => ({
          ...prev,
          [provider]: { ...prev[provider], enabled }
        }));
        setSuccessMessage(`${provider} ${enabled ? 'enabled' : 'disabled'}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to update provider');
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
          <p className="text-muted-foreground">Loading SSO configuration...</p>
        </div>
      </div>
    );
  }

  const callbackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback`;

  const providers = [
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      color: 'from-gray-800 to-gray-900',
      docs: 'https://docs.github.com/en/apps/oauth-apps',
      scopes: 'user:email read:user'
    },
    {
      id: 'google',
      name: 'Google',
      icon: Mail,
      color: 'from-red-500 to-red-600',
      docs: 'https://developers.google.com/identity',
      scopes: 'email profile'
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      icon: Globe,
      color: 'from-orange-500 to-orange-600',
      docs: 'https://docs.gitlab.com/ee/api/oauth2.html',
      scopes: 'api read_user'
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      icon: Globe,
      color: 'from-blue-500 to-blue-600',
      docs: 'https://docs.microsoft.com/en-us/azure/active-directory',
      scopes: 'email profile'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Single Sign-On (SSO)</h1>
        <p className="text-muted-foreground">
          Configure OAuth 2.0 providers for seamless authentication
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

      {/* Callback URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Callback URL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">
            Use this URL when configuring OAuth applications:
          </p>
          <div className="flex gap-2">
            <Input
              value={callbackUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(callbackUrl, 'callback')}
            >
              {copied === 'callback' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Providers */}
      <Tabs defaultValue="github" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="gitlab">GitLab</TabsTrigger>
          <TabsTrigger value="microsoft">Microsoft</TabsTrigger>
        </TabsList>

        {providers.map((provider) => {
          const Icon = provider.icon;
          const config = formData[provider.id];

          return (
            <TabsContent key={provider.id} value={provider.id} className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>{provider.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">OAuth 2.0 Provider</p>
                    </div>
                  </div>
                  {config?.enabled && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Enabled</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="text-sm">
                        Visit {' '}
                        <a 
                          href={provider.docs} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          {provider.name} documentation
                        </a>
                        {' '} to create an application
                      </p>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-clientId`}>Client ID</Label>
                      <Input
                        id={`${provider.id}-clientId`}
                        placeholder="Enter Client ID"
                        value={config?.clientId || ''}
                        onChange={(e) => handleProviderChange(provider.id, 'clientId', e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-clientSecret`}>Client Secret</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`${provider.id}-clientSecret`}
                          type={showSecrets[provider.id] ? 'text' : 'password'}
                          placeholder="Enter Client Secret"
                          value={config?.clientSecret || ''}
                          onChange={(e) => handleProviderChange(provider.id, 'clientSecret', e.target.value)}
                          disabled={saving}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSecrets(prev => ({
                            ...prev,
                            [provider.id]: !prev[provider.id]
                          }))}
                        >
                          {showSecrets[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs font-semibold mb-2">Required Scopes:</p>
                      <code className="text-xs text-muted-foreground">{provider.scopes}</code>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Redirect URI:</p>
                      <code className="text-xs text-blue-800">{callbackUrl}</code>
                    </div>

                    <div className="flex gap-3 pt-4">
                      {config?.enabled ? (
                        <Button 
                          onClick={() => handleToggleProvider(provider.id, false)}
                          disabled={saving}
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
                        >
                          Disable {provider.name}
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleToggleProvider(provider.id, true)}
                          disabled={saving || !config?.clientId || !config?.clientSecret}
                          className="flex-1"
                        >
                          Enable {provider.name}
                        </Button>
                      )}
                      <Button 
                        onClick={() => handleSaveProvider(provider.id)}
                        disabled={saving || !config?.clientId || !config?.clientSecret}
                        variant="outline"
                        className="flex-1"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-blue-900">
          <p>
            <strong>1. Create OAuth Application:</strong> Go to each provider's developer console and create a new OAuth application
          </p>
          <p>
            <strong>2. Configure Redirect URI:</strong> Set the callback URL above as the authorized redirect URI
          </p>
          <p>
            <strong>3. Copy Credentials:</strong> Copy the Client ID and Client Secret from the provider
          </p>
          <p>
            <strong>4. Paste & Enable:</strong> Paste credentials above and enable the provider
          </p>
          <p>
            <strong>5. Request Scopes:</strong> Ensure all required scopes are requested during OAuth setup
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
