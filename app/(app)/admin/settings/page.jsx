'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Save, AlertCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'CloudDeck',
    timezone: 'UTC',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    twoFactorRequired: false,
    sessionTimeout: '30',
    logRetention: '90',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage system-wide configuration and preferences</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <p className="text-sm text-green-800">Settings saved successfully</p>
        </div>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Platform Name</label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Timezone</label>
                <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">EST</SelectItem>
                    <SelectItem value="CST">CST</SelectItem>
                    <SelectItem value="PST">PST</SelectItem>
                    <SelectItem value="GMT">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Session Timeout (minutes)</label>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">Idle session timeout duration</p>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Save Settings
              </Button>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'registrationEnabled', label: 'Allow New User Registration', desc: 'Allow new users to create accounts' },
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send email notifications to users' },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-semibold text-sm">{feature.label}</p>
                    <p className="text-xs text-gray-600">{feature.desc}</p>
                  </div>
                  <Toggle
                    pressed={settings[feature.key]}
                    onPressedChange={(pressed) => setSettings({ ...settings, [feature.key]: pressed })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Security Hardening</p>
                  <p className="text-xs text-blue-800 mt-1">Enable security features to protect your deployment platform</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'twoFactorRequired', label: 'Require 2FA for Admins', desc: 'Enforce two-factor authentication for admin accounts' },
                  { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Temporarily disable platform access' },
                ].map((policy) => (
                  <div key={policy.key} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-semibold text-sm">{policy.label}</p>
                      <p className="text-xs text-gray-600">{policy.desc}</p>
                    </div>
                    <Toggle
                      pressed={settings[policy.key]}
                      onPressedChange={(pressed) => setSettings({ ...settings, [policy.key]: pressed })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Password Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Password Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Minimum Password Length</label>
                <Input type="number" defaultValue="12" className="mt-1" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Required Characters</p>
                {['Uppercase', 'Lowercase', 'Numbers', 'Special Characters'].map((req) => (
                  <label key={req} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-sm">{req}</span>
                  </label>
                ))}
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Save Policy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">SMTP Server</label>
                <Input placeholder="smtp.gmail.com" className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">SMTP Port</label>
                  <Input type="number" placeholder="587" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Sender Email</label>
                  <Input placeholder="noreply@deployer.dev" className="mt-1" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Username</label>
                <Input className="mt-1" />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <Input type="password" className="mt-1" />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" /> Save Configuration
                </Button>
                <Button variant="outline">Send Test Email</Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Welcome Email', 'Password Reset', 'Deployment Notification', 'Alert Notification'].map((template) => (
                  <div key={template} className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">{template}</span>
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Slack', connected: true, icon: '💬' },
                  { name: 'GitHub', connected: true, icon: '🐙' },
                  { name: 'PagerDuty', connected: false, icon: '📟' },
                  { name: 'Datadog', connected: true, icon: '📊' },
                  { name: 'New Relic', connected: false, icon: '📈' },
                ].map((integration) => (
                  <Card key={integration.name} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.icon}</span>
                          <div>
                            <p className="font-semibold">{integration.name}</p>
                            <Badge className={integration.connected ? 'bg-green-600' : 'bg-gray-400'}>
                              {integration.connected ? 'Connected' : 'Not Connected'}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          {integration.connected ? 'Manage' : 'Connect'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Maintenance Mode</label>
                <div className="mt-2 flex items-center gap-3">
                  <Toggle pressed={settings.maintenanceMode} onPressedChange={(p) => setSettings({ ...settings, maintenanceMode: p })} />
                  <span className="text-sm text-gray-600">
                    {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {settings.maintenanceMode && (
                <div>
                  <label className="text-sm font-medium">Maintenance Message</label>
                  <textarea className="w-full mt-1 p-3 border rounded-lg text-sm" placeholder="System maintenance in progress..." defaultValue="System maintenance in progress. Please check back shortly." />
                </div>
              )}

              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Apply
              </Button>
            </CardContent>
          </Card>

          {/* Log Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Log Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Log Retention Period (days)</label>
                <Input
                  type="number"
                  value={settings.logRetention}
                  onChange={(e) => setSettings({ ...settings, logRetention: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Log Level</label>
                <Select defaultValue="info">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" /> Save
                </Button>
                <Button variant="outline">Clear Old Logs</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
