'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthenticationPage() {
  const [samlConfig, setSamlConfig] = useState({ enabled: false });
  const [ldapConfig, setLdapConfig] = useState({ enabled: false });
  const [webauthnConfig, setWebauthnConfig] = useState({ enabled: false });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Authentication Management</h1>

      <Tabs defaultValue="saml" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
          <TabsTrigger value="ldap">LDAP/AD</TabsTrigger>
          <TabsTrigger value="webauthn">WebAuthn</TabsTrigger>
        </TabsList>

        {/* SAML Configuration */}
        <TabsContent value="saml" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>SAML 2.0 Configuration</span>
                <Badge variant={samlConfig.enabled ? 'default' : 'secondary'}>
                  {samlConfig.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Assertion Consumer Service URL</label>
                <Input 
                  defaultValue="https://platform.deployer.dev/auth/saml/acs"
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-600 mt-1">Provide this URL to your IdP</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Entity ID</label>
                  <Input 
                    defaultValue="https://platform.deployer.dev/saml"
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Single Logout URL</label>
                  <Input 
                    defaultValue="https://platform.deployer.dev/auth/saml/slo"
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">IdP Certificate (PEM)</label>
                <textarea 
                  className="w-full h-32 p-3 border border-gray-300 rounded font-mono text-xs"
                  placeholder="Paste your IdP certificate here"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Okta</p>
                  <Button variant="outline" className="w-full">Configure</Button>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Azure AD</p>
                  <Button variant="outline" className="w-full">Configure</Button>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Google Workspace</p>
                  <Button variant="outline" className="w-full">Configure</Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setSamlConfig({ ...samlConfig, enabled: true })}>
                  Enable SAML 2.0
                </Button>
                <Button variant="outline">Test Connection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LDAP Configuration */}
        <TabsContent value="ldap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>LDAP/Active Directory</span>
                <Badge variant={ldapConfig.enabled ? 'default' : 'secondary'}>
                  {ldapConfig.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">LDAP Server URL</label>
                  <Input placeholder="ldap://directory.company.com:389" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Use LDAPS (Secure)</label>
                  <Input type="checkbox" className="w-4 h-4 mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Bind DN</label>
                  <Input placeholder="cn=admin,dc=company,dc=com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Bind Password</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Base DN</label>
                <Input placeholder="dc=company,dc=com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">User Search Base</label>
                  <Input placeholder="ou=Users,dc=company,dc=com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">User Search Filter</label>
                  <Input placeholder="(sAMAccountName={{username}})" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Group Search Base</label>
                  <Input placeholder="ou=Groups,dc=company,dc=com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Group Member Attribute</label>
                  <Input placeholder="member" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setLdapConfig({ ...ldapConfig, enabled: true })}>
                  Enable LDAP
                </Button>
                <Button variant="outline">Test Connection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WebAuthn Configuration */}
        <TabsContent value="webauthn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>WebAuthn (Passwordless)</span>
                <Badge variant={webauthnConfig.enabled ? 'default' : 'secondary'}>
                  {webauthnConfig.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-900">
                  WebAuthn enables passwordless authentication using FIDO2-compatible devices (security keys, biometrics).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Relying Party Name</label>
                  <Input placeholder="Enterprise Deployment Platform" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Relying Party ID</label>
                  <Input placeholder="platform.deployer.dev" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Origin</label>
                <Input placeholder="https://platform.deployer.dev" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <input type="checkbox" checked readOnly className="w-4 h-4" />
                  <label className="text-sm font-semibold">Allow FIDO2 Security Keys</label>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <input type="checkbox" checked readOnly className="w-4 h-4" />
                  <label className="text-sm font-semibold">Allow Platform Authenticators (Biometric)</label>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <input type="checkbox" readOnly className="w-4 h-4" />
                  <label className="text-sm font-semibold">Require Resident Keys</label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setWebauthnConfig({ ...webauthnConfig, enabled: true })}>
                  Enable WebAuthn
                </Button>
                <Button variant="outline">Test Registration</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'YubiKey 5 NFC', registered: '2 weeks ago', lastUsed: '1 day ago' },
                  { name: 'iPhone Face ID', registered: '1 month ago', lastUsed: '2 hours ago' }
                ].map((device, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold text-sm">{device.name}</p>
                      <p className="text-xs text-gray-600">Registered: {device.registered} | Last used: {device.lastUsed}</p>
                    </div>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Auth Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Methods Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { method: 'SAML 2.0', status: 'active', users: 45 },
              { method: 'LDAP/Active Directory', status: 'inactive', users: 0 },
              { method: 'OAuth2 (Google)', status: 'active', users: 23 },
              { method: 'WebAuthn', status: 'inactive', users: 0 }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  {item.status === 'active' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <p className="font-semibold text-sm">{item.method}</p>
                </div>
                <div className="text-right">
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">{item.users} users</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
