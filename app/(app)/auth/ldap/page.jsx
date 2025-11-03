'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, Eye, EyeOff, Shield, Server, Users, Key, Network } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function LDAPSetupPage() {
  const [ldapConfig, setLdapConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    serverUrl: '',
    baseDN: '',
    bindDN: '',
    bindPassword: '',
    userSearchBase: '',
    userObjectClass: 'inetOrgPerson',
    userIdAttribute: 'uid',
    mailAttribute: 'mail',
    nameAttribute: 'cn',
    groupSearchBase: '',
    groupObjectClass: 'groupOfNames',
    groupMemberAttribute: 'member',
    useSSL: true,
    useTLS: false,
    syncUsers: true,
    jitProvisioning: true,
  });

  // Fetch LDAP configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setError('');
        const response = await apiClient.getLDAPConfig();
        
        if (response.success && response.data) {
          setLdapConfig(response.data);
          setFormData({
            serverUrl: response.data.serverUrl || '',
            baseDN: response.data.baseDN || '',
            bindDN: response.data.bindDN || '',
            bindPassword: response.data.bindPassword ? '••••••••' : '',
            userSearchBase: response.data.userSearchBase || '',
            userObjectClass: response.data.userObjectClass || 'inetOrgPerson',
            userIdAttribute: response.data.userIdAttribute || 'uid',
            mailAttribute: response.data.mailAttribute || 'mail',
            nameAttribute: response.data.nameAttribute || 'cn',
            groupSearchBase: response.data.groupSearchBase || '',
            groupObjectClass: response.data.groupObjectClass || 'groupOfNames',
            groupMemberAttribute: response.data.groupMemberAttribute || 'member',
            useSSL: response.data.useSSL !== false,
            useTLS: response.data.useTLS === true,
            syncUsers: response.data.syncUsers !== false,
            jitProvisioning: response.data.jitProvisioning !== false,
          });
        }
      } catch (err) {
        console.error('Failed to fetch LDAP config:', err);
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

  // Handle toggle change
  const handleToggleChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Save LDAP configuration
  const handleSaveConfig = async () => {
    try {
      setError('');
      setSaving(true);

      if (!formData.serverUrl || !formData.baseDN || !formData.bindDN) {
        setError('Server URL, Base DN, and Bind DN are required');
        return;
      }

      const configData = { ...formData };
      if (configData.bindPassword === '••••••••') {
        delete configData.bindPassword;
      }

      const response = await apiClient.updateLDAPConfig(configData);

      if (response.success) {
        setLdapConfig(response.data);
        setSuccessMessage('LDAP configuration updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Failed to save LDAP config:', err);
    } finally {
      setSaving(false);
    }
  };

  // Test LDAP connection
  const handleTestConnection = async () => {
    try {
      setError('');
      setSaving(true);

      const response = await apiClient.testLDAPConnection(formData.serverUrl);

      if (response.success) {
        setSuccessMessage('LDAP connection successful');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'LDAP connection failed');
      }
    } catch (err) {
      setError(err.message || 'Connection test failed');
    } finally {
      setSaving(false);
    }
  };

  // Sync LDAP users
  const handleSyncUsers = async () => {
    try {
      setError('');
      setSaving(true);

      const response = await apiClient.syncLDAPUsers();

      if (response.success) {
        setSuccessMessage(`Successfully synced ${response.data?.syncedCount || 0} users`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'User sync failed');
      }
    } catch (err) {
      setError(err.message || 'Sync operation failed');
    } finally {
      setSaving(false);
    }
  };

  // Enable/Disable LDAP
  const handleToggleLDAP = async (enabled) => {
    try {
      setError('');
      setSaving(true);

      const response = await apiClient.updateLDAPConfig({
        ...formData,
        enabled: enabled,
      });

      if (response.success) {
        setLdapConfig(response.data);
        setSuccessMessage(`LDAP ${enabled ? 'enabled' : 'disabled'} successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to update LDAP status');
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
          <p className="text-muted-foreground">Loading LDAP configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">LDAP Configuration</h1>
        <p className="text-muted-foreground">
          Connect your LDAP directory for enterprise authentication
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
          <CardTitle>LDAP Status</CardTitle>
          {ldapConfig?.enabled && (
            <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
          )}
          {!ldapConfig?.enabled && (
            <Badge variant="outline">Disconnected</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <Network className="w-5 h-5 mb-2 text-primary" />
              <p className="text-sm font-medium">Server Status</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ldapConfig?.enabled && ldapConfig?.serverUrl ? 'Connected' : 'Not connected'}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Users className="w-5 h-5 mb-2 text-primary" />
              <p className="text-sm font-medium">User Sync</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ldapConfig?.syncUsers ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Shield className="w-5 h-5 mb-2 text-primary" />
              <p className="text-sm font-medium">Encryption</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.useSSL ? 'SSL' : formData.useTLS ? 'TLS' : 'None'}
              </p>
            </div>
          </div>

          {ldapConfig?.enabled && (
            <Button 
              variant="outline" 
              onClick={() => handleToggleLDAP(false)}
              disabled={saving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
            >
              Disable LDAP
            </Button>
          )}
          {!ldapConfig?.enabled && (
            <Button 
              onClick={() => handleToggleLDAP(true)}
              disabled={saving || !formData.serverUrl}
              className="w-full"
            >
              Enable LDAP
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>LDAP Server Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connection Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Connection Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="serverUrl">Server URL</Label>
                <Input
                  id="serverUrl"
                  placeholder="ldap://ldap.example.com:389 or ldaps://ldap.example.com:636"
                  value={formData.serverUrl}
                  onChange={(e) => handleInputChange('serverUrl', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseDN">Base DN</Label>
                <Input
                  id="baseDN"
                  placeholder="dc=example,dc=com"
                  value={formData.baseDN}
                  onChange={(e) => handleInputChange('baseDN', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bindDN">Bind DN</Label>
                <Input
                  id="bindDN"
                  placeholder="cn=admin,dc=example,dc=com"
                  value={formData.bindDN}
                  onChange={(e) => handleInputChange('bindDN', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bindPassword">Bind Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="bindPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formData.bindPassword}
                    onChange={(e) => handleInputChange('bindPassword', e.target.value)}
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useSSL" className="font-normal text-sm cursor-pointer">Use SSL</Label>
                  <Switch
                    id="useSSL"
                    checked={formData.useSSL}
                    onCheckedChange={() => handleToggleChange('useSSL')}
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="useTLS" className="font-normal text-sm cursor-pointer">Use TLS</Label>
                  <Switch
                    id="useTLS"
                    checked={formData.useTLS}
                    onCheckedChange={() => handleToggleChange('useTLS')}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* User Search Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">User Search Configuration</h3>
              
              <div className="space-y-2">
                <Label htmlFor="userSearchBase">User Search Base</Label>
                <Input
                  id="userSearchBase"
                  placeholder="ou=users,dc=example,dc=com"
                  value={formData.userSearchBase}
                  onChange={(e) => handleInputChange('userSearchBase', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userObjectClass">User Object Class</Label>
                <Input
                  id="userObjectClass"
                  placeholder="inetOrgPerson"
                  value={formData.userObjectClass}
                  onChange={(e) => handleInputChange('userObjectClass', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userIdAttribute">User ID Attribute</Label>
                <Input
                  id="userIdAttribute"
                  placeholder="uid"
                  value={formData.userIdAttribute}
                  onChange={(e) => handleInputChange('userIdAttribute', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mailAttribute">Email Attribute</Label>
                <Input
                  id="mailAttribute"
                  placeholder="mail"
                  value={formData.mailAttribute}
                  onChange={(e) => handleInputChange('mailAttribute', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameAttribute">Name Attribute</Label>
                <Input
                  id="nameAttribute"
                  placeholder="cn"
                  value={formData.nameAttribute}
                  onChange={(e) => handleInputChange('nameAttribute', e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-semibold text-sm">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="groupSearchBase">Group Search Base (Optional)</Label>
                <Input
                  id="groupSearchBase"
                  placeholder="ou=groups,dc=example,dc=com"
                  value={formData.groupSearchBase}
                  onChange={(e) => handleInputChange('groupSearchBase', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupObjectClass">Group Object Class</Label>
                <Input
                  id="groupObjectClass"
                  placeholder="groupOfNames"
                  value={formData.groupObjectClass}
                  onChange={(e) => handleInputChange('groupObjectClass', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupMemberAttribute">Group Member Attribute</Label>
                <Input
                  id="groupMemberAttribute"
                  placeholder="member"
                  value={formData.groupMemberAttribute}
                  onChange={(e) => handleInputChange('groupMemberAttribute', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <Label htmlFor="syncUsers" className="font-normal text-sm cursor-pointer">Sync Users</Label>
                  <Switch
                    id="syncUsers"
                    checked={formData.syncUsers}
                    onCheckedChange={() => handleToggleChange('syncUsers')}
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="jitProvisioning" className="font-normal text-sm cursor-pointer">Just-in-Time Provisioning</Label>
                  <Switch
                    id="jitProvisioning"
                    checked={formData.jitProvisioning}
                    onCheckedChange={() => handleToggleChange('jitProvisioning')}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 flex-wrap">
            <Button 
              onClick={handleTestConnection}
              disabled={saving || !formData.serverUrl}
              variant="outline"
              className="flex-1 min-w-48"
            >
              <Network className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
            <Button 
              onClick={handleSyncUsers}
              disabled={saving || !ldapConfig?.enabled}
              variant="outline"
              className="flex-1 min-w-48"
            >
              <Users className="w-4 h-4 mr-2" />
              Sync Users Now
            </Button>
            <Button 
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex-1 min-w-48"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">LDAP Configuration Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• Test your connection before enabling LDAP to ensure credentials are correct</p>
          <p>• User Search Base should be a DN that contains user entries</p>
          <p>• Email attribute is required for user identification</p>
          <p>• When JIT Provisioning is enabled, users are created automatically on first login</p>
          <p>• User sync can be run manually to update user information from LDAP</p>
        </CardContent>
      </Card>
    </div>
  );
}
