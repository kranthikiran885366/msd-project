'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Activity, BarChart3, Puzzle, Webhook, Database, Cloud, Code2, Settings, ArrowRight } from 'lucide-react';

const integrations = [
  {
    id: 'git',
    name: 'Git Integration',
    description: 'Connect your Git repositories for automated deployments',
    icon: GitBranch,
    href: '/integrations/git',
    status: 'connected',
    category: 'Source Control'
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Configure webhook endpoints for real-time notifications',
    icon: Webhook,
    href: '/integrations/webhooks',
    status: 'available',
    category: 'Notifications'
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    description: 'Time-series metrics collection and alerting',
    icon: BarChart3,
    href: '/integrations/prometheus',
    status: 'connected',
    category: 'Monitoring'
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Visualization and dashboards for your metrics',
    icon: BarChart3,
    href: '/integrations/grafana',
    status: 'available',
    category: 'Monitoring'
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Application performance monitoring and logging',
    icon: Activity,
    href: '/integrations/datadog',
    status: 'available',
    category: 'Monitoring'
  },
  {
    id: 'newrelic',
    name: 'New Relic',
    description: 'Full-stack observability platform',
    icon: BarChart3,
    href: '/integrations/newrelic',
    status: 'available',
    category: 'Monitoring'
  },
  {
    id: 'analytics',
    name: 'Analytics Tools',
    description: 'Connect analytics and tracking services',
    icon: BarChart3,
    href: '/integrations/analytics',
    status: 'available',
    category: 'Analytics'
  },
  {
    id: 'logs',
    name: 'Log Providers',
    description: 'Centralized logging and log management',
    icon: Database,
    href: '/integrations/logs',
    status: 'available',
    category: 'Logging'
  },
  {
    id: 'endpoints',
    name: 'API Endpoints',
    description: 'Manage external API integrations',
    icon: Code2,
    href: '/integrations/endpoints',
    status: 'available',
    category: 'APIs'
  },
  {
    id: 'gateway',
    name: 'API Gateway',
    description: 'Configure API gateway and routing',
    icon: Cloud,
    href: '/integrations/gateway',
    status: 'available',
    category: 'APIs'
  },
  {
    id: 'custom',
    name: 'Custom Integrations',
    description: 'Build and manage custom integrations',
    icon: Puzzle,
    href: '/integrations/custom',
    status: 'available',
    category: 'Custom'
  }
];

const categories = ['All', 'Source Control', 'Monitoring', 'Analytics', 'Logging', 'APIs', 'Notifications', 'Custom'];

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredIntegrations = selectedCategory === 'All' 
    ? integrations 
    : integrations.filter(integration => integration.category === selectedCategory);

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect your favorite tools and services</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Connected</p>
              <p className="text-2xl font-bold">{connectedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{integrations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{categories.length - 1}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map(integration => {
          const Icon = integration.icon;
          return (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'} className="text-xs mt-1">
                        {integration.status === 'connected' ? 'Connected' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{integration.category}</Badge>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={integration.href} className="gap-2">
                      Configure
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}