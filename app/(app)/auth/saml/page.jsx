'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, Shield, Server, Users, Key } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function SAMLSetupPage() {
  const [samlConfig, setSamlConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});
  const [formData, setFormData] = useState({
    entryPoint: '',
    issuer: '',
    certificate: '',
    privateKey: '',
  });

  // Fetch SAML configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setError('');
        const response = await apiClient.getSAMLConfig();
        
        if (response.success && response.data) {
          setSamlConfig(response.data);
          setFormData({
            entryPoint: response.data.entryPoint || '',
            issuer: response.data.issuer || '',
            certificate: response.data.certificate || '',
            privateKey: response.data.privateKey || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch SAML config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Handle form input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save SAML configuration
  const handleSaveConfig = async () => {
    try {
      setError('');
      setSaving(true);

      if (!formData.entryPoint || !formData.issuer || !formData.certificate) {
        setError('Entry Point, Issuer, and Certificate are required');
        return;
      }

      const response = await apiClient.updateSAMLConfig({
        entryPoint: formData.entryPoint,
        issuer: formData.issuer,
        certificate: formData.certificate,
        privateKey: formData.privateKey,
      });

      if (response.success) {
        setSamlConfig(response.data);
        setSuccessMessage('SAML configuration updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Failed to save SAML config:', err);
    } finally {
      setSaving(false);
    }
  };

  // Test SAML connection
  const handleTestConnection = async () => {
    try {
      setError('');
      setSaving(true);

      const response = await apiClient.testSAMLConnection();

      if (response.success) {
        setSuccessMessage('SAML connection test successful');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'SAML connection test failed');
      }
    } catch (err) {
      setError(err.message || 'Connection test failed');
    } finally {
      setSaving(false);
    }
  };

  // Enable/Disable SAML
  const handleToggleSAML = async (enabled) => {
    try {
      setError('');
      setSaving(true);

      const response = await apiClient.updateSAMLConfig({
        enabled: enabled,
        entryPoint: formData.entryPoint,
        issuer: formData.issuer,
        certificate: formData.certificate,
        privateKey: formData.privateKey,
      });

      if (response.success) {
        setSamlConfig(response.data);
        setSuccessMessage(`SAML ${enabled ? 'enabled' : 'disabled'} successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to update SAML status');
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
          <p className="text-muted-foreground">Loading SAML configuration...</p>
        </div>
      </div>
    );
  }

  const spMetadataUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/saml/metadata`;
  const acsUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/saml/acs`;
  const sloUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/saml/slo`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">SAML Configuration</h1>
        <p className="text-muted-foreground">
          Set up SAML 2.0 single sign-on (SSO) for enterprise authentication
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

      {/* Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>SAML SSO Status</CardTitle>
          {samlConfig?.enabled && (
            <Badge className="bg-green-100 text-green-800 border-green-200">Enabled</Badge>
          )}
          {!samlConfig?.enabled && (
            <Badge variant="outline">Disabled</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <Shield className="w-5 h-5 mb-2 text-primary" />
              <p className="text-sm font-medium">Authentication Provider</p>
              <p className="text-xs text-muted-foreground mt-1">
                {samlConfig?.entryPoint ? 'Connected' : 'Not configured'}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Users className="w-5 h-5 mb-2 text-primary" />
              <p className="text-sm font-medium">User Sync</p>
              <p className="text-xs text-muted-foreground mt-1">
                {samlConfig?.syncUsers ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Server className="w-5 h-5 mb-2 text-primary" />
              <p className="text-sm font-medium">Just-in-Time Provisioning</p>
              <p className="text-xs text-muted-foreground mt-1">
                {samlConfig?.jitProvisioning ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          {samlConfig?.enabled && (
            <Button 
              variant="outline" 
              onClick={() => handleToggleSAML(false)}
              disabled={saving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
            >
              Disable SAML
            </Button>
          )}
          {!samlConfig?.enabled && (
            <Button 
              onClick={() => handleToggleSAML(true)}
              disabled={saving || !formData.entryPoint}
              className="w-full"
            >
              Enable SAML
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="mapping">User Mapping</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identity Provider (IdP) Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entryPoint">Entry Point URL</Label>
                <Input
                  id="entryPoint"
                  placeholder="https://idp.example.com/saml/authorize"
                  value={formData.entryPoint}
                  onChange={(e) => handleInputChange('entryPoint', e.target.value)}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  The URL where your SAML assertions will be posted
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer (Entity ID)</Label>
                <Input
                  id="issuer"
                  placeholder="urn:example:idp"
                  value={formData.issuer}
                  onChange={(e) => handleInputChange('issuer', e.target.value)}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier of the SAML authority
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate">X.509 Certificate</Label>
                <Textarea
                  id="certificate"
                  placeholder="-----BEGIN CERTIFICATE-----"
                  value={formData.certificate}
                  onChange={(e) => handleInputChange('certificate', e.target.value)}
                  disabled={saving}
                  className="font-mono text-xs min-h-32"
                />
                <p className="text-xs text-muted-foreground">
                  Public certificate for SAML assertion validation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key (Optional)</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="privateKey"
                    placeholder="-----BEGIN PRIVATE KEY-----"
                    value={showSecrets.privateKey ? formData.privateKey : '••••••••••'}
                    onChange={(e) => {
                      if (showSecrets.privateKey) {
                        handleInputChange('privateKey', e.target.value);
                      }
                    }}
                    disabled={saving || !showSecrets.privateKey}
                    className="font-mono text-xs min-h-32"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecrets(prev => ({...prev, privateKey: !prev.privateKey}))}
                    className="h-fit"
                  >
                    {showSecrets.privateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Private key for signing requests (optional)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleTestConnection}
                  disabled={saving || !formData.entryPoint}
                  variant="outline"
                  className="flex-1"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
                <Button 
                  onClick={handleSaveConfig}
                  disabled={saving || !formData.entryPoint}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Provider (SP) Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Provide these URLs to your SAML identity provider
                </AlertDescription>
              </Alert>

              {/* SP Metadata URL */}
              <div className="space-y-2">
                <Label>Service Provider Metadata URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={spMetadataUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(spMetadataUrl, 'spMetadata')}
                  >
                    {copied === 'spMetadata' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* ACS URL */}
              <div className="space-y-2">
                <Label>Assertion Consumer Service (ACS) URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={acsUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(acsUrl, 'acs')}
                  >
                    {copied === 'acs' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* SLO URL */}
              <div className="space-y-2">
                <Label>Single Logout (SLO) URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={sloUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(sloUrl, 'slo')}
                  >
                    {copied === 'slo' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Required Settings */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Required IdP Settings:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Name ID Format: EmailAddress</li>
                  <li>• Sign Assertions: Yes</li>
                  <li>• Include Certificate: Yes</li>
                  <li>• Sign Response: Yes (recommended)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Mapping Tab */}
        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SAML Attribute Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Configure how SAML attributes map to user profile fields
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {[
                  { name: 'Email', attribute: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress' },
                  { name: 'First Name', attribute: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname' },
                  { name: 'Last Name', attribute: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname' },
                  { name: 'Groups', attribute: 'http://schemas.xmlsoap.org/claims/Group' },
                ].map((mapping, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium">{mapping.name}</p>
                      </div>
                      <div>
                        <Input
                          value={mapping.attribute}
                          readOnly
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Configuration Tips:</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Ensure your IdP sends all required attributes</li>
                  <li>• Email is required for user identification</li>
                  <li>• Groups can be used for role-based access control</li>
                  <li>• Extra attributes will be stored in user metadata</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
