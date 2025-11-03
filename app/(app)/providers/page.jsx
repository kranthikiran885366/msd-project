'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Settings, CheckCircle, AlertCircle, Link2 } from 'lucide-react';

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [connectedIntegrations, setConnectedIntegrations] = useState([
    { id: 'github', name: 'GitHub', icon: '🐙', connected: true, status: 'active' },
    { id: 'slack', name: 'Slack', icon: '💬', connected: true, status: 'active' },
    { id: 'datadog', name: 'Datadog', icon: '📊', connected: true, status: 'active' },
  ]);

  const [allIntegrations] = useState([
    {
      id: 'github',
      name: 'GitHub',
      icon: '🐙',
      category: 'Version Control',
      description: 'Connect your GitHub repositories for automated deployments',
      features: ['CI/CD', 'Auto Deploy', 'Pull Requests', 'Webhooks'],
      connected: true
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      icon: '📕',
      category: 'Version Control',
      description: 'Integrate with GitLab for CI/CD pipelines',
      features: ['CI/CD', 'Auto Deploy', 'Merge Requests', 'Webhooks'],
      connected: false
    },
    {
      id: 'bitbucket',
      name: 'Bitbucket',
      icon: '🪣',
      category: 'Version Control',
      description: 'Connect Bitbucket repositories and pipelines',
      features: ['CI/CD', 'Auto Deploy', 'Pull Requests', 'Webhooks'],
      connected: false
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: '💬',
      category: 'Notifications',
      description: 'Get deployment notifications in Slack channels',
      features: ['Notifications', 'Alerts', 'Status Updates', 'Team Mentions'],
      connected: true
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: '🎮',
      category: 'Notifications',
      description: 'Send deployment updates to Discord servers',
      features: ['Notifications', 'Alerts', 'Status Updates', 'Webhooks'],
      connected: false
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      icon: '👨',
      category: 'Notifications',
      description: 'Microsoft Teams integration for deployment alerts',
      features: ['Notifications', 'Alerts', 'Status Updates', 'Team Mentions'],
      connected: false
    },
    {
      id: 'datadog',
      name: 'Datadog',
      icon: '📊',
      category: 'Monitoring',
      description: 'Monitor and track application performance',
      features: ['Metrics', 'Logs', 'APM', 'Alerts'],
      connected: true
    },
    {
      id: 'newrelic',
      name: 'New Relic',
      icon: '📈',
      category: 'Monitoring',
      description: 'Application performance monitoring and analytics',
      features: ['Metrics', 'Logs', 'APM', 'Dashboards'],
      connected: false
    },
    {
      id: 'sentry',
      name: 'Sentry',
      icon: '🚨',
      category: 'Monitoring',
      description: 'Error tracking and performance monitoring',
      features: ['Error Tracking', 'Session Replay', 'Alerts', 'Trends'],
      connected: false
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: '💳',
      category: 'Payments',
      description: 'Accept payments and manage billing',
      features: ['Payments', 'Billing', 'Invoices', 'Webhooks'],
      connected: false
    },
  ]);

  const filteredIntegrations = allIntegrations.filter(int =>
    int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    int.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(allIntegrations.map(i => i.category))];

  const handleConnect = (integrationId) => {
    if (!connectedIntegrations.find(i => i.id === integrationId)) {
      const integration = allIntegrations.find(i => i.id === integrationId);
      setConnectedIntegrations([...connectedIntegrations, {
        id: integration.id,
        name: integration.name,
        icon: integration.icon,
        connected: true,
        status: 'active'
      }]);
    }
  };

  const handleDisconnect = (integrationId) => {
    setConnectedIntegrations(connectedIntegrations.filter(i => i.id !== integrationId));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-gray-600 mt-1">Connect external services and tools</p>
        </div>
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="connected">Connected ({connectedIntegrations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search integrations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {categories.map(category => {
            const categoryIntegrations = filteredIntegrations.filter(i => i.category === category);
            if (categoryIntegrations.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3">{category}</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {categoryIntegrations.map(integration => (
                    <Card key={integration.id} className="hover:shadow-lg transition">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-4xl">{integration.icon}</span>
                          {connectedIntegrations.find(i => i.id === integration.id) && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>

                        <h4 className="font-semibold text-lg mb-2">{integration.name}</h4>
                        <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {integration.features.map(feature => (
                            <Badge key={feature} variant="outline" className="text-xs">{feature}</Badge>
                          ))}
                        </div>

                        {connectedIntegrations.find(i => i.id === integration.id) ? (
                          <div className="space-y-2">
                            <Button variant="outline" className="w-full">
                              <Settings className="w-4 h-4 mr-2" /> Configure
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full text-red-600 hover:bg-red-50"
                              onClick={() => handleDisconnect(integration.id)}
                            >
                              Disconnect
                            </Button>
                          </div>
                        ) : (
                          <Button className="w-full" onClick={() => handleConnect(integration.id)}>
                            <Link2 className="w-4 h-4 mr-2" /> Connect
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="space-y-3">
            {connectedIntegrations.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-gray-600">No integrations connected yet</p>
                </CardContent>
              </Card>
            ) : (
              connectedIntegrations.map(integration => (
                <Card key={integration.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{integration.icon}</span>
                        <div>
                          <h4 className="font-semibold">{integration.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">Connected</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" /> Settings
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDisconnect(integration.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
