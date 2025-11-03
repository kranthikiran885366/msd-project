'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Copy, Download, AlertTriangle, Clock, Database, Users, HardDrive } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

export default function DatabaseDetailPage() {
  const params = useParams();
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);

  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        setError('');
        const [dbResponse, metricsResponse, healthResponse, connectionsResponse] = await Promise.all([
          apiClient.getDatabaseDetail(params.id),
          apiClient.getDatabaseMetrics(params.id).catch(() => null),
          apiClient.getDatabaseHealth(params.id).catch(() => null),
          apiClient.getDatabaseConnections(params.id).catch(() => [])
        ]);

        if (dbResponse) {
          setDatabase(dbResponse);
          setMetrics(metricsResponse);
          setHealth(healthResponse);
          setConnections(connectionsResponse || []);
        } else {
          setError('Database not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch database details');
      } finally {
        setLoading(false);
      }
    };

    fetchDatabaseData();
  }, [params.id]);

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadConnectionConfig = () => {
    const config = `# Database Connection Configuration\n# Host: ${database.host}\n# Port: ${database.port}\n\nDB_HOST=${database.host}\nDB_PORT=${database.port}\nDB_USER=${database.username}\nDB_NAME=${database.database}`;
    const blob = new Blob([config], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${database.name}-config.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }

  if (!database) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Database not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{database.name}</h1>
            <p className="text-muted-foreground capitalize">
              {database.type} • {database.region}
            </p>
          </div>
          <div className="flex gap-2">
            {database.status === 'running' ? (
              <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Running</Badge>
            ) : database.status === 'creating' ? (
              <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Creating</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />{database.status}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Connections</p>
                <p className="text-2xl font-bold">{connections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold capitalize">{database.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="text-2xl font-bold capitalize">{database.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-2xl font-bold">
                  {new Date(database.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Details */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Host</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-muted p-2 rounded text-sm">{database.host}</code>
                <Button size="sm" variant="outline" onClick={() => handleCopyToClipboard(database.host, 'host')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Port</p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-muted p-2 rounded text-sm">{database.port}</code>
                <Button size="sm" variant="outline" onClick={() => handleCopyToClipboard(String(database.port), 'port')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Connection String</p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 bg-muted p-2 rounded text-sm break-all">{database.connectionString}</code>
              <Button size="sm" variant="outline" onClick={() => handleCopyToClipboard(database.connectionString, 'connstr')}>
                {copied === 'connstr' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={handleDownloadConnectionConfig} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download Connection Config
          </Button>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics (Last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                <Line type="monotone" dataKey="connections" stroke="#3b82f6" name="Connections" dot={false} />
                <Line type="monotone" dataKey="responseTime" stroke="#10b981" name="Response Time (ms)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Active Connections */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections.slice(0, 5).map(conn => (
                <div key={conn.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{conn.user}</p>
                      <p className="text-sm text-muted-foreground">{conn.host}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold">{Math.floor(conn.duration / 60)}m {conn.duration % 60}s</p>
                      </div>
                      <Badge className={conn.state === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {conn.state}
                      </Badge>
                    </div>
                  </div>
                  {conn.query && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Current Query:</p>
                      <code className="text-xs bg-muted p-1 rounded">{conn.query}</code>
                    </div>
                  )}
                </div>
              ))}
              {connections.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... and {connections.length - 5} more connections
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Backup Enabled</p>
            <p className="text-2xl font-bold">{database.backupEnabled ? 'Yes' : 'No'}</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Schedule</p>
            <p className="text-2xl font-bold capitalize">{database.backupSchedule}</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">SSL Enabled</p>
            <p className="text-2xl font-bold">{database.sslEnabled ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}