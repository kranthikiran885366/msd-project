'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

export default function DatabaseMonitoringPage() {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [slowQueries, setSlowQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState(null);
  const [connections, setConnections] = useState([]);

  const fetchDatabases = useCallback(async () => {
    try {
      setError('');
      const response = await apiClient.getDatabases();
      setDatabases(response || []);
      if (response?.length > 0 && !selectedDb) {
        setSelectedDb(response[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch databases');
    }
  }, [selectedDb]);

  const fetchMetrics = useCallback(async () => {
    if (!selectedDb) return;
    
    try {
      setLoading(true);
      setError('');
      const [metricsResponse, statsResponse, connectionsResponse] = await Promise.all([
        apiClient.getDatabaseMetrics(selectedDb).catch(() => null),
        apiClient.getDatabaseStats(selectedDb).catch(() => null),
        apiClient.getDatabaseConnections(selectedDb).catch(() => [])
      ]);
      
      setMetrics(metricsResponse);
      setStats(statsResponse);
      setConnections(connectionsResponse || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedDb]);

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDb) {
      fetchMetrics();
    }
  }, [selectedDb, fetchMetrics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <RefreshCw className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Database Monitoring</h1>
          <p className="text-muted-foreground">Real-time performance metrics and query analysis</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Database Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Database</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedDb}
            onChange={(e) => setSelectedDb(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">Select a database...</option>
            {databases.map(db => (
              <option key={db._id} value={db._id}>
                {db.name} ({db.type})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Connections</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{stats.connections?.current || 0}</span>
                    <Badge className={stats.connections?.percentage > 80 ? "bg-red-100 text-red-800" : stats.connections?.percentage > 60 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                      {stats.connections?.percentage || 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{stats.storage?.percentage || 0}%</span>
                    <Badge className={stats.storage?.percentage > 80 ? "bg-red-100 text-red-800" : stats.storage?.percentage > 60 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                      {Math.round((stats.storage?.used || 0) / 1024)} GB
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{stats.performance?.avgResponseTime || 0}ms</span>
                    <Badge className={stats.performance?.avgResponseTime > 100 ? "bg-red-100 text-red-800" : stats.performance?.avgResponseTime > 50 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                      {stats.performance?.avgResponseTime > 100 ? 'Slow' : stats.performance?.avgResponseTime > 50 ? 'Normal' : 'Fast'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Queries/sec</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{stats.performance?.queriesPerSecond || 0}</span>
                    <Badge className="bg-blue-100 text-blue-800">QPS</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>CPU Usage (Last 7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value) => [`${value}%`, 'CPU Usage']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cpuUsage" 
                        stroke="#ef4444" 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage (Last 7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value) => [`${value}%`, 'Memory Usage']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="memoryUsage" 
                        stroke="#f59e0b" 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Time (Last 7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value) => [`${value}ms`, 'Response Time']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="#3b82f6" 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connections (Last 7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value) => [value, 'Connections']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="connections" 
                        stroke="#8b5cf6" 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Active Connections */}
          {connections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {connections.slice(0, 10).map((conn) => (
                    <div key={conn.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{conn.user}@{conn.host}</p>
                          <p className="text-sm text-muted-foreground">Database: {conn.database}</p>
                        </div>
                        <Badge className={conn.state === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {conn.state}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Duration: {Math.floor(conn.duration / 60)}m {conn.duration % 60}s</span>
                        {conn.query && <span>Query: {conn.query.substring(0, 50)}...</span>}
                      </div>
                    </div>
                  ))}
                  {connections.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {connections.length - 10} more connections
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {stats.storage?.percentage > 80 && (
                  <li className="flex gap-3">
                    <span className="text-red-600 font-bold">⚠</span>
                    <span>Storage usage is at {stats.storage.percentage}%. Consider scaling up storage or archiving old data.</span>
                  </li>
                )}
                {stats.connections?.percentage > 80 && (
                  <li className="flex gap-3">
                    <span className="text-yellow-600 font-bold">⚠</span>
                    <span>Connection usage is at {stats.connections.percentage}%. Consider implementing connection pooling.</span>
                  </li>
                )}
                {stats.performance?.avgResponseTime > 100 && (
                  <li className="flex gap-3">
                    <span className="text-yellow-600 font-bold">⚠</span>
                    <span>Average response time is {stats.performance.avgResponseTime}ms. Consider optimizing queries or adding indexes.</span>
                  </li>
                )}
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">💡</span>
                  <span>Monitor cache hit ratio to optimize query performance.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Database is running normally. Continue monitoring for performance trends.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}