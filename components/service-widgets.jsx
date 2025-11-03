'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Code2,
  Globe,
  Database,
  Zap,
  Monitor,
  Lock,
  Settings2,
  GitBranch,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const QUICK_SERVICES = [
  {
    id: 'functions',
    name: 'Serverless Functions',
    icon: Code2,
    status: 'active',
    usage: 125,
    limit: 1000,
    link: '/functions',
  },
  {
    id: 'cdn',
    name: 'Edge CDN',
    icon: Globe,
    status: 'active',
    usage: 2534,
    limit: 5000,
    link: '/cdn',
  },
  {
    id: 'database',
    name: 'Databases',
    icon: Database,
    status: 'active',
    usage: 45,
    limit: 100,
    link: '/databases',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: Monitor,
    status: 'active',
    usage: 5678,
    limit: 100000,
    link: '/analytics',
  },
  {
    id: 'forms',
    name: 'Forms',
    icon: Zap,
    status: 'active',
    usage: 89,
    limit: 1000,
    link: '/forms',
  },
  {
    id: 'ssl',
    name: 'SSL & Security',
    icon: Lock,
    status: 'active',
    usage: 12,
    limit: 50,
    link: '/domains',
  },
];

export function QuickServicesWidget() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quick Services</h3>
        <Link href="/services">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUICK_SERVICES.map(service => {
          const Icon = service.icon;
          const usagePercent = (service.usage / service.limit) * 100;

          return (
            <Link key={service.id} href={service.link}>
              <Card className="hover:shadow-md transition cursor-pointer h-full">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{service.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {service.usage} / {service.limit}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full ${
                            usagePercent > 80
                              ? 'bg-red-500'
                              : usagePercent > 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ServiceHealthWidget() {
  const services = [
    { name: 'API Gateway', status: 'operational', uptime: '99.99%' },
    { name: 'CDN Nodes', status: 'operational', uptime: '99.98%' },
    { name: 'Database Cluster', status: 'operational', uptime: '99.95%' },
    { name: 'Auth Service', status: 'operational', uptime: '100.00%' },
    { name: 'Webhook Engine', status: 'degraded', uptime: '98.50%' },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'down':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Service Health</CardTitle>
        <CardDescription>Real-time system status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-gray-600">{service.uptime}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  service.status === 'operational'
                    ? 'border-green-200 text-green-700 bg-green-50'
                    : 'border-yellow-200 text-yellow-700 bg-yellow-50'
                }
              >
                {service.status === 'operational' ? 'OK' : 'Degraded'}
              </Badge>
            </div>
          ))}
        </div>

        <Link href="/monitoring">
          <Button variant="outline" size="sm" className="w-full mt-4">
            View Detailed Status
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function ServiceAnalyticsWidget() {
  const metrics = [
    { label: 'Function Invocations', value: '42.5K', change: '+12%', trend: 'up' },
    { label: 'API Requests', value: '1.2M', change: '+8%', trend: 'up' },
    { label: 'CDN Cache Hit Rate', value: '94.2%', change: '+2%', trend: 'up' },
    { label: 'Avg Response Time', value: '245ms', change: '-5%', trend: 'down' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Service Metrics</CardTitle>
        <CardDescription>This month's performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-xs text-gray-600">{metric.label}</p>
              <div className="flex items-end gap-2">
                <p className="text-lg font-bold">{metric.value}</p>
                <Badge
                  variant="outline"
                  className={
                    (metric.trend === 'up' && metric.label !== 'Avg Response Time') ||
                    (metric.trend === 'down' && metric.label === 'Avg Response Time')
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {metric.change}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <Link href="/analytics">
          <Button variant="outline" size="sm" className="w-full mt-4">
            View Analytics
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
