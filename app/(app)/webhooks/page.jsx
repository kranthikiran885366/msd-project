'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Plus,
  Webhook,
  Copy,
  Settings,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  Activity,
  Send,
  Search,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function WebhooksPage() {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [deliveryLogs, setDeliveryLogs] = useState([]);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [],
    active: true,
    retryPolicy: 'exponential',
    maxRetries: 5,
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setError('');
      setLoading(true);
      // Try to get the current project from localStorage or URL
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');
      
      if (!projectId) {
        setError('Please select a project first');
        setWebhooks([]);
        setLoading(false);
        return;
      }

      const res = await apiClient.getWebhooks(projectId);
      setWebhooks(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error('Error fetching webhooks:', err);
      setError(err.message || 'Failed to fetch webhooks');
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryLogs = async (webhookId) => {
    try {
      setError('');
      const res = await apiClient.getWebhookDeliveries(webhookId);
      setDeliveryLogs(Array.isArray(res) ? res : res.data || []);
      setSelectedWebhook(webhookId);
    } catch (err) {
      setError(err.message || 'Failed to fetch logs');
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.url.trim()) {
      setError('Webhook URL is required');
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

      const res = await apiClient.createWebhook(projectId, newWebhook);
      setSuccess('Webhook created successfully!');
      setNewWebhook({ url: '', events: [], active: true, retryPolicy: 'exponential', maxRetries: 5 });
      setShowNewDialog(false);
      await fetchWebhooks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create webhook');
    }
  };

  const deleteWebhook = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      setError('');
      await apiClient.deleteWebhook(id);
      setSuccess('Webhook deleted successfully!');
      await fetchWebhooks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete webhook');
    }
  };

  const eventTypes = [
    { id: 'deployment.created', label: 'Deployment Created', icon: '🚀' },
    { id: 'deployment.succeeded', label: 'Deployment Succeeded', icon: '✅' },
    { id: 'deployment.failed', label: 'Deployment Failed', icon: '❌' },
    { id: 'form.submission', label: 'Form Submission', icon: '📝' },
    { id: 'form.spam_detected', label: 'Spam Detected', icon: '🛡️' },
    { id: 'alert.triggered', label: 'Alert Triggered', icon: '🚨' },
    { id: 'alert.resolved', label: 'Alert Resolved', icon: '✔️' },
    { id: 'database.backup', label: 'Database Backed Up', icon: '💾' },
  ];

  const filteredWebhooks = webhooks.filter((webhook) => {
    const matchesSearch = webhook.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = eventFilter === 'all' || (webhook.events && webhook.events.includes(eventFilter));
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Webhooks & Events
            </h1>
            <p className="text-muted-foreground mt-2">
              Send real-time events to your applications with automatic retries
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Webhook
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Total Webhooks"
            value={webhooks.length}
            icon={<Webhook className="w-5 h-5" />}
            color="blue"
          />
          <InfoCard
            title="Active"
            value={webhooks.filter((w) => w.active).length}
            icon={<Activity className="w-5 h-5" />}
            color="green"
          />
          <InfoCard
            title="Total Deliveries"
            value={webhooks.reduce((sum, w) => sum + (w.deliveries || 0), 0).toLocaleString()}
            icon={<Send className="w-5 h-5" />}
            color="orange"
          />
          <InfoCard
            title="Failed"
            value={webhooks.reduce((sum, w) => sum + (w.failures || 0), 0)}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
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
            placeholder="Search webhooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border/50"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border/50 bg-card text-foreground hover:border-border transition-colors"
        >
          <option value="all">All Events</option>
          {eventTypes.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.label}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={fetchWebhooks} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Create Webhook Dialog */}
      {showNewDialog && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Create New Webhook</CardTitle>
                <CardDescription>Subscribe to real-time events</CardDescription>
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
              <label className="text-sm font-semibold">Webhook URL</label>
              <Input
                placeholder="https://example.com/webhook"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Events to Subscribe</label>
              <div className="grid grid-cols-2 gap-2">
                {eventTypes.map((evt) => (
                  <label key={evt.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(evt.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWebhook({
                            ...newWebhook,
                            events: [...newWebhook.events, evt.id],
                          });
                        } else {
                          setNewWebhook({
                            ...newWebhook,
                            events: newWebhook.events.filter((e) => e !== evt.id),
                          });
                        }
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{evt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Retry Policy</label>
              <select
                value={newWebhook.retryPolicy}
                onChange={(e) =>
                  setNewWebhook({ ...newWebhook, retryPolicy: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background"
              >
                <option value="exponential">Exponential Backoff</option>
                <option value="linear">Linear Backoff</option>
                <option value="none">No Retry</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newWebhook.active}
                onChange={(e) => setNewWebhook({ ...newWebhook, active: e.target.checked })}
                className="rounded border-border"
              />
              <label className="text-sm font-semibold">Enable Webhook</label>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={createWebhook}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Create Webhook
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks Grid */}
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
      ) : filteredWebhooks.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center space-y-4">
            <Webhook className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-semibold">No webhooks found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first webhook to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredWebhooks.map((webhook) => (
            <WebhookCard
              key={webhook._id || webhook.id}
              webhook={webhook}
              eventTypes={eventTypes}
              onSelect={fetchDeliveryLogs}
              onDelete={deleteWebhook}
            />
          ))}
        </div>
      )}

      {/* Delivery Logs */}
      {selectedWebhook && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Delivery Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveryLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No deliveries yet
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deliveryLogs.slice(0, 10).map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      log.status === 'success' || log.statusCode === 200
                        ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {log.status === 'success' || log.statusCode === 200 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        <p className="font-semibold text-sm capitalize">
                          {log.event || 'Delivery'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleTimeString()
                          : 'N/A'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Status: {log.statusCode || 'N/A'} | Response: {log.responseTime || 'N/A'}ms
                    </p>
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

function WebhookCard({ webhook, eventTypes, onSelect, onDelete }) {
  const successRate = webhook.deliveries > 0
    ? (((webhook.deliveries - webhook.failures) / webhook.deliveries) * 100).toFixed(1)
    : '100';

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors font-mono text-sm">
              {webhook.url}
            </CardTitle>
            <Badge
              variant={webhook.active ? 'default' : 'secondary'}
              className="mt-2 capitalize"
            >
              {webhook.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(webhook._id || webhook.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Events */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Subscribed Events:</p>
          <div className="flex flex-wrap gap-1">
            {webhook.events && webhook.events.map((evt) => {
              const eventType = eventTypes.find((e) => e.id === evt);
              return (
                <Badge key={evt} variant="outline" className="text-xs">
                  {eventType?.label || evt}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Deliveries</p>
            <p className="font-semibold">{webhook.deliveries || 0}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="font-semibold text-red-600">{webhook.failures || 0}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Success Rate</p>
            <p className="font-semibold text-green-600">{successRate}%</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Avg Response</p>
            <p className="font-semibold">{webhook.averageResponse || '0ms'}</p>
          </div>
        </div>

        {/* Last Delivery */}
        {webhook.lastDelivery && (
          <p className="text-xs text-muted-foreground">
            Last delivery:{' '}
            {new Date(webhook.lastDelivery).toLocaleDateString()}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onSelect(webhook._id || webhook.id)}
          >
            <Eye className="w-4 h-4" />
            Logs
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
          >
            <Send className="w-4 h-4" />
            Test
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
