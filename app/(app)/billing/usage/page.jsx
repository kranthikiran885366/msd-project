'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import { AlertCircle, Info, Download, RefreshCw, TrendingUp } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function UsageTrackingPage() {
  const [usageData, setUsageData] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsageData();
  }, [timeRange]);

  const fetchUsageData = async () => {
    try {
      setError('');
      setLoading(true);

      const [usageRes, planRes, historyRes] = await Promise.all([
        apiClient.getCurrentUsage(),
        apiClient.getCurrentPlan(),
        apiClient.getUsageHistory({ days: parseInt(timeRange) })
      ]);

      if (usageRes.success) {
        setUsageData(usageRes.data);
      } else {
        setError(usageRes.error || 'Failed to fetch usage data');
      }

      if (planRes.success) {
        setCurrentPlan(planRes.data);
      }

      if (historyRes.success) {
        setHistoricalData(historyRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateUsagePercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading usage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Usage & Metrics</h1>
          <p className="text-muted-foreground">
            Monitor your current usage and billing metrics
          </p>
        </div>
        <Button
          onClick={fetchUsageData}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Warning for high usage */}
      {usageData && (
        <>
          {calculateUsagePercentage(usageData.deployments, currentPlan?.deploymentLimit) > 80 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                You are approaching your deployment limit. Consider upgrading your plan.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Current Usage Overview */}
      {usageData && currentPlan && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Deployments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Deployments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  {usageData.deployments} / {currentPlan.deploymentLimit || '∞'}
                </p>
                <Progress
                  value={calculateUsagePercentage(usageData.deployments, currentPlan.deploymentLimit)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {calculateUsagePercentage(usageData.deployments, currentPlan.deploymentLimit)}% used
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Build Minutes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Build Minutes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  {usageData.buildMinutes} / {currentPlan.buildMinutesLimit || '∞'}
                </p>
                <Progress
                  value={calculateUsagePercentage(usageData.buildMinutes, currentPlan.buildMinutesLimit)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {calculateUsagePercentage(usageData.buildMinutes, currentPlan.buildMinutesLimit)}% used
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  {(usageData.storageGB).toFixed(2)} / {currentPlan.storageLimit || '∞'} GB
                </p>
                <Progress
                  value={calculateUsagePercentage(usageData.storageGB, currentPlan.storageLimit)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {calculateUsagePercentage(usageData.storageGB, currentPlan.storageLimit)}% used
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bandwidth */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bandwidth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  {(usageData.bandwidthGB).toFixed(2)} / {currentPlan.bandwidthLimit || '∞'} GB
                </p>
                <Progress
                  value={calculateUsagePercentage(usageData.bandwidthGB, currentPlan.bandwidthLimit)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {calculateUsagePercentage(usageData.bandwidthGB, currentPlan.bandwidthLimit)}% used
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Metrics */}
      {usageData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Database Instances</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{usageData.databaseInstances}</p>
              <p className="text-xs text-muted-foreground mt-1">Active databases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Concurrent Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{usageData.concurrentExecutions}</p>
              <p className="text-xs text-muted-foreground mt-1">Functions running now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">API Calls (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{usageData.todayApiCalls.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Requests today</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historical Charts */}
      <Tabs defaultValue="deployments" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="buildMinutes">Build Time</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="bandwidth">Bandwidth</TabsTrigger>
            <TabsTrigger value="apiCalls">API Calls</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              onClick={() => setTimeRange('7')}
              variant={timeRange === '7' ? 'default' : 'outline'}
              size="sm"
            >
              7 Days
            </Button>
            <Button
              onClick={() => setTimeRange('30')}
              variant={timeRange === '30' ? 'default' : 'outline'}
              size="sm"
            >
              30 Days
            </Button>
            <Button
              onClick={() => setTimeRange('90')}
              variant={timeRange === '90' ? 'default' : 'outline'}
              size="sm"
            >
              90 Days
            </Button>
          </div>
        </div>

        {/* Deployments Chart */}
        <TabsContent value="deployments">
          <Card>
            <CardHeader>
              <CardTitle>Daily Deployments</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="deployments"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Build Minutes Chart */}
        <TabsContent value="buildMinutes">
          <Card>
            <CardHeader>
              <CardTitle>Build Minutes Used</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="buildMinutes"
                      stroke="#8b5cf6"
                      fill="#8b5cf685"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Chart */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage (GB)</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="storageGB"
                      stroke="#ec4899"
                      fill="#ec489985"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bandwidth Chart */}
        <TabsContent value="bandwidth">
          <Card>
            <CardHeader>
              <CardTitle>Bandwidth Usage (GB)</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bandwidthGB" fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Calls Chart */}
        <TabsContent value="apiCalls">
          <Card>
            <CardHeader>
              <CardTitle>Daily API Calls</CardTitle>
            </CardHeader>
            <CardContent>
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Bar dataKey="apiCalls" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-5 h-5" />
            Usage Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• <strong>Build Minutes:</strong> Total time spent building and deploying your applications</p>
          <p>• <strong>Storage:</strong> Total disk space used by your applications and databases</p>
          <p>• <strong>Bandwidth:</strong> Data transferred to and from your applications</p>
          <p>• <strong>Concurrent Executions:</strong> Number of functions or processes running simultaneously</p>
          <p>• <strong>API Calls:</strong> Total requests made to your deployed APIs</p>
          <p>• Usage is reset monthly. Overage charges may apply if you exceed your plan limits</p>
        </CardContent>
      </Card>

      {/* Upgrade Recommendation */}
      {currentPlan && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Plan Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900">
            <p className="mb-3">
              Based on your usage, you're currently on the <Badge className="ml-2">{currentPlan.name}</Badge> plan.
            </p>
            <p>
              {calculateUsagePercentage(usageData.deployments, currentPlan.deploymentLimit) > 80 ? (
                <>Consider upgrading to the <strong>Pro</strong> or <strong>Enterprise</strong> plan to get higher limits and avoid overage charges.</>
              ) : (
                <>Your current plan is suitable for your usage. Monitor your metrics to plan for future growth.</>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
