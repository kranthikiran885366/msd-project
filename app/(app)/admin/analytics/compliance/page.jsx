'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';

export default function ComplianceAnalyticsPage() {
  const complianceScore = 94;

  const complianceFrameworks = [
    { name: 'GDPR', score: 98, status: 'compliant', audits: 12, lastAudit: '15 days ago', nextAudit: '45 days' },
    { name: 'SOC 2 Type II', score: 92, status: 'compliant', audits: 8, lastAudit: '30 days ago', nextAudit: '150 days' },
    { name: 'ISO 27001', score: 90, status: 'compliant', audits: 10, lastAudit: '20 days ago', nextAudit: '100 days' },
    { name: 'HIPAA', score: 85, status: 'at-risk', audits: 5, lastAudit: '60 days ago', nextAudit: '60 days' },
    { name: 'PCI DSS', score: 88, status: 'in-progress', audits: 6, lastAudit: '40 days ago', nextAudit: '90 days' },
  ];

  const controlCategories = [
    { category: 'Access Control', score: 95, met: 18, total: 19 },
    { category: 'Data Protection', score: 92, met: 23, total: 25 },
    { category: 'Incident Response', score: 88, met: 14, total: 16 },
    { category: 'Audit & Logging', score: 96, met: 24, total: 25 },
    { category: 'Business Continuity', score: 85, met: 17, total: 20 },
  ];

  const riskData = [
    { month: 'Jan', critical: 2, high: 5, medium: 12, low: 25 },
    { month: 'Feb', critical: 1, high: 3, medium: 10, low: 22 },
    { month: 'Mar', critical: 0, high: 4, medium: 8, low: 20 },
    { month: 'Apr', critical: 1, high: 2, medium: 6, low: 18 },
    { month: 'May', critical: 0, high: 1, medium: 5, low: 15 },
    { month: 'Jun', critical: 0, high: 2, medium: 7, low: 16 },
  ];

  const COLORS = ['#dc2626', '#ea580c', '#eab308', '#22c55e'];

  const openFindings = [
    { id: 1, title: 'Encryption key rotation not automated', severity: 'high', framework: 'GDPR', daysOpen: 12, status: 'open' },
    { id: 2, title: 'Missing audit logs for certain APIs', severity: 'medium', framework: 'SOC 2', daysOpen: 8, status: 'open' },
    { id: 3, title: 'Incident response plan outdated', severity: 'medium', framework: 'ISO 27001', daysOpen: 25, status: 'overdue' },
    { id: 4, title: 'Data retention policy not enforced', severity: 'high', framework: 'HIPAA', daysOpen: 40, status: 'overdue' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Analytics</h1>
        <p className="text-gray-600 mt-2">Track compliance status and audit findings</p>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Overall Compliance Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold">{complianceScore}</p>
                <span className="text-xl text-gray-600">/100</span>
              </div>
              <p className="text-sm text-green-600 mt-2">↑ +5 points vs last month</p>
            </div>
            <div className="w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="8"
                  strokeDasharray={`${(complianceScore / 100) * 283} 283`}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
                <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#1f2937">
                  {complianceScore}%
                </text>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="frameworks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Frameworks */}
        <TabsContent value="frameworks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Frameworks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceFrameworks.map((framework) => (
                  <Card key={framework.name} className="border">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">{framework.name}</p>
                            <Badge className={
                              framework.status === 'compliant' ? 'bg-green-600' :
                              framework.status === 'at-risk' ? 'bg-red-600' :
                              'bg-yellow-600'
                            }>
                              {framework.status === 'compliant' ? '✓ Compliant' :
                               framework.status === 'at-risk' ? '✗ At Risk' :
                               '⊙ In Progress'}
                            </Badge>
                          </div>
                          <p className="text-3xl font-bold">{framework.score}%</p>
                        </div>

                        <Progress value={framework.score} className="h-2" />

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Audits Completed</p>
                            <p className="font-bold">{framework.audits}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Last Audit</p>
                            <p className="font-bold">{framework.lastAudit}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Next Audit</p>
                            <p className="font-bold">{framework.nextAudit}</p>
                          </div>
                        </div>

                        <Button size="sm" variant="outline" className="w-full">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controls */}
        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Control Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {controlCategories.map((control) => (
                  <div key={control.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{control.category}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{control.met}/{control.total}</span>
                        <p className="font-bold text-lg w-12 text-right">{control.score}%</p>
                      </div>
                    </div>
                    <Progress value={control.score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings */}
        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Findings ({openFindings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {openFindings.map((finding) => (
                  <Card key={finding.id} className={`border ${finding.status === 'overdue' ? 'border-red-300 bg-red-50' : ''}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{finding.title}</p>
                            <Badge className={
                              finding.severity === 'critical' ? 'bg-red-600' :
                              finding.severity === 'high' ? 'bg-orange-600' :
                              'bg-yellow-600'
                            }>
                              {finding.severity}
                            </Badge>
                            {finding.status === 'overdue' && (
                              <Badge className="bg-red-600">Overdue</Badge>
                            )}
                          </div>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>{finding.framework}</span>
                            <span>Open for {finding.daysOpen} days</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Resolve</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="critical" fill="#dc2626" name="Critical" />
                  <Bar dataKey="high" fill="#ea580c" name="High" />
                  <Bar dataKey="medium" fill="#eab308" name="Medium" />
                  <Bar dataKey="low" fill="#22c55e" name="Low" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Findings by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Critical', value: 1 },
                        { name: 'High', value: 8 },
                        { name: 'Medium', value: 24 },
                        { name: 'Low', value: 67 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Score History</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', score: 78 },
                    { month: 'Feb', score: 81 },
                    { month: 'Mar', score: 85 },
                    { month: 'Apr', score: 89 },
                    { month: 'May', score: 92 },
                    { month: 'Jun', score: 94 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
