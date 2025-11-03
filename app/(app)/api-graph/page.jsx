'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  TrendingUp,
  AlertTriangle,
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  Search,
  Copy,
  Eye,
  Key,
  Zap,
  Lock,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function APIGraphPage() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedApi, setSelectedApi] = useState(null);
  const [usage, setUsage] = useState([]);
  const [newApi, setNewApi] = useState({
    name: '',
    path: '',
    method: 'GET',
    rateLimit: 1000,
    enabled: true,
  });

  useEffect(() => {
    fetchApis();
    fetchUsageData();
  }, []);

  const fetchApis = async () => {
    try {
      setError('');
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');

      if (!projectId) {
        setError('Please select a project first');
        setApis([]);
        setLoading(false);
        return;
      }

      const res = await apiClient.getApis?.(projectId) || { data: [] };
      setApis(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error('Error fetching APIs:', err);
      setError(err.message || 'Failed to fetch APIs');
      setApis([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async () => {
    try {
      const res = await apiClient.getApiUsage?.() || { data: [] };
      setUsage(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  };

  const createApi = async () => {
    if (!newApi.name.trim() || !newApi.path.trim()) {
      setError('API name and path are required');
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

      const res = await apiClient.createApi?.(projectId, newApi) || { success: true };
      setSuccess('API created successfully!');
      setNewApi({ name: '', path: '', method: 'GET', rateLimit: 1000, enabled: true });
      setShowNewDialog(false);
      await fetchApis();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create API');
    }
  };

  const deleteApi = async (id) => {
    if (!confirm('Are you sure you want to delete this API?')) return;
    try {
      setError('');
      await apiClient.deleteApi?.(id);
      setSuccess('API deleted successfully!');
      await fetchApis();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete API');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const statusFilters = ['all', 'active', 'limited', 'inactive'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const filteredApis = apis.filter((api) => {
    const matchesSearch = api.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || api.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalApis = apis.length;
  const activeApis = apis.filter((a) => a.enabled).length;
  const totalRequests = apis.reduce((sum, a) => sum + (a.totalRequests || 0), 0);
  const avgLatency = apis.length > 0
    ? (apis.reduce((sum, a) => sum + (a.avgLatency || 0), 0) / apis.length).toFixed(0)
    : 0;

  const methodColors = {
    GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    POST: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              API Gateway
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage API endpoints, rate limiting, and keys
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New API
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Total APIs"
            value={totalApis}
            icon={<Zap className="w-5 h-5" />}
            color="blue"
          />
          <InfoCard
            title="Active"
            value={activeApis}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <InfoCard
            title="Total Requests"
            value={totalRequests.toLocaleString()}
            icon={<TrendingUp className="w-5 h-5" />}
            color="purple"
          />
          <InfoCard
            title="Avg Latency"
            value={`${avgLatency}ms`}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="orange"
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

      {/* Usage Chart */}
      {usage.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>API Usage (24 Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={usage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#4f46e5"
                  name="Requests"
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#ef4444"
                  name="Errors"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search APIs..."
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
        <Button variant="outline" onClick={fetchApis} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Create API Dialog */}
      {showNewDialog && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Create API Endpoint</CardTitle>
                <CardDescription>Add a new API endpoint to your gateway</CardDescription>
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
              <label className="text-sm font-semibold">API Name</label>
              <Input
                placeholder="User Service"
                value={newApi.name}
                onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Path</label>
              <Input
                placeholder="/api/users"
                value={newApi.path}
                onChange={(e) => setNewApi({ ...newApi, path: e.target.value })}
                className="bg-background border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Method</label>
                <select
                  value={newApi.method}
                  onChange={(e) =>
                    setNewApi({ ...newApi, method: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background"
                >
                  {methods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Rate Limit</label>
                <Input
                  type="number"
                  value={newApi.rateLimit}
                  onChange={(e) =>
                    setNewApi({ ...newApi, rateLimit: parseInt(e.target.value) })
                  }
                  className="bg-background border-border/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newApi.enabled}
                onChange={(e) =>
                  setNewApi({ ...newApi, enabled: e.target.checked })
                }
                className="rounded border-border"
              />
              <label className="text-sm font-semibold">Enable API</label>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={createApi}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
              >
                Create API
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* APIs Grid */}
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
      ) : filteredApis.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center space-y-4">
            <Zap className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-semibold">No APIs found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first API endpoint to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApis.map((api) => (
            <ApiCard
              key={api._id || api.id}
              api={api}
              methodColors={methodColors}
              onDelete={deleteApi}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500',
    purple: 'from-purple-500 to-pink-500',
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

function ApiCard({ api, methodColors, onDelete, onCopy }) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {api.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={methodColors[api.method] || methodColors.GET}>
                {api.method}
              </Badge>
              <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                {api.path}
              </code>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(api._id || api.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Status</span>
          <Badge variant={api.enabled ? 'default' : 'secondary'}>
            {api.enabled ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* API Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Rate Limit</p>
            <p className="font-semibold">{api.rateLimit}/min</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Requests</p>
            <p className="font-semibold">{api.totalRequests || 0}</p>
          </div>
        </div>

        {/* API Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Latency</p>
            <p className="font-semibold">{api.avgLatency || 0}ms</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Errors</p>
            <p className="font-semibold text-red-600">{api.errors || 0}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onCopy(api.path)}
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
          >
            <Eye className="w-4 h-4" />
            Logs
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Lock className="w-4 h-4" />
            Auth
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}