'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  AlertTriangle,
  Plus,
  Settings,
  Trash2,
  Play,
  RefreshCw,
  Search,
  Code2,
  GitBranch,
  Eye,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CICDPage() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [buildLogs, setBuildLogs] = useState([]);
  const [newBuild, setNewBuild] = useState({
    name: '',
    branch: 'main',
    autoTrigger: true,
    environment: 'staging',
  });

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
    try {
      setError('');
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');

      if (!projectId) {
        setError('Please select a project first');
        setBuilds([]);
        setLoading(false);
        return;
      }

      const res = await apiClient.getBuilds?.(projectId) || { data: [] };
      setBuilds(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error('Error fetching builds:', err);
      setError(err.message || 'Failed to fetch builds');
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildLogs = async (buildId) => {
    try {
      setError('');
      const res = await apiClient.getBuildLogs?.(buildId) || { data: [] };
      setBuildLogs(Array.isArray(res) ? res : res.data || []);
      setSelectedBuild(buildId);
    } catch (err) {
      setError(err.message || 'Failed to fetch logs');
    }
  };

  const createBuild = async () => {
    if (!newBuild.name.trim()) {
      setError('Build name is required');
      return;
    }

    try {
      setError('');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');

      if (!projectId) {
        setError('Please select a project first');
        return;
      }

      const res = await apiClient.createBuild?.(projectId, newBuild) || { success: true };
      setSuccess('Build configuration created successfully!');
      setNewBuild({ name: '', branch: 'main', autoTrigger: true, environment: 'staging' });
      setShowNewDialog(false);
      await fetchBuilds();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create build');
    }
  };

  const triggerBuild = async (buildId) => {
    try {
      setError('');
      await apiClient.triggerBuild?.(buildId);
      setSuccess('Build triggered successfully!');
      await fetchBuilds();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to trigger build');
    }
  };

  const deleteBuild = async (id) => {
    if (!confirm('Are you sure you want to delete this build configuration?')) return;
    try {
      setError('');
      await apiClient.deleteBuild?.(id);
      setSuccess('Build configuration deleted!');
      await fetchBuilds();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete build');
    }
  };

  const statusFilters = ['all', 'success', 'failed', 'building', 'queued'];

  const filteredBuilds = builds.filter((build) => {
    const matchesSearch = build.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || build.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const successRate =
    builds.length > 0
      ? Math.round(
          (builds.filter((b) => b.status === 'success').length / builds.length) * 100
        )
      : 0;

  const totalBuilds = builds.length;
  const successfulBuilds = builds.filter((b) => b.status === 'success').length;
  const failedBuilds = builds.filter((b) => b.status === 'failed').length;
  const averageDuration =
    builds.length > 0
      ? Math.round(
          builds.reduce((sum, b) => sum + (parseInt(b.duration) || 0), 0) / builds.length
        )
      : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              CI/CD Pipelines
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and monitor your build and deployment pipelines
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Build
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Total Builds"
            value={totalBuilds}
            icon={<Zap className="w-5 h-5" />}
            color="green"
          />
          <InfoCard
            title="Success Rate"
            value={`${successRate}%`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <InfoCard
            title="Failed"
            value={failedBuilds}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
          <InfoCard
            title="Avg Duration"
            value={`${averageDuration}s`}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-400">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search builds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border/50 bg-card text-foreground hover:border-border transition-colors"
        >
          {statusFilters.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={fetchBuilds} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Create Build Dialog */}
      {showNewDialog && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Create Build Configuration</CardTitle>
                <CardDescription>Set up a new CI/CD build pipeline</CardDescription>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowNewDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Build Name</label>
              <Input
                placeholder="Production Build"
                value={newBuild.name}
                onChange={(e) => setNewBuild({ ...newBuild, name: e.target.value })}
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Branch</label>
              <Input
                placeholder="main"
                value={newBuild.branch}
                onChange={(e) => setNewBuild({ ...newBuild, branch: e.target.value })}
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Environment</label>
              <select
                value={newBuild.environment}
                onChange={(e) =>
                  setNewBuild({ ...newBuild, environment: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background"
              >
                <option value="staging">Staging</option>
                <option value="production">Production</option>
                <option value="development">Development</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newBuild.autoTrigger}
                onChange={(e) =>
                  setNewBuild({ ...newBuild, autoTrigger: e.target.checked })
                }
                className="rounded border-border"
              />
              <label className="text-sm font-semibold">Auto-trigger on push</label>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={createBuild}
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Create Build
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Builds Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-lg animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBuilds.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center space-y-4">
            <Zap className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-semibold">No builds found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first build configuration to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBuilds.map((build) => (
            <BuildCard
              key={build._id || build.id}
              build={build}
              onTrigger={triggerBuild}
              onDelete={deleteBuild}
              onViewLogs={fetchBuildLogs}
            />
          ))}
        </div>
      )}

      {/* Build Logs */}
      {selectedBuild && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-green-500" />
              Build Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {buildLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No logs yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs bg-background p-4 rounded border">
                {buildLogs.map((log, idx) => (
                  <div key={idx} className="text-foreground">
                    <span className="text-muted-foreground">[{log.timestamp}]</span>{' '}
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoCard({ title, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500',
    red: 'from-red-500 to-rose-500',
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]} text-white group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BuildCard({ build, onTrigger, onDelete, onViewLogs }) {
  const statusColors = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    building: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    queued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {build.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <GitBranch className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{build.branch}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(build._id || build.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Status</span>
          <Badge className={statusColors[build.status] || statusColors.queued}>
            {build.status.charAt(0).toUpperCase() + build.status.slice(1)}
          </Badge>
        </div>

        {/* Build Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Environment</p>
            <p className="font-semibold capitalize">{build.environment}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-semibold">{build.duration || '0'}</p>
          </div>
        </div>

        {/* Build Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Last Build</p>
            <p className="font-semibold text-xs">
              {build.lastRun
                ? new Date(build.lastRun).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Auto-trigger</p>
            <p className="font-semibold">{build.autoTrigger ? 'On' : 'Off'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onTrigger(build._id || build.id)}
          >
            <Play className="w-4 h-4" />
            Trigger
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onViewLogs(build._id || build.id)}
          >
            <Eye className="w-4 h-4" />
            Logs
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
