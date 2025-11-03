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
  Globe,
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
  Edit,
  Lock,
  Shield,
  Calendar,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function DomainsPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [dnsRecords, setDnsRecords] = useState([]);
  const [sslStatus, setSslStatus] = useState(null);
  const [newDomain, setNewDomain] = useState({
    host: '',
    enableSSL: true,
    autoRenewal: true,
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setError('');
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');
      
      if (!projectId) {
        setError('Please select a project first');
        setDomains([]);
        setLoading(false);
        return;
      }

      const res = await apiClient.getDomains(projectId);
      setDomains(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error('Error fetching domains:', err);
      setError(err.message || 'Failed to fetch domains');
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const createDomain = async () => {
    if (!newDomain.host.trim()) {
      setError('Domain name is required');
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

      await apiClient.createDomain(projectId, newDomain.host.trim());
      setSuccess('Domain added successfully!');
      setNewDomain({ host: '', enableSSL: true, autoRenewal: true });
      setShowNewDialog(false);
      await fetchDomains();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add domain');
    }
  };

  const deleteDomain = async (id) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    try {
      setError('');
      await apiClient.deleteDomain(id);
      setSuccess('Domain deleted successfully!');
      await fetchDomains();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete domain');
    }
  };

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  const statusConfig = {
    verified: { color: 'from-green-500 to-emerald-500', label: 'Verified', badge: 'bg-green-100 text-green-800' },
    pending: { color: 'from-yellow-500 to-amber-500', label: 'Pending', badge: 'bg-yellow-100 text-yellow-800' },
    failed: { color: 'from-red-500 to-rose-500', label: 'Failed', badge: 'bg-red-100 text-red-800' },
  };

  const filteredDomains = domains.filter((domain) => {
    const matchesSearch = domain.host.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || domain.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              Custom Domains
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your domains, SSL certificates, and DNS records
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="gap-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Domain
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Total Domains"
            value={domains.length}
            icon={<Globe className="w-5 h-5" />}
            color="orange"
          />
          <InfoCard
            title="Verified"
            value={domains.filter((d) => d.status === 'verified').length}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <InfoCard
            title="SSL Active"
            value={domains.filter((d) => d.sslEnabled).length}
            icon={<Lock className="w-5 h-5" />}
            color="blue"
          />
          <InfoCard
            title="Pending"
            value={domains.filter((d) => d.status === 'pending').length}
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
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
            placeholder="Search domains..."
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
          <option value="all">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <Button variant="outline" onClick={fetchDomains} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Create Domain Dialog */}
      {showNewDialog && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Add New Domain</CardTitle>
                <CardDescription>Connect a custom domain to your project</CardDescription>
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
              <label className="text-sm font-semibold">Domain Name</label>
              <Input
                placeholder="example.com"
                value={newDomain.host}
                onChange={(e) => setNewDomain({ ...newDomain, host: e.target.value })}
                className="bg-background border-border/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newDomain.enableSSL}
                onChange={(e) => setNewDomain({ ...newDomain, enableSSL: e.target.checked })}
                className="rounded border-border"
              />
              <label className="text-sm font-semibold">Enable SSL Certificate</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newDomain.autoRenewal}
                onChange={(e) => setNewDomain({ ...newDomain, autoRenewal: e.target.checked })}
                className="rounded border-border"
              />
              <label className="text-sm font-semibold">Auto-Renew Certificate</label>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={createDomain}
                className="gap-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
              >
                Add Domain
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Domains Grid */}
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
      ) : filteredDomains.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center space-y-4">
            <Globe className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-semibold">No domains found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Add your first domain to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDomains.map((domain) => (
            <DomainCard
              key={domain._id || domain.id}
              domain={domain}
              statusConfig={statusConfig}
              onDelete={deleteDomain}
              onCopy={copy}
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
    yellow: 'from-yellow-500 to-amber-500',
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

function DomainCard({ domain, statusConfig, onDelete, onCopy }) {
  const config = statusConfig[domain.status] || statusConfig.pending;
  const daysUntilExpiry = domain.expiresAt
    ? Math.ceil((new Date(domain.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {domain.host}
            </CardTitle>
            <Badge className={`mt-2 capitalize ${config.badge}`}>
              {config.label}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(domain._id || domain.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* SSL Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold">SSL Certificate</span>
          </div>
          <Badge variant={domain.sslEnabled ? 'default' : 'secondary'}>
            {domain.sslEnabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>

        {/* Expiry Info */}
        {daysUntilExpiry !== null && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold">Expires In</span>
            </div>
            <span className={`text-sm font-semibold ${daysUntilExpiry < 30 ? 'text-red-600' : 'text-green-600'}`}>
              {daysUntilExpiry} days
            </span>
          </div>
        )}

        {/* DNS Records */}
        {domain.dnsRecords && domain.dnsRecords.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">DNS Records:</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {domain.dnsRecords.slice(0, 3).map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-background p-2 rounded border hover:bg-muted transition"
                >
                  <div className="font-mono min-w-0">
                    <span className="font-semibold text-primary">{record.type}</span>
                    <span className="text-muted-foreground ml-1">→</span>
                    <span className="text-foreground ml-1 break-all">{record.value}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCopy(record.value)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
          >
            <Settings className="w-4 h-4" />
            DNS Settings
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
          >
            <Shield className="w-4 h-4" />
            SSL
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
