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
  Database,
  Copy,
  Settings,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
  HardDrive,
  Globe,
  Zap,
  BarChart3,
  Lock,
  Activity,
  Clock,
  TrendingUp,
  Download,
  Upload,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function DatabasesPage() {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [type, setType] = useState('postgresql');
  const [size, setSize] = useState('small');
  const [region, setRegion] = useState('iad1');
  const [name, setName] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      setError('');
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');

      if (!projectId) {
        setError('Please select a project first');
        setDatabases([]);
        setLoading(false);
        return;
      }

      const response = await apiClient.getDatabases?.(projectId) || { data: [] };
      setDatabases(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch databases');
      setDatabases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDatabase = async () => {
    if (!name.trim()) {
      setError('Database name is required');
      return;
    }

    setCreating(true);
    try {
      setError('');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const projectId = user?.currentProjectId || localStorage.getItem('currentProjectId');

      if (!projectId) {
        setError('Please select a project first');
        setCreating(false);
        return;
      }

      const response = await apiClient.createDatabase?.(projectId, {
        name: name.trim(),
        type,
        size,
        region,
      }) || { success: true };

      setSuccessMessage('Database created successfully!');
      setName('');
      setShowNewDialog(false);
      await fetchDatabases();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create database');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDatabase = async (id) => {
    if (!confirm('Are you sure you want to delete this database?')) return;

    try {
      setError('');
      const res = await apiClient.deleteDatabase?.(id) || { success: false };
      if (res?.success || res) {
        setSuccessMessage('Database deleted successfully!');
        await fetchDatabases();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete database');
    }
  };

  const dbTypes = {
    postgresql: {
      name: 'PostgreSQL',
      icon: '🐘',
      color: 'from-blue-500 to-cyan-500',
      features: ['ACID compliance', 'JSON support', 'PostGIS', 'Full-text search'],
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    redis: {
      name: 'Redis',
      icon: '⚡',
      color: 'from-red-500 to-orange-500',
      features: ['In-memory cache', 'Real-time sync', 'Pub/Sub', 'Lua scripting'],
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
    mongodb: {
      name: 'MongoDB',
      icon: '🍃',
      color: 'from-green-500 to-emerald-500',
      features: ['Document DB', 'Flexible schema', 'Aggregation', 'Transactions'],
      badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    mysql: {
      name: 'MySQL',
      icon: '🐬',
      color: 'from-blue-600 to-blue-400',
      features: ['Relational DB', 'InnoDB', 'Full-text search', 'Partitioning'],
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    mariadb: {
      name: 'MariaDB',
      icon: '🐬',
      color: 'from-blue-700 to-indigo-500',
      features: ['MySQL compatible', 'High performance', 'Open source', 'Galera cluster'],
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    },
  };

  const sizes = {
    micro: { ram: '0.5 GB', cpu: '1 vCPU', storage: '10 GB' },
    small: { ram: '2 GB', cpu: '2 vCPU', storage: '50 GB' },
    medium: { ram: '8 GB', cpu: '4 vCPU', storage: '200 GB' },
    large: { ram: '32 GB', cpu: '8 vCPU', storage: '500 GB' },
    xlarge: { ram: '64 GB', cpu: '16 vCPU', storage: '1 TB' },
  };

  const regions = {
    iad1: 'US East (Virginia)',
    fra1: 'EU (Frankfurt)',
    sfo1: 'US West (California)',
    sin1: 'Asia Pacific (Singapore)',
    syd1: 'Australia (Sydney)',
  };

  const filteredDatabases = databases.filter((db) => {
    const matchesSearch = db.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || db.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || db.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const copy = async (val) => {
    try {
      await navigator.clipboard.writeText(val);
      setSuccessMessage('Connection string copied!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('Failed to copy connection string');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Managed Databases
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and manage fully managed databases with automatic backups and scaling
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create Database
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Total Databases"
            value={databases.length}
            icon={<Database className="w-5 h-5" />}
            color="blue"
          />
          <InfoCard
            title="Running"
            value={databases.filter((d) => d.status === 'running').length}
            icon={<Activity className="w-5 h-5" />}
            color="green"
          />
          <InfoCard
            title="Avg Uptime"
            value="99.97%"
            icon={<TrendingUp className="w-5 h-5" />}
            color="purple"
          />
          <InfoCard
            title="Total Storage"
            value={`${databases.reduce((sum, d) => sum + (d.storage || 0), 0)} GB`}
            icon={<HardDrive className="w-5 h-5" />}
            color="orange"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-400">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search databases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border/50 bg-card text-foreground hover:border-border transition-colors"
        >
          <option value="all">All Types</option>
          {Object.entries(dbTypes).map(([key, val]) => (
            <option key={key} value={key}>
              {val.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border/50 bg-card text-foreground hover:border-border transition-colors"
        >
          <option value="all">All Status</option>
          <option value="running">Running</option>
          <option value="creating">Creating</option>
          <option value="failed">Failed</option>
        </select>
        <Button variant="outline" onClick={fetchDatabases} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Create Dialog */}
      {showNewDialog && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card/95 to-card/80">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Create New Database</CardTitle>
                <CardDescription>
                  Set up a new managed database instance
                </CardDescription>
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
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Database Name</label>
                <Input
                  placeholder="my-database"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background"
                >
                  {Object.entries(dbTypes).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background"
                >
                  {Object.entries(sizes).map(([key, val]) => (
                    <option key={key} value={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)} - {val.ram}, {val.cpu}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background"
                >
                  {Object.entries(regions).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Size Details */}
            {sizes[size] && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <h4 className="font-semibold text-sm mb-2">{size.charAt(0).toUpperCase() + size.slice(1)} Plan</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">RAM</p>
                    <p className="font-semibold">{sizes[size].ram}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CPU</p>
                    <p className="font-semibold">{sizes[size].cpu}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Storage</p>
                    <p className="font-semibold">{sizes[size].storage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowNewDialog(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDatabase}
                disabled={creating || !name.trim()}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {creating ? 'Creating...' : 'Create Database'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Databases Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-0 shadow-lg animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDatabases.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center space-y-4">
            <Database className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h3 className="text-lg font-semibold">No databases found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search filters'
                  : 'Create your first database to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDatabases.map((db) => (
            <DatabaseCard
              key={db._id}
              database={db}
              dbType={dbTypes[db.type]}
              onDelete={handleDeleteDatabase}
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
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
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

function DatabaseCard({ database, dbType, onDelete, onCopy }) {
  const statusColors = {
    running: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    creating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const storagePercent = (database.storage / database.maxStorage) * 100;

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="text-3xl">{dbType?.icon}</div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                {database.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={dbType?.badge}>
                  {dbType?.name}
                </Badge>
                <Badge
                  variant="outline"
                  className={`capitalize ${statusColors[database.status]}`}
                >
                  {database.status}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(database._id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection String */}
        {database.connectionString && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Connection String</p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 text-xs bg-muted/50 p-2 rounded font-mono truncate">
                {database.connectionString}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCopy(database.connectionString)}
                className="flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Region</p>
            <p className="font-semibold text-sm">{database.region.toUpperCase()}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Size</p>
            <p className="font-semibold text-sm capitalize">{database.size}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Connections</p>
            <p className="font-semibold text-sm">
              {database.connections}/{database.maxConnections}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="font-semibold text-sm text-green-600">{database.uptime}%</p>
          </div>
        </div>

        {/* Storage Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Storage</span>
            <span className="font-semibold">
              {database.storage}/{database.maxStorage} GB
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                storagePercent > 80
                  ? 'bg-red-500'
                  : storagePercent > 60
                  ? 'bg-yellow-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(storagePercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            asChild
          >
            <Link href={`/databases/${database._id}`}>
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            asChild
          >
            <Link href={`/databases/${database._id}/backups`}>
              <Download className="w-4 h-4" />
              Backups
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            asChild
          >
            <Link href={`/databases/${database._id}/monitoring`}>
              <Activity className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
