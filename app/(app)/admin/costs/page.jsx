'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import realtimeService from '@/lib/realtime-service';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function CostAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [costData, setCostData] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCostData();
    
    const handleCostUpdate = (data) => {
      setCostData(data);
      setBreakdown(data.breakdown || []);
      setTrends(data.trends || []);
    };

    realtimeService.on('metric:update', handleCostUpdate);

    return () => {
      realtimeService.off('metric:update', handleCostUpdate);
    };
  }, [timeRange]);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/costs?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch cost data');
      const data = await response.json();
      setCostData(data);
      setBreakdown(data.breakdown || []);
      setTrends(data.trends || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading cost analytics...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  const monthlyData = trends || [
    { month: 'Jan', cost: 1200 },
    { month: 'Feb', cost: 1450 },
    { month: 'Mar', cost: 1800 },
    { month: 'Apr', cost: 1650 },
    { month: 'May', cost: 1950 },
    { month: 'Jun', cost: 2100 }
  ];

  const costBreakdown = breakdown || [
    { name: 'Compute', value: 4200, percent: 45 },
    { name: 'Storage', value: 1800, percent: 19 },
    { name: 'Bandwidth', value: 2100, percent: 23 },
    { name: 'Functions', value: 900, percent: 10 },
    { name: 'Other', value: 300, percent: 3 }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cost Analytics</h1>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchCostData}>Refresh</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${costData?.summary?.totalCost?.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-gray-600 mt-2">Total costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previous Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${costData?.summary?.previousPeriod?.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-gray-600 mt-2">Previous costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${costData?.summary?.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {costData?.summary?.changePercent >= 0 ? '+' : ''}{costData?.summary?.changePercent?.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 mt-2">Period over period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projected (Annual)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${(costData?.summary?.totalCost * 12)?.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-gray-600 mt-2">Annualized cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-semibold">Right-size compute instances</p>
                <p className="text-sm text-gray-600">Reduce instance types during off-peak hours - estimated savings: $340/month</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-semibold">Enable storage lifecycle policies</p>
                <p className="text-sm text-gray-600">Archive old logs and backups to S3 Glacier - estimated savings: $210/month</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-semibold">Enable CDN edge caching</p>
                <p className="text-sm text-gray-600">Reduce bandwidth costs with aggressive caching - estimated savings: $180/month</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
