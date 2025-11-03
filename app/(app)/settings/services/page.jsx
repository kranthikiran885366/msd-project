'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Code2,
  Globe,
  Database,
  Zap,
  Monitor,
  Lock,
  Bell,
  Shield,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';

const SERVICE_SETTINGS = [
  {
    id: 'functions',
    name: 'Serverless Functions',
    icon: Code2,
    enabled: true,
    settings: [
      { key: 'memory', label: 'Default Memory', value: '512 MB', type: 'select' },
      { key: 'timeout', label: 'Timeout', value: '30', type: 'number' },
      { key: 'concurrency', label: 'Max Concurrency', value: 'Unlimited', type: 'select' },
    ],
  },
  {
    id: 'cdn',
    name: 'Edge CDN',
    icon: Globe,
    enabled: true,
    settings: [
      { key: 'cache_ttl', label: 'Cache TTL', value: '3600', type: 'number' },
      { key: 'compress', label: 'Enable Compression', value: 'true', type: 'toggle' },
      { key: 'minify', label: 'Minify Assets', value: 'true', type: 'toggle' },
    ],
  },
  {
    id: 'database',
    name: 'Managed Databases',
    icon: Database,
    enabled: true,
    settings: [
      { key: 'backup_frequency', label: 'Backup Frequency', value: 'Daily', type: 'select' },
      { key: 'auto_scale', label: 'Auto-scaling', value: 'true', type: 'toggle' },
      { key: 'point_in_time', label: 'Point-in-time Recovery', value: '7 days', type: 'select' },
    ],
  },
  {
    id: 'analytics',
    name: 'Web Analytics',
    icon: Monitor,
    enabled: true,
    settings: [
      { key: 'tracking', label: 'Page View Tracking', value: 'true', type: 'toggle' },
      { key: 'events', label: 'Custom Events', value: 'true', type: 'toggle' },
      { key: 'retention', label: 'Data Retention', value: '365 days', type: 'select' },
    ],
  },
  {
    id: 'security',
    name: 'Security & SSL',
    icon: Lock,
    enabled: true,
    settings: [
      { key: 'ssl_auto_renew', label: 'Auto-renew SSL', value: 'true', type: 'toggle' },
      { key: 'hsts', label: 'HSTS Enabled', value: 'true', type: 'toggle' },
      { key: 'tls_version', label: 'Minimum TLS Version', value: '1.2', type: 'select' },
    ],
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Alerts',
    icon: Monitor,
    enabled: true,
    settings: [
      { key: 'uptime_checks', label: 'Uptime Checks', value: 'Every 5 min', type: 'select' },
      { key: 'alert_email', label: 'Alert Email', value: 'on', type: 'toggle' },
      { key: 'sms_alerts', label: 'SMS Alerts', value: 'off', type: 'toggle' },
    ],
  },
];

function ServiceSettingsCard({ service, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState(service.settings);

  const handleSave = () => {
    onSave(service.id, settings);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <service.icon className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-base">{service.name}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {service.enabled && <Badge className="bg-green-100 text-green-800">Enabled</Badge>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {settings.map((setting, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <label className="text-sm font-medium">{setting.label}</label>
              {isEditing ? (
                <input
                  type={setting.type === 'number' ? 'number' : 'text'}
                  value={setting.value}
                  onChange={(e) => {
                    const updated = [...settings];
                    updated[idx].value = e.target.value;
                    setSettings(updated);
                  }}
                  className="px-2 py-1 text-sm border rounded"
                />
              ) : (
                <span className="text-sm text-gray-600">{setting.value}</span>
              )}
            </div>
          ))}
        </div>

        {isEditing && (
          <Button onClick={handleSave} className="w-full mt-4">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ServicesSettingsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [globalSettings, setGlobalSettings] = useState({
    enableMetrics: true,
    enableAlerts: true,
    alertThreshold: 80,
    autoScale: true,
    backupFrequency: 'daily',
  });

  const handleServiceSave = (serviceId, settings) => {
    console.log(`Saving ${serviceId}:`, settings);
    // API call would go here
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Services Settings</h1>
        <p className="text-gray-600">Manage configuration for all services</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Monitoring</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Enabled Services</p>
                <p className="text-3xl font-bold mt-2">
                  {SERVICE_SETTINGS.filter(s => s.enabled).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{SERVICE_SETTINGS.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="text-3xl font-bold text-green-600 mt-2">$245</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">System Health</p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Optimal</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_SETTINGS.map(service => (
              <ServiceSettingsCard
                key={service.id}
                service={service}
                onSave={handleServiceSave}
              />
            ))}
          </div>
        </TabsContent>

        {/* Global Settings Tab */}
        <TabsContent value="global" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Configuration</CardTitle>
              <CardDescription>Apply settings across all services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Enable Metrics Collection</label>
                <select
                  value={globalSettings.enableMetrics ? 'true' : 'false'}
                  onChange={(e) =>
                    setGlobalSettings({
                      ...globalSettings,
                      enableMetrics: e.target.value === 'true',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Enable Alerts</label>
                <select
                  value={globalSettings.enableAlerts ? 'true' : 'false'}
                  onChange={(e) =>
                    setGlobalSettings({
                      ...globalSettings,
                      enableAlerts: e.target.value === 'true',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Alert Threshold (%)</label>
                <Input
                  type="number"
                  value={globalSettings.alertThreshold}
                  onChange={(e) =>
                    setGlobalSettings({
                      ...globalSettings,
                      alertThreshold: parseInt(e.target.value),
                    })
                  }
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Enable Auto-scaling</label>
                <select
                  value={globalSettings.autoScale ? 'true' : 'false'}
                  onChange={(e) =>
                    setGlobalSettings({
                      ...globalSettings,
                      autoScale: e.target.value === 'true',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Backup Frequency</label>
                <select
                  value={globalSettings.backupFrequency}
                  onChange={(e) =>
                    setGlobalSettings({
                      ...globalSettings,
                      backupFrequency: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <Button className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Global Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>Set up notifications for service events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['High CPU Usage', 'Memory Threshold', 'Deployment Failure', 'Database Down'].map(
                  (alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium text-sm">{alert}</p>
                        <p className="text-xs text-gray-600">Get notified immediately</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                  )
                )}
              </div>

              <Button className="w-full mt-4">
                <Save className="w-4 h-4 mr-2" />
                Save Alert Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Third-party Integrations</CardTitle>
              <CardDescription>Connect external services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Slack', 'Datadog', 'New Relic', 'PagerDuty', 'Sentry'].map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium text-sm">{integration}</p>
                      <p className="text-xs text-gray-600">Send alerts and notifications</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
