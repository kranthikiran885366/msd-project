'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Code2,
  Globe,
  Database,
  Zap,
  Monitor,
  Lock,
  Settings2,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

const SERVICES = [
  {
    id: 'functions',
    name: 'Serverless Functions',
    description: 'Deploy and run code without managing servers',
    category: 'Compute',
    icon: Code2,
    color: 'bg-blue-100',
    status: 'active',
    pricing: 'Free tier available',
    features: ['Auto-scaling', 'Multiple runtimes', 'Environment variables', 'Logs & debugging'],
    link: '/functions',
    usage: 125,
    limit: 1000,
  },
  {
    id: 'cdn',
    name: 'Edge Network & CDN',
    description: 'Global content delivery with edge optimization',
    category: 'Networking',
    icon: Globe,
    color: 'bg-green-100',
    status: 'active',
    pricing: 'Pay as you go',
    features: ['Edge caching', 'Image optimization', 'Automatic compression', 'DDoS protection'],
    link: '/cdn',
    usage: 2534,
    limit: 5000,
  },
  {
    id: 'database',
    name: 'Managed Databases',
    description: 'PostgreSQL, MySQL, MongoDB - fully managed',
    category: 'Storage',
    icon: Database,
    color: 'bg-purple-100',
    status: 'active',
    pricing: 'Consumption based',
    features: ['Automatic backups', 'Read replicas', 'Point-in-time recovery', 'Connection pooling'],
    link: '/databases',
    usage: 45,
    limit: 100,
  },
  {
    id: 'forms',
    name: 'Form Handling',
    description: 'Collect and manage form submissions',
    category: 'Data Collection',
    icon: Zap,
    color: 'bg-yellow-100',
    status: 'active',
    pricing: 'Free for 100 submissions/month',
    features: ['Email notifications', 'Webhooks', 'File uploads', 'Spam filtering'],
    link: '/forms',
    usage: 89,
    limit: 1000,
  },
  {
    id: 'analytics',
    name: 'Web Analytics',
    description: 'Track site performance and user behavior',
    category: 'Analytics',
    icon: Monitor,
    color: 'bg-indigo-100',
    status: 'active',
    pricing: 'Included in plans',
    features: ['Real-time insights', 'Custom events', 'Audience segmentation', 'Conversion tracking'],
    link: '/analytics',
    usage: 5678,
    limit: 100000,
  },
  {
    id: 'ssl',
    name: 'SSL Certificates',
    description: 'Automatic HTTPS with Let\'s Encrypt',
    category: 'Security',
    icon: Lock,
    color: 'bg-red-100',
    status: 'active',
    pricing: 'Free automated',
    features: ['Auto-renewal', 'Wildcard support', 'Custom domains', 'Security headers'],
    link: '/domains',
    usage: 12,
    limit: 50,
  },
  {
    id: 'environment',
    name: 'Environment Variables',
    description: 'Manage secrets and configuration',
    category: 'Configuration',
    icon: Settings2,
    color: 'bg-pink-100',
    status: 'active',
    pricing: 'Unlimited',
    features: ['Encrypted storage', 'Build-time injection', 'Runtime access', 'Audit logs'],
    link: '/env',
    usage: 234,
    limit: 1000,
  },
  {
    id: 'webhooks',
    name: 'Webhooks & Events',
    description: 'Real-time event notifications',
    category: 'Integration',
    icon: GitBranch,
    color: 'bg-orange-100',
    status: 'active',
    pricing: 'Pay per event',
    features: ['Deployment hooks', 'Custom events', 'Retry logic', 'Rate limiting'],
    link: '/webhooks',
    usage: 567,
    limit: 10000,
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Alerts',
    description: 'Monitor uptime, performance, and errors',
    category: 'Monitoring',
    icon: AlertCircle,
    color: 'bg-cyan-100',
    status: 'active',
    pricing: 'Free tier included',
    features: ['Uptime monitoring', 'Error tracking', 'Performance metrics', 'Smart alerts'],
    link: '/monitoring',
    usage: 1234,
    limit: 50000,
  },
  {
    id: 'ci-cd',
    name: 'CI/CD Pipeline',
    description: 'Automated build and deployment',
    category: 'DevOps',
    icon: CheckCircle,
    color: 'bg-emerald-100',
    status: 'active',
    pricing: 'Build minutes included',
    features: ['GitHub integration', 'Custom build steps', 'Parallel builds', 'Build cache'],
    link: '/ci-cd',
    usage: 345,
    limit: 3000,
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    description: 'Secure and scale your APIs',
    category: 'API Management',
    icon: Code2,
    color: 'bg-teal-100',
    status: 'active',
    pricing: 'Per million requests',
    features: ['Rate limiting', 'API keys', 'Version management', 'Documentation'],
    link: '/api-graph',
    usage: 890,
    limit: 100000,
  },
  {
    id: 'media-cdn',
    name: 'Media & Image Optimization',
    description: 'Optimize and serve images efficiently',
    category: 'Media',
    icon: Globe,
    color: 'bg-violet-100',
    status: 'active',
    pricing: 'Based on bandwidth',
    features: ['Auto-format', 'Responsive images', 'Resizing', 'Optimization'],
    link: '/media-cdn',
    usage: 2345,
    limit: 50000,
  },
];

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const categories = [...new Set(SERVICES.map(s => s.category))];

  const filteredServices = useMemo(() => {
    return SERVICES.filter(service => {
      const matchSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || service.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || service.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [searchQuery, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Services & Integrations</h1>
        <p className="text-gray-600">
          Build powerful applications with our comprehensive service ecosystem
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Services</p>
            <p className="text-3xl font-bold mt-2">{SERVICES.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Active Services</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {SERVICES.filter(s => s.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Usage</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {(SERVICES.reduce((sum, s) => sum + s.usage, 0) / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Search Services</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="beta">Beta</option>
                <option value="coming">Coming Soon</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredServices.length} of {SERVICES.length} services
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => {
          const Icon = service.icon;
          const usagePercent = (service.usage / service.limit) * 100;

          return (
            <Link key={service.id} href={service.link}>
              <Card className="h-full hover:shadow-lg transition cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${service.color}`}>
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <Badge
                      className={
                        service.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : service.status === 'beta'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {service.status === 'active' ? 'Active' : service.status === 'beta' ? 'Beta' : 'Soon'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div>
                    <p className="text-sm font-medium mb-2">Features:</p>
                    <div className="space-y-1">
                      {service.features.slice(0, 2).map((feature, idx) => (
                        <div key={idx} className="text-xs text-gray-600">
                          • {feature}
                        </div>
                      ))}
                      {service.features.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{service.features.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Usage</span>
                      <span className="text-xs font-medium">
                        {service.usage} / {service.limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition ${
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

                  {/* Category & Pricing */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant="outline" className="text-xs">
                      {service.category}
                    </Badge>
                    <span className="text-xs text-gray-600">{service.pricing}</span>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full group"
                    onClick={(e) => {
                      e.preventDefault();
                      // Navigation handled by Link
                    }}
                  >
                    View Service
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No services match your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
