'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Eye, EyeOff, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function APISDKPage() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showKey, setShowKey] = useState({});

  useEffect(() => {
    fetchApiData();
  }, []);

  const fetchApiData = async () => {
    try {
      setLoading(true);
      const [tokensResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/api/tokens', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/api/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const [tokens, stats] = await Promise.all([
        tokensResponse.json(),
        statsResponse.json()
      ]);

      setApiData({ tokens, stats });
    } catch (error) {
      console.error('Error fetching API data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading API data: {error}</p>
          <Button onClick={fetchApiData}>Retry</Button>
        </div>
      </div>
    );
  }

  const { tokens = [], stats = {} } = apiData || {};

  // Fallback data
  const fallbackTokens = [
    { id: 1, name: 'Production API Key', key: 'sk_live_***', scopes: ['deploy', 'read:logs'], created: '30 days ago', lastUsed: '2 hours ago' },
    { id: 2, name: 'CI/CD Integration', key: 'sk_live_***', scopes: ['deploy', 'read:projects'], created: '15 days ago', lastUsed: '10 min ago' }
  ];

  const apiKeys = tokens.length > 0 ? tokens : fallbackTokens;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">API & SDK Management</h1>
        <Button><Plus className="w-4 h-4 mr-2" /> Generate API Key</Button>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="docs">API Documentation</TabsTrigger>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="border">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{apiKey.name}</p>
                          <p className="text-xs text-gray-600">Created: {apiKey.created}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            {showKey[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded font-mono text-sm break-all">
                        {showKey[apiKey.id] ? 'sk_live_1a2b3c4d5e6f7g8h9i0j' : 'sk_live_***'}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {apiKey.scopes.map((scope) => (
                          <Badge key={scope} variant="outline">{scope}</Badge>
                        ))}
                      </div>

                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Last used: {apiKey.lastUsed}</span>
                        <span>Status: <Badge className="ml-2 bg-green-600">Active</Badge></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Scopes Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Available Scopes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { scope: 'deploy', description: 'Create and manage deployments' },
                  { scope: 'read:logs', description: 'Read deployment logs' },
                  { scope: 'read:projects', description: 'List and read projects' },
                  { scope: 'write:projects', description: 'Create and modify projects' },
                  { scope: 'read:metrics', description: 'Access performance metrics' },
                  { scope: 'read:billing', description: 'View billing information' },
                  { scope: 'admin', description: 'Full administrator access' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-shrink-0">{item.scope}</code>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Documentation */}
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>REST API Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  {
                    method: 'GET',
                    endpoint: '/api/v1/projects',
                    description: 'List all projects',
                    example: `curl -H "Authorization: Bearer sk_live_xxx" https://api.deployer.dev/api/v1/projects`
                  },
                  {
                    method: 'POST',
                    endpoint: '/api/v1/projects/{id}/deploy',
                    description: 'Trigger a deployment',
                    example: `curl -X POST -H "Authorization: Bearer sk_live_xxx" https://api.deployer.dev/api/v1/projects/{id}/deploy`
                  },
                  {
                    method: 'GET',
                    endpoint: '/api/v1/deployments/{id}/logs',
                    description: 'Stream deployment logs',
                    example: `curl -H "Authorization: Bearer sk_live_xxx" https://api.deployer.dev/api/v1/deployments/{id}/logs`
                  }
                ].map((endpoint, idx) => (
                  <Card key={idx} className="border">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className="font-mono">{endpoint.method}</Badge>
                        <code className="text-sm">{endpoint.endpoint}</code>
                      </div>
                      <p className="text-sm text-gray-600">{endpoint.description}</p>
                      <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
                        {endpoint.example}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full">
                View Full API Documentation →
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SDKs */}
        <TabsContent value="sdks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Official SDKs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    name: 'JavaScript/TypeScript',
                    icon: '🟨',
                    status: 'available',
                    install: 'npm install @deployer/sdk',
                    version: 'v1.2.3'
                  },
                  {
                    name: 'Python',
                    icon: '🐍',
                    status: 'available',
                    install: 'pip install deployer-sdk',
                    version: 'v1.1.5'
                  },
                  {
                    name: 'Go',
                    icon: '🐹',
                    status: 'available',
                    install: 'go get github.com/deployer/sdk-go',
                    version: 'v1.0.8'
                  },
                  {
                    name: 'Ruby',
                    icon: '💎',
                    status: 'beta',
                    install: 'gem install deployer-sdk',
                    version: 'v0.9.0-beta'
                  },
                  {
                    name: 'Java',
                    icon: '☕',
                    status: 'coming',
                    install: 'Coming soon',
                    version: '—'
                  },
                  {
                    name: 'C#/.NET',
                    icon: '🔷',
                    status: 'coming',
                    install: 'Coming soon',
                    version: '—'
                  }
                ].map((sdk, idx) => (
                  <Card key={idx} className="border">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{sdk.icon}</span>
                            <p className="font-semibold">{sdk.name}</p>
                          </div>
                          <Badge variant={sdk.status === 'available' ? 'default' : sdk.status === 'beta' ? 'secondary' : 'outline'}>
                            {sdk.status}
                          </Badge>
                        </div>
                        <code className="block text-xs bg-gray-100 p-2 rounded">{sdk.install}</code>
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>{sdk.version}</span>
                          {sdk.status === 'available' && (
                            <Button size="sm" variant="outline">Download</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-sm mb-2">JavaScript</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
                  {`import { Deployer } from '@deployer/sdk';\n\nconst client = new Deployer({\n  apiKey: 'sk_live_xxx'\n});\n\nconst deployment = await client.projects.deploy('my-project', {\n  branch: 'main'\n});`}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Python</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
                  {`from deployer import Deployer\n\nclient = Deployer(api_key='sk_live_xxx')\n\ndeployment = client.projects.deploy(\n    'my-project',\n    branch='main'\n)\nprint(deployment.status)`}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
