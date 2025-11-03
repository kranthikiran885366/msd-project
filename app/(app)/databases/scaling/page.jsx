'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, TrendingUp, TrendingDown, Plus, Edit2, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

export default function InfrastructureScalingPage() {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [scalingHistory, setScalingHistory] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'cpu',
    metric: 'average',
    threshold: 70,
    action: 'scale-up',
    scale: 1,
    cooldown: 300,
    enabled: true
  });

  const [scalingOptions, setScalingOptions] = useState(null);
  const [currentDatabase, setCurrentDatabase] = useState(null);

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

  const fetchScalingData = useCallback(async () => {
    if (!selectedDb) return;
    
    try {
      setLoading(true);
      setError('');
      const [optionsResponse, dbResponse, metricsResponse] = await Promise.all([
        apiClient.getDatabaseScalingOptions(selectedDb).catch(() => null),
        apiClient.getDatabaseDetail(selectedDb).catch(() => null),
        apiClient.getDatabaseMetrics(selectedDb).catch(() => [])
      ]);
      
      setScalingOptions(optionsResponse);
      setCurrentDatabase(dbResponse);
      setScalingHistory(metricsResponse || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch scaling data');
    } finally {
      setLoading(false);
    }
  }, [selectedDb]);

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDb) {
      fetchScalingData();
    }
  }, [selectedDb, fetchScalingData]);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handleScaleDatabase = async (newSize) => {
    if (!selectedDb || !newSize) return;

    try {
      setError('');
      setLoading(true);
      await apiClient.scaleDatabaseUp(selectedDb, newSize);
      setSuccessMessage(`Database scaling to ${newSize} initiated successfully`);
      await fetchScalingData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to scale database');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    );
  }



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Infrastructure Scaling</h1>
          <p className="text-muted-foreground">Configure auto-scaling policies based on metrics</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Policy
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

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

      {/* Current Database Info */}
      {currentDatabase && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Size</p>
                <p className="text-3xl font-bold capitalize">{currentDatabase.size}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-3xl font-bold capitalize">{currentDatabase.status}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="text-3xl font-bold">{currentDatabase.region}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-3xl font-bold capitalize">{currentDatabase.type}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scaling Options */}
      {scalingOptions && (
        <Card>
          <CardHeader>
            <CardTitle>Available Scaling Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Current size: <span className="font-semibold capitalize">{scalingOptions.current}</span>
              </p>
              <div className="grid gap-3">
                {scalingOptions.options?.map((option) => (
                  <div key={option.size} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold capitalize">{option.size}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.cpu} • {option.memory} • {option.storage}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{option.price}</span>
                      <Button 
                        size="sm" 
                        onClick={() => handleScaleDatabase(option.size)}
                        disabled={option.size === scalingOptions.current || loading}
                        variant={option.size === scalingOptions.current ? "outline" : "default"}
                      >
                        {option.size === scalingOptions.current ? 'Current' : 'Scale To'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance History Chart */}
      {scalingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance History (Last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scalingHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="cpuUsage" stroke="#ef4444" name="CPU %" dot={false} />
                <Line type="monotone" dataKey="memoryUsage" stroke="#f59e0b" name="Memory %" dot={false} />
                <Line type="monotone" dataKey="connections" stroke="#3b82f6" name="Connections" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}



      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Scaling Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Set appropriate thresholds based on your SLA requirements</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Configure cooldown periods to prevent rapid scaling oscillations</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Monitor scaling events and adjust policies based on actual behavior</span>
          </div>
          <div className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">Use multiple metrics for more intelligent scaling decisions</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
