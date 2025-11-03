'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GitBranch, Settings, Copy, Trash2, Plus, Eye, EyeOff, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id;

  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      if (!projectId) {
        console.error('Project ID is missing');
        return;
      }
      
      const project = await apiClient.getProject?.(projectId);
      if (!project) {
        console.error('Project not found');
        return;
      }
      
      const stats = await apiClient.getProjectStats?.(projectId) || {};
      
      setProjectData({
        id: project._id || project.id,
        name: project.name || 'Unnamed Project',
        description: project.description || 'No description provided',
        framework: project.framework || 'Unknown',
        repository: project.githubRepo || project.gitlabRepo || 'No repository linked',
        branch: 'main',
        buildCommand: project.buildCommand || 'npm run build',
        outputDir: 'out',
        region: project.region || 'us-east-1',
        status: project.status || 'active',
        lastDeployed: stats.lastDeployment ? new Date(stats.lastDeployment.createdAt).toLocaleString() : 'Never',
        deployedBy: stats.lastDeployment?.triggeredBy || 'System',
        linkedDomains: project.linkedDomains || [],
        teamOwner: 'Development Team',
        stats
      });
    } catch (error) {
      console.error('Failed to fetch project data:', error?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const [envVars, setEnvVars] = useState([]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEnvDialog, setShowEnvDialog] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});

  const deploymentMetrics = [
    { time: '00:00', duration: 45, success: 1, failed: 0 },
    { time: '04:00', duration: 52, success: 1, failed: 0 },
    { time: '08:00', duration: 38, success: 1, failed: 0 },
    { time: '12:00', duration: 61, success: 1, failed: 1 },
    { time: '16:00', duration: 49, success: 1, failed: 0 },
    { time: '20:00', duration: 44, success: 1, failed: 0 },
  ];

  const buildLogs = [
    { timestamp: '14:30:45', level: 'info', message: 'Starting build process...' },
    { timestamp: '14:30:46', level: 'info', message: 'Installing dependencies...' },
    { timestamp: '14:31:02', level: 'info', message: 'Building application...' },
    { timestamp: '14:31:45', level: 'info', message: 'Running tests...' },
    { timestamp: '14:32:10', level: 'success', message: 'Build completed successfully!' },
  ];

  const [deploymentHistory, setDeploymentHistory] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetchDeploymentHistory();
    }
  }, [projectId]);

  const fetchDeploymentHistory = async () => {
    try {
      const deployments = await apiClient.getDeployments(projectId);
      setDeploymentHistory(deployments.map(d => ({
        id: d._id,
        status: d.status,
        commit: d.gitCommit || 'No commit',
        author: d.gitAuthor || 'System',
        deployed: new Date(d.createdAt).toLocaleString(),
        duration: d.buildTime ? `${Math.round(d.buildTime/60)}m ${d.buildTime%60}s` : 'N/A'
      })));
    } catch (error) {
      console.error('Failed to fetch deployment history:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{projectData.name}</h1>
            <Badge className={projectData.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}>
              {projectData.status.charAt(0).toUpperCase() + projectData.status.slice(1)}
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">{projectData.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            <span>🏗️ {projectData.framework}</span>
            <span>👥 {projectData.teamOwner}</span>
            <span>📍 {projectData.region}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Deploy</Button>
          <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Settings</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Last Deployed</p>
            <p className="text-2xl font-bold mt-2">{projectData.lastDeployed}</p>
            <p className="text-xs text-gray-600 mt-2">by {projectData.deployedBy}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Linked Domains</p>
            <p className="text-2xl font-bold mt-2">{projectData.linkedDomains.length}</p>
            <p className="text-xs text-gray-600 mt-2">Active domains</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Build Time (Avg)</p>
            <p className="text-2xl font-bold mt-2">48s</p>
            <p className="text-xs text-gray-600 mt-2">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Deploy Success Rate</p>
            <p className="text-2xl font-bold mt-2">98.5%</p>
            <p className="text-xs text-gray-600 mt-2">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deploymentMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="duration" fill="#3b82f6" name="Duration (seconds)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Repository Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Repository URL</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-sm bg-gray-100 px-3 py-2 rounded flex-1 truncate">{projectData.repository}</code>
                    <Button size="sm" variant="ghost"><Copy className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Default Branch</p>
                  <div className="flex items-center gap-2 mt-2">
                    <GitBranch className="w-4 h-4 text-gray-600" />
                    <code className="text-sm bg-gray-100 px-3 py-2 rounded">{projectData.branch}</code>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Build Command</p>
                  <code className="text-sm bg-gray-100 px-3 py-2 rounded block mt-2">{projectData.buildCommand}</code>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Output Directory</p>
                  <code className="text-sm bg-gray-100 px-3 py-2 rounded block mt-2">{projectData.outputDir}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployments Tab */}
        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deploymentHistory.map((deploy) => (
                  <Card key={deploy.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {deploy.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-semibold">{deploy.commit}</p>
                            <p className="text-sm text-gray-600">{deploy.author} • {deploy.deployed}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold">{deploy.duration}</p>
                            <Badge className={deploy.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {deploy.status.charAt(0).toUpperCase() + deploy.status.slice(1)}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline">View</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environment Tab */}
        <TabsContent value="environment" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Environment Variables</h3>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Variable</Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {envVars.map((env) => (
                  <Card key={env.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{env.key}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="text-sm bg-gray-100 px-3 py-1 rounded flex-1">
                              {showSecrets[env.id] ? env.value : '***'}
                            </code>
                            <Badge variant="outline">{env.environment}</Badge>
                            {env.isSecret && (
                              <Badge variant="outline" className="text-yellow-700 border-yellow-300">Secret</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {env.isSecret && (
                            <Button size="sm" variant="ghost" onClick={() => setShowSecrets({ ...showSecrets, [env.id]: !showSecrets[env.id] })}>
                              {showSecrets[env.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost"><Copy className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-4">
          <Button><Plus className="w-4 h-4 mr-2" /> Add Domain</Button>

          <div className="space-y-3">
            {projectData.linkedDomains.map((domain, idx) => (
              <Card key={idx} className="border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{domain}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-green-600">SSL Active</Badge>
                        <span className="text-xs text-gray-600">Expires in 90 days</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Manage</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Build Logs</CardTitle>
              <Button size="sm" variant="outline"><Download className="w-4 h-4" /> Download</Button>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto space-y-1 max-h-96 overflow-y-auto">
                {buildLogs.map((log, idx) => (
                  <div key={idx} className={log.level === 'error' ? 'text-red-400' : log.level === 'success' ? 'text-green-400' : 'text-gray-300'}>
                    <span className="text-gray-600">{log.timestamp}</span> [{log.level.toUpperCase()}] {log.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input defaultValue={projectData.name} className="mt-1" />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea className="w-full mt-1 p-3 border rounded-lg text-sm" defaultValue={projectData.description} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Framework</label>
                  <Select defaultValue={projectData.framework}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Next.js">Next.js</SelectItem>
                      <SelectItem value="React">React</SelectItem>
                      <SelectItem value="Vue">Vue</SelectItem>
                      <SelectItem value="Angular">Angular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Region</label>
                  <Select defaultValue={projectData.region}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East</SelectItem>
                      <SelectItem value="eu-west-1">EU West</SelectItem>
                      <SelectItem value="ap-south-1">Asia Pacific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Deleting a project is permanent and cannot be undone.</p>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>Delete Project</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectData.name}"? This action cannot be undone and all deployments will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
