'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayCircle, GitBranch, Zap, CheckCircle, XCircle } from 'lucide-react';

export default function CICDPage() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CI/CD Pipelines</h1>
        <Button>Create Pipeline</Button>
      </div>

      <Tabs defaultValue="pipelines" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipelines">Tekton Pipelines</TabsTrigger>
          <TabsTrigger value="gitops">ArgoCD GitOps</TabsTrigger>
          <TabsTrigger value="actions">GitHub Actions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Tekton Pipelines */}
        <TabsContent value="pipelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Tekton Cloud-Native Pipelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    name: 'Build & Test',
                    status: 'completed',
                    duration: '12m 34s',
                    tasks: [
                      { name: 'Checkout', status: 'completed' },
                      { name: 'Unit Tests', status: 'completed' },
                      { name: 'Build Docker Image', status: 'completed' },
                      { name: 'Push to Registry', status: 'completed' }
                    ]
                  },
                  {
                    name: 'Deploy to Staging',
                    status: 'running',
                    duration: '5m 12s',
                    tasks: [
                      { name: 'Pull Image', status: 'completed' },
                      { name: 'Deploy to K8s', status: 'running' },
                      { name: 'Run E2E Tests', status: 'pending' }
                    ]
                  },
                  {
                    name: 'Security Scan',
                    status: 'pending',
                    duration: '—',
                    tasks: [
                      { name: 'SAST Analysis', status: 'pending' },
                      { name: 'Dependency Check', status: 'pending' },
                      { name: 'Container Scan', status: 'pending' }
                    ]
                  }
                ].map((pipeline, idx) => (
                  <Card key={idx} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            pipeline.status === 'completed' ? 'bg-green-600' :
                            pipeline.status === 'running' ? 'bg-blue-600' :
                            'bg-gray-400'
                          }`} />
                          <p className="font-semibold">{pipeline.name}</p>
                        </div>
                        <Badge variant={pipeline.status === 'completed' ? 'default' : 'secondary'}>
                          {pipeline.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Duration: {pipeline.duration}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {pipeline.tasks.map((task, tidx) => (
                          <div key={tidx} className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-xs font-semibold">
                              {tidx + 1}
                            </div>
                            <span className="flex-1">{task.name}</span>
                            {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {task.status === 'running' && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                            {task.status === 'pending' && <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ArgoCD GitOps */}
        <TabsContent value="gitops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                ArgoCD Declarative Deployments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    app: 'Production API',
                    status: 'synced',
                    syncPolicy: 'Auto-sync',
                    health: 'healthy',
                    repo: 'main',
                    version: 'v1.2.3'
                  },
                  {
                    app: 'Frontend Dashboard',
                    status: 'out-of-sync',
                    syncPolicy: 'Manual approval',
                    health: 'degraded',
                    repo: 'feature/new-ui',
                    version: 'v1.2.2'
                  },
                  {
                    app: 'Worker Service',
                    status: 'synced',
                    syncPolicy: 'Auto-sync',
                    health: 'healthy',
                    repo: 'main',
                    version: 'v1.1.5'
                  }
                ].map((app, idx) => (
                  <Card key={idx} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{app.app}</p>
                        <div className="flex gap-2">
                          <Badge variant={app.status === 'synced' ? 'default' : 'secondary'}>
                            {app.status}
                          </Badge>
                          <Badge variant={app.health === 'healthy' ? 'default' : 'destructive'}>
                            {app.health}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Sync Policy</p>
                          <p className="font-semibold">{app.syncPolicy}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Branch</p>
                          <p className="font-semibold">{app.repo}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Version</p>
                          <p className="font-semibold">{app.version}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm">Sync</Button>
                        <Button size="sm" variant="outline">Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GitHub Actions */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                GitHub Actions Workflows
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    workflow: 'Test & Lint',
                    branch: 'main',
                    status: 'success',
                    runs: 342,
                    lastRun: '10 min ago'
                  },
                  {
                    workflow: 'Deploy to Production',
                    branch: 'main',
                    status: 'success',
                    runs: 156,
                    lastRun: '2 hours ago'
                  },
                  {
                    workflow: 'Security Scan',
                    branch: 'develop',
                    status: 'failed',
                    runs: 89,
                    lastRun: '5 min ago'
                  }
                ].map((workflow, idx) => (
                  <Card key={idx} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{workflow.workflow}</p>
                          <p className="text-xs text-gray-600">Branch: {workflow.branch}</p>
                        </div>
                        {workflow.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600">{workflow.runs} total runs</p>
                          <p className="text-sm font-semibold">Last: {workflow.lastRun}</p>
                        </div>
                        <Button size="sm" variant="outline">View Runs</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pre-built Pipeline Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Node.js CI/CD', icon: '🟢', tasks: 8 },
                  { name: 'Python FastAPI', icon: '🐍', tasks: 7 },
                  { name: 'React SPA', icon: '⚛️', tasks: 6 },
                  { name: 'Docker Multi-stage', icon: '🐳', tasks: 5 },
                  { name: 'Kubernetes Deploy', icon: '☸️', tasks: 9 },
                  { name: 'Microservices', icon: '🔌', tasks: 12 }
                ].map((template, idx) => (
                  <Card key={idx} className="border cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-3xl">{template.icon}</span>
                        <Badge>{template.tasks} tasks</Badge>
                      </div>
                      <p className="font-semibold mb-4">{template.name}</p>
                      <Button size="sm" variant="outline" className="w-full">Use Template</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
