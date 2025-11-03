'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Zap, AlertCircle } from 'lucide-react';

export default function CostAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedProject, setSelectedProject] = useState('all');
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCostAnalytics();
  }, [timeRange]);

  const fetchCostAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/cost?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cost analytics');
      }
      
      const data = await response.json();
      setCostData(data);
    } catch (error) {
      console.error('Error fetching cost analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cost analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading cost analytics: {error}</p>
          <Button onClick={fetchCostAnalytics}>Retry</Button>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
  
  const { 
    trends = [], 
    breakdown = [], 
    projects = [], 
    drivers = [], 
    summary = {} 
  } = costData || {};

  // Fallback data if API doesn't return data
  const fallbackTrends = [
    { month: 'Jan', compute: 1200, storage: 400, bandwidth: 300, database: 500 },
    { month: 'Feb', compute: 1500, storage: 450, bandwidth: 350, database: 600 },
    { month: 'Mar', compute: 1800, storage: 500, bandwidth: 400, database: 700 },
    { month: 'Apr', compute: 2100, storage: 550, bandwidth: 450, database: 800 },
    { month: 'May', compute: 1900, storage: 480, bandwidth: 420, database: 750 },
    { month: 'Jun', compute: 2200, storage: 600, bandwidth: 500, database: 900 },
  ];

  const fallbackBreakdown = [
    { name: 'Compute', value: 45, cost: '$4,500' },
    { name: 'Storage', value: 20, cost: '$2,000' },
    { name: 'Bandwidth', value: 18, cost: '$1,800' },
    { name: 'Database', value: 17, cost: '$1,700' },
  ];

  const fallbackProjects = [
    { name: 'Production API', cost: 2500, trend: 'up', percentage: 12 },
    { name: 'Website Hosting', cost: 1800, trend: 'down', percentage: 5 },
    { name: 'Data Pipeline', cost: 1200, trend: 'up', percentage: 8 },
    { name: 'Mobile Backend', cost: 950, trend: 'down', percentage: 3 },
    { name: 'Analytics Service', cost: 800, trend: 'up', percentage: 15 },
    { name: 'Dev Environment', cost: 450, trend: 'down', percentage: 2 },
  ];

  const fallbackDrivers = [
    { resource: 'Large Database Instance', cost: 1500, percentage: 15, status: 'high' },
    { resource: 'GPU Compute Instances', cost: 1200, percentage: 12, status: 'high' },
    { resource: 'CDN Usage', cost: 800, percentage: 8, status: 'medium' },
    { resource: 'API Gateway', cost: 650, percentage: 6.5, status: 'medium' },
    { resource: 'Storage Buckets', cost: 500, percentage: 5, status: 'low' },
  ];

  const displayTrends = trends.length > 0 ? trends : fallbackTrends;
  const displayBreakdown = breakdown.length > 0 ? breakdown : fallbackBreakdown;
  const displayProjects = projects.length > 0 ? projects : fallbackProjects;
  const displayDrivers = drivers.length > 0 ? drivers : fallbackDrivers;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cost Analytics</h1>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost (30d)</p>
                <p className="text-3xl font-bold">${summary.totalCost?.toLocaleString() || '10,450'}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                  <TrendingUp className="w-4 h-4" /> {summary.monthlyChange || '+8.5%'} vs last month
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Daily Average</p>
                <p className="text-3xl font-bold">${summary.dailyAverage || '348'}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <TrendingDown className="w-4 h-4" /> {summary.dailyChange || '-2%'} vs last 30d
                </div>
              </div>
              <Zap className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">Compute Costs</p>
              <p className="text-3xl font-bold">${((summary.computeCost || 4500) / 1000).toFixed(1)}K</p>
              <p className="text-xs text-gray-500 mt-2">{summary.computePercentage || '43'}% of total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">Forecast (30d)</p>
              <p className="text-3xl font-bold">${((summary.forecast || 11200) / 1000).toFixed(1)}K</p>
              <p className="text-xs text-orange-600 mt-2">{summary.forecastChange || '+7%'} projected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="projects">By Project</TabsTrigger>
          <TabsTrigger value="resources">Resource Costs</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Cost Breakdown */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={displayTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="compute" fill="#3b82f6" name="Compute" />
                  <Bar dataKey="storage" fill="#8b5cf6" name="Storage" />
                  <Bar dataKey="bandwidth" fill="#ec4899" name="Bandwidth" />
                  <Bar dataKey="database" fill="#f59e0b" name="Database" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={displayBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {displayBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.value}% of total</p>
                      </div>
                      <p className="font-bold text-lg">{item.cost}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Project */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayProjects.map((project) => (
                  <Card key={project.name} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{project.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(project.cost / 2500) * 100}%` }}></div>
                            </div>
                            <Badge variant={project.trend === 'up' ? 'destructive' : 'secondary'}>
                              {project.trend === 'up' ? '↑' : '↓'} {project.percentage}%
                            </Badge>
                          </div>
                        </div>
                        <p className="text-2xl font-bold">${project.cost}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource Costs */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Cost Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayDrivers.map((driver) => (
                  <Card key={driver.resource} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{driver.resource}</p>
                            <Badge className={
                              driver.status === 'high' ? 'bg-red-600' :
                              driver.status === 'medium' ? 'bg-yellow-600' :
                              'bg-green-600'
                            }>
                              {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 max-w-md">
                            <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${driver.percentage}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{driver.percentage}% of total</p>
                        </div>
                        <p className="text-2xl font-bold">${driver.cost}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { title: 'Right-size database instance', savings: '$300/month', priority: 'high', status: 'recommended' },
                  { title: 'Enable auto-scaling for compute', savings: '$250/month', priority: 'high', status: 'recommended' },
                  { title: 'Consolidate storage buckets', savings: '$150/month', priority: 'medium', status: 'review' },
                  { title: 'Implement CDN caching', savings: '$200/month', priority: 'medium', status: 'review' },
                  { title: 'Upgrade to reserved instances', savings: '$400/month', priority: 'low', status: 'planned' },
                ].map((rec, idx) => (
                  <Card key={idx} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{rec.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={
                              rec.priority === 'high' ? 'bg-red-600' :
                              rec.priority === 'medium' ? 'bg-yellow-600' :
                              'bg-blue-600'
                            }>
                              {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                            </Badge>
                            <Badge variant="outline">{rec.status}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Potential savings</p>
                          <p className="text-2xl font-bold text-green-600">{rec.savings}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Budget Spent</span>
                    <span className="text-sm text-gray-600">$10,450 / $12,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">87% of monthly budget used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
