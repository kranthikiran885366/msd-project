'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingDown, Zap, Database, HardDrive, ChevronRight, Check, X, Info } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CostOptimizationPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [projections, setProjections] = useState([]);
  const [appliedRecommendations, setAppliedRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchOptimizationData();
  }, []);

  const fetchOptimizationData = async () => {
    try {
      setError('');
      setLoading(true);

      const [recsRes, costRes, projRes] = await Promise.all([
        apiClient.getCostOptimizationRecommendations(),
        apiClient.getCostBreakdown(),
        apiClient.getCostProjections()
      ]);

      if (recsRes.success) {
        setRecommendations(recsRes.data || []);
      } else {
        setError(recsRes.error || 'Failed to fetch recommendations');
      }

      if (costRes.success) {
        setCostBreakdown(costRes.data);
      }

      if (projRes.success) {
        setProjections(projRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async (recommendationId) => {
    try {
      setError('');
      setSaving(true);

      const response = await apiClient.applyCostOptimizationRecommendation(recommendationId);

      if (response.success) {
        setAppliedRecommendations([...appliedRecommendations, recommendationId]);
        setSuccessMessage('Recommendation applied successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Refresh data
        fetchOptimizationData();
      } else {
        setError(response.error || 'Failed to apply recommendation');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const getTotalPotentialSavings = () => {
    return recommendations.reduce((sum, rec) => sum + (rec.potentialMonthlySavings || 0), 0);
  };

  const getRecommationIcon = (type) => {
    switch (type) {
      case 'database':
        return <Database className="w-5 h-5" />;
      case 'compute':
        return <Zap className="w-5 h-5" />;
      case 'storage':
        return <HardDrive className="w-5 h-5" />;
      default:
        return <TrendingDown className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading cost analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Cost Optimization</h1>
        <p className="text-muted-foreground">
          Discover ways to reduce your cloud spending
        </p>
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
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Savings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potential Monthly Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${getTotalPotentialSavings().toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From {recommendations.length} recommendations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${costBreakdown?.totalMonthlyCost.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potential Savings %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {costBreakdown && costBreakdown.totalMonthlyCost > 0 ? (
                ((getTotalPotentialSavings() / costBreakdown.totalMonthlyCost) * 100).toFixed(1)
              ) : '0'}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Of current spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recommendations Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {appliedRecommendations.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Of {recommendations.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Chart */}
      {costBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex justify-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Compute', value: costBreakdown.computeCost },
                        { name: 'Storage', value: costBreakdown.storageCost },
                        { name: 'Database', value: costBreakdown.databaseCost },
                        { name: 'Other', value: costBreakdown.otherCost }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ec4899" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#14b8a6" />
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Compute</span>
                    <span className="text-sm font-bold">${costBreakdown.computeCost.toFixed(2)}</span>
                  </div>
                  <Progress value={(costBreakdown.computeCost / costBreakdown.totalMonthlyCost) * 100} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((costBreakdown.computeCost / costBreakdown.totalMonthlyCost) * 100).toFixed(1)}%
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Storage</span>
                    <span className="text-sm font-bold">${costBreakdown.storageCost.toFixed(2)}</span>
                  </div>
                  <Progress value={(costBreakdown.storageCost / costBreakdown.totalMonthlyCost) * 100} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((costBreakdown.storageCost / costBreakdown.totalMonthlyCost) * 100).toFixed(1)}%
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Database</span>
                    <span className="text-sm font-bold">${costBreakdown.databaseCost.toFixed(2)}</span>
                  </div>
                  <Progress value={(costBreakdown.databaseCost / costBreakdown.totalMonthlyCost) * 100} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((costBreakdown.databaseCost / costBreakdown.totalMonthlyCost) * 100).toFixed(1)}%
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Other</span>
                    <span className="text-sm font-bold">${costBreakdown.otherCost.toFixed(2)}</span>
                  </div>
                  <Progress value={(costBreakdown.otherCost / costBreakdown.totalMonthlyCost) * 100} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((costBreakdown.otherCost / costBreakdown.totalMonthlyCost) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="border rounded-lg p-3">
                  <p className="text-muted-foreground">Total Monthly Cost</p>
                  <p className="text-2xl font-bold">${costBreakdown.totalMonthlyCost.toFixed(2)}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-muted-foreground">Projected Annual Cost</p>
                  <p className="text-2xl font-bold">${(costBreakdown.totalMonthlyCost * 12).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Projections */}
      {projections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>12-Month Cost Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="currentCost"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Current Path"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="optimizedCost"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="With Optimizations"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Optimization Recommendations</h2>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
            <TabsTrigger value="high">High Priority</TabsTrigger>
            <TabsTrigger value="medium">Medium Priority</TabsTrigger>
            <TabsTrigger value="low">Low Priority</TabsTrigger>
          </TabsList>

          {/* All Recommendations */}
          <TabsContent value="all" className="space-y-3">
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Check className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-30" />
                  <p>Great job! No optimization recommendations at this time.</p>
                </CardContent>
              </Card>
            ) : (
              recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          {getRecommationIcon(rec.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{rec.title}</h3>
                            <Badge className={getSeverityColor(rec.severity)}>
                              {rec.severity.charAt(0).toUpperCase() + rec.severity.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {rec.description}
                          </p>
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <p className="font-mono">{rec.details}</p>
                          </div>
                          <div className="flex gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Monthly Savings</p>
                              <p className="font-bold text-green-600">
                                ${rec.potentialMonthlySavings.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Annual Savings</p>
                              <p className="font-bold text-green-600">
                                ${(rec.potentialMonthlySavings * 12).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Effort</p>
                              <p className="font-bold">{rec.effortLevel}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleApplyRecommendation(rec.id)}
                        disabled={saving || appliedRecommendations.includes(rec.id)}
                        className="whitespace-nowrap"
                      >
                        {appliedRecommendations.includes(rec.id) ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Applied
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4 mr-2" />
                            Apply
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* High Priority */}
          <TabsContent value="high" className="space-y-3">
            {recommendations.filter(r => r.severity === 'high').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No high priority recommendations</p>
                </CardContent>
              </Card>
            ) : (
              recommendations.filter(r => r.severity === 'high').map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{rec.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                        <p className="text-sm font-bold text-green-600 mt-2">
                          Save ${rec.potentialMonthlySavings.toFixed(2)}/month
                        </p>
                      </div>
                      <Button
                        onClick={() => handleApplyRecommendation(rec.id)}
                        disabled={saving || appliedRecommendations.includes(rec.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Medium Priority */}
          <TabsContent value="medium" className="space-y-3">
            {recommendations.filter(r => r.severity === 'medium').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No medium priority recommendations</p>
                </CardContent>
              </Card>
            ) : (
              recommendations.filter(r => r.severity === 'medium').map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{rec.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                        <p className="text-sm font-bold text-green-600 mt-2">
                          Save ${rec.potentialMonthlySavings.toFixed(2)}/month
                        </p>
                      </div>
                      <Button
                        onClick={() => handleApplyRecommendation(rec.id)}
                        disabled={saving || appliedRecommendations.includes(rec.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Low Priority */}
          <TabsContent value="low" className="space-y-3">
            {recommendations.filter(r => r.severity === 'low').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No low priority recommendations</p>
                </CardContent>
              </Card>
            ) : (
              recommendations.filter(r => r.severity === 'low').map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{rec.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                        <p className="text-sm font-bold text-green-600 mt-2">
                          Save ${rec.potentialMonthlySavings.toFixed(2)}/month
                        </p>
                      </div>
                      <Button
                        onClick={() => handleApplyRecommendation(rec.id)}
                        disabled={saving || appliedRecommendations.includes(rec.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-5 h-5" />
            Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• <strong>Right-size your resources:</strong> Review instance types and adjust to match actual usage patterns</p>
          <p>• <strong>Use reserved instances:</strong> Save up to 70% with 1-year or 3-year commitments</p>
          <p>• <strong>Implement auto-scaling:</strong> Automatically adjust capacity based on demand</p>
          <p>• <strong>Clean up unused resources:</strong> Delete idle databases, storage, and functions</p>
          <p>• <strong>Optimize data transfer:</strong> Use caching and CDN to reduce bandwidth costs</p>
          <p>• <strong>Monitor regularly:</strong> Check usage metrics and adjust resource allocation</p>
        </CardContent>
      </Card>
    </div>
  );
}
