'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Clock, RotateCcw, Download, Play } from 'lucide-react';
import apiClient from '@/lib/api-client';
import NewDeploymentDialog from '@/components/new-deployment-dialog';

export default function DeploymentsPage() {
  const [loading, setLoading] = useState(true);
  const [deployments, setDeployments] = useState([
  ]);
  const [showNewDeploymentDialog, setShowNewDeploymentDialog] = useState(false);

  useEffect(() => {
    fetchDeployments();
    
    // Check if we're returning from GitHub OAuth
    if (typeof window !== 'undefined') {
      const isPending = sessionStorage.getItem('github-import-pending');
      if (isPending) {
        console.log('GitHub OAuth completed, opening deployment dialog...');
        sessionStorage.removeItem('github-import-pending');
        setShowNewDeploymentDialog(true);
      }
    }
  }, []);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAllDeployments();
      
      // Transform backend data to match frontend expectations
      const transformedDeployments = data.map(deployment => ({
        id: deployment._id,
        projectName: deployment.projectId?.name || 'Unknown Project',
        environment: deployment.environment,
        status: deployment.status === 'running' ? 'success' : deployment.status,
        commit: deployment.gitCommit || 'N/A',
        author: deployment.gitAuthor || 'System',
        message: deployment.commitMessage || 'No message',
        deployedAt: deployment.createdAt,
        duration: deployment.buildTime ? `${Math.round(deployment.buildTime/60)}m ${deployment.buildTime%60}s` : 'N/A',
        version: deployment.version || '1.0.0',
        previous: 'stable',
        changes: 0,
        buildTime: deployment.buildTime ? `${Math.round(deployment.buildTime/60)}m ${deployment.buildTime%60}s` : 'N/A',
        size: deployment.buildSize ? `${(deployment.buildSize/1024/1024).toFixed(1)} MB` : 'N/A',
        url: deployment.productionUrl || deployment.previewUrl
      }));
      
      setDeployments(transformedDeployments);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterEnv, setFilterEnv] = useState('all');

  const projects = [...new Set(deployments.map(d => d.projectName))];
  const environments = [...new Set(deployments.map(d => d.environment))];

  const filteredDeployments = useMemo(() => {
    let result = deployments;

    if (searchQuery) {
      result = result.filter(d =>
        d.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.commit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(d => d.status === filterStatus);
    }

    if (filterProject !== 'all') {
      result = result.filter(d => d.projectName === filterProject);
    }

    if (filterEnv !== 'all') {
      result = result.filter(d => d.environment === filterEnv);
    }

    return result;
  }, [deployments, searchQuery, filterStatus, filterProject, filterEnv]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Deployments</h1>
          <p className="text-gray-600">View and manage all deployments across your projects</p>
        </div>
        <Button onClick={() => setShowNewDeploymentDialog(true)}>
          <Play className="w-4 h-4 mr-2" /> New Deployment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Deployments</p>
            <p className="text-3xl font-bold mt-2">{deployments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Successful</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {deployments.filter(d => d.status === 'success').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {deployments.filter(d => d.status === 'failed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {deployments.filter(d => d.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search by project, commit, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex gap-4 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={filterEnv}
              onChange={(e) => setFilterEnv(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Environments</option>
              {environments.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>

            <div className="flex-1" />

            <Button variant="outline">Export</Button>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredDeployments.length} of {deployments.length} deployments
          </div>
        </CardContent>
      </Card>

      {/* Deployments List */}
      <div className="space-y-3">
        {filteredDeployments.map((deployment) => (
          <Card key={deployment.id} className="hover:shadow-lg transition cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(deployment.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="font-semibold">{deployment.projectName}</h3>
                      <Badge variant="outline">{deployment.environment}</Badge>
                      <Badge className={getStatusColor(deployment.status)}>
                        {deployment.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{deployment.message}</p>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Commit: <span className="font-mono text-gray-700">{deployment.commit}</span></span>
                      <span>Author: {deployment.author}</span>
                      <span>{new Date(deployment.deployedAt).toLocaleString()}</span>
                      {deployment.status === 'success' && deployment.version && (
                        <span>Version: {deployment.version}</span>
                      )}
                    </div>

                    {deployment.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        {deployment.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold">{deployment.duration}</p>
                  <div className="flex gap-2 mt-2">
                    {deployment.status === 'failed' && (
                      <Button size="sm" variant="outline">
                        <RotateCcw className="w-4 h-4 mr-1" /> Retry
                      </Button>
                    )}
                    {deployment.status === 'success' && deployment.url && (
                      <Button size="sm" variant="outline">
                        <Play className="w-4 h-4 mr-1" /> Visit
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Details Row */}
              {(deployment.buildTime || deployment.size || deployment.changes) && (
                <div className="mt-3 pt-3 border-t flex gap-6 text-xs text-gray-600">
                  {deployment.buildTime && <span>Build: {deployment.buildTime}</span>}
                  {deployment.size && <span>Size: {deployment.size}</span>}
                  {deployment.changes && <span>{deployment.changes} files changed</span>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDeployments.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500 py-12">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No deployments match your filters</p>
          </CardContent>
        </Card>
      )}

      {showNewDeploymentDialog && (
        <NewDeploymentDialog 
          open={showNewDeploymentDialog}
          onOpenChange={setShowNewDeploymentDialog}
          onDeploymentCreated={() => {
            setShowNewDeploymentDialog(false);
            fetchDeployments();
          }}
        />
      )}
    </div>
  );
}
