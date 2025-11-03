'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertCircle, DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CostAnalyticsPage() {
  const [costData, setCostData] = useState(null);
  const [costHistory, setCostHistory] = useState([]);
  const [costByService, setCostByService] = useState([]);
  const [timeRange, setTimeRange] = useState('30');
  const [filterService, setFilterService] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCostData();
  }, [timeRange]);

  const fetchCostData = async () => {
    try {
      setError('');
      setLoading(true);

      const [costRes, historyRes, serviceRes] = await Promise.all([
        apiClient.getCostAnalytics({ days: parseInt(timeRange) }),
        apiClient.getCostHistory({ days: parseInt(timeRange) }),
        apiClient.getCostByService({ days: parseInt(timeRange) })
      ]);

      if (costRes.success) {
        setCostData(costRes.data);
      } else {
        setError(costRes.error || 'Failed to fetch cost data');
      }

      if (historyRes.success) {
        setCostHistory(historyRes.data || []);
      }

      if (serviceRes.success) {
        setCostByService(serviceRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend) => {
    return trend > 0 ? 'text-red-600' : 'text-green-600';
  };

  const getTrendIcon = (trend) => {
    return trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getSortedServices = () => {
    return costByService.sort((a, b) => b.cost - a.cost);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading cost analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Cost Analytics</h1>
          <p className="text-muted-foreground">
            Detailed breakdown of your cloud spending and cost trends
          </p>
        </div>
        <Button
          onClick={fetchCostData}
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

      {/* Cost Metrics */}
      {costData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cost */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>Total Cost</span>
                <DollarSign className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">${costData.totalCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Period: {timeRange} days</p>
              </div>
            </CardContent>
          </Card>

          {/* Daily Average */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daily Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">${costData.dailyAverage.toFixed(2)}</p>
                <p className={`text-sm font-medium flex items-center gap-1 ${getTrendColor(costData.costTrend)}`}>
                  {getTrendIcon(costData.costTrend)}
                  {Math.abs(costData.costTrend).toFixed(1)}% vs previous period
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Highest Day */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Highest Daily Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">${costData.highestDayCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{costData.highestDay}</p>
              </div>
            </CardContent>
          </Card>

          {/* Projected Monthly */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projected Monthly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">${costData.projectedMonthly.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Based on current rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Range Selector */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cost Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {costHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={costHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#3b82f6"
                    fill="#3b82f685"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Cost by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution by Service</CardTitle>
          </CardHeader>
          <CardContent>
            {costByService.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getSortedServices()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="cost"
                  >
                    {getSortedServices().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'][index % 6]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Cumulative Cost */}
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {costHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Line
                    type="monotone"
                    dataKey="cumulativeCost"
                    stroke="#ec4899"
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

        {/* Cost vs Deployment Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Cost vs Deployment Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {costHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="cost"
                    fill="#3b82f6"
                    name="Cost ($)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="deployments"
                    fill="#8b5cf6"
                    name="Deployments"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {costByService.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Service</th>
                    <th className="text-right py-3 px-4 font-semibold">Cost</th>
                    <th className="text-right py-3 px-4 font-semibold">% of Total</th>
                    <th className="text-right py-3 px-4 font-semibold">Usage</th>
                    <th className="text-right py-3 px-4 font-semibold">Cost/Unit</th>
                    <th className="text-center py-3 px-4 font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedServices().map((service, idx) => {
                    const totalCost = costData?.totalCost || 0;
                    const percentage = (service.cost / totalCost) * 100;
                    return (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{service.name}</td>
                        <td className="text-right py-3 px-4 font-bold">${service.cost.toFixed(2)}</td>
                        <td className="text-right py-3 px-4">{percentage.toFixed(1)}%</td>
                        <td className="text-right py-3 px-4">{service.usage}</td>
                        <td className="text-right py-3 px-4">${service.costPerUnit.toFixed(4)}</td>
                        <td className="text-center py-3 px-4">
                          {service.trend > 0 ? (
                            <Badge className="bg-red-100 text-red-800">↑ {service.trend}%</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">↓ {Math.abs(service.trend)}%</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No service data available</p>
          )}
        </CardContent>
      </Card>

      {/* Cost Alerts */}
      {costData && costData.costTrend > 15 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Cost Spike Detected:</strong> Your costs are trending up by {costData.costTrend.toFixed(1)}% 
            compared to the previous period. Review your usage and optimization recommendations.
          </AlertDescription>
        </Alert>
      )}

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export as Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
