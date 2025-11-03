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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  Activity,
  TrendingUp,
  AlertTriangle,
  Plus,
  Settings,
  Trash2,
  Bell,
  RefreshCw,
  Search,
  Eye,
  Clock,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function MonitoringPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [uptime, setUptime] = useState([]);
  const [newAlert, setNewAlert] = useState({
    name: '',
    metric: 'cpu',
    threshold: 80,
    condition: 'above',
    enabled: true,
  });

  useEffect(() => {
    fetchAlerts();
    fetchUptime();
  }, []);

  const fetchAlerts = async () => {
    try {
      setError('');
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');

      if (!projectId) {
        setError('Please select a project first');
        setAlerts([]);
        setLoading(false);
        return;
      }

      const res = await apiClient.getAlerts?.(projectId) || { data: [] };
      setAlerts(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message || 'Failed to fetch alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUptime = async () => {
    try {
      const res = await apiClient.getUptimeData?.() || { data: [] };
      setUptime(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error('Error fetching uptime:', err);
    }
  };

  const createAlert = async () => {
    if (!newAlert.name.trim()) {
      setError('Alert name is required');
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

      const res = await apiClient.createAlert?.(projectId, newAlert) || { success: true };
      setSuccess('Alert created successfully!');
      setNewAlert({ name: '', metric: 'cpu', threshold: 80, condition: 'above', enabled: true });
      setShowNewDialog(false);
      await fetchAlerts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create alert');
    }
  };

  const deleteAlert = async (id) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    try {
      setError('');
      await apiClient.deleteAlert?.(id);
      setSuccess('Alert deleted successfully!');
      await fetchAlerts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete alert');
    }
  };

  const statusFilters = ['all', 'healthy', 'warning', 'critical'];
  const metrics = ['cpu', 'memory', 'disk', 'network', 'latency'];

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = alert.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const healthyAlerts = alerts.filter((a) => a.status === 'healthy').length;
  const warningAlerts = alerts.filter((a) => a.status === 'warning').length;
  const criticalAlerts = alerts.filter((a) => a.status === 'critical').length;
  const avgUptime = alerts.length > 0
    ? (alerts.reduce((sum, a) => sum + (a.uptime || 0), 0) / alerts.length).toFixed(2)
    : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Service Monitoring
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor service health, uptime, and set up alerts
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Alert
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Healthy"
            value={healthyAlerts}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <InfoCard
            title="Warning"
            value={warningAlerts}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="yellow"
          />
          <InfoCard
            title="Critical"
            value={criticalAlerts}
            icon={<AlertCircle className="w-5 h-5" />}
            color="red"
          />
          <InfoCard
            title="Avg Uptime"
            value={`${avgUptime}%`}
            icon={<TrendingUp className="w-5 h-5" />}
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

      {/* Uptime Chart */}
      {uptime.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Uptime Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={uptime}>
                <defs>
                  <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="uptime"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorUptime)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
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
        <Button variant="outline" onClick={fetchAlerts} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Create Alert Dialog */}
      {showNewDialog && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Create Alert Rule</CardTitle>
                <CardDescription>Set up a monitoring alert for your services</CardDescription>
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
              <label className="text-sm font-semibold">Alert Name</label>
              <Input
                placeholder="High CPU Usage"
                value={newAlert.name}
                onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Metric</label>
              <select
                value={newAlert.metric}
                onChange={(e) =>
                  setNewAlert({ ...newAlert, metric: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background"
              >
                {metrics.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Condition</label>
                <select
                  value={newAlert.condition}
                  onChange={(e) =>
                    setNewAlert({ ...newAlert, condition: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                  <option value="equals">Equals</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Threshold</label>
                <Input
                  type="number"
                  value={newAlert.threshold}
                  onChange={(e) =>
                    setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) })
                  }
                  className="bg-background border-border/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAlert.enabled}
                onChange={(e) =>
                  setNewAlert({ ...newAlert, enabled: e.target.checked })
                }
                className="rounded border-border"
              />
              <label className="text-sm font-semibold">Enable Alert</label>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={createAlert}
                className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                Create Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Grid */}
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
      ) : filteredAlerts.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center space-y-4">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-semibold">No alerts found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first alert to start monitoring'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert._id || alert.id}
              alert={alert}
              onDelete={deleteAlert}
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
    yellow: 'from-yellow-500 to-amber-500',
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

function AlertCard({ alert, onDelete }) {
  const statusColors = {
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {alert.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {alert.metric.toUpperCase()} {alert.condition} {alert.threshold}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(alert._id || alert.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Status</span>
          <Badge className={statusColors[alert.status] || statusColors.healthy}>
            {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
          </Badge>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="font-semibold">{alert.currentValue || '0'}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="font-semibold">{alert.uptime || 0}%</p>
          </div>
        </div>

        {/* Alert Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Triggered</p>
            <p className="font-semibold text-xs">
              {alert.triggered || 0} times
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Enabled</p>
            <p className="font-semibold">{alert.enabled ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
          >
            <Eye className="w-4 h-4" />
            Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
          >
            <Clock className="w-4 h-4" />
            History
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
