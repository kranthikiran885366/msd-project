'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  FileText,
  Copy,
  Settings,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  Activity,
  Clock,
  TrendingUp,
  Search,
  Download,
  Edit,
  Mail,
  FileText,
  BarChart3,
  Shield,
  Zap,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function FormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    fields: [],
    notifications: { email: '', slackWebhook: '' },
    spamFiltering: true,
  });

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setError('');
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');

      if (!projectId) {
        setError('Please select a project first');
        setForms([]);
        setLoading(false);
        return;
      }

      const res = await apiClient.getForms?.(projectId) || { data: [] };
      setForms(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch forms');
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (formId) => {
    try {
      setError('');
      const res = await apiClient.getFormSubmissions?.(formId) || { success: false };
      if (res.success || Array.isArray(res)) {
        setSubmissions(Array.isArray(res) ? res : res.data || []);
        setSelectedForm(formId);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch submissions');
    }
  };

  const createForm = async () => {
    if (!newForm.name.trim()) {
      setError('Form name is required');
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

      const res = await apiClient.createForm?.(projectId, newForm) || { success: true };
      setSuccess('Form created successfully!');
      setNewForm({ name: '', description: '', fields: [], notifications: {}, spamFiltering: true });
      setShowNewDialog(false);
      await fetchForms();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create form');
    }
  };

  const deleteForm = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      setError('');
      await apiClient.deleteForm?.(id);
      setSuccess('Form deleted successfully!');
      await fetchForms();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete form');
    }
  };

  const filteredForms = forms.filter((form) => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Form Handling
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and manage forms with automatic notifications and spam filtering
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Form
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Total Forms"
            value={forms.length}
            icon={<FileText className="w-5 h-5" />}
            color="green"
          />
          <InfoCard
            title="Total Submissions"
            value={forms.reduce((sum, f) => sum + (f.submissions || 0), 0).toLocaleString()}
            icon={<FileText className="w-5 h-5" />}
            color="blue"
          />
          <InfoCard
            title="Unread"
            value={forms.reduce((sum, f) => sum + (f.unread || 0), 0)}
            icon={<Mail className="w-5 h-5" />}
            color="orange"
            trend="action needed"
          />
          <InfoCard
            title="Spam Blocked"
            value={forms.reduce((sum, f) => sum + (f.spamBlocked || 0), 0)}
            icon={<Shield className="w-5 h-5" />}
            color="purple"
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
            placeholder="Search forms..."
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
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
        <Button variant="outline" onClick={fetchForms} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Create Form Dialog */}
      {showNewDialog && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Create New Form</CardTitle>
                <CardDescription>Set up a new form to collect submissions</CardDescription>
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
              <label className="text-sm font-semibold">Form Name</label>
              <Input
                placeholder="e.g., Contact Us"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Description</label>
              <Input
                placeholder="What is this form for?"
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                className="bg-background border-border/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newForm.spamFiltering}
                onChange={(e) => setNewForm({ ...newForm, spamFiltering: e.target.checked })}
                className="rounded border-border"
              />
              <label className="text-sm font-semibold">Enable Spam Filtering</label>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowNewDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createForm}
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Create Form
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
      ) : filteredForms.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center space-y-4">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-semibold">No forms found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first form to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredForms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onSelect={fetchSubmissions}
              onDelete={deleteForm}
            />
          ))}
        </div>
      )}

      {/* Submissions Viewer */}
      {selectedForm && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Form Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No submissions yet
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {submissions.slice(0, 10).map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">
                        Submission {submissions.length - idx}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.createdAt
                          ? new Date(sub.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <pre className="text-xs bg-background p-2 rounded border border-border/50 overflow-auto max-h-24">
                      {JSON.stringify(sub.data || sub, null, 2)}
                    </pre>
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

function InfoCard({ title, value, icon, color = 'green', trend }) {
  const colors = {
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
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
          {trend && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              ⚠ {trend}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FormCard({ form, onSelect, onDelete }) {
  const [showEmbed, setShowEmbed] = useState(false);

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
              {form.name}
            </CardTitle>
            {form.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {form.description}
              </CardDescription>
            )}
            <Badge
              variant={form.status === 'active' ? 'default' : 'secondary'}
              className="mt-2 capitalize"
            >
              {form.status}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(form.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Submissions</p>
            <p className="font-semibold">{form.submissions}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Unread</p>
            <p className="font-semibold text-orange-600">{form.unread}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Spam Blocked</p>
            <p className="font-semibold">{form.spamBlocked}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Fields</p>
            <p className="font-semibold">{form.fields}</p>
          </div>
        </div>

        {/* Last Submission */}
        {form.lastSubmission && (
          <p className="text-xs text-muted-foreground">
            Last submission:{' '}
            {new Date(form.lastSubmission).toLocaleDateString()}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onSelect(form.id)}
          >
            <Eye className="w-4 h-4" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setShowEmbed(!showEmbed)}
          >
            <Copy className="w-4 h-4" />
            Embed
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            asChild
          >
            <Link href={`/forms/${form.id}`}>
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Embed Code */}
        {showEmbed && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs font-semibold mb-2">Embed Code:</p>
            <code className="text-xs block bg-background p-2 rounded overflow-auto max-h-24">
              {form.embedCode}
            </code>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 w-full gap-2"
              onClick={() => navigator.clipboard.writeText(form.embedCode)}
            >
              <Copy className="w-3 h-3" />
              Copy Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}